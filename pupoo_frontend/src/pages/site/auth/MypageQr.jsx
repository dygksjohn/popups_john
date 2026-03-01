import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mypageApi } from "./api/mypageApi";
import { resolveErrorMessage } from "../../../features/shared/forms/formError";
import {
  mypageCardStyle,
  mypageInputStyle,
  mypageLabelStyle,
  mypageOutlineButtonStyle,
  mypagePageStyle,
  mypagePrimaryButtonStyle,
  mypageTitleStyle,
} from "../../../features/shared/ui/mypageStyles";

export default function MypageQr() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState("");
  const [registrations, setRegistrations] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [qr, setQr] = useState(null);

  const selectableEvents = useMemo(
    () =>
      (registrations || []).filter(
        (item) => item?.eventId && (item?.status === "APPLIED" || item?.status === "APPROVED"),
      ),
    [registrations],
  );

  const issueQr = async (eventId) => {
    if (!eventId) return;
    try {
      setIssuing(true);
      setError("");
      const data = await mypageApi.issueMyQr(Number(eventId));
      setQr(data || null);
    } catch (e) {
      setError(resolveErrorMessage(e, "QR 발급에 실패했습니다."));
    } finally {
      setIssuing(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      try {
        setLoading(true);
        setError("");
        const page = await mypageApi.getMyEventRegistrations({ page: 0, size: 50 });
        const content = Array.isArray(page?.content) ? page.content : [];
        if (!mounted) return;
        setRegistrations(content);

        const first = content.find(
          (item) => item?.eventId && (item?.status === "APPLIED" || item?.status === "APPROVED"),
        );
        if (!first?.eventId) {
          setError("신청 또는 승인된 행사 정보가 없어 QR을 자동 발급할 수 없습니다.");
          return;
        }
        setSelectedEventId(String(first.eventId));
        await issueQr(first.eventId);
      } catch (e) {
        if (!mounted) return;
        setError(resolveErrorMessage(e, "QR 자동 발급 준비에 실패했습니다."));
      } finally {
        if (mounted) setLoading(false);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div style={mypagePageStyle}>
      <div style={{ ...mypageCardStyle, maxWidth: 760, margin: "120px auto 80px" }}>
        <h2 style={mypageTitleStyle}>내 QR코드</h2>
        {error ? <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{error}</div> : null}

        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14, flexWrap: "wrap" }}>
          <label htmlFor="eventId" style={mypageLabelStyle}>
            행사 선택
          </label>
          <select
            id="eventId"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            style={mypageInputStyle}
            disabled={loading || issuing}
          >
            <option value="">행사를 선택하세요</option>
            {selectableEvents.map((item) => (
              <option key={`${item.eventId}-${item.applyId}`} value={item.eventId}>
                eventId {item.eventId} / {item.status}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => issueQr(selectedEventId)}
            disabled={loading || issuing || !selectedEventId}
            style={{ ...mypagePrimaryButtonStyle, cursor: loading || issuing || !selectedEventId ? "not-allowed" : "pointer" }}
          >
            {issuing ? "발급 중..." : "QR 재발급"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/mypage")}
            style={mypageOutlineButtonStyle}
          >
            마이페이지로
          </button>
        </div>

        {qr ? (
          <div style={{ border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 13, color: "#475569", marginBottom: 8 }}>발급 결과</div>
            <div style={{ fontSize: 13, lineHeight: 1.8 }}>
              <div>qrId: {qr.qrId}</div>
              <div>eventId: {qr.eventId}</div>
              <div>mimeType: {qr.mimeType || "-"}</div>
              <div>issuedAt: {qr.issuedAt || "-"}</div>
              <div>expiredAt: {qr.expiredAt || "-"}</div>
              <div>
                originalUrl:{" "}
                <a href={qr.originalUrl} target="_blank" rel="noreferrer">
                  {qr.originalUrl}
                </a>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
