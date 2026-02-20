import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

const initialDogs = [
  {
    id: 1,
    name: "체리",
    album: "공주같이 자는 개 보셨어요?",
    votes: 1768,
    img: "http://kgj.dothome.co.kr/pupoo/cherry.png",
  },
  {
    id: 2,
    name: "체리",
    album: "쟤가 쟤에요",
    votes: 1316,
    img: "http://kgj.dothome.co.kr/pupoo/cherry2.png",
  },
  {
    id: 3,
    name: "도도",
    album: "산책 마스터",
    votes: 489,
    img: "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=400&h=400&fit=crop",
  },
  {
    id: 4,
    name: "초코",
    album: "애교 폭발 모드",
    votes: 455,
    img: "https://images.unsplash.com/photo-1504595403659-9088ce801e29?w=400&h=400&fit=crop",
  },
  {
    id: 5,
    name: "모치",
    album: "솜사탕 털뭉치",
    votes: 376,
    img: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=400&h=400&fit=crop",
  },
  {
    id: 6,
    name: "마리",
    album: "간식 앞에 진심",
    votes: 375,
    img: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop",
  },
  {
    id: 7,
    name: "요한",
    album: "공놀이 국가대표",
    votes: 375,
    img: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=400&h=400&fit=crop",
  },
  {
    id: 8,
    name: "코기",
    album: "심쿵 눈빛 장착",
    votes: 362,
    img: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
  },
];

function formatVotes(n) {
  return n.toLocaleString();
}

function calcPercentages(dogs) {
  const total = dogs.reduce((s, d) => s + d.votes, 0);
  return dogs.map((d) => ({
    ...d,
    pct: total ? ((d.votes / total) * 100).toFixed(2) : "0.00",
  }));
}

export default function VoteStatus() {
  const [dogs, setDogs] = useState(() => calcPercentages(initialDogs));
  const [modal, setModal] = useState(null); // { dog }
  const [voted, setVoted] = useState(null); // id of recently voted
  const [badge, setBadge] = useState(null); // id showing badge

  const openModal = (dog) => setModal({ dog });
  const closeModal = () => setModal(null);

  const confirmVote = () => {
    const id = modal.dog.id;
    closeModal();
    setDogs((prev) => {
      const updated = prev.map((d) =>
        d.id === id ? { ...d, votes: d.votes + 1 } : d,
      );
      return calcPercentages(updated);
    });
    setVoted(id);
    setBadge(id);
    setTimeout(() => setVoted(null), 1200);
    setTimeout(() => setBadge(null), 2200);
  };

  return (
    <>
      <style>{`
       @import url("https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css");
       * {
  font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
}
        .vote-root {
          min-height: 100vh;
          background: #f0f0f5;
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
          padding: 40px 0;

        }

        .vote-container {
          max-width: 1370px;
          width: 100%;
          margin: 0 auto;
          padding: 0 24px;
          box-sizing: border-box;
           
        }

        .vote-header {
          text-align: center;
          margin-bottom: 36px;
        }

        .vote-header h1 {
         
          font-size: 3rem;
          letter-spacing: 0.08em;
          color: #1a1a2e;
        }

        .vote-header p {
          color: #666;
          font-size: 0.95rem;
          margin-top: 6px;
        }

        .vote-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }

        @media (max-width: 900px) {
          .vote-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 520px) {
          .vote-grid { grid-template-columns: 1fr; }
        }

        .card {
          background: #fff;
          border-radius: 5px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          transition: transform 0.2s, box-shadow 0.2s, outline 0.1s;
          position: relative;
        }

        .card:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 30px rgba(0,0,0,0.13);
        }

        .card.glowing {
  outline: 3px solid #006BF0;
  box-shadow: 0 0 0 6px rgba(0,107,240,0.18), 0 8px 30px rgba(0,0,0,0.13);
  animation: glowPulse 1.2s ease forwards;
}

        @keyframes glowPulse {
          0% { outline-color: #969696; }
          60% { outline-color: #c1c1c1; }
          100% { outline-color: transparent; outline-width: 0; }
        }

        .rank-badge {
          position: absolute;
          top: 0;
          left: 0;
          background: #006BF0;
          color: #fff;
         
          font-size: 1.1rem;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          letter-spacing: 0.02em;
        }

        .card-img-wrap {
          position: relative;
          width: 100%;
          padding-top: 100%;
          overflow: hidden;
          background: #e5e5ef;
        }

        .card-img-wrap img {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.4s;
        }

        .card:hover .card-img-wrap img {
          transform: scale(1.04);
        }

        .vote-badge {
          position: absolute;
          bottom: 8px;
          left: 50%;
          transform: translateX(-50%);
          background: #006BF0;
          color: white;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 4px 12px;
          border-radius: 20px;
          white-space: nowrap;
          animation: badgePop 2.2s ease forwards;
          z-index: 20;
          letter-spacing: 0.04em;
        }

        @keyframes badgePop {
          0% { opacity: 0; transform: translateX(-50%) scale(0.7); }
          15% { opacity: 1; transform: translateX(-50%) scale(1.05); }
          20% { transform: translateX(-50%) scale(1); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateX(-50%) scale(0.8); }
        }

        .card-body {
          padding: 14px 16px 16px;
        }

        .dog-album {
    font-size: 12px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: #a1a1a1;
    margin-bottom: 3px;
}

       .dog-name {
    font-size: 27px;
    color: #333333;
    letter-spacing: 0.01px;
    line-height: 1;
    margin-bottom: 10px;
    font-weight: 700;
}

        .vote-row {
          display: flex;
          align-items: baseline;
          gap: 10px;
          margin-bottom: 8px;
        }

        .vote-count {
          font-size: 0.85rem;
          font-weight: 600;
          color: #1a1a2e;
        }

        .vote-count span {
          font-size: 0.72rem;
          font-weight: 400;
          color: #999;
          margin-left: 2px;
        }

        .vote-pct {
          font-size: 0.82rem;
          font-weight: 600;
          color: #006BF0;
          margin-left: auto;
        }

        .progress-bg {
          height: 4px;
          background: #ede9fe;
          border-radius: 99px;
          overflow: hidden;
          margin-bottom: 14px;
        }

        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #006BF0, #8bbffa);
          border-radius: 99px;
          transition: width 0.7s cubic-bezier(0.22, 1, 0.36, 1);
        }

       .vote-btn {
  width: 100%;
  padding: 9px 0;
  background: #006BF0;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: 'Pretendard', sans-serif;
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

        .vote-btn:hover {
          background: #147eff;
        }

        .vote-btn:active {
          transform: scale(0.97);
        }

        /* Modal */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 10, 30, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
            z-index: 9999;     
  overflow: hidden;  
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .modal-box {
          background: #fff;
          border-radius: 20px;
          padding: 40px 36px 32px;
          max-width: 380px;
          width: 90%;
          box-shadow: 0 20px 60px rgba(0,0,0,0.25);
          animation: slideUp 0.25s cubic-bezier(0.22, 1, 0.36, 1);
          text-align: center;
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid #ede9fe;
          margin: 0 auto 16px;
          display: block;
        }

        .modal-title {
         
          font-size: 22px;
          color: #1a1a2e;
          letter-spacing: 0.04em;
          margin-bottom: 8px;
          font-weight:700;
        }

        .modal-sub {
          font-size: 0.9rem;
          color: #777;
          margin-bottom: 28px;
          line-height: 1.5;
        }

        .modal-sub strong {
          color: #006BF0;
        }

        .modal-actions {
          display: flex;
          gap: 12px;
        }

        .btn-cancel {
          flex: 1;
          padding: 12px 0;
          border: 2px solid #e5e7eb;
          background: transparent;
          border-radius: 10px;
          
          font-size: 0.9rem;
          font-weight: 600;
          color: #666;
          cursor: pointer;
          transition: border-color 0.2s, color 0.2s;
        }

        .btn-cancel:hover {
          border-color: #d1d5db;
          color: #333;
        }

        .btn-confirm {
          flex: 1;
          padding: 12px 0;
          background: linear-gradient(135deg, #006BF0, #3a43ed);
          color: white;
          border: none;
          border-radius: 10px;
          
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }

        .btn-confirm:hover {
          opacity: 0.9;
        }

        .btn-confirm:active {
          transform: scale(0.97);
        }
      `}</style>

      <div className="vote-root">
        <div className="vote-container">
          <div className="section-title-wrap">
            <h1 className="section-title">고객상담 프로세스</h1>
            <p className="section-subtitle">
              <strong>오뚜기</strong>는 언제나 고객의 소리에 귀기울여 듣고
              있습니다
            </p>
          </div>

          <div className="vote-grid">
            {dogs.map((dog, i) => (
              <div
                key={dog.id}
                className={`card${voted === dog.id ? " glowing" : ""}`}
              >
                <div className="rank-badge">{i + 1}</div>
                <div className="card-img-wrap">
                  <img src={dog.img} alt={dog.name} loading="lazy" />
                  {badge === dog.id && (
                    <div className="vote-badge">✓ Vote Completed!</div>
                  )}
                </div>
                <div className="card-body">
                  <div className="dog-album">{dog.album}</div>
                  <div className="dog-name">{dog.name}</div>
                  <div className="vote-row">
                    <div className="vote-count">
                      {formatVotes(dog.votes)}
                      <span>표</span>
                    </div>
                    <div className="vote-pct">{dog.pct}%</div>
                  </div>
                  <div className="progress-bg">
                    <div
                      className="progress-bar"
                      style={{ width: `${dog.pct}%` }}
                    />
                  </div>
                  <button className="vote-btn" onClick={() => openModal(dog)}>
                    <Heart size={16} strokeWidth={2.5} />
                    투표하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <img
              className="modal-icon"
              src={modal.dog.img}
              alt={modal.dog.name}
            />
            <div className="modal-title">최종 투표 확인</div>
            <div className="modal-sub">
              <strong>
                #{dogs.findIndex((d) => d.id === modal.dog.id) + 1}{" "}
                {modal.dog.name}
              </strong>{" "}
              에게 투표 하시겠습니까?
              <br />
              투표 시 1표가 추가됩니다.
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeModal}>
                취소
              </button>
              <button className="btn-confirm" onClick={confirmVote}>
                투표하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
