import ParticipantListItem from "./ParticipantListItem";

function buildItemKey(item, index, variant) {
  return (
    item?.personKey ??
    item?.applicationId ??
    item?.attendanceId ??
    item?.key ??
    `${variant}-${index}`
  );
}

export default function AttendanceListPanel({
  title,
  subtitle = "",
  items = [],
  loading = false,
  emptyText = "표시할 데이터가 없습니다.",
  variant = "attendance",
  submitting = false,
  onConfirm,
  headerActions = null,
  children = null,
}) {
  return (
    <section className="board-panel board-sidePanelSection">
      <div className="board-sidePanelHeader">
        <div>
          <h3 className="board-sideSectionTitle">{title}</h3>
          {subtitle ? (
            <p className="board-sideSectionDesc">{subtitle}</p>
          ) : null}
        </div>

        {headerActions ? (
          <div className="board-sideHeaderActions">{headerActions}</div>
        ) : null}
      </div>

      {children}

      {loading ? (
        <div className="board-emptyState">불러오는 중입니다...</div>
      ) : items.length === 0 ? (
        <div className="board-emptyState">{emptyText}</div>
      ) : (
        <div className="board-participantList">
          {items.map((item, index) => (
            <ParticipantListItem
              key={buildItemKey(item, index, variant)}
              item={item}
              variant={variant}
              submitting={submitting}
              onConfirm={onConfirm}
            />
          ))}
        </div>
      )}
    </section>
  );
}