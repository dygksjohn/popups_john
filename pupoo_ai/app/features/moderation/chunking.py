"""모더레이션 정책 문서 청크 생성기.

기능:
- `policy_docs` 아래의 텍스트/JSON 정책 파일을 읽어 RAG 검색용 청크로 변환한다.

설명:
- 현재 구현은 `.txt`와 `.json`을 모두 읽는다.
- JSON은 하나의 canonical 파일만 읽는 구조가 아니라 디렉터리 아래 모든 JSON 파일을 로드한다.
- 따라서 다중 파일이 공존하면 검색 인덱스에도 함께 반영된다.

흐름:
- 정책 파일 탐색 -> 파일 형식별 파싱 -> PolicyChunk 리스트 생성
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List


@dataclass
class PolicyChunk:
    # 기능: RAG 검색 단위 정책 청크를 표현한다.
    text: str
    policy_id: str
    category: str
    source: str


def iter_policy_files(base_dir: Path) -> Iterable[Path]:
    """텍스트 정책 파일을 순회한다."""
    if not base_dir.exists():
        return []
    return sorted(p for p in base_dir.rglob("*.txt") if p.is_file())


def iter_policy_json_files(base_dir: Path) -> Iterable[Path]:
    """JSON 정책 파일을 순회한다."""
    if not base_dir.exists():
        return []
    return sorted(p for p in base_dir.rglob("*.json") if p.is_file())


def simple_chunk_text(text: str, max_chars: int = 800, overlap: int = 200) -> List[str]:
    """긴 텍스트를 RAG 검색용 슬라이딩 윈도우 청크로 나눈다."""
    paragraphs = [p.strip() for p in text.splitlines() if p.strip()]
    if not paragraphs:
        return []

    joined = "\n".join(paragraphs)
    chunks: List[str] = []
    start = 0
    total_length = len(joined)

    while start < total_length:
        end = min(start + max_chars, total_length)
        chunk = joined[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == total_length:
            break
        start = max(0, end - overlap)

    return chunks


def _policy_json_to_chunk(policy: dict, file_source: str) -> PolicyChunk:
    """정책 JSON 한 항목을 RAG 검색용 청크로 변환한다."""
    parts = [
        policy.get("description", ""),
        policy.get("violation_criteria", ""),
        "키워드: " + ", ".join(policy.get("keywords") or []),
    ]
    text = "\n".join(part for part in parts if part.strip())
    return PolicyChunk(
        text=text or policy.get("code", ""),
        policy_id=policy.get("id", ""),
        category=policy.get("category", "GENERAL"),
        source=file_source,
    )


def load_policy_chunks_from_json(path: Path, policy_root: Path) -> List[PolicyChunk]:
    """JSON 정책 파일 하나를 읽어 PolicyChunk 리스트로 변환한다."""
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

    for policy in policies:
        if isinstance(policy, dict) and (policy.get("id") or policy.get("code")):
            chunks.append(_policy_json_to_chunk(policy, source))
    return chunks


def load_policy_chunks(policy_root: Path) -> List[PolicyChunk]:
    """정책 문서를 읽어 RAG 검색용 PolicyChunk 리스트를 만든다."""
    chunks: List[PolicyChunk] = []

    for path in iter_policy_files(policy_root):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for index, chunk in enumerate(simple_chunk_text(text)):
            chunks.append(
                PolicyChunk(
                    text=chunk,
                    policy_id=f"{path.stem}:{index}",
                    category="GENERAL",
                    source=str(path.relative_to(policy_root)),
                )
            )

    # 기능: JSON 정책 파일은 모두 로드한다.
    # 설명: canonical 문서와 달리 현재 구현은 단일 파일 고정이 아니므로 다중 JSON 공존 시 함께 반영된다.
    for path in iter_policy_json_files(policy_root):
        chunks.extend(load_policy_chunks_from_json(path, policy_root))

    return chunks
