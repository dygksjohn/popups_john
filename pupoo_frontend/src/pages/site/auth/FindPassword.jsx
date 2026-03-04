import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function FindPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
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
          가입한 이메일과 휴대전화 번호를 입력해 주세요.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
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
            placeholder="휴대전화(숫자만)"
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
            style={{
              height: 46,
              border: "none",
              borderRadius: 8,
              background: "#3B82F6",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            확인
          </button>
        </form>

        {submitted ? (
          <p style={{ marginTop: 12, color: "#2563EB", fontSize: 13 }}>
            현재 비밀번호 재설정 API 연동 전입니다. 관리자에게 문의해 주세요.
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
