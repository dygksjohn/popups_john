"""
조합 6: HateBERT + Redis.
- 혐오/욕설 패턴 감지(로컬 모델) + Redis 캐시로 동일 텍스트 재추론 방지.
"""
import hashlib
import asyncio
from pupoo_ai.app.core.config import settings

# 동기 파이프라인은 첫 사용 시 로드 (메인 스레드 블로킹 방지를 위해 run_in_executor 사용)
_classifier = None
_fallback_model = "cardiffnlp/twitter-roberta-base-offensive"


def _load_classifier():
    global _classifier
    if _classifier is not None:
        return _classifier
    try:
        from transformers import pipeline
        _classifier = pipeline("text-classification", model=settings.hatebert_model)
        return _classifier
    except Exception:
        try:
            from transformers import pipeline
            _classifier = pipeline("text-classification", model=_fallback_model)
            return _classifier
        except Exception:
            return None


def _score_sync(text: str) -> float:
    """동기 추론: 텍스트에 대한 혐오/욕설 확률 0~1. 모델 미설치 시 0.0 반환."""
    text = (text or "").strip()
    if not text:
        return 0.0
    pipe = _load_classifier()
    if pipe is None:
        return 0.0
    # 최대 길이 제한 (BERT 등 토큰 제한)
    if len(text) > 4000:
        text = text[:4000]
    try:
        out = pipe(text)
    except Exception:
        return 0.0
    if not out:
        return 0.0
    # 단일 결과: [{"label":"...", "score":0.9}]
    if len(out) == 1:
        item = out[0]
        label = (item.get("label") or "").lower()
        score = float(item.get("score", 0))
        if "non" in label or "not" in label or "0" in label or "neutral" in label:
            return 1.0 - score
        return score
    # 다중: positive 클래스(offensive/hate/abusive) 점수 반환
    for item in out:
        label = (item.get("label") or "").lower()
        score = float(item.get("score", 0))
        if "offensive" in label or label in ("1", "label_1", "hate", "abusive"):
            return score
    return max(float(x.get("score", 0)) for x in out)


def _redis_client():
    try:
        import redis
        return redis.from_url(settings.redis_url, decode_responses=True)
    except Exception:
        return None


def _cache_key(text: str) -> str:
    t = (text or "").strip().lower()
    return "mod:hatebert:" + hashlib.sha256(t.encode("utf-8")).hexdigest()


async def get_abuse_score(text: str) -> float:
    """
    Redis 캐시 조회 후 없으면 HateBERT(또는 fallback) 추론, 결과 캐시.
    """
    text = (text or "").strip()
    if not text:
        return 0.0

    key = _cache_key(text)
    client = _redis_client()
    if client:
        try:
            cached = client.get(key)
            if cached is not None:
                return float(cached)
        except Exception:
            pass

    loop = asyncio.get_event_loop()
    score = await loop.run_in_executor(None, _score_sync, text)

    if client:
        try:
            client.setex(key, 3600, str(score))  # 1시간 TTL
        except Exception:
            pass

    return score
