function maskPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return "-";

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-****`;
  }

  if (digits.length >= 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-****`;
  }

  return String(phone ?? "-");
}

function formatDateTime(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "-";

  const normalized = raw.replace("T", " ");
  if (normalized.length >= 16) {
    return normalized.slice(0, 16);
  }

  return normalized;
}

function getSlotLabel(slot) {
  const value = String(slot ?? "").trim().toUpperCase();

  if (!value) return "-";
  if (value === "AM" || value === "MORNING") return "오전";
  if (value === "PM" || value === "AFTERNOON") return "오후";
  return String(slot ?? "-");
}

function getEntrySourceLabel(source) {
  const value = String(source ?? "").trim().toUpperCase();

  if (!value) return "추가";
  if (value === "APPLICATION" || value === "AUTO") return "신청";
  if (value === "WALK_IN" || value === "WALKIN") return "현장";
  if (value === "MANUAL") return "추가";
  return String(source ?? "-");
}

function getEntrySourceTagClass(source) {
  const value = String(source ?? "").trim().toUpperCase();

  if (value === "APPLICATION" || value === "AUTO") {
    return "board-participantTag-auto";
  }

  return "board-participantTag-manual";
}

export default function ParticipantListItem({
  item,
  variant = "attendance",
  submitting = false,
  onConfirm,
}) {
  if (!item) return null;

  if (variant === "selected") {
    return (
      <div className="board-participantItem">
        <div className="board-participantTop">
          <div className="board-participantNameWrap">
            <strong className="board-participantName">{item.name || "-"}</strong>

            <div className="board-participantTags">
              <span className="board-participantTag board-participantTag-auto">
                자동 선별
              </span>

              {item?.difficulty ? (
                <span className="board-participantTag">{String(item.difficulty)}</span>
              ) : null}

              {item?.alreadyAttendance ? (
                <span className="board-participantTag board-participantTag-confirmed">
                  최종 반영
                </span>
              ) : null}
            </div>
          </div>

          <div className="board-participantActions">
            {item?.alreadyAttendance ? (
              <span className="board-participantTag board-participantTag-comment">
                댓글 대상 반영됨
              </span>
            ) : (
              <button
                type="button"
                className="board-btn board-btnInline board-btnPrimary"
                onClick={() => onConfirm?.(item)}
                disabled={submitting || !item?.applicationId}
              >
                참석 확정
              </button>
            )}
          </div>
        </div>

        <div className="board-participantMeta">
          <span>부서 {item.dept || "-"}</span>
          <span>연락처 {maskPhone(item.phone)}</span>
          <span>슬롯 {getSlotLabel(item.slot)}</span>
          <span>상태 {item.applicationStatus || "-"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="board-participantItem">
      <div className="board-participantTop">
        <div className="board-participantNameWrap">
          <strong className="board-participantName">{item.name || "-"}</strong>

          <div className="board-participantTags">
            <span className="board-participantTag board-participantTag-confirmed">
              최종 참여자
            </span>
            <span
              className={`board-participantTag ${getEntrySourceTagClass(
                item.entrySource
              )}`}
            >
              {getEntrySourceLabel(item.entrySource)}
            </span>
          </div>
        </div>

        <div className="board-participantActions">
          <span className="board-participantTag board-participantTag-comment">
            댓글 대상
          </span>
        </div>
      </div>

      <div className="board-participantMeta">
        <span>부서 {item.dept || "-"}</span>
        <span>연락처 {maskPhone(item.phone)}</span>
        <span>슬롯 {getSlotLabel(item.slot)}</span>
        <span>등록 방식 {getEntrySourceLabel(item.entrySource)}</span>
        <span>확정 시각 {formatDateTime(item.checkedAt)}</span>
      </div>
    </div>
  );
}
