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

export default function AiWeeklyGameList({
  games,
  selectedGameId,
  onSelectGame,
}) {
  return (
    <section className="ai-guide-panel ai-guide-panel--weekly">
      <div className="ai-guide-sectionHead">
        <div>
          <div className="ai-guide-sectionTitle">이번 주 게임</div>
          <p className="ai-guide-sectionText">
            이번 주 운영 예정 게임을 바로 선택해보세요
          </p>
        </div>
      </div>

      <div className="ai-guide-weeklyList" role="list">
        {games.map((game) => {
          const isSelected = game.id === selectedGameId;

          return (
            <button
              key={game.id}
              type="button"
              className={`ai-guide-weeklyItem ${isSelected ? "is-selected" : ""}`}
              onClick={() => onSelectGame(game)}
            >
              <span
                className={`ai-guide-difficulty ${difficultyClassName(
                  game.difficulty
                )}`}
              >
                {game.difficulty}
              </span>

              <div className="ai-guide-weeklyName">{game.name}</div>
              <div className="ai-guide-weeklyDescription">
                {game.tagline}
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

