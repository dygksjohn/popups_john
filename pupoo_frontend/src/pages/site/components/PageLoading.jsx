const styles = `
  .page-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 100px 20px;
    min-height: 400px;
    grid-column: 1 / -1;
  }
  .pl-loader {
    position: relative;
    width: 40px;
    height: 40px;
  }
  .pl-circle {
    position: absolute;
    width: 38px;
    height: 38px;
    opacity: 0;
    transform: rotate(225deg);
    animation: pl-orbit 5.5s infinite;
  }
  .pl-circle::after {
    content: '';
    position: absolute;
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #3b82f6;
  }
  .pl-circle:nth-child(2) { animation-delay: 240ms; }
  .pl-circle:nth-child(2)::after { background: #60a5fa; }
  .pl-circle:nth-child(3) { animation-delay: 480ms; }
  .pl-circle:nth-child(3)::after { background: #93bbfd; }
  .pl-circle:nth-child(4) { animation-delay: 720ms; }
  .pl-circle:nth-child(4)::after { background: #bfdbfe; }
  .pl-circle:nth-child(5) { animation-delay: 960ms; }
  .pl-circle:nth-child(5)::after { background: #dbeafe; }
  .page-loading-text {
    margin-top: 36px;
    font-size: 13px;
    font-weight: 600;
    color: #9ca3af;
    letter-spacing: -0.02em;
    font-family: inherit;
    animation: pl-fade 2s linear infinite;
  }
  @keyframes pl-orbit {
    0%   { transform: rotate(225deg); opacity: 1; animation-timing-function: ease-out; }
    7%   { transform: rotate(345deg); animation-timing-function: linear; }
    30%  { transform: rotate(455deg); animation-timing-function: ease-in-out; }
    39%  { transform: rotate(690deg); animation-timing-function: linear; }
    70%  { transform: rotate(815deg); opacity: 1; animation-timing-function: ease-out; }
    75%  { transform: rotate(945deg); animation-timing-function: ease-out; }
    76%  { transform: rotate(945deg); opacity: 0; }
    100% { transform: rotate(945deg); opacity: 0; }
  }
  @keyframes pl-fade {
    0%   { opacity: 0; }
    20%  { opacity: 0; }
    50%  { opacity: 1; }
    100% { opacity: 0; }
  }
`;

export default function PageLoading({ message = "불러오는 중" }) {
  return (
    <>
      <style>{styles}</style>
      <div className="page-loading">
        <div className="pl-loader">
          <div className="pl-circle" />
          <div className="pl-circle" />
          <div className="pl-circle" />
          <div className="pl-circle" />
          <div className="pl-circle" />
        </div>
        <span className="page-loading-text">{message}</span>
      </div>
    </>
  );
}
