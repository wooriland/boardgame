import {
  getCurrentWeekStartDate,
  getNextWeekStartDate,
  getPreviousWeekStartDate,
  toWeekStartDateYYYYMMDD,
  formatWeekRangeLabel,
  formatWeekTitle,
} from "../../utils/dateUtils";

export default function AdminWeekSelector({
  value,
  onChange,
  disabled = false,
  title = "운영 기준 주차",
  variant = "admin",
}) {
  const currentValue =
    toWeekStartDateYYYYMMDD(value) || getCurrentWeekStartDate();

  function emitChange(nextValue) {
    if (!onChange) return;

    const normalized = toWeekStartDateYYYYMMDD(nextValue);
    if (!normalized) return;

    onChange(normalized);
  }

  function handleDateChange(e) {
    emitChange(e.target.value);
  }

  function handlePrevWeek() {
    emitChange(getPreviousWeekStartDate(currentValue));
  }

  function handleThisWeek() {
    emitChange(getCurrentWeekStartDate());
  }

  function handleNextWeek() {
    emitChange(getNextWeekStartDate(currentValue));
  }

  if (variant === "board") {
    return (
      <div className="board-inlineForm">
        <div className="board-sidePanelHeader">
          <div>
            <h3 className="board-sideSectionTitle">{title}</h3>
            <p className="board-sideMiniText">{formatWeekTitle(currentValue)}</p>
          </div>

          <div className="board-participantTags">
            <span className="board-participantTag">
              {formatWeekRangeLabel(currentValue)}
            </span>
          </div>
        </div>

        <div className="board-field">
          <label htmlFor="adminWeekSelectorDateBoard">주차 기준일</label>
          <input
            id="adminWeekSelectorDateBoard"
            type="date"
            value={currentValue}
            onChange={handleDateChange}
            disabled={disabled}
          />
        </div>

        <div className="board-formActions">
          <button
            type="button"
            className="board-btn board-btnGhost board-btnInlineWide"
            onClick={handlePrevWeek}
            disabled={disabled}
          >
            이전 주
          </button>

          <button
            type="button"
            className="board-btn board-btnGhost board-btnInlineWide"
            onClick={handleThisWeek}
            disabled={disabled}
          >
            이번 주
          </button>

          <button
            type="button"
            className="board-btn board-btnGhost board-btnInlineWide"
            onClick={handleNextWeek}
            disabled={disabled}
          >
            다음 주
          </button>
        </div>
      </div>
    );
  }

  return (
    <section className="admin-panel admin-week-selector">
      <div className="admin-panel-header">
        <div>
          <h3 className="admin-panel-title">{title}</h3>
          <p className="admin-panel-subtitle">{formatWeekTitle(currentValue)}</p>
        </div>
        <div className="admin-week-selector__range">
          {formatWeekRangeLabel(currentValue)}
        </div>
      </div>

      <div className="admin-week-selector__controls">
        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={handlePrevWeek}
          disabled={disabled}
        >
          이전 주
        </button>

        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={handleThisWeek}
          disabled={disabled}
        >
          이번 주
        </button>

        <input
          type="date"
          className="admin-input admin-week-selector__input"
          value={currentValue}
          onChange={handleDateChange}
          disabled={disabled}
        />

        <button
          type="button"
          className="admin-btn admin-btn--ghost"
          onClick={handleNextWeek}
          disabled={disabled}
        >
          다음 주
        </button>
      </div>
    </section>
  );
}