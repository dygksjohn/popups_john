from __future__ import annotations

import sys
from pathlib import Path

# pupoo_ai 폴더에서 실행해도 상위(popups)를 path에 넣어 pupoo_ai 패키지를 찾을 수 있게 함
_this_file = Path(__file__).resolve()
_popups_root = _this_file.parent.parent.parent.parent.parent  # moderation->features->app->pupoo_ai->popups
if _popups_root.is_dir() and str(_popups_root) not in sys.path:
    sys.path.insert(0, str(_popups_root))

import argparse

from pupoo_ai.app.features.moderation.rag_service import build_policy_index, POLICY_DOC_ROOT


def main() -> None:
    parser = argparse.ArgumentParser(description="정책 문서를 청킹해 Milvus에 인덱싱합니다.")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Milvus 연결 없이 정책 로딩·청크 수만 확인 (DB 미기동 시 사용)",
    )
    args = parser.parse_args()

    if args.dry_run:
        total, dim = build_policy_index(dry_run=True)
        print(f"[dry-run] policy_docs 경로: {POLICY_DOC_ROOT}")
        print(f"[dry-run] 로드된 청크: {total}개, 임베딩 차원: {dim}.")
        if total == 0:
            print("  → policy_docs 아래에 .json/.txt 정책 파일이 있는지 확인하세요.")
        else:
            print("  → Milvus 기동 후 --dry-run 없이 실행하면 인덱싱됩니다.")
        return

    total, dim = build_policy_index()
    print(f"Indexed {total} policy chunks (dim={dim}).")


if __name__ == "__main__":
    main()

