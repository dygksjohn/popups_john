// src/pages/site/program/SessionDetail.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { programApi } from "../../../app/http/programApi";

export default function SessionDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const programId = searchParams.get("programId");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [program, setProgram] = useState(null);

  const [speakerLoading, setSpeakerLoading] = useState(false);
  const [speakers, setSpeakers] = useState([]);

  useEffect(() => {
    if (!programId) {
      setErrorMsg("programId가 없습니다.");
      setProgram(null);
      return;
    }

    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await programApi.getProgramDetail(programId);
        setProgram(res.data.data);
      } catch (e) {
        const statusCode = e?.response?.status;
        const msg =
          e?.response?.data?.message ||
          e?.response?.data?.error ||
          e?.message ||
          "세션 상세 조회 실패";
        setErrorMsg(statusCode ? `[${statusCode}] ${msg}` : msg);
        setProgram(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [programId]);

  useEffect(() => {
    if (!programId) return;

    (async () => {
      setSpeakerLoading(true);
      try {
        const res = await programApi.getProgramSpeakers(programId);
        setSpeakers(res.data.data || []);
      } catch (e) {
        // 연사 없거나 에러면 빈 목록 처리
        setSpeakers([]);
      } finally {
        setSpeakerLoading(false);
      }
    })();
  }, [programId]);

  if (loading) return <div style={{ padding: 16 }}>로딩중...</div>;

  if (errorMsg) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ color: "red", marginBottom: 12 }}>에러: {errorMsg}</div>
        <button onClick={() => navigate(-1)}>뒤로</button>
      </div>
    );
  }

  if (!program) return <div style={{ padding: 16 }}>데이터 없음</div>;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)}>뒤로</button>

      <h2 style={{ marginTop: 12 }}>{program.programTitle}</h2>
      <div style={{ opacity: 0.8 }}>
        {String(program.startAt ?? "")} ~ {String(program.endAt ?? "")}
      </div>

      {program.description && (
        <div style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
          {program.description}
        </div>
      )}

      <hr style={{ margin: "16px 0" }} />

      <h3 style={{ marginBottom: 10 }}>연사</h3>

      {speakerLoading && <div>연사 불러오는 중...</div>}

      {!speakerLoading && speakers.length === 0 && (
        <div style={{ opacity: 0.7 }}>등록된 연사가 없습니다.</div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {speakers.map((s) => (
          <div
            key={s.speakerId}
            style={{
              border: "1px solid #ddd",
              borderRadius: 10,
              padding: 12,
            }}
          >
            <div style={{ fontWeight: 700 }}>{s.speakerName}</div>
            {s.speakerBio && (
              <div style={{ marginTop: 6, opacity: 0.85 }}>{s.speakerBio}</div>
            )}
            {(s.speakerEmail || s.speakerPhone) && (
              <div style={{ marginTop: 6, opacity: 0.7 }}>
                {s.speakerEmail ? `📧 ${s.speakerEmail}` : ""}
                {s.speakerEmail && s.speakerPhone ? " / " : ""}
                {s.speakerPhone ? `📞 ${s.speakerPhone}` : ""}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
