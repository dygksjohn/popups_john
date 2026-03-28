#!/usr/bin/env bash

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

if [[ -z "${FRONTEND_CF_DISTRIBUTION_ID:-}" ]]; then
  echo "FRONTEND_CF_DISTRIBUTION_ID is required" >&2
  exit 1
fi

FUNCTION_NAME="${FRONTEND_CSP_FUNCTION_NAME:-pupoo-frontend-csp-report-only}"
REPORT_URI="${FRONTEND_CSP_REPORT_URI:-https://api.pupoo.site/api/security/csp/report}"
CSP_REPORT_ONLY="default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-eval' 'report-sample' https://dapi.kakao.com https://t1.daumcdn.net; style-src 'self' 'unsafe-inline' 'report-sample' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https://cdn.pupoo.site https://images.unsplash.com https://k.kakaocdn.net https://*.kakaocdn.net https://phinf.pstatic.net https://lh3.googleusercontent.com https://t1.daumcdn.net; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; connect-src 'self' https://api.pupoo.site https://dapi.kakao.com; frame-src 'self' https://maps.google.com https://www.google.com; media-src 'self' blob: https://cdn.pupoo.site; worker-src 'self' blob:; manifest-src 'self'; report-uri ${REPORT_URI}; upgrade-insecure-requests"

workdir="$(mktemp -d)"
trap 'rm -rf "${workdir}"' EXIT

function_code_file="${workdir}/frontend-csp-report-only.js"
distribution_config_file="${workdir}/distribution-config.json"

csp_js_literal="$(jq -Rn --arg value "${CSP_REPORT_ONLY}" '$value')"

cat > "${function_code_file}" <<EOF
function handler(event) {
  var response = event.response;
  var headers = response.headers;
  var contentTypeHeader = headers["content-type"];
  var contentType = contentTypeHeader && contentTypeHeader.value ? contentTypeHeader.value.toLowerCase() : "";

  if (contentType.indexOf("text/html") === -1) {
    return response;
  }

  headers["content-security-policy-report-only"] = { value: ${csp_js_literal} };
  return response;
}
EOF

if aws cloudfront describe-function --name "${FUNCTION_NAME}" --stage DEVELOPMENT > "${workdir}/function-development.json" 2>/dev/null; then
  function_etag="$(jq -r '.ETag' "${workdir}/function-development.json")"
  aws cloudfront update-function \
    --name "${FUNCTION_NAME}" \
    --if-match "${function_etag}" \
    --function-config Comment="PUPOO frontend CSP report-only header injection",Runtime=cloudfront-js-2.0 \
    --function-code "fileb://${function_code_file}" >/dev/null
else
  aws cloudfront create-function \
    --name "${FUNCTION_NAME}" \
    --function-config Comment="PUPOO frontend CSP report-only header injection",Runtime=cloudfront-js-2.0 \
    --function-code "fileb://${function_code_file}" >/dev/null
fi

publish_etag="$(aws cloudfront describe-function --name "${FUNCTION_NAME}" --stage DEVELOPMENT --query 'ETag' --output text)"
aws cloudfront publish-function --name "${FUNCTION_NAME}" --if-match "${publish_etag}" >/dev/null

function_arn="$(aws cloudfront describe-function --name "${FUNCTION_NAME}" --stage LIVE --query 'FunctionSummary.FunctionMetadata.FunctionARN' --output text)"

distribution_json="$(aws cloudfront get-distribution-config --id "${FRONTEND_CF_DISTRIBUTION_ID}" --output json)"
distribution_etag="$(jq -r '.ETag' <<< "${distribution_json}")"
current_function_arn="$(jq -r '.DistributionConfig.DefaultCacheBehavior.FunctionAssociations.Items[]? | select(.EventType == "viewer-response") | .FunctionARN' <<< "${distribution_json}")"

if [[ "${current_function_arn}" != "${function_arn}" ]]; then
  jq --arg function_arn "${function_arn}" \
    '.DistributionConfig.DefaultCacheBehavior.FunctionAssociations = (
      (.DistributionConfig.DefaultCacheBehavior.FunctionAssociations // {Quantity: 0, Items: []})
      | .Items = (((.Items // []) | map(select(.EventType != "viewer-response"))) + [{EventType: "viewer-response", FunctionARN: $function_arn}])
      | .Quantity = (.Items | length)
    ) | .DistributionConfig' \
    <<< "${distribution_json}" > "${distribution_config_file}"

  aws cloudfront update-distribution \
    --id "${FRONTEND_CF_DISTRIBUTION_ID}" \
    --if-match "${distribution_etag}" \
    --distribution-config "file://${distribution_config_file}" >/dev/null

  aws cloudfront wait distribution-deployed --id "${FRONTEND_CF_DISTRIBUTION_ID}"
fi

echo "Applied CloudFront function ${FUNCTION_NAME} (${function_arn}) to distribution ${FRONTEND_CF_DISTRIBUTION_ID}"
