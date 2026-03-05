import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, UserRound } from "lucide-react";
import { programApi } from "../../../app/http/programApi";

const AVATAR_COLORS = ["#1a4fd6", "#059669", "#d97706", "#dc2626", "#7c3aed"];

function avatarColor(id) {
  return AVATAR_COLORS[Math.abs(Number(id) || 0) % AVATAR_COLORS.length];
}

const css = `
  .sp-root { background:#f8f9fc; min-height:100vh; padding:32px 16px 56px; }
  .sp-wrap { max-width:840px; margin:0 auto; }
  .sp-head { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
  .sp-back {
    width:38px; height:38px; border-radius:50%; border:1px solid #e5e7eb; background:#fff;
    display:flex; align-items:center; justify-content:center; cursor:pointer;
  }
  .sp-title { font-size:22px; font-weight:800; color:#111827; }
  .sp-card { background:#fff; border:1px solid #e9ecef; border-radius:16px; padding:24px; }
  .sp-top { display:flex; gap:16px; align-items:center; }
  .sp-avatar {
    width:64px; height:64px; border-radius:50%; color:#fff; font-size:24px; font-weight:800;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .sp-name { font-size:20px; font-weight:800; color:#111827; }
  .sp-bio { margin-top:18px; color:#374151; line-height:1.7; white-space:pre-wrap; }
  .sp-contact { margin-top:18px; display:flex; flex-wrap:wrap; gap:12px; }
  .sp-chip {
    display:inline-flex; align-items:center; gap:6px; padding:8px 12px;
    border-radius:999px; border:1px solid #e5e7eb; background:#f8fafc; font-size:13px; color:#4b5563;
  }
  .sp-load, .sp-err {
    min-height:50vh; display:flex; align-items:center; justify-content:center; color:#9ca3af;
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
        const msg = e?.response?.data?.message || e?.message || "Speaker detail load failed";
        setErrorMsg(code ? `[${code}] ${msg}` : msg);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [speakerId, programId]);

  if (loading) {
    return (
      <div className="sp-root">
        <style>{css}</style>
        <div className="sp-load">Loading...</div>
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
              <ArrowLeft size={16} />
            </button>
            <div className="sp-title">연사 상세</div>
          </div>
          <div className="sp-err">{errorMsg || "Speaker not found."}</div>
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
            <ArrowLeft size={16} />
          </button>
          <div className="sp-title">연사 상세</div>
        </div>

        <div className="sp-card">
          <div className="sp-top">
            <div
              className="sp-avatar"
              style={{ background: avatarColor(speaker.speakerId) }}
            >
              {(speaker.speakerName || "?").charAt(0)}
            </div>
            <div>
              <div className="sp-name">{speaker.speakerName || "이름 없음"}</div>
              <div style={{ marginTop: 4, color: "#9ca3af", fontSize: 13 }}>
                <UserRound size={12} style={{ marginRight: 4 }} />
                Speaker ID: {speaker.speakerId ?? "-"}
              </div>
            </div>
          </div>

          {!!speaker.speakerBio && <div className="sp-bio">{speaker.speakerBio}</div>}

          <div className="sp-contact">
            {!!speaker.speakerEmail && (
              <span className="sp-chip">
                <Mail size={13} />
                {speaker.speakerEmail}
              </span>
            )}
            {!!speaker.speakerPhone && (
              <span className="sp-chip">
                <Phone size={13} />
                {speaker.speakerPhone}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
