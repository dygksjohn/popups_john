import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, unwrap, setToken } from "../../../api/noticeApi";

export default function AdminLogin() {
  useEffect(() => {
    document.title = "푸푸 관리자 센터 | 로그인";
  }, []);

  const navigate = useNavigate();

  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [accountType, setAccountType] = useState("admin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Tab 자동 입력
  const handleIdKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      setId("admin@pupoo.com");
      setPw("admin1234");
    }
  };

  // 실제 API 로그인
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!id || !pw) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await authApi.login(id, pw);
      const data = unwrap(res);
      const token = data?.accessToken || data?.token;
      if (!token) {
        setError("토큰을 받지 못했습니다.");
        return;
      }
      setToken(token);
      navigate("/admin/dashboard");
    } catch (err) {
      console.error("[Login error]", err);
      setError("관리자 계정 정보가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f7f8fa",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          background: "#fff",
          padding: "60px 50px 50px",
          borderRadius: "36px",
          boxShadow: "0 25px 60px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "28px",
          }}
        >
          <img
            src="/logo_blue.png"
            alt="PUPU Logo"
            style={{ height: "38px", objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "36px",
            marginBottom: "32px",
          }}
        >
          <Radio
            label="관리자 계정"
            value="admin"
            selected={accountType}
            onChange={setAccountType}
          />
          <Radio
            label="담당자 계정"
            value="staff"
            selected={accountType}
            onChange={setAccountType}
          />
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="이메일"
            value={id}
            onChange={(e) => setId(e.target.value)}
            onKeyDown={handleIdKeyDown}
            style={pillInput}
          />
          <input
            type="password"
            placeholder="비밀번호"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            style={{ ...pillInput, marginTop: "20px" }}
          />

          {error && (
            <div
              style={{
                marginTop: "10px",
                color: "#e53935",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "18px",
              borderRadius: "50px",
              border: "none",
              fontSize: "16px",
              fontWeight: "700",
              background: "#006BF0",
              color: "#fff",
              marginTop: "16px",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "로그인 중..." : "관리자 로그인"}
          </button>
        </form>

        <div
          style={{
            marginTop: "28px",
            textAlign: "center",
            fontSize: "14px",
            color: "#777",
          }}
        >
          아이디/비밀번호
          찾기&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;관리자
          만들기
        </div>
      </div>
    </div>
  );
}

function Radio({ label, value, selected, onChange }) {
  const active = selected === value;
  return (
    <div
      onClick={() => onChange(value)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        cursor: "pointer",
        fontSize: "15px",
        color: active ? "#006BF0" : "#888",
        fontWeight: active ? "600" : "400",
        transition: "all 0.2s ease",
      }}
    >
      <div
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: active ? "6px solid #006BF0" : "2px solid #ccc",
          boxSizing: "border-box",
          transition: "all 0.2s ease",
          background: "#fff",
        }}
      />
      {label}
    </div>
  );
}

const pillInput = {
  width: "100%",
  padding: "18px 22px",
  borderRadius: "50px",
  border: "1px solid #ddd",
  fontSize: "15px",
  outline: "none",
  background: "#fafafa",
};
