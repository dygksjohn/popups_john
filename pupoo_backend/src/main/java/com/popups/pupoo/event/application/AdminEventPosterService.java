package com.popups.pupoo.event.application;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.popups.pupoo.common.exception.BusinessException;
import com.popups.pupoo.common.exception.ErrorCode;
import com.popups.pupoo.event.dto.AdminEventPosterAssetResponse;
import com.popups.pupoo.event.dto.AdminEventPosterGenerateRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.AlphaComposite;
import java.awt.Color;
import java.awt.Font;
import java.awt.FontMetrics;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.GraphicsEnvironment;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Stream;

@Slf4j
@Service
public class AdminEventPosterService {

    private static final int POSTER_IMAGE_COUNT = 1;
    private static final String POSTER_IMAGE_SIZE = "1024x1792";
    private static final String[] POSTER_FONT_CANDIDATES = {
            "Malgun Gothic",
            "Apple SD Gothic Neo",
            "Noto Sans CJK KR",
            "Noto Sans KR",
            "NanumGothic",
            "Dialog",
            "SansSerif"
    };
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "image/webp"
    );
    private static final long MAX_FILE_SIZE = 10L * 1024 * 1024;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd", Locale.KOREA);
    private static final List<Path> DOTENV_CANDIDATES = List.of(
            Paths.get("..", "pupoo_ai", ".env"),
            Paths.get("pupoo_ai", ".env"),
            Paths.get(".env")
    );

    private final RestClient restClient;
    private final Path eventUploadDir;
    private final String apiKey;
    private final String model;
    private final Object fileLock = new Object();

    public AdminEventPosterService(
            RestClient.Builder builder,
            @Value("${openai.image.api-key:}") String configuredApiKey,
            @Value("${openai.image.model:}") String configuredModel,
            @Value("${openai.image.base-url:https://api.openai.com}") String baseUrl,
            @Value("${storage.base-path:./src/main/resources/uploads}") String storageBasePath
    ) {
        this.apiKey = firstNonBlank(
                configuredApiKey,
                System.getenv("OPENAI_API_KEY"),
                readDotEnvValue("OPENAI_API_KEY")
        );
        this.model = firstNonBlank(
                configuredModel,
                System.getenv("OPENAI_IMAGE_MODEL"),
                readDotEnvValue("OPENAI_IMAGE_MODEL"),
                "dall-e-3"
        );
        RestClient.Builder configuredBuilder = builder.baseUrl(baseUrl);
        if (StringUtils.hasText(this.apiKey)) {
            configuredBuilder.defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + this.apiKey);
        }
        this.restClient = configuredBuilder.build();
        this.eventUploadDir = Paths.get(storageBasePath).toAbsolutePath().normalize().resolve("event");
    }

    public AdminEventPosterAssetResponse uploadPoster(MultipartFile file) {
        validateImageFile(file);
        String extension = resolveExtension(file.getOriginalFilename(), file.getContentType());
        try {
            return storeImage(file.getBytes(), extension);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to read poster upload bytes");
        }
    }

    public AdminEventPosterAssetResponse generatePoster(AdminEventPosterGenerateRequest request) {
        ensureConfigured();
        String prompt = buildPrompt(request);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("model", model);
        payload.put("prompt", prompt);
        payload.put("size", POSTER_IMAGE_SIZE);
        payload.put("quality", "standard");
        payload.put("n", POSTER_IMAGE_COUNT);
        payload.put("response_format", "b64_json");

        try {
            OpenAiImageGenerationResponse response = restClient.post()
                    .uri("/v1/images/generations")
                    .contentType(MediaType.APPLICATION_JSON)
                    .accept(MediaType.APPLICATION_JSON)
                    .body(payload)
                    .retrieve()
                    .body(OpenAiImageGenerationResponse.class);

            if (response == null || response.data() == null || response.data().isEmpty()) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI poster generation returned an empty response");
            }

            byte[] imageBytes = extractImageBytes(response.data().get(0));
            imageBytes = overlayPosterText(imageBytes, request);
            return storeImage(imageBytes, "png");
        } catch (RestClientResponseException e) {
            log.warn("AI poster generation failed: status={} body={}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw new BusinessException(
                    ErrorCode.INTERNAL_ERROR,
                    "AI poster generation failed: " + e.getStatusCode().value()
            );
        }
    }

    private void ensureConfigured() {
        if (StringUtils.hasText(apiKey)) {
            return;
        }
        throw new BusinessException(
                ErrorCode.INTERNAL_ERROR,
                "OpenAI API key is not configured. Set OPENAI_API_KEY or pupoo_ai/.env"
        );
    }

    private void validateImageFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Poster image file is required");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Poster image must be 10MB or less");
        }
        String contentType = file.getContentType();
        if (!StringUtils.hasText(contentType) || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase(Locale.ROOT))) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Only jpg, png, gif, webp files are allowed");
        }
    }

    private String buildPrompt(AdminEventPosterGenerateRequest request) {
        String description = StringUtils.hasText(request.description())
                ? request.description().trim()
                : "No additional description provided.";
        String extraPrompt = StringUtils.hasText(request.extraPrompt())
                ? request.extraPrompt().trim()
                : "No extra creative direction provided.";

        return """
                Create a polished promotional poster image for a Korean pet event.
                Event title: %s
                Location: %s
                Schedule: %s
                Description: %s
                Organizer creative direction: %s
                Use a vertical poster composition suitable for a website cover image.
                Do not render readable text, dates, logos, or labels directly into the artwork.
                Leave a clean lower area so crisp real text can be added later as an overlay.
                Show pets or a festival atmosphere that matches the event theme.
                Keep the design modern, warm, energetic, and premium.
                Keep text minimal and clean. Avoid long paragraphs, watermarks, QR codes, logos, and unreadable gibberish.
                """.formatted(
                request.eventName().trim(),
                request.location().trim(),
                formatDateRange(request.startAt(), request.endAt()),
                description,
                extraPrompt
        );
    }

    private String formatDateRange(LocalDateTime startAt, LocalDateTime endAt) {
        String startDate = DATE_FORMATTER.format(startAt);
        String endDate = DATE_FORMATTER.format(endAt);
        return startDate.equals(endDate) ? startDate : startDate + " ~ " + endDate;
    }

    private byte[] extractImageBytes(OpenAiImageData imageData) {
        if (imageData == null) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI poster generation returned no image data");
        }
        if (StringUtils.hasText(imageData.b64Json())) {
            return Base64.getDecoder().decode(imageData.b64Json());
        }
        if (StringUtils.hasText(imageData.url())) {
            byte[] downloaded = RestClient.create()
                    .get()
                    .uri(imageData.url())
                    .retrieve()
                    .body(byte[].class);
            if (downloaded != null && downloaded.length > 0) {
                return downloaded;
            }
        }
        throw new BusinessException(ErrorCode.INTERNAL_ERROR, "AI poster generation returned unusable image content");
    }

    private byte[] overlayPosterText(byte[] bytes, AdminEventPosterGenerateRequest request) {
        try {
            BufferedImage source = ImageIO.read(new ByteArrayInputStream(bytes));
            if (source == null) {
                return bytes;
            }

            BufferedImage canvas = new BufferedImage(
                    source.getWidth(),
                    source.getHeight(),
                    BufferedImage.TYPE_INT_ARGB
            );
            Graphics2D g = canvas.createGraphics();
            try {
                g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
                g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
                g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
                g.drawImage(source, 0, 0, null);

                int width = canvas.getWidth();
                int height = canvas.getHeight();
                int panelHeight = Math.max(300, height / 4);
                int panelTop = height - panelHeight;

                g.setPaint(new GradientPaint(
                        0,
                        panelTop,
                        new Color(0, 0, 0, 0),
                        0,
                        height,
                        new Color(8, 12, 20, 225)
                ));
                g.fillRect(0, panelTop, width, panelHeight);

                int paddingX = Math.max(48, width / 18);
                int baselineY = panelTop + Math.max(92, panelHeight / 3);
                String title = safeTrim(request.eventName());
                String schedule = formatDateRange(request.startAt(), request.endAt());
                String location = safeTrim(request.location());

                Font titleFont = pickFont(title, Font.BOLD, Math.max(42, width / 18));
                Font metaFont = pickFont(schedule + " " + location, Font.PLAIN, Math.max(24, width / 34));

                g.setColor(Color.WHITE);
                drawWrappedText(g, title, titleFont, paddingX, baselineY, width - (paddingX * 2), 2);

                FontMetrics titleMetrics = g.getFontMetrics(titleFont);
                int titleLines = countWrappedLines(g, title, titleFont, width - (paddingX * 2), 2);
                int metaY = baselineY + (titleMetrics.getHeight() * titleLines) + 18;

                g.setComposite(AlphaComposite.SrcOver);
                g.setColor(new Color(255, 255, 255, 220));
                drawWrappedText(g, schedule, metaFont, paddingX, metaY, width - (paddingX * 2), 1);

                FontMetrics metaMetrics = g.getFontMetrics(metaFont);
                int locationY = metaY + metaMetrics.getHeight() + 8;
                g.setColor(new Color(240, 245, 255, 190));
                drawWrappedText(g, location, metaFont, paddingX, locationY, width - (paddingX * 2), 1);
            } finally {
                g.dispose();
            }

            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(canvas, "png", output);
            return output.toByteArray();
        } catch (IOException e) {
            log.warn("Poster text overlay failed, returning raw AI image", e);
            return bytes;
        }
    }

    private Font pickFont(String text, int style, int size) {
        String sample = StringUtils.hasText(text) ? text : "행사 포스터";
        for (String family : POSTER_FONT_CANDIDATES) {
            Font font = new Font(family, style, size);
            if (font.canDisplayUpTo(sample) == -1) {
                return font;
            }
        }
        return new Font("SansSerif", style, size);
    }

    private void drawWrappedText(
            Graphics2D g,
            String text,
            Font font,
            int startX,
            int startY,
            int maxWidth,
            int maxLines
    ) {
        if (!StringUtils.hasText(text)) {
            return;
        }
        g.setFont(font);
        FontMetrics metrics = g.getFontMetrics(font);
        List<String> lines = wrapText(metrics, text, maxWidth, maxLines);
        int y = startY;
        for (String line : lines) {
            g.drawString(line, startX, y);
            y += metrics.getHeight();
        }
    }

    private int countWrappedLines(Graphics2D g, String text, Font font, int maxWidth, int maxLines) {
        if (!StringUtils.hasText(text)) {
            return 0;
        }
        g.setFont(font);
        return wrapText(g.getFontMetrics(font), text, maxWidth, maxLines).size();
    }

    private List<String> wrapText(FontMetrics metrics, String text, int maxWidth, int maxLines) {
        String normalized = safeTrim(text);
        if (!StringUtils.hasText(normalized)) {
            return List.of();
        }

        List<String> lines = new java.util.ArrayList<>();
        StringBuilder current = new StringBuilder();

        for (int i = 0; i < normalized.length(); i++) {
            char ch = normalized.charAt(i);
            String candidate = current + String.valueOf(ch);
            if (metrics.stringWidth(candidate) <= maxWidth || current.isEmpty()) {
                current.append(ch);
                continue;
            }

            lines.add(current.toString());
            if (lines.size() == maxLines) {
                return truncateLastLine(metrics, lines, maxWidth);
            }
            current = new StringBuilder().append(ch);
        }

        if (!current.isEmpty() && lines.size() < maxLines) {
            lines.add(current.toString());
        }
        return lines;
    }

    private List<String> truncateLastLine(FontMetrics metrics, List<String> lines, int maxWidth) {
        if (lines.isEmpty()) {
            return lines;
        }
        int lastIndex = lines.size() - 1;
        String last = lines.get(lastIndex);
        String ellipsis = "...";
        while (!last.isEmpty() && metrics.stringWidth(last + ellipsis) > maxWidth) {
            last = last.substring(0, last.length() - 1);
        }
        lines.set(lastIndex, last + ellipsis);
        return lines;
    }

    private String safeTrim(String value) {
        return value == null ? "" : value.trim();
    }

    private AdminEventPosterAssetResponse storeImage(byte[] bytes, String extension) {
        try {
            Files.createDirectories(eventUploadDir);
            String storedName;
            synchronized (fileLock) {
                storedName = nextStoredName(extension);
                Files.write(
                        eventUploadDir.resolve(storedName),
                        bytes,
                        StandardOpenOption.CREATE_NEW,
                        StandardOpenOption.WRITE
                );
            }
            return new AdminEventPosterAssetResponse("/uploads/event/" + storedName, storedName);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Failed to store poster image");
        }
    }

    private String nextStoredName(String extension) throws IOException {
        long nextSequence;
        try (Stream<Path> stream = Files.list(eventUploadDir)) {
            nextSequence = stream
                    .filter(Files::isRegularFile)
                    .map(path -> extractSequence(path.getFileName().toString()))
                    .filter(sequence -> sequence >= 0)
                    .max(Long::compareTo)
                    .orElse(0L) + 1;
        }
        return String.format(Locale.ROOT, "%013d.%s", nextSequence, extension);
    }

    private long extractSequence(String fileName) {
        int dotIndex = fileName.indexOf('.');
        String baseName = dotIndex >= 0 ? fileName.substring(0, dotIndex) : fileName;
        if (!baseName.matches("\\d+")) {
            return -1L;
        }
        try {
            return Long.parseLong(baseName);
        } catch (NumberFormatException e) {
            return -1L;
        }
    }

    private String resolveExtension(String originalFilename, String contentType) {
        if (StringUtils.hasText(contentType)) {
            return switch (contentType.toLowerCase(Locale.ROOT)) {
                case "image/jpeg", "image/jpg" -> "jpg";
                case "image/png" -> "png";
                case "image/gif" -> "gif";
                case "image/webp" -> "webp";
                default -> resolveExtensionFromName(originalFilename);
            };
        }
        return resolveExtensionFromName(originalFilename);
    }

    private String resolveExtensionFromName(String originalFilename) {
        if (!StringUtils.hasText(originalFilename)) {
            return "png";
        }
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            return "png";
        }
        String extension = originalFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        return switch (extension) {
            case "jpg", "jpeg", "png", "gif", "webp" -> "jpeg".equals(extension) ? "jpg" : extension;
            default -> "png";
        };
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (StringUtils.hasText(value)) {
                return value.trim();
            }
        }
        return "";
    }

    private static String readDotEnvValue(String key) {
        for (Path candidate : DOTENV_CANDIDATES) {
            Path absolute = candidate.toAbsolutePath().normalize();
            if (!Files.exists(absolute)) {
                continue;
            }
            try (Stream<String> lines = Files.lines(absolute, StandardCharsets.UTF_8)) {
                String matched = lines
                        .map(String::trim)
                        .filter(line -> !line.isBlank() && !line.startsWith("#") && line.contains("="))
                        .map(line -> line.split("=", 2))
                        .filter(parts -> parts.length == 2 && key.equals(parts[0].trim()))
                        .map(parts -> stripQuotes(parts[1].trim()))
                        .findFirst()
                        .orElse(null);
                if (StringUtils.hasText(matched)) {
                    return matched;
                }
            } catch (IOException ignored) {
                // Ignore local dotenv lookup failures and continue.
            }
        }
        return null;
    }

    private static String stripQuotes(String value) {
        if (value == null || value.length() < 2) {
            return value;
        }
        char first = value.charAt(0);
        char last = value.charAt(value.length() - 1);
        if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
            return value.substring(1, value.length() - 1);
        }
        return value;
    }

    private record OpenAiImageGenerationResponse(List<OpenAiImageData> data) {}

    private record OpenAiImageData(
            @JsonProperty("b64_json")
            String b64Json,
            String url
    ) {}
}
