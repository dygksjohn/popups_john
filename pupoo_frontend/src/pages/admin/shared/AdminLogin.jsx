import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  authApi,
  unwrap,
  setToken,
  getToken,
  clearToken,
  adminNoticeApi,
} from "../../../api/noticeApi";

const page = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: 420,
    background: "#fff",
    borderRadius: 18,
    border: "1px solid #e2e8f0",
    boxShadow: "0 16px 44px rgba(15, 23, 42, 0.12)",
    padding: "28px 24px",
  },
  title: { margin: 0, fontSize: 24, fontWeight: 800, color: "#0f172a" },
  sub: { marginTop: 6, marginBottom: 20, fontSize: 13, color: "#64748b" },
  label: {
    fontSize: 12,
    fontWeight: 700,
    color: "#475569",
    display: "block",
    marginBottom: 6,
  },
  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    fontSize: 14,
    outline: "none",
    marginBottom: 14,
  },
  button: {
    width: "100%",
    border: "none",
    borderRadius: 10,
    padding: "12px 0",
    background: "#1d4ed8",
    color: "#fff",
    fontSize: 14,
    fontWeight: 700,
    cursor: "pointer",
  },
  err: {
    marginBottom: 12,
    borderRadius: 10,
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#b91c1c",
    padding: "10px 12px",
    fontSize: 12.5,
    fontWeight: 600,
  },
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const from = location.state?.from || "/admin/dashboard";

  useEffect(() => {
    const validate = async () => {
      const token = getToken();
      if (!token) return;

      try {
        await adminNoticeApi.list(1, 1);
        navigate(from, { replace: true });
      } catch {
        clearToken();
      }
    };

    validate();
  }, [from, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const res = await authApi.login(email, password);
      const data = unwrap(res);
      const token = data?.accessToken || data?.token;
      if (!token) {
        setError("토큰을 받지 못했습니다.");
        return;
      }

      setToken(token);
      navigate(from, { replace: true });
    } catch {
      setError("관리자 계정 정보가 올바르지 않습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page.wrap}>
      <form style={page.card} onSubmit={onSubmit}>
        <h1 style={page.title}>관리자 로그인</h1>
        <p style={page.sub}>관리자 페이지 접근을 위해 로그인해 주세요.</p>

        {error ? <div style={page.err}>{error}</div> : null}

        <label style={page.label}>이메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@pupoo.com"
          style={page.input}
          autoFocus
        />

        <label style={page.label}>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호"
          style={page.input}
        />

        <button type="submit" style={page.button} disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
      </form>
    </div>
  );
}
