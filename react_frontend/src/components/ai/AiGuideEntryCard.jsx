import "./aiGuide.css";

export default function AiGuideEntryCard({ onClick }) {
  return (
    <button
      type="button"
      className="ai-entry-card"
      onClick={onClick}
      aria-label="AI 게임 안내 열기"
    >
      <div className="ai-entry-card__kicker">AI GUIDE</div>

      <div className="ai-entry-card__title">
        AI로 게임을 찾고, 세계관과 룰을 미리 확인해보세요
      </div>

      <p className="ai-entry-card__description">
        게임명을 검색하거나 이번 주 게임을 선택하면 안내를 빠르게 받을 수
        있어요
      </p>

      <div className="ai-entry-card__footer">
        <span className="ai-entry-card__chip">게임 검색</span>
        <span className="ai-entry-card__chip">이번 주 게임 선택</span>
        <span className="ai-entry-card__chip">세계관 · 기본 룰 안내</span>
      </div>
    </button>
  );
}

