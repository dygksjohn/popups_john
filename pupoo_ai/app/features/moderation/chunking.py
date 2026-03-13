from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List


@dataclass
class PolicyChunk:
    text: str
    policy_id: str
    category: str
    source: str


def iter_policy_files(base_dir: Path) -> Iterable[Path]:
    """
    정책 문서가 위치한 디렉터리에서 텍스트 파일(.txt)을 순회한다.

    기본 경로 예시: pupoo_ai/policy_docs/*.txt
    """
    if not base_dir.exists():
        return []
    return sorted(p for p in base_dir.rglob("*.txt") if p.is_file())


def iter_policy_json_files(base_dir: Path) -> Iterable[Path]:
    """
    정책 JSON 파일(.json)을 순회한다.
    형식: { "metadata": {...}, "policies": [{ "id", "code", "category", "source", "description", "keywords", "violation_criteria", "action_type", "ai_response_guide" }, ...] }
    """
    if not base_dir.exists():
        return []
    return sorted(p for p in base_dir.rglob("*.json") if p.is_file())


def simple_chunk_text(text: str, max_chars: int = 800, overlap: int = 200) -> List[str]:
    """
    문단 단위로 나눈 뒤, 길이에 맞춰 슬라이딩 윈도우로 청킹한다.
    """
    paragraphs = [p.strip() for p in text.splitlines() if p.strip()]
    if not paragraphs:
        return []

    joined = "\n".join(paragraphs)
    chunks: List[str] = []
    start = 0
    n = len(joined)
    while start < n:
        end = min(start + max_chars, n)
        chunk = joined[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == n:
            break
        start = max(0, end - overlap)
    return chunks


def _policy_json_to_chunk(p: dict, file_source: str) -> PolicyChunk:
    """단일 정책 객체를 RAG 검색용 텍스트로 합쳐 PolicyChunk로 만든다."""
    parts = [
        p.get("description", ""),
        p.get("violation_criteria", ""),
        "키워드: " + ", ".join(p.get("keywords") or []),
    ]
    text = "\n".join(x for x in parts if x.strip())
    return PolicyChunk(
        text=text or p.get("code", ""),
        policy_id=p.get("id", ""),
        category=p.get("category", "GENERAL"),
        source=file_source,
    )


def load_policy_chunks_from_json(path: Path, policy_root: Path) -> List[PolicyChunk]:
    """
    moderation_rules 형식 JSON 한 파일을 읽어 PolicyChunk 리스트로 변환한다.
    policies[] 각 항목이 하나의 청크가 된다.
    """
    chunks: List[PolicyChunk] = []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return []
    policies = data.get("policies") or []
    try:
        source = str(path.relative_to(policy_root))
    except ValueError:
        source = path.name
    for p in policies:
        if isinstance(p, dict) and (p.get("id") or p.get("code")):
            chunks.append(_policy_json_to_chunk(p, source))
    return chunks


def load_policy_chunks(policy_root: Path) -> List[PolicyChunk]:
    """
    정책 문서를 읽어 PolicyChunk 리스트로 변환한다.

    - .txt: 문단 청킹, policy_id는 파일명:인덱스, category는 GENERAL.
    - .json: metadata.policies 형식이면 각 정책을 하나의 청크로 사용(id, category, source 유지).
    """
    chunks: List[PolicyChunk] = []
    for path in iter_policy_files(policy_root):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for idx, chunk in enumerate(simple_chunk_text(text)):
            chunks.append(
                PolicyChunk(
                    text=chunk,
                    policy_id=f"{path.stem}:{idx}",
                    category="GENERAL",
                    source=str(path.relative_to(policy_root)),
                )
            )
    for path in iter_policy_json_files(policy_root):
        chunks.extend(load_policy_chunks_from_json(path, policy_root))
    return chunks

