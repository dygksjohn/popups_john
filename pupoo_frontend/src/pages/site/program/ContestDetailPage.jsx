import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Trophy,
  Users,
  Clock3,
  ArrowLeft,
  BarChart3,
  Heart,
  PawPrint,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import {
  SERVICE_CATEGORIES,
  SUBTITLE_MAP,
} from "../constants/programConstants";
import { programApi } from "../../../app/http/programApi";
import { tokenStore } from "../../../app/http/tokenStore";
import { authApi } from "../auth/api/authApi";

const styles = `
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');

  .cd-root { box-sizing: border-box; font-family: 'Pretendard Variable', 'Pretendard', -apple-system, sans-serif; background: #f8f9fc; min-height: 100vh; }
  .cd-root *, .cd-root *::before, .cd-root *::after { box-sizing: border-box; font-family: inherit; }
  .cd-container { max-width: 1400px; margin: 0 auto; padding: 28px 24px 64px; }

  .cd-back {
    height: 36px; border-radius: 10px; border: 1px solid #e5e7eb; background: #fff;
    padding: 0 12px; display: inline-flex; align-items: center; gap: 6px; cursor: pointer; color: #374151; font-weight: 700;
    margin-bottom: 14px;
  }

  .cd-title-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 18px 20px; margin-bottom: 14px; }
  .cd-title { font-size: 20px; font-weight: 800; color: #111827; margin: 0 0 6px; }
  .cd-sub { font-size: 13px; color: #6b7280; margin: 0; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; row-gap: 6px; }
  .cd-sub span { display: inline-flex; align-items: center; gap: 5px; white-space: nowrap; }
  .cd-top-actions { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
  .cd-top-btn {
    height: 38px; padding: 0 14px; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer;
    display: inline-flex; align-items: center; gap: 6px;
  }
  .cd-top-btn.primary {
    border: none; background: linear-gradient(135deg,#f59e0b,#f97316); color: #fff;
    box-shadow: 0 4px 14px rgba(245,158,11,0.28);
  }
  .cd-top-btn.primary:disabled { background: #e5e7eb; color: #9ca3af; box-shadow: none; cursor: not-allowed; }
  .cd-top-btn.outline { border: 1px solid #e5e7eb; background: #fff; color: #374151; }

  .cd-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; }
  .cd-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 18px 20px; }
  .cd-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f3f6; }
  .cd-card-title { margin: 0; font-size: 15px; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 8px; }
  .cd-tag { font-size: 11px; font-weight: 700; color: #6b7280; background: #f3f4f6; border-radius: 999px; padding: 4px 10px; }

  .cd-candidate-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .cd-candidate-card { border: 1px solid #eceef3; border-radius: 12px; overflow: hidden; background: #fff; }
  .cd-candidate-thumb { width: 100%; aspect-ratio: 1 / 1; background: #f8f9fb; display: flex; align-items: center; justify-content: center; overflow: hidden; }
  .cd-candidate-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-candidate-body { padding: 10px 12px 12px; }
  .cd-candidate-name { font-size: 14px; font-weight: 800; color: #111827; }
  .cd-candidate-owner { margin-top: 4px; font-size: 12px; color: #6b7280; }
  .cd-candidate-votes { margin-top: 8px; font-size: 12px; font-weight: 700; color: #7c3aed; }
  .cd-candidate-actions { margin-top: 10px; }
  .cd-vote-btn {
    width: 100%; height: 36px; border-radius: 9px; border: none;
    background: linear-gradient(135deg,#f59e0b,#f97316); color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
    box-shadow: 0 3px 10px rgba(245,158,11,0.3); transition: all 0.15s;
  }
  .cd-vote-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(245,158,11,0.4); }
  .cd-vote-btn:disabled { background: #e5e7eb; color: #9ca3af; cursor: not-allowed; box-shadow: none; }
  .cd-vote-btn.done { background: linear-gradient(135deg,#ecfdf5,#d1fae5); color: #059669; border: 1px solid #a7f3d0; box-shadow: none; }

  .cd-list { display: flex; flex-direction: column; gap: 8px; }
  .cd-item { border: 1px solid #eceef3; border-radius: 10px; padding: 12px 14px; background: #fff; }
  .cd-item-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 8px; }
  .cd-name { font-size: 14px; font-weight: 700; color: #111827; }
  .cd-votes { font-size: 13px; font-weight: 800; color: #7c3aed; }
  .cd-progress { height: 6px; border-radius: 999px; background: #f1f3f6; overflow: hidden; }
  .cd-progress-fill { height: 100%; border-radius: 999px; background: #8b5cf6; }
  .cd-meta { margin-top: 6px; font-size: 12px; color: #9ca3af; }

  .cd-empty { color: #9ca3af; font-size: 13px; padding: 20px 0; text-align: center; }

  @media (max-width: 980px) {
    .cd-grid { grid-template-columns: 1fr; }
  }
  @media (max-width: 680px) {
    .cd-candidate-grid { grid-template-columns: 1fr; }
  }
`;

const toAbsUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const base = (
    import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"
  ).replace(/\/$/, "");
  return base + (url.startsWith("/") ? url : "/" + url);
};

function formatTimeRange(startAt, endAt) {
  const pick = (v) => {
    const m = String(v ?? "").match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : "";
  };
  const a = pick(startAt);
  const b = pick(endAt);
  return a && b ? `${a} ~ ${b}` : a || b || "?쒓컙 誘몄젙";
}

function contestPhase(program) {
  const now = Date.now();
  const s = new Date(program?.startAt ?? "").getTime();
  const e = new Date(program?.endAt ?? "").getTime();
  if (Number.isFinite(s) && now < s) return "upcoming";
  if (Number.isFinite(e) && now > e) return "ended";
  return "live";
}

export default function ContestDetailPage() {
  const navigate = useNavigate();
  const { eventId, programId } = useParams();
  const currentPath = "/program/contest";

  const [program, setProgram] = useState(null);
  const [rows, setRows] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [myProgramApplyId, setMyProgramApplyId] = useState(null);
  const [voteSubmittingId, setVoteSubmittingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const load = async ({ silent = false } = {}) => {
    if (!programId) return;
    if (!silent) setLoading(true);
    setErrorMsg("");
    try {
      const [programRes, candRes, voteRes] = await Promise.all([
        programApi.getProgramDetail(programId),
        programApi.getCandidates(programId, { page: 0, size: 200 }),
        programApi.getContestVoteResult(programId),
      ]);

      const programData = programRes?.data?.data ?? null;
      const candidates = candRes?.data?.data?.content ?? [];
      const voteData = voteRes?.data?.data ?? {};
      const voteRows = Array.isArray(voteData?.results) ? voteData.results : [];
      const voteMap = new Map(
        voteRows.map((r) => [
          Number(r?.programApplyId),
          Number(r?.voteCount ?? 0),
        ]),
      );

      const mapped = candidates
        .map((c) => ({
          id: Number(c?.programApplyId),
          name:
            c?.petName ||
            (c?.ticketNo
              ? `李멸???${c.ticketNo}`
              : `李멸???#${c?.programApplyId}`),
          ownerNickname:
            c?.ownerNickname ||
            (c?.userId ? `?뚯썝 #${c.userId}` : "?뚯썝 ?뺣낫 ?놁쓬"),
          imageUrl: c?.imageUrl || null,
          votes: voteMap.get(Number(c?.programApplyId)) ?? 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      setProgram(programData);
      setRows(mapped);
      setTotalVotes(Number(voteData?.totalVotes ?? 0));
      setMyProgramApplyId(
        voteData?.myProgramApplyId == null
          ? null
          : Number(voteData.myProgramApplyId),
      );
    } catch (e) {
      setErrorMsg(
        e?.response?.data?.message ||
          e?.response?.data?.error?.message ||
          e?.message ||
          "肄섑뀒?ㅽ듃 ?곸꽭 ?곗씠?곕? 遺덈윭?ㅼ? 紐삵뻽?듬땲??",
      );
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [programId]);

  const maxVotes = useMemo(
    () => rows.reduce((m, r) => (r.votes > m ? r.votes : m), 0),
    [rows],
  );

  const handleVote = async (candidateId) => {
    if (!candidateId || voteSubmittingId) return;
    if (contestPhase(program) !== "live") return;
    if (myProgramApplyId) return;

    if (!tokenStore.getAccess()) {
      try {
        const refreshed = await authApi.refresh();
        if (refreshed?.accessToken) {
          tokenStore.setAccess(refreshed.accessToken);
        } else {
          navigate("/auth/login", {
            state: { from: `/program/contest/${eventId}/detail/${programId}` },
          });
          return;
        }
      } catch {
        navigate("/auth/login", {
          state: { from: `/program/contest/${eventId}/detail/${programId}` },
        });
        return;
      }
    }

    setVoteSubmittingId(candidateId);
    try {
      await programApi.voteContest(Number(programId), Number(candidateId));
      await load({ silent: true });
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/auth/login", {
          state: { from: `/program/contest/${eventId}/detail/${programId}` },
        });
      } else if (e?.response?.status === 409) {
        await load({ silent: true });
      } else {
        window.alert(
          e?.response?.data?.error?.message ||
            e?.response?.data?.message ||
            "?ы몴 泥섎━ 以??ㅻ쪟媛 諛쒖깮?덉뒿?덈떎.",
        );
      }
    } finally {
      setVoteSubmittingId(null);
    }
  };

  const handleApply = () => {
    if (!eventId || !programId) return;
    navigate(`/program/contest/${eventId}?apply=${programId}`);
  };

  return (
    <div className="cd-root">
      <style>{styles}</style>
      <PageHeader
        title="肄섑뀒?ㅽ듃 ?덈궡"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(eventId ? `${path}/${eventId}` : path)}
      />
      <main className="cd-container">
        <button
          className="cd-back"
          type="button"
          onClick={() => navigate(`/program/contest/${eventId}`)}
        >
          <ArrowLeft size={14} />
          紐⑸줉?쇰줈
        </button>
          <div className="cd-top-actions">
            <button
              type="button"
              className="cd-top-btn primary"
              onClick={handleApply}
              disabled={contestPhase(program) === "ended"}
            >
              <Heart size={14} />
              {contestPhase(program) === "ended" ? "참가 마감" : "참가하기"}
            </button>
            <button
              type="button"
              className="cd-top-btn outline"
              onClick={() => navigate(`/program/contest/${eventId}`)}
            >
              후보 목록 보기
            </button>
          </div>

        <section className="cd-title-card">
          <h2 className="cd-title">
            {program?.programTitle || `肄섑뀒?ㅽ듃 #${programId}`}
          </h2>
          <p className="cd-sub">
            <span>
              <Clock3 size={13} />{" "}
              {formatTimeRange(program?.startAt, program?.endAt)}
            </span>
            <span>
              <Users size={13} /> ?꾨낫 {rows.length}紐?
            </span>
            <span>
              <BarChart3 size={13} /> 珥?{totalVotes.toLocaleString()}??
            </span>
          </p>
        </section>

        {loading ? (
          <div className="cd-empty">?곗씠?곕? 遺덈윭?ㅻ뒗 以?..</div>
        ) : null}
        {errorMsg ? <div className="cd-empty">{errorMsg}</div> : null}

        {!loading && !errorMsg ? (
          <section className="cd-grid">
            <article className="cd-card">
              <div className="cd-card-head">
                <h3 className="cd-card-title">
                  <Users size={16} /> 肄섑뀒?ㅽ듃 李몄뿬 ?꾨낫??
                </h3>
                <span className="cd-tag">{rows.length}명</span>
              </div>
              <div className="cd-candidate-grid">
                {rows.length === 0 ? (
                  <div className="cd-empty">?꾨낫?먭? ?놁뒿?덈떎.</div>
                ) : null}
                {rows.map((r) => (
                  <div key={r.id} className="cd-candidate-card">
                    <div className="cd-candidate-thumb">
                      {r.imageUrl ? (
                        <img
                          src={toAbsUrl(r.imageUrl)}
                          alt={r.name}
                          onError={(e) => {
                            e.target.style.display = "none";
                          }}
                        />
                      ) : (
                        <PawPrint size={30} color="#9ca3af" />
                      )}
                    </div>
                    <div className="cd-candidate-body">
                      <div className="cd-candidate-name">{r.name}</div>
                      <div className="cd-candidate-owner">
                        二쇱씤 ?됰꽕?? {r.ownerNickname}
                      </div>
                      <div className="cd-candidate-votes">
                        ?뿳截?{r.votes.toLocaleString()}??
                      </div>
                      <div className="cd-candidate-actions">
                        <button
                          type="button"
                          className={`cd-vote-btn${myProgramApplyId === r.id ? " done" : ""}`}
                          onClick={() => handleVote(r.id)}
                          disabled={
                            voteSubmittingId === r.id ||
                            myProgramApplyId != null ||
                            contestPhase(program) !== "live"
                          }
                        >
                          {myProgramApplyId === r.id
                            ? "?ы몴 ?꾨즺"
                            : voteSubmittingId === r.id
                              ? "?ы몴 以?.."
                              : contestPhase(program) !== "live"
                                ? "?ы몴 遺덇?"
                                : "?ы몴?섍린"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="cd-card">
              <div className="cd-card-head">
                <h3 className="cd-card-title">
                  <Trophy size={16} /> ?ㅼ떆媛??ы몴 ?꾪솴 諛?寃곌낵
                </h3>
                <span className="cd-tag">
                  珥?{totalVotes.toLocaleString()}??
                </span>
              </div>
              <div className="cd-list">
                {rows.length === 0 ? (
                  <div className="cd-empty">吏묎퀎 寃곌낵媛 ?놁뒿?덈떎.</div>
                ) : null}
                {rows.map((r, idx) => (
                  <div key={`rank-${r.id}`} className="cd-item">
                    <div className="cd-item-top">
                      <div className="cd-name">
                        {idx + 1}??{r.name}
                      </div>
                      <div className="cd-votes">
                        {totalVotes > 0
                          ? Math.round((r.votes / totalVotes) * 100)
                          : 0}
                        %
                      </div>
                    </div>
                    <div className="cd-progress">
                      <div
                        className="cd-progress-fill"
                        style={{
                          width: `${maxVotes > 0 ? (r.votes / maxVotes) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="cd-meta">{r.votes.toLocaleString()}표</div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        ) : null}
      </main>
    </div>
  );
}
