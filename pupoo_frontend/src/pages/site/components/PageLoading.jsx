const styles = `
  .page-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
  }
  .page-loading-dots {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
  }
  .page-loading-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #c7d2fe;
    animation: page-dot-bounce 1.4s ease-in-out infinite;
  }
  .page-loading-dot:nth-child(1) { animation-delay: 0s; }
  .page-loading-dot:nth-child(2) { animation-delay: 0.16s; }
  .page-loading-dot:nth-child(3) { animation-delay: 0.32s; }
  @keyframes page-dot-bounce {
    0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
    40% { transform: scale(1); opacity: 1; background: #6366f1; }
  }
  .page-loading-text {
    font-size: 14px;
    font-weight: 600;
    color: #94a3b8;
    letter-spacing: -0.2px;
  }
`;

export default function PageLoading({ message = "데이터를 불러오는 중입니다" }) {
  return (
    <>
      <style>{styles}</style>
      <div className="page-loading">
        <div className="page-loading-dots">
          <div className="page-loading-dot" />
          <div className="page-loading-dot" />
          <div className="page-loading-dot" />
        </div>
        <span className="page-loading-text">{message}</span>
      </div>
    </>
  );
}
