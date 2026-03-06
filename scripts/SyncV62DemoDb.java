import java.io.BufferedReader;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class SyncV62DemoDb {

    private static final String JDBC_URL =
            "jdbc:mysql://localhost:3306/pupoodb?serverTimezone=Asia/Seoul&characterEncoding=UTF-8"
                    + "&useUnicode=true&useSSL=false&allowPublicKeyRetrieval=true";
    private static final String JDBC_USER = "pupoo";
    private static final String JDBC_PASSWORD = "pupoo1234!";

    private static final Pattern EVENT_INSERT_PATTERN = Pattern.compile(
            "^INSERT INTO event \\([^)]*\\) VALUES \\((\\d+),.*?'(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})',\\s*'(\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2})',"
    );

    private static final DateTimeFormatter SQL_TS = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final int WINDOW_DAYS = 120;

    private record SeedEvent(LocalDateTime startAt, LocalDateTime endAt) {
    }

    private record EventWindow(
            long eventId,
            LocalDateTime currentStartAt,
            LocalDateTime currentEndAt,
            LocalDateTime seedStartAt,
            long deltaSeconds
    ) {
        Timestamp lowerBound() {
            return Timestamp.valueOf(currentStartAt.minusDays(WINDOW_DAYS));
        }

        Timestamp upperBound() {
            return Timestamp.valueOf(currentEndAt.plusDays(WINDOW_DAYS));
        }
    }

    private record UrlColumn(String table, String column) {
    }

    private SyncV62DemoDb() {
    }

    public static void main(String[] args) throws Exception {
        Path workspaceRoot = resolveWorkspaceRoot();
        Path seedPath = workspaceRoot.resolve(Paths.get(
                "pupoo_backend", "src", "main", "resources", "data", "pupoo_seed_v6.2.sql"
        ));

        if (!Files.exists(seedPath)) {
            throw new IllegalStateException("v6.2 seed file not found: " + seedPath);
        }

        Map<Long, SeedEvent> seedEvents = loadSeedEvents(seedPath);
        if (seedEvents.isEmpty()) {
            throw new IllegalStateException("No event rows parsed from " + seedPath);
        }

        try (Connection connection = DriverManager.getConnection(JDBC_URL, JDBC_USER, JDBC_PASSWORD)) {
            connection.setAutoCommit(false);

            try {
                Map<Long, EventWindow> windows = loadEventWindows(connection, seedEvents);

                int shiftedRows = shiftTimelineTables(connection, windows);
                int normalizedUrls = normalizeUrlColumns(connection);
                int syncedStatuses = syncEventStatuses(connection);

                connection.commit();

                System.out.println("v6.2 sync completed");
                System.out.println("events compared: " + windows.size());
                System.out.println("timeline rows shifted: " + shiftedRows);
                System.out.println("url values normalized: " + normalizedUrls);
                System.out.println("event statuses synced: " + syncedStatuses);
            } catch (Exception ex) {
                connection.rollback();
                throw ex;
            }
        }
    }

    private static Path resolveWorkspaceRoot() {
        Path cwd = Paths.get("").toAbsolutePath().normalize();
        if (Files.isDirectory(cwd.resolve("pupoo_backend")) && Files.isDirectory(cwd.resolve("pupoo_frontend"))) {
            return cwd;
        }
        Path parent = cwd.getParent();
        if (parent != null
                && Files.isDirectory(parent.resolve("pupoo_backend"))
                && Files.isDirectory(parent.resolve("pupoo_frontend"))) {
            return parent;
        }
        throw new IllegalStateException("Workspace root not found from " + cwd);
    }

    private static Map<Long, SeedEvent> loadSeedEvents(Path seedPath) throws IOException {
        Map<Long, SeedEvent> seedEvents = new LinkedHashMap<>();

        try (BufferedReader reader = Files.newBufferedReader(seedPath, StandardCharsets.UTF_8)) {
            String line;
            while ((line = reader.readLine()) != null) {
                Matcher matcher = EVENT_INSERT_PATTERN.matcher(line);
                if (!matcher.find()) {
                    continue;
                }
                long eventId = Long.parseLong(matcher.group(1));
                LocalDateTime startAt = LocalDateTime.parse(matcher.group(2), SQL_TS);
                LocalDateTime endAt = LocalDateTime.parse(matcher.group(3), SQL_TS);
                seedEvents.put(eventId, new SeedEvent(startAt, endAt));
            }
        }

        return seedEvents;
    }

    private static Map<Long, EventWindow> loadEventWindows(Connection connection, Map<Long, SeedEvent> seedEvents)
            throws SQLException {
        Map<Long, EventWindow> windows = new LinkedHashMap<>();

        try (PreparedStatement statement = connection.prepareStatement(
                "SELECT event_id, start_at, end_at FROM event ORDER BY event_id"
        );
             ResultSet resultSet = statement.executeQuery()) {
            while (resultSet.next()) {
                long eventId = resultSet.getLong("event_id");
                SeedEvent seedEvent = seedEvents.get(eventId);
                if (seedEvent == null) {
                    continue;
                }
                LocalDateTime currentStart = resultSet.getTimestamp("start_at").toLocalDateTime();
                LocalDateTime currentEnd = resultSet.getTimestamp("end_at").toLocalDateTime();
                long deltaSeconds = java.time.Duration.between(seedEvent.startAt(), currentStart).getSeconds();
                windows.put(eventId, new EventWindow(
                        eventId,
                        currentStart,
                        currentEnd,
                        seedEvent.startAt(),
                        deltaSeconds
                ));
            }
        }

        return windows;
    }

    private static int shiftTimelineTables(Connection connection, Map<Long, EventWindow> windows) throws SQLException {
        int total = 0;

        for (EventWindow window : windows.values()) {
            total += shiftEventApply(connection, window);
            total += shiftBooths(connection, window);
            total += shiftEventPrograms(connection, window);
            total += shiftProgramSpeakers(connection, window);
            total += shiftProgramApplies(connection, window);
            total += shiftContestVotes(connection, window);
            total += shiftEventHistory(connection, window);
            total += shiftProgramParticipationStats(connection, window);
            total += shiftReviews(connection, window);
            total += shiftReviewComments(connection, window);
            total += shiftPayments(connection, window);
            total += shiftPaymentTransactions(connection, window);
            total += shiftRefunds(connection, window);
            total += shiftGalleries(connection, window);
            total += shiftGalleryImages(connection, window);
            total += shiftGalleryLikes(connection, window);
            total += shiftQrCodes(connection, window);
        }

        return total;
    }

    private static int shiftEventApply(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE event_apply
                SET applied_at = TIMESTAMPADD(SECOND, ?, applied_at)
                WHERE event_id = ?
                  AND applied_at IS NOT NULL
                  AND (applied_at < ? OR applied_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftBooths(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE booths
                SET created_at = TIMESTAMPADD(SECOND, ?, created_at)
                WHERE event_id = ?
                  AND created_at IS NOT NULL
                  AND (created_at < ? OR created_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftEventPrograms(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE event_program
                SET start_at = TIMESTAMPADD(SECOND, ?, start_at),
                    end_at = TIMESTAMPADD(SECOND, ?, end_at),
                    created_at = CASE
                        WHEN created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, created_at)
                    END
                WHERE event_id = ?
                  AND (
                      start_at < ? OR start_at > ?
                      OR end_at < ? OR end_at > ?
                      OR (created_at IS NOT NULL AND (created_at < ? OR created_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, true);
    }

    private static int shiftProgramSpeakers(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE program_speakers ps
                JOIN event_program ep ON ep.program_id = ps.program_id
                SET ps.created_at = TIMESTAMPADD(SECOND, ?, ps.created_at)
                WHERE ep.event_id = ?
                  AND ps.created_at IS NOT NULL
                  AND (ps.created_at < ? OR ps.created_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftProgramApplies(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE event_program_apply epa
                JOIN event_program ep ON ep.program_id = epa.program_id
                SET epa.notified_at = CASE
                        WHEN epa.notified_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, epa.notified_at)
                    END,
                    epa.checked_in_at = CASE
                        WHEN epa.checked_in_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, epa.checked_in_at)
                    END,
                    epa.created_at = CASE
                        WHEN epa.created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, epa.created_at)
                    END,
                    epa.cancelled_at = CASE
                        WHEN epa.cancelled_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, epa.cancelled_at)
                    END
                WHERE ep.event_id = ?
                  AND (
                      (epa.notified_at IS NOT NULL AND (epa.notified_at < ? OR epa.notified_at > ?))
                      OR (epa.checked_in_at IS NOT NULL AND (epa.checked_in_at < ? OR epa.checked_in_at > ?))
                      OR (epa.created_at IS NOT NULL AND (epa.created_at < ? OR epa.created_at > ?))
                      OR (epa.cancelled_at IS NOT NULL AND (epa.cancelled_at < ? OR epa.cancelled_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 4);
    }

    private static int shiftContestVotes(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE contest_votes cv
                JOIN event_program ep ON ep.program_id = cv.program_id
                SET cv.voted_at = CASE
                        WHEN cv.voted_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, cv.voted_at)
                    END,
                    cv.cancelled_at = CASE
                        WHEN cv.cancelled_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, cv.cancelled_at)
                    END
                WHERE ep.event_id = ?
                  AND (
                      (cv.voted_at IS NOT NULL AND (cv.voted_at < ? OR cv.voted_at > ?))
                      OR (cv.cancelled_at IS NOT NULL AND (cv.cancelled_at < ? OR cv.cancelled_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 2);
    }

    private static int shiftEventHistory(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE event_history
                SET joined_at = TIMESTAMPADD(SECOND, ?, joined_at)
                WHERE event_id = ?
                  AND joined_at IS NOT NULL
                  AND (joined_at < ? OR joined_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftProgramParticipationStats(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE program_participation_stats pps
                JOIN event_program ep ON ep.program_id = pps.program_id
                SET pps.last_participated_at = CASE
                        WHEN pps.last_participated_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, pps.last_participated_at)
                    END
                WHERE ep.event_id = ?
                  AND pps.last_participated_at IS NOT NULL
                  AND (pps.last_participated_at < ? OR pps.last_participated_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftReviews(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE reviews
                SET created_at = CASE
                        WHEN created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, created_at)
                    END,
                    updated_at = CASE
                        WHEN updated_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, updated_at)
                    END
                WHERE event_id = ?
                  AND (
                      (created_at IS NOT NULL AND (created_at < ? OR created_at > ?))
                      OR (updated_at IS NOT NULL AND (updated_at < ? OR updated_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 2);
    }

    private static int shiftReviewComments(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE review_comments rc
                JOIN reviews r ON r.review_id = rc.review_id
                SET rc.created_at = CASE
                        WHEN rc.created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, rc.created_at)
                    END,
                    rc.updated_at = CASE
                        WHEN rc.updated_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, rc.updated_at)
                    END
                WHERE r.event_id = ?
                  AND (
                      (rc.created_at IS NOT NULL AND (rc.created_at < ? OR rc.created_at > ?))
                      OR (rc.updated_at IS NOT NULL AND (rc.updated_at < ? OR rc.updated_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 2);
    }

    private static int shiftPayments(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE payments
                SET requested_at = CASE
                        WHEN requested_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, requested_at)
                    END
                WHERE event_id = ?
                  AND requested_at IS NOT NULL
                  AND (requested_at < ? OR requested_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftPaymentTransactions(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE payment_transactions pt
                JOIN payments p ON p.payment_id = pt.payment_id
                SET pt.requested_at = CASE
                        WHEN pt.requested_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, pt.requested_at)
                    END,
                    pt.approved_at = CASE
                        WHEN pt.approved_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, pt.approved_at)
                    END,
                    pt.cancelled_at = CASE
                        WHEN pt.cancelled_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, pt.cancelled_at)
                    END,
                    pt.failed_at = CASE
                        WHEN pt.failed_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, pt.failed_at)
                    END,
                    pt.created_at = CASE
                        WHEN pt.created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, pt.created_at)
                    END,
                    pt.updated_at = CASE
                        WHEN pt.updated_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, pt.updated_at)
                    END
                WHERE p.event_id = ?
                  AND (
                      (pt.requested_at IS NOT NULL AND (pt.requested_at < ? OR pt.requested_at > ?))
                      OR (pt.approved_at IS NOT NULL AND (pt.approved_at < ? OR pt.approved_at > ?))
                      OR (pt.cancelled_at IS NOT NULL AND (pt.cancelled_at < ? OR pt.cancelled_at > ?))
                      OR (pt.failed_at IS NOT NULL AND (pt.failed_at < ? OR pt.failed_at > ?))
                      OR (pt.created_at IS NOT NULL AND (pt.created_at < ? OR pt.created_at > ?))
                      OR (pt.updated_at IS NOT NULL AND (pt.updated_at < ? OR pt.updated_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 6);
    }

    private static int shiftRefunds(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE refunds rf
                JOIN payments p ON p.payment_id = rf.payment_id
                SET rf.requested_at = CASE
                        WHEN rf.requested_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, rf.requested_at)
                    END,
                    rf.completed_at = CASE
                        WHEN rf.completed_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, rf.completed_at)
                    END,
                    rf.created_at = CASE
                        WHEN rf.created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, rf.created_at)
                    END,
                    rf.updated_at = CASE
                        WHEN rf.updated_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, rf.updated_at)
                    END
                WHERE p.event_id = ?
                  AND (
                      (rf.requested_at IS NOT NULL AND (rf.requested_at < ? OR rf.requested_at > ?))
                      OR (rf.completed_at IS NOT NULL AND (rf.completed_at < ? OR rf.completed_at > ?))
                      OR (rf.created_at IS NOT NULL AND (rf.created_at < ? OR rf.created_at > ?))
                      OR (rf.updated_at IS NOT NULL AND (rf.updated_at < ? OR rf.updated_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 4);
    }

    private static int shiftGalleries(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE galleries
                SET created_at = CASE
                        WHEN created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, created_at)
                    END,
                    updated_at = CASE
                        WHEN updated_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, updated_at)
                    END
                WHERE event_id = ?
                  AND (
                      (created_at IS NOT NULL AND (created_at < ? OR created_at > ?))
                      OR (updated_at IS NOT NULL AND (updated_at < ? OR updated_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 2);
    }

    private static int shiftGalleryImages(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE gallery_images gi
                JOIN galleries g ON g.gallery_id = gi.gallery_id
                SET gi.created_at = CASE
                        WHEN gi.created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, gi.created_at)
                    END
                WHERE g.event_id = ?
                  AND gi.created_at IS NOT NULL
                  AND (gi.created_at < ? OR gi.created_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftGalleryLikes(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE gallery_likes gl
                JOIN galleries g ON g.gallery_id = gl.gallery_id
                SET gl.created_at = CASE
                        WHEN gl.created_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, gl.created_at)
                    END
                WHERE g.event_id = ?
                  AND gl.created_at IS NOT NULL
                  AND (gl.created_at < ? OR gl.created_at > ?)
                """;
        return executeShift(connection, sql, window, false);
    }

    private static int shiftQrCodes(Connection connection, EventWindow window) throws SQLException {
        String sql = """
                UPDATE qr_codes
                SET issued_at = CASE
                        WHEN issued_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, issued_at)
                    END,
                    expired_at = CASE
                        WHEN expired_at IS NULL THEN NULL
                        ELSE TIMESTAMPADD(SECOND, ?, expired_at)
                    END
                WHERE event_id = ?
                  AND (
                      (issued_at IS NOT NULL AND (issued_at < ? OR issued_at > ?))
                      OR (expired_at IS NOT NULL AND (expired_at < ? OR expired_at > ?))
                  )
                """;
        return executeShift(connection, sql, window, 2);
    }

    private static int executeShift(Connection connection, String sql, EventWindow window, boolean threeColumns)
            throws SQLException {
        return executeShift(connection, sql, window, threeColumns ? 3 : 1);
    }

    private static int executeShift(Connection connection, String sql, EventWindow window, int shiftedColumnCount)
            throws SQLException {
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            int index = 1;
            for (int i = 0; i < shiftedColumnCount; i++) {
                statement.setLong(index++, window.deltaSeconds());
            }
            statement.setLong(index++, window.eventId());

            int boundsRepeat = countBoundsPlaceholders(sql);
            for (int i = 0; i < boundsRepeat; i++) {
                statement.setTimestamp(index++, (i % 2 == 0) ? window.lowerBound() : window.upperBound());
            }
            return statement.executeUpdate();
        }
    }

    private static int countBoundsPlaceholders(String sql) {
        int whereIndex = sql.indexOf("WHERE");
        if (whereIndex < 0) {
            return 0;
        }
        int questionMarks = 0;
        for (int i = whereIndex; i < sql.length(); i++) {
            if (sql.charAt(i) == '?') {
                questionMarks++;
            }
        }
        return Math.max(0, questionMarks - 1);
    }

    private static int normalizeUrlColumns(Connection connection) throws SQLException {
        List<UrlColumn> columns = List.of(
                new UrlColumn("event", "image_url"),
                new UrlColumn("event_program", "image_url"),
                new UrlColumn("event_program_apply", "image_url"),
                new UrlColumn("speakers", "speaker_image_url"),
                new UrlColumn("event_images", "original_url"),
                new UrlColumn("event_images", "thumb_url"),
                new UrlColumn("gallery_images", "original_url"),
                new UrlColumn("gallery_images", "thumb_url"),
                new UrlColumn("qr_codes", "original_url")
        );

        int updated = 0;
        for (UrlColumn column : columns) {
            updated += normalizeUrlColumn(connection, column);
        }
        return updated;
    }

    private static int normalizeUrlColumn(Connection connection, UrlColumn column) throws SQLException {
        String selectSql = "SELECT " + column.column() + " FROM " + column.table();
        String updateSql = "UPDATE " + column.table() + " SET " + column.column() + " = ? WHERE " + column.column() + " = ?";

        List<String[]> changes = new ArrayList<>();
        try (PreparedStatement select = connection.prepareStatement(selectSql);
             ResultSet resultSet = select.executeQuery()) {
            while (resultSet.next()) {
                String raw = resultSet.getString(1);
                String normalized = normalizeUrl(raw);
                if (Objects.equals(raw, normalized)) {
                    continue;
                }
                changes.add(new String[]{normalized, raw});
            }
        }

        if (changes.isEmpty()) {
            return 0;
        }

        int updated = 0;
        try (PreparedStatement update = connection.prepareStatement(updateSql)) {
            for (String[] change : changes) {
                update.setString(1, change[0]);
                update.setString(2, change[1]);
                updated += update.executeUpdate();
            }
        }
        return updated;
    }

    private static String normalizeUrl(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            return rawUrl;
        }

        String normalized = rawUrl.trim().replace('\\', '/');
        String lower = normalized.toLowerCase();

        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            return normalized;
        }

        int idx = lower.indexOf("/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx);
        }

        idx = lower.indexOf("/src/main/resources/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx + "/src/main/resources".length());
        }

        idx = lower.indexOf("src/main/resources/uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx + "src/main/resources/".length());
        }

        idx = lower.indexOf("/main/resources/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx + "/main/resources".length());
        }

        idx = lower.indexOf("main/resources/uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx + "main/resources/".length());
        }

        idx = lower.indexOf("/resources/uploads/");
        if (idx >= 0) {
            return normalized.substring(idx + "/resources".length());
        }

        idx = lower.indexOf("resources/uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx + "resources/".length());
        }

        idx = lower.indexOf("uploads/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx);
        }

        idx = lower.indexOf("/static/");
        if (idx >= 0) {
            return normalized.substring(idx);
        }

        idx = lower.indexOf("static/");
        if (idx >= 0) {
            return "/" + normalized.substring(idx);
        }

        return normalized.startsWith("/") ? normalized : "/" + normalized;
    }

    private static int syncEventStatuses(Connection connection) throws SQLException {
        String sql = """
                UPDATE event
                SET status = CASE
                    WHEN start_at > NOW() THEN 'PLANNED'
                    WHEN end_at < NOW() THEN 'ENDED'
                    ELSE 'ONGOING'
                END
                WHERE status <> 'CANCELLED'
                """;
        try (PreparedStatement statement = connection.prepareStatement(sql)) {
            return statement.executeUpdate();
        }
    }
}
