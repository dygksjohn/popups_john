import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, normalizeApiError } from "./api/authApi";

const PASSWORD_RESET_CONTEXT_KEY = "password_reset_context";

// 기능: 비밀번호 재설정 첫 단계에서 인증번호 요청 실패 이유를 화면 메시지로 정리한다.
function resolvePasswordResetRequestMessage(error) {
  const normalized = normalizeApiError(error, "인증번호 요청에 실패했습니다. 잠시 후 다시 시도해주세요.");

  if (normalized.status === 400) {
    return "이메일과 휴대폰 번호를 다시 확인해주세요.";
  }

  if (normalized.status === 404) {
    return "일치하는 회원 정보를 찾을 수 없습니다.";
  }

  if (normalized.status === 409) {
    return "이미 진행 중인 재설정 요청이 있으면 기존 인증번호를 먼저 확인해주세요.";
  }

  return normalized.message;
}

// 기능: 인증번호 확인 단계 실패 이유를 재설정 흐름 기준 메시지로 바꾼다.
function resolvePasswordResetVerifyMessage(error) {
  const normalized = normalizeApiError(error, "인증번호 확인에 실패했습니다. 다시 시도해주세요.");

  if (normalized.status === 400) {
    return "인증번호 형식을 다시 확인해주세요.";
  }

  if (normalized.status === 401) {
    return "인증번호가 만료되었거나 유효하지 않습니다.";
  }

  if (normalized.status === 409) {
    return "이미 사용된 인증번호이거나 다시 요청이 필요합니다.";
  }

  return normalized.message;
}

export default function FindPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [devVerificationCode, setDevVerificationCode] = useState("");
  const [codeRequested, setCodeRequested] = useState(false);
  const [requestingCode, setRequestingCode] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleRequestCode = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setErrorMessage("이메일을 입력해주세요.");
      return;
    }

    if (!phone.trim()) {
      setErrorMessage("휴대폰 번호를 입력해주세요.");
      return;
    }

    setRequestingCode(true);
    setErrorMessage("");
    setSuccessMessage("");
    setCodeRequested(false);
    setVerificationCode("");
    setDevVerificationCode("");
    // 기능: 새 인증번호 요청이 시작되면 이전 재설정 컨텍스트를 지운다.
    // 설명: 다른 이메일과 휴대폰 조합으로 다시 요청할 수 있으므로, 이전 verify 성공 정보가 남아 있지 않게 만든다.
    sessionStorage.removeItem(PASSWORD_RESET_CONTEXT_KEY);

    try {
      const response = await authApi.passwordResetRequest({
        email: email.trim(),
        phone: phone.trim(),
      });

      // 기능: 인증번호 요청 성공 후에만 코드 입력 화면을 연다.
      // 설명: 성공 전까지는 단순 입력 폼 상태로 유지하고, dev 코드는 확인용으로만 보여준다.
      // 흐름: request 성공 -> codeRequested 활성화 -> 인증번호 입력 UI 표시.
      setCodeRequested(true);
      setDevVerificationCode(String(response?.verificationCode || ""));
      setSuccessMessage("인증번호를 발송했습니다. 메일로 받은 코드를 입력해주세요.");
    } catch (error) {
      setErrorMessage(resolvePasswordResetRequestMessage(error));
    } finally {
      setRequestingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!codeRequested) {
      setErrorMessage("먼저 인증번호를 요청해주세요.");
      return;
    }

    if (!verificationCode.trim()) {
      setErrorMessage("인증번호를 입력해주세요.");
      return;
    }

    setVerifyingCode(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      // 기능: 인증번호 확인 성공 시 다음 화면이 사용할 최소 정보를 sessionStorage에 저장한다.
      // 설명: reset 화면은 직접 접근을 막아야 하므로, verify 성공 결과가 있을 때만 sessionStorage를 통해 진입을 허용한다.
      await authApi.passwordResetVerifyCode({
        email: email.trim(),
        phone: phone.trim(),
        verificationCode: verificationCode.trim(),
      });

      // 기능: 새 비밀번호 입력 단계로 넘어갈 기준 컨텍스트를 저장한다.
      // 설명: 로컬 플래그가 아니라 백엔드 코드 검증 성공 응답 이후에만 저장한다.
      // 흐름: 코드 검증 성공 -> sessionStorage 컨텍스트 저장 -> reset 화면 이동.
      sessionStorage.setItem(
        PASSWORD_RESET_CONTEXT_KEY,
        JSON.stringify({
          email: email.trim(),
          phone: phone.trim(),
          verificationCode: verificationCode.trim(),
        }),
      );

      navigate("/auth/reset-password");
    } catch (error) {
      setErrorMessage(resolvePasswordResetVerifyMessage(error));
    } finally {
      setVerifyingCode(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #EEF2F9 0%, #E3EAF6 100%)",
        padding: "24px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderRadius: 16,
          padding: 28,
          boxShadow: "0 14px 36px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: 24, color: "#1F2937" }}>비밀번호 찾기</h1>
        <p style={{ marginTop: 10, marginBottom: 20, color: "#6B7280", fontSize: 14 }}>
          가입한 이메일과 휴대폰 번호를 확인한 뒤, 메일로 받은 인증번호를 검증해 새 비밀번호를 설정합니다.
        </p>

        {/* 기능: 첫 화면은 계정 식별 정보 입력과 인증번호 요청만 담당한다. */}
        <form onSubmit={handleRequestCode} style={{ display: "grid", gap: 10 }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일"
            style={{
              height: 44,
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "0 12px",
              fontSize: 14,
            }}
          />
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="휴대폰 번호"
            maxLength={11}
            style={{
              height: 44,
              border: "1px solid #D1D5DB",
              borderRadius: 8,
              padding: "0 12px",
              fontSize: 14,
            }}
          />

          <button
            type="submit"
            disabled={requestingCode}
            style={{
              height: 46,
              border: "none",
              borderRadius: 8,
              background: requestingCode ? "#93C5FD" : "#3B82F6",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: requestingCode ? "default" : "pointer",
              marginTop: 4,
            }}
          >
            {requestingCode ? "발송 중..." : "인증번호 요청"}
          </button>
        </form>

        {/* 기능: 인증번호 요청이 성공한 뒤에만 확인 입력 UI를 추가로 보여준다. */}
        {codeRequested ? (
          <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
            <input
              type="text"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
              placeholder="인증번호 6자리"
              maxLength={6}
              style={{
                height: 44,
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 14,
              }}
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={verifyingCode}
              style={{
                height: 46,
                border: "none",
                borderRadius: 8,
                background: verifyingCode ? "#93C5FD" : "#111827",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: verifyingCode ? "default" : "pointer",
              }}
            >
              {verifyingCode ? "확인 중..." : "인증번호 확인"}
            </button>
            {devVerificationCode ? (
              <p style={{ margin: 0, color: "#6B7280", fontSize: 12 }}>
                개발 환경 확인용 코드: {devVerificationCode}
              </p>
            ) : null}
          </div>
        ) : null}

        {successMessage ? (
          <p style={{ marginTop: 12, color: "#2563EB", fontSize: 13 }}>
            {successMessage}
          </p>
        ) : null}

        {errorMessage ? (
          <p style={{ marginTop: 12, color: "#DC2626", fontSize: 13 }}>
            {errorMessage}
          </p>
        ) : null}

        <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => navigate("/auth/login")}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 8,
              border: "1px solid #D1D5DB",
              background: "#fff",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            로그인으로
          </button>
          <button
            type="button"
            onClick={() => navigate("/auth/join/joinselect")}
            style={{
              flex: 1,
              height: 40,
              borderRadius: 8,
              border: "none",
              background: "#111827",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            회원가입하기
          </button>
        </div>
      </div>
    </div>
  );
}
