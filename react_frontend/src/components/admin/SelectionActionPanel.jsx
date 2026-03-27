export default function SelectionActionPanel({
  selectionSize = "",
  onSelectionSizeChange,
  onRunSelection,
  running = false,
  disabled = false,
  applicationsCount = 0,
  selectedCount = 0,
  title = "랜덤 선발 실행",
  subtitle = "주차별 신청자 중 선발 인원을 지정해 실행합니다.",
}) {
  const isDisabled = disabled || running;

  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h3 className="admin-panel-title">{title}</h3>
          <p className="admin-panel-subtitle">{subtitle}</p>
        </div>
      </div>

      <div className="admin-stat-grid">
        <article className="admin-stat-card">
          <div className="admin-stat-card__label">현재 신청 수</div>
          <div className="admin-stat-card__value">{applicationsCount}</div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__label">현재 선발 수</div>
          <div className="admin-stat-card__value">{selectedCount}</div>
        </article>

        <article className="admin-stat-card">
          <div className="admin-stat-card__label">실행 상태</div>
          <div className="admin-stat-card__value" style={{ fontSize: "20px" }}>
            {running ? "진행 중" : "대기"}
          </div>
        </article>
      </div>

      <div className="admin-inline-form" style={{ marginTop: "16px" }}>
        <label className="admin-field admin-field--inline">
          <span className="admin-label">선발 인원</span>
          <input
            type="number"
            min="1"
            className="admin-input admin-input--sm"
            value={selectionSize}
            onChange={(e) => onSelectionSizeChange?.(e.target.value)}
            disabled={isDisabled}
          />
        </label>

        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={onRunSelection}
          disabled={isDisabled}
        >
          {running ? "실행 중..." : "랜덤 선발 실행"}
        </button>
      </div>
    </section>
  );
}