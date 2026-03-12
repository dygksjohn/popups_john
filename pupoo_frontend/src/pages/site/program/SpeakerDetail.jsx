import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone } from "lucide-react";
import { programApi } from "../../../app/http/programApi";
import { resolveImageUrl } from "../../../shared/utils/publicAssetUrl";

const AVATAR_COLORS = ["#1a4fd6", "#059669", "#d97706", "#dc2626", "#7c3aed"];

function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}

const css = `
  .sp-root {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 32%),
      linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
    padding: 32px 16px 64px;
    font-family: 'Noto Sans KR', sans-serif;
  }
  .sp-wrap { max-width: 1180px; margin: 0 auto; }
  .sp-head { display: flex; align-items: center; gap: 12px; margin-bottom: 22px; }
  .sp-back {
    width: 42px;
    height: 42px;
    border-radius: 12px;
    border: 1px solid #dbe2ea;
    background: rgba(255,255,255,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 8px 18px rgba(15, 23, 42, 0.08);
  }
  .sp-title { font-size: 28px; font-weight: 900; color: #0f172a; }
  .sp-card {
    display: grid;
    grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
    gap: 24px;
    padding: 28px;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(219, 234, 254, 0.9);
    border-radius: 28px;
    box-shadow: 0 28px 60px rgba(15, 23, 42, 0.12);
    backdrop-filter: blur(10px);
  }
  .sp-photo {
    min-height: 480px;
    border-radius: 24px;
    overflow: hidden;
    background: linear-gradient(145deg, #dbeafe, #eef2ff);
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sp-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .sp-photo-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    font-size: 108px;
    font-weight: 900;
  }
  .sp-info { display: flex; flex-direction: column; }
  .sp-name { font-size: 36px; font-weight: 900; color: #0f172a; line-height: 1.18; }
  .sp-summary { margin-top: 10px; font-size: 15px; line-height: 1.8; color: #475569; }
  .sp-meta { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }
  .sp-chip {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border-radius: 999px;
    border: 1px solid #dbe2ea;
    background: #fff;
    color: #334155;
    font-size: 13px;
    font-weight: 700;
  }
  .sp-section {
    margin-top: 24px;
    border: 1px solid #e2e8f0;
    border-radius: 18px;
    background: #fff;
    padding: 20px 22px;
  }
  .sp-section h2 { margin: 0 0 12px; font-size: 18px; font-weight: 900; color: #0f172a; }
  .sp-section p { margin: 0; font-size: 15px; line-height: 1.9; color: #334155; white-space: pre-wrap; }
  .sp-empty {
    min-height: 420px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #64748b;
    font-size: 14px;
  }
  .sp-note {
    margin-top: 20px;
    padding: 14px 16px;
    border-radius: 16px;
    background: #eff6ff;
    color: #1d4ed8;
    font-size: 13px;
    font-weight: 700;
  }
  @media (max-width: 960px) {
    .sp-card { grid-template-columns: 1fr; }
    .sp-photo { min-height: 360px; }
  }
  @media (max-width: 640px) {
    .sp-root { padding: 20px 14px 48px; }
    .sp-card { padding: 18px; border-radius: 22px; }
    .sp-title { font-size: 24px; }
    .sp-name { font-size: 28px; }
    .sp-photo { min-height: 300px; }
  }
`;

export default function SpeakerDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const speakerId = searchParams.get("speakerId");
  const programId = searchParams.get("programId");

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [speaker, setSpeaker] = useState(null);

  useEffect(() => {
    if (!speakerId) {
      setErrorMsg("speakerId is required.");
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        let res;
        if (programId) {
          try {
            res = await programApi.getProgramSpeaker(programId, speakerId);
          } catch {
            res = await programApi.getSpeakerDetail(speakerId);
          }
        } else {
          res = await programApi.getSpeakerDetail(speakerId);
        }
        if (!mounted) return;
        setSpeaker(res?.data?.data ?? null);
      } catch (e) {
        if (!mounted) return;
        const code = e?.response?.status;
        const msg = e?.response?.data?.message || e?.message || "연사 정보를 불러오지 못했습니다.";
        setErrorMsg(code ? `[${code}] ${msg}` : msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [speakerId, programId]);

  const speakerImageUrl = useMemo(
    () => resolveImageUrl(speaker?.speakerImageUrl),
    [speaker?.speakerImageUrl],
  );
  const initial = String(speaker?.speakerName || "연").trim().charAt(0) || "연";

  if (loading) {
    return (
      <div className="sp-root">
        <style>{css}</style>
        <div className="sp-wrap">
          <div className="sp-head">
            <button className="sp-back" onClick={() => navigate(-1)} aria-label="back">
              <ArrowLeft size={18} />
            </button>
            <div className="sp-title">연사 상세</div>
          </div>
          <div className="sp-card">
            <div className="sp-empty">연사 정보를 불러오는 중입니다.</div>
          </div>
        </div>
      </div>
    );
  }

  if (errorMsg || !speaker) {
    return (
      <div className="sp-root">
        <style>{css}</style>
        <div className="sp-wrap">
          <div className="sp-head">
            <button className="sp-back" onClick={() => navigate(-1)} aria-label="back">
              <ArrowLeft size={18} />
            </button>
            <div className="sp-title">연사 상세</div>
          </div>
          <div className="sp-card">
            <div className="sp-empty">{errorMsg || "연사 정보를 찾을 수 없습니다."}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-root">
      <style>{css}</style>
      <div className="sp-wrap">
        <div className="sp-head">
          <button className="sp-back" onClick={() => navigate(-1)} aria-label="back">
            <ArrowLeft size={18} />
          </button>
          <div className="sp-title">연사 상세</div>
        </div>

        <div className="sp-card">
          <div className="sp-photo">
            {speakerImageUrl ? (
              <img src={speakerImageUrl} alt={speaker.speakerName || "연사 사진"} />
            ) : (
              <div className="sp-photo-fallback" style={{ background: avatarColor(speaker.speakerId) }}>
                {initial}
              </div>
            )}
          </div>

          <div className="sp-info">
            <div className="sp-name">{speaker.speakerName || "이름 없음"}</div>
            <div className="sp-summary">
              {speaker.speakerBio || "등록된 소개가 없습니다. 연사 소개와 활동 분야를 여기에 노출할 수 있습니다."}
            </div>

            <div className="sp-meta">
              {speaker.speakerEmail ? (
                <span className="sp-chip">
                  <Mail size={15} />
                  {speaker.speakerEmail}
                </span>
              ) : null}
              {speaker.speakerPhone ? (
                <span className="sp-chip">
                  <Phone size={15} />
                  {speaker.speakerPhone}
                </span>
              ) : null}
            </div>

            <section className="sp-section">
              <h2>연사 소개</h2>
              <p>{speaker.speakerBio || "상세 소개가 아직 등록되지 않았습니다."}</p>
            </section>

            <div className="sp-note">
              이력/경력 섹션은 별도 구조로 추가하는 편이 안전합니다. 제안은 아래 답변에 정리했습니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
