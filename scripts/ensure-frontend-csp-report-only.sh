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

POLICY_NAME="${FRONTEND_CSP_POLICY_NAME:-pupoo-frontend-security-report-only}"
REPORT_URI="${FRONTEND_CSP_REPORT_URI:-https://api.pupoo.site/api/security/csp/report}"
CSP_REPORT_ONLY="default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'self'; form-action 'self'; script-src 'self' 'unsafe-eval' 'report-sample' https://dapi.kakao.com https://t1.daumcdn.net; style-src 'self' 'unsafe-inline' 'report-sample' https://fonts.googleapis.com https://cdn.jsdelivr.net; img-src 'self' data: blob: https://cdn.pupoo.site https://images.unsplash.com https://k.kakaocdn.net https://*.kakaocdn.net https://phinf.pstatic.net https://lh3.googleusercontent.com https://t1.daumcdn.net; font-src 'self' data: https://fonts.gstatic.com https://cdn.jsdelivr.net; connect-src 'self' https://api.pupoo.site https://dapi.kakao.com; frame-src 'self' https://maps.google.com https://www.google.com; media-src 'self' blob: https://cdn.pupoo.site; worker-src 'self' blob:; manifest-src 'self'; report-uri ${REPORT_URI}; upgrade-insecure-requests"

workdir="$(mktemp -d)"
trap 'rm -rf "${workdir}"' EXIT

policy_config_file="${workdir}/response-headers-policy.json"
distribution_config_file="${workdir}/distribution-config.json"

jq -n \
  --arg name "${POLICY_NAME}" \
  --arg comment "PUPOO frontend security headers with CSP report-only policy" \
  --arg csp "${CSP_REPORT_ONLY}" \
  '{
    Name: $name,
    Comment: $comment,
    SecurityHeadersConfig: {
      XSSProtection: {
        Override: true,
        Protection: true,
        ModeBlock: true
      },
      FrameOptions: {
        Override: true,
        FrameOption: "SAMEORIGIN"
      },
      ReferrerPolicy: {
        Override: true,
        ReferrerPolicy: "strict-origin-when-cross-origin"
      },
      ContentTypeOptions: {
        Override: true
      },
      StrictTransportSecurity: {
        Override: true,
        AccessControlMaxAgeSec: 31536000
      }
    },
    CustomHeadersConfig: {
      Quantity: 1,
      Items: [
        {
          Header: "Content-Security-Policy-Report-Only",
          Value: $csp,
          Override: true
        }
      ]
    }
  }' > "${policy_config_file}"

existing_policy_id="$(aws cloudfront list-response-headers-policies \
  --type custom \
  --query "ResponseHeadersPolicyList.Items[?ResponseHeadersPolicy.ResponseHeadersPolicyConfig.Name=='${POLICY_NAME}'].ResponseHeadersPolicy.Id | [0]" \
  --output text)"

if [[ -z "${existing_policy_id}" || "${existing_policy_id}" == "None" ]]; then
  policy_id="$(aws cloudfront create-response-headers-policy \
    --response-headers-policy-config "file://${policy_config_file}" \
    --query 'ResponseHeadersPolicy.Id' \
    --output text)"
else
  policy_id="${existing_policy_id}"
  policy_etag="$(aws cloudfront get-response-headers-policy --id "${policy_id}" --query 'ETag' --output text)"
  aws cloudfront update-response-headers-policy \
    --id "${policy_id}" \
    --if-match "${policy_etag}" \
    --response-headers-policy-config "file://${policy_config_file}" >/dev/null
fi

distribution_json="$(aws cloudfront get-distribution-config --id "${FRONTEND_CF_DISTRIBUTION_ID}" --output json)"
distribution_etag="$(jq -r '.ETag' <<< "${distribution_json}")"
current_policy_id="$(jq -r '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId // empty' <<< "${distribution_json}")"

if [[ "${current_policy_id}" != "${policy_id}" ]]; then
  jq --arg policy_id "${policy_id}" \
    '.DistributionConfig.DefaultCacheBehavior.ResponseHeadersPolicyId = $policy_id | .DistributionConfig' \
    <<< "${distribution_json}" > "${distribution_config_file}"

  aws cloudfront update-distribution \
    --id "${FRONTEND_CF_DISTRIBUTION_ID}" \
    --if-match "${distribution_etag}" \
    --distribution-config "file://${distribution_config_file}" >/dev/null

  aws cloudfront wait distribution-deployed --id "${FRONTEND_CF_DISTRIBUTION_ID}"
fi

echo "Applied response headers policy ${policy_id} to distribution ${FRONTEND_CF_DISTRIBUTION_ID}"
