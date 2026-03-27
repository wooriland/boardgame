function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

const QUICK_QUESTIONS = [
  "기본 룰 알려줘",
  "초보자 팁 알려줘",
  "몇 명이 하기 좋아?",
  "세계관 설명해줘",
];

export default function AiChatPanel({
  game,
  messages,
  draft,
  isLoading,
  onDraftChange,
  onSubmitQuestion,
  onQuickQuestion,
}) {
  const isDisabled = !game || isLoading;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      console.log("[AiChatPanel] Enter submit requested", {
        hasGame: Boolean(game),
        draftLength: String(draft ?? "").trim().length,
      });
      onSubmitQuestion(undefined, "textarea-enter");
    }
  };

  return (
    <section className="ai-guide-panel ai-guide-panel--chat">
      <div className="ai-guide-chatHead">
        <div>
          <div className="ai-guide-sectionTitle">
            {game ? `${game.name}에 대해 질문하기` : "AI 질문/응답"}
          </div>
          <p className="ai-guide-sectionText">
            {game
              ? "선택한 게임에 대해 궁금한 점을 물어보세요. 운영 전에 필요한 설명을 빠르게 확인할 수 있어요."
              : "게임을 먼저 선택하면 이곳에서 실제 AI 안내를 받을 수 있어요."}
          </p>
        </div>
      </div>

      <div className="ai-guide-quickQuestions">
        {QUICK_QUESTIONS.map((question) => (
          <button
            key={question}
            type="button"
            className="ai-guide-questionChip"
            disabled={isDisabled}
            onClick={() => onQuickQuestion(question, "quick-question-chip")}
          >
            {question}
          </button>
        ))}
      </div>

      <div className="ai-guide-chatThread" aria-live="polite">
        {!game ? (
          <div className="ai-guide-chatEmpty">
            오른쪽 리스트나 검색에서 게임을 선택하면 질문 입력이 열립니다.
          </div>
        ) : messages.length === 0 ? (
          <div className="ai-guide-chatEmpty">
            첫 질문을 보내면 이곳에 질문과 AI 답변이 차분한 정보형 카드로
            쌓입니다.
          </div>
        ) : (
          messages.map((message) => {
            const timeLabel = formatTime(message.createdAt);

            return (
              <article key={message.id} className="ai-guide-chatTurn">
                <div className="ai-guide-chatQuestion">
                  <div className="ai-guide-chatLabel">내 질문</div>
                  <div className="ai-guide-chatText">{message.question}</div>
                </div>

                <div
                  className={`ai-guide-chatAnswer ${
                    message.status === "error" ? "is-error" : ""
                  } ${message.status === "loading" ? "is-loading" : ""}`}
                >
                  <div className="ai-guide-chatAnswerHead">
                    <span className="ai-guide-chatLabel">AI 안내</span>
                    {timeLabel ? (
                      <span className="ai-guide-chatTime">{timeLabel}</span>
                    ) : null}
                  </div>

                  <div className="ai-guide-chatText">
                    {message.status === "loading"
                      ? "AI가 답변을 정리하고 있어요..."
                      : message.status === "error"
                      ? message.errorMessage
                      : message.answer}
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>

      <div className="ai-guide-chatComposer">
        <label className="ai-guide-searchLabel" htmlFor="ai-guide-question">
          질문 입력
        </label>

        <div className="ai-guide-chatComposerRow">
          <textarea
            id="ai-guide-question"
            className="ai-guide-chatTextarea"
            rows={3}
            value={draft}
            disabled={!game}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              game
                ? `${game.name}에 대해 궁금한 점을 입력해보세요. Shift + Enter로 줄바꿈할 수 있어요.`
                : "게임을 선택하면 질문을 입력할 수 있어요."
            }
          />

          <button
            type="button"
            className="ai-guide-searchButton ai-guide-chatSubmit"
            disabled={isLoading}
            onClick={() => onSubmitQuestion(undefined, "send-button-click")}
          >
            {isLoading ? "전송 중..." : "질문 보내기"}
          </button>
        </div>
      </div>
    </section>
  );
}
