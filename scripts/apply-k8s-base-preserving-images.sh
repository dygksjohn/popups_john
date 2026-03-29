#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BASE_DIR="${1:-${REPO_ROOT}/k8s/base}"
NAMESPACE="${EKS_NAMESPACE:-pupoo}"
BACKEND_DEPLOYMENT="${BACKEND_DEPLOYMENT_NAME:-pupoo-backend}"
AI_DEPLOYMENT="${AI_DEPLOYMENT_NAME:-pupoo-ai}"
BACKEND_FALLBACK_IMAGE="${BACKEND_FALLBACK_IMAGE:-593797021262.dkr.ecr.ap-northeast-2.amazonaws.com/pupoo-backend:latest}"
AI_FALLBACK_IMAGE="${AI_FALLBACK_IMAGE:-593797021262.dkr.ecr.ap-northeast-2.amazonaws.com/pupoo-ai:latest}"

resolve_current_image() {
  local deployment_name="$1"
  local fallback_image="$2"
  local current_image

  current_image="$(kubectl -n "${NAMESPACE}" get deployment "${deployment_name}" -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true)"
  if [[ -n "${current_image}" ]]; then
    printf '%s' "${current_image}"
    return
  fi

  printf '%s' "${fallback_image}"
}

render_manifest_with_image() {
  local manifest_path="$1"
  local image_value="$2"

  python3 - "${manifest_path}" "${image_value}" <<'PY'
from pathlib import Path
import sys

path = Path(sys.argv[1])
image = sys.argv[2]
lines = path.read_text(encoding="utf-8").splitlines()

for index, line in enumerate(lines):
    stripped = line.lstrip()
    if stripped.startswith("image:"):
        indent = line[: len(line) - len(stripped)]
        lines[index] = f"{indent}image: {image}"
        path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        break
else:
    raise SystemExit(f"image field not found in {path}")
PY
}

BACKEND_IMAGE="$(resolve_current_image "${BACKEND_DEPLOYMENT}" "${BACKEND_FALLBACK_IMAGE}")"
AI_IMAGE="$(resolve_current_image "${AI_DEPLOYMENT}" "${AI_FALLBACK_IMAGE}")"

TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

cp -R "${BASE_DIR}/." "${TMP_DIR}/"
render_manifest_with_image "${TMP_DIR}/backend-deployment.yaml" "${BACKEND_IMAGE}"
render_manifest_with_image "${TMP_DIR}/ai-deployment.yaml" "${AI_IMAGE}"

echo "[cluster-sync] applying base manifests with preserved runtime images"
echo "[cluster-sync] backend image -> ${BACKEND_IMAGE}"
echo "[cluster-sync] ai image -> ${AI_IMAGE}"

kubectl apply -k "${TMP_DIR}"
