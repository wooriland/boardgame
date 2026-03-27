function renderStatusMessage(status) {
  switch (status) {
    case "loading":
      return "안내를 준비하고 있어요. 잠시만 기다려주세요.";
    case "empty":
      return "검색 결과가 없습니다. 다른 게임명을 입력해보세요.";
    default:
      return "게임명을 입력하거나 오른쪽 이번 주 게임을 선택해보세요.";
  }
}

function difficultyClassName(difficulty) {
  switch (difficulty) {
    case "EASY":
      return "is-easy";
    case "HARD":
      return "is-hard";
    default:
      return "is-normal";
  }
}

export default function AiGameDetailPanel({ game, status, source }) {
  if (!game || status !== "result") {
    return (
      <section
        className={`ai-guide-panel ai-guide-panel--detail ${
          status === "loading" ? "is-loading" : ""
        }`}
        aria-live="polite"
      >
        <div className="ai-guide-emptyState">
          <div className="ai-guide-emptyTitle">
            {status === "loading" ? "안내를 불러오는 중" : "AI 안내 대기 중"}
          </div>
          <p className="ai-guide-emptyText">{renderStatusMessage(status)}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="ai-guide-panel ai-guide-panel--detail">
      <div className="ai-guide-detailHead">
        <div>
          <div className="ai-guide-sectionTitle">선택된 게임 안내</div>
          <p className="ai-guide-sectionText">
            {source === "weekly"
              ? "이번 주 운영 예정 게임을 선택해 바로 안내를 열었어요."
              : "검색 결과를 바탕으로 기본 안내를 정리했어요."}
          </p>
        </div>

        <div className="ai-guide-detailMeta">
          <span
            className={`ai-guide-difficulty is-inline ${difficultyClassName(
              game.difficulty
            )}`}
          >
            {game.difficulty}
          </span>
          <span className="ai-guide-detailBadge">
            {game.beginnerRecommended ? "초보자 추천" : "설명 후 추천"}
          </span>
        </div>
      </div>

      <div className="ai-guide-detailTitle">{game.name}</div>
      <p className="ai-guide-detailLead">{game.shortDescription}</p>

      <div className="ai-guide-detailGrid">
        <article className="ai-guide-detailCard">
          <div className="ai-guide-detailLabel">세계관 요약</div>
          <p className="ai-guide-detailText">{game.worldSummary}</p>
        </article>

        <article className="ai-guide-detailCard">
          <div className="ai-guide-detailLabel">기본 룰 요약</div>
          <p className="ai-guide-detailText">{game.ruleSummary}</p>
        </article>

        <article className="ai-guide-detailCard">
          <div className="ai-guide-detailLabel">플레이 감각</div>
          <p className="ai-guide-detailText">{game.playSense}</p>
        </article>

        <article className="ai-guide-detailCard">
          <div className="ai-guide-detailLabel">추천 포인트</div>
          <ul className="ai-guide-detailList">
            {game.recommendationPoints.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </article>
      </div>

      <div className="ai-guide-supportRow">
        <div className="ai-guide-supportChip">{game.supportInfo}</div>
        <div className="ai-guide-supportChip">
          {game.beginnerRecommended
            ? "초보자도 바로 설명 듣고 시작하기 좋아요"
            : "설명 시간을 조금 잡고 몰입해서 즐기기 좋아요"}
        </div>
      </div>
    </section>
  );
}
