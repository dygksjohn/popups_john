"""정책 인덱싱 실행 스크립트.

기능:
- 로컬에서 policy_docs를 읽어 Milvus 정책 인덱스를 구축한다.

설명:
- 현재 구현은 `policy_docs` 아래의 JSON/TXT를 모두 읽는다.
- canonical 정책 문서와 별개로 다중 JSON이 함께 인덱싱될 수 있으므로 실행 전 파일 구성을 확인해야 한다.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

from pupoo_ai.app.features.moderation.rag_service import POLICY_DOC_ROOT, build_policy_index


def main() -> None:
    # 기능: 정책 인덱싱 스크립트를 실행한다.
    # 설명: dry-run이면 적재 없이 로딩 가능한 청크 수만 확인한다.
    # 흐름: 인자 파싱 -> build_policy_index 호출 -> 실행 결과 출력.
    parser = argparse.ArgumentParser(description="정책 문서를 청크화해 Milvus 인덱스를 구축합니다.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Milvus 연결 없이 청크 로딩 결과만 확인합니다.",
    )
    args = parser.parse_args()

    print(f"정책 경로: {POLICY_DOC_ROOT}")
    total, dim = build_policy_index(dry_run=args.dry_run)
    if args.dry_run:
        print(f"[dry-run] 청크: {total}개, 차원: {dim}")
        if total == 0:
            print("  -> policy_docs 아래에 .json 또는 .txt 정책 파일이 있는지 확인하세요.")
        return
    print(f"인덱싱 완료: {total}개 청크 (dim={dim})")
