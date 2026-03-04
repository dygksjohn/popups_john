import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trophy, Users, Clock3, ArrowLeft, BarChart3, PawPrint } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { SERVICE_CATEGORIES, SUBTITLE_MAP } from "../constants/programConstants";
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
  .cd-sub { font-size: 13px; color: #6b7280; margin: 0; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }

  .cd-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 14px; }
  .cd-card { background: #fff; border: 1px solid #e9ecef; border-radius: 13px; padding: 18px 20px; }
  .cd-card-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid #f1f3f6; }
  .cd-card-title { margin: 0; font-size: 15px; font-weight: 800; color: #111827; display: flex; align-items: center; gap: 8px; }
  .cd-tag { font-size: 11px; font-weight: 700; color: #6b7280; background: #f3f4f6; border-radius: 999px; padding: 4px 10px; }

  .cd-candidate-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .cd-candidate-card { border: 1px solid #eceef3; border-radius: 12px; overflow: hidden; background: #fff; }
  .cd-candidate-thumb { width: 100%; aspect-ratio: 4 / 3; background: #f3f4f6; display: flex; align-items: center; justify-content: center; }
  .cd-candidate-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cd-candidate-body { padding: 10px 12px 12px; }
  .cd-candidate-name { font-size: 14px; font-weight: 800; color: #111827; }
  .cd-candidate-owner { margin-top: 4px; font-size: 12px; color: #6b7280; }
  .cd-candidate-votes { margin-top: 8px; font-size: 12px; font-weight: 700; color: #7c3aed; }
  .cd-candidate-actions { margin-top: 10px; }
  .cd-vote-btn {
    width: 100%; height: 34px; border-radius: 8px; border: none;
    background: #1d4ed8; color: #fff; font-size: 12px; font-weight: 700; cursor: pointer;
  }
  .cd-vote-btn:disabled { background: #d1d5db; color: #9ca3af; cursor: not-allowed; }
  .cd-vote-btn.done { background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; }

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

function formatTimeRange(startAt, endAt) {
  const pick = (v) => {
    const m = String(v ?? "").match(/(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : "";
  };
  const a = pick(startAt);
  const b = pick(endAt);
  return a && b ? `${a} ~ ${b}` : a || b || "시간 미정";
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
        voteRows.map((r) => [Number(r?.programApplyId), Number(r?.voteCount ?? 0)]),
      );

      const mapped = candidates
        .map((c) => ({
          id: Number(c?.programApplyId),
          name:
            c?.petName ||
            (c?.ticketNo ? `참가자 ${c.ticketNo}` : `참가자 #${c?.programApplyId}`),
          ownerNickname: c?.ownerNickname || (c?.userId ? `회원 #${c.userId}` : "회원 정보 없음"),
          imageUrl: c?.imageUrl || null,
          votes: voteMap.get(Number(c?.programApplyId)) ?? 0,
        }))
        .sort((a, b) => b.votes - a.votes);

      setProgram(programData);
      setRows(mapped);
      setTotalVotes(Number(voteData?.totalVotes ?? 0));
      setMyProgramApplyId(
        voteData?.myProgramApplyId == null ? null : Number(voteData.myProgramApplyId),
      );
    } catch (e) {
      setErrorMsg(
        e?.response?.data?.message ||
          e?.response?.data?.error?.message ||
          e?.message ||
          "콘테스트 상세 데이터를 불러오지 못했습니다.",
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
          navigate("/auth/login", { state: { from: `/program/contest/${eventId}/detail/${programId}` } });
          return;
        }
      } catch {
        navigate("/auth/login", { state: { from: `/program/contest/${eventId}/detail/${programId}` } });
        return;
      }
    }

    setVoteSubmittingId(candidateId);
    try {
      await programApi.voteContest(Number(programId), Number(candidateId));
      await load({ silent: true });
    } catch (e) {
      if (e?.response?.status === 401) {
        navigate("/auth/login", { state: { from: `/program/contest/${eventId}/detail/${programId}` } });
      } else if (e?.response?.status === 409) {
        await load({ silent: true });
      } else {
        window.alert(
          e?.response?.data?.error?.message ||
            e?.response?.data?.message ||
            "투표 처리 중 오류가 발생했습니다.",
        );
      }
    } finally {
      setVoteSubmittingId(null);
    }
  };

  return (
    <div className="cd-root">
      <style>{styles}</style>
      <PageHeader
        title="콘테스트 및 투표"
        subtitle={SUBTITLE_MAP[currentPath]}
        categories={SERVICE_CATEGORIES}
        currentPath={currentPath}
        onNavigate={(path) => navigate(eventId ? `${path}/${eventId}` : path)}
      />
      <main className="cd-container">
        <button className="cd-back" type="button" onClick={() => navigate(`/program/contest/${eventId}`)}>
          <ArrowLeft size={14} />
          목록으로
        </button>

        <section className="cd-title-card">
          <h2 className="cd-title">{program?.programTitle || `콘테스트 #${programId}`}</h2>
          <p className="cd-sub">
            <span><Clock3 size={13} /> {formatTimeRange(program?.startAt, program?.endAt)}</span>
            <span><Users size={13} /> 후보 {rows.length}명</span>
            <span><BarChart3 size={13} /> 총 {totalVotes.toLocaleString()}표</span>
          </p>
        </section>

        {loading ? <div className="cd-empty">데이터를 불러오는 중...</div> : null}
        {errorMsg ? <div className="cd-empty">{errorMsg}</div> : null}

        {!loading && !errorMsg ? (
          <section className="cd-grid">
            <article className="cd-card">
              <div className="cd-card-head">
                <h3 className="cd-card-title"><Users size={16} /> 콘테스트 참여 후보자</h3>
                <span className="cd-tag">{rows.length}명</span>
              </div>
              <div className="cd-candidate-grid">
                {rows.length === 0 ? <div className="cd-empty">후보자가 없습니다.</div> : null}
                {rows.map((r) => (
                  <div key={r.id} className="cd-candidate-card">
                    <div className="cd-candidate-thumb">
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.name} />
                      ) : (
                        <PawPrint size={30} color="#9ca3af" />
                      )}
                    </div>
                    <div className="cd-candidate-body">
                      <div className="cd-candidate-name">{r.name}</div>
                      <div className="cd-candidate-owner">주인 닉네임: {r.ownerNickname}</div>
                      <div className="cd-candidate-votes">현재 득표 {r.votes.toLocaleString()}표</div>
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
                            ? "투표 완료"
                            : voteSubmittingId === r.id
                              ? "투표 중..."
                              : contestPhase(program) !== "live"
                                ? "투표 불가"
                                : "투표하기"}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="cd-card">
              <div className="cd-card-head">
                <h3 className="cd-card-title"><Trophy size={16} /> 실시간 투표 현황 및 결과</h3>
                <span className="cd-tag">총 {totalVotes.toLocaleString()}표</span>
              </div>
              <div className="cd-list">
                {rows.length === 0 ? <div className="cd-empty">집계 결과가 없습니다.</div> : null}
                {rows.map((r, idx) => (
                  <div key={`rank-${r.id}`} className="cd-item">
                    <div className="cd-item-top">
                      <div className="cd-name">{idx + 1}위 {r.name}</div>
                      <div className="cd-votes">
                        {totalVotes > 0 ? Math.round((r.votes / totalVotes) * 100) : 0}%
                      </div>
                    </div>
                    <div className="cd-progress">
                      <div
                        className="cd-progress-fill"
                        style={{ width: `${maxVotes > 0 ? (r.votes / maxVotes) * 100 : 0}%` }}
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
