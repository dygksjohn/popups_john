import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "./api/authApi";

const PASSWORD_RESET_CONTEXT_KEY = "password_reset_context";

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resetContext, setResetContext] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const raw = sessionStorage.getItem(PASSWORD_RESET_CONTEXT_KEY);
    if (!raw) {
      setErrorMessage("인증번호 확인이 필요합니다.");
      setLoading(false);
      return;
    }

    try {
      const parsed = JSON.parse(raw);
      if (!parsed?.email || !parsed?.phone || !parsed?.verificationCode) {
        throw new Error("INVALID_CONTEXT");
      }
      setResetContext(parsed);
      setErrorMessage("");
    } catch {
      sessionStorage.removeItem(PASSWORD_RESET_CONTEXT_KEY);
      setErrorMessage("인증번호 확인이 필요합니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      setErrorMessage("새 비밀번호를 입력해 주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setErrorMessage("비밀번호가 일치하지 않습니다.");
      return;
    }

    setSubmitting(true);
    setErrorMessage("");

    try {
      await authApi.passwordResetConfirm({
        email: resetContext.email,
        phone: resetContext.phone,
        verificationCode: resetContext.verificationCode,
        newPassword: password,
      });
      sessionStorage.removeItem(PASSWORD_RESET_CONTEXT_KEY);
      setSuccessMessage("비밀번호가 변경되었습니다. 다시 로그인해 주세요.");
      setTimeout(() => navigate("/auth/login"), 1200);
    } catch (error) {
      const message =
        error?.response?.data?.error?.message ||
        "비밀번호를 변경하지 못했습니다. 인증번호를 다시 확인해 주세요.";
      setErrorMessage(message);
      setSuccessMessage("");
    } finally {
      setSubmitting(false);
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
        <h1 style={{ margin: 0, fontSize: 24, color: "#1F2937" }}>비밀번호 재설정</h1>
        <p style={{ marginTop: 10, marginBottom: 20, color: "#6B7280", fontSize: 14 }}>
          새 비밀번호를 입력하고 계정 접근을 다시 설정해 주세요.
        </p>

        {loading ? (
          <p style={{ margin: "12px 0 0", color: "#2563EB", fontSize: 13 }}>
            인증 상태를 확인하는 중입니다.
          </p>
        ) : null}

        {!loading && resetContext ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호"
              style={{
                height: 44,
                border: "1px solid #D1D5DB",
                borderRadius: 8,
                padding: "0 12px",
                fontSize: 14,
              }}
            />
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="새 비밀번호 확인"
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
              disabled={submitting}
              style={{
                height: 46,
                border: "none",
                borderRadius: 8,
                background: submitting ? "#93C5FD" : "#3B82F6",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: submitting ? "default" : "pointer",
                marginTop: 4,
              }}
            >
              {submitting ? "변경 중..." : "비밀번호 변경"}
            </button>
          </form>
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
            onClick={() => navigate("/auth/find-password")}
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
            다시 요청하기
          </button>
        </div>
      </div>
    </div>
  );
}
