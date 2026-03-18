"""
로컬에서 정책 chunking + Milvus 인덱싱 실행.
- policy_docs/*.json 을 로드·청킹·임베딩 후 Milvus에 upsert.
- 프로젝트 루트(popups)에서 실행: python pupoo_ai/scripts/run_policy_index.py [--dry-run]
"""
from __future__ import annotations

import sys
from pathlib import Path

_repo_root = Path(__file__).resolve().parent.parent.parent
if str(_repo_root) not in sys.path:
    sys.path.insert(0, str(_repo_root))

import argparse
from pupoo_ai.app.features.moderation.rag_service import build_policy_index, POLICY_DOC_ROOT


def main() -> None:
    parser = argparse.ArgumentParser(description="정책 문서를 청킹해 Milvus에 인덱싱합니다.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Milvus 연결 없이 청크 수·차원만 확인",
    )
    args = parser.parse_args()

    print(f"정책 경로: {POLICY_DOC_ROOT}")
    total, dim = build_policy_index(dry_run=args.dry_run)
    if args.dry_run:
        print(f"[dry-run] 청크: {total}개, 차원: {dim}.")
        if total == 0:
            print("  → policy_docs 아래에 .json 정책 파일을 두고, JSON 생성 스크립트를 먼저 실행하세요.")
        return
    print(f"인덱싱 완료: {total}개 청크 (dim={dim}).")


if __name__ == "__main__":
    main()
