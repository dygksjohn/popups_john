from pupoo_ai.app.features.poster.dto.poster_dto import PosterGenerateRequest


def build_poster_prompt(request: PosterGenerateRequest) -> str:
    tone_text = request.tone or "balanced"
    style_guides = {
        "MODERN": "Clean grid, bold headline hierarchy, premium editorial look.",
        "FESTIVAL": "Energetic composition, lively color contrast, outdoor event mood.",
        "MINIMAL": "Strong whitespace, restrained palette, high readability.",
        "PLAYFUL": "Friendly shapes, bright accents, approachable family event feel.",
    }
    style_guide = style_guides.get(request.style.value, "Readable event poster composition.")

    return (
        "Create a polished event poster with clear readable typography and real poster composition. "
        "Use short headline text only, preserve safe margins, avoid watermark-like artifacts, "
        "avoid extra logos, and prioritize visual hierarchy over decorative clutter. "
        f"Title: {request.title}. "
        f"Date: {request.date_text}. "
        f"Location: {request.location}. "
        f"Summary: {request.summary}. "
        f"Style: {request.style.value}. "
        f"Tone: {tone_text}. "
        f"Design direction: {style_guide} "
        f"Canvas size: {request.size}. "
        f"Requested output quality: {request.quality.value}. "
        f"Background handling: {request.background.value}."
    )
