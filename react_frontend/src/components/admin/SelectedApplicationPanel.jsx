function maskPhone(phone) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return "-";

  if (digits.length < 7) return phone;

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-****`;
  }

  if (digits.length >= 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-****`;
  }

  return phone;
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
  return slot;
}

export default function SelectedApplicationPanel({
  title = "선발 결과 목록",
  items = [],
  loading = false,
  emptyText = "아직 선발 결과가 없습니다.",
  showAttendanceAction = false,
  confirmingApplicationId = null,
  onConfirmAttendance,
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-header">
        <div>
          <h3 className="admin-panel-title">{title}</h3>
          <p className="admin-panel-subtitle">총 {items.length}건</p>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>이름</th>
              <th>부서</th>
              <th>연락처</th>
              <th>슬롯</th>
              <th>신청일시</th>
              <th>선발</th>
              <th>참석확정</th>
              {showAttendanceAction ? <th>처리</th> : null}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  className="admin-table__empty"
                  colSpan={showAttendanceAction ? 8 : 7}
                >
                  불러오는 중입니다...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td
                  className="admin-table__empty"
                  colSpan={showAttendanceAction ? 8 : 7}
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              items.map((item, index) => {
                const isConfirming =
                  String(confirmingApplicationId ?? "") ===
                  String(item.applicationId ?? "");

                const alreadyConfirmed = item.attendanceConfirmedYn === "Y";
                const canConfirm =
                  !!item.applicationId &&
                  !alreadyConfirmed &&
                  typeof onConfirmAttendance === "function";

                return (
                  <tr key={item.key ?? item.applicationId ?? index}>
                    <td>{item.name || "-"}</td>
                    <td>{item.dept || "-"}</td>
                    <td>{maskPhone(item.phone)}</td>
                    <td>{getSlotLabel(item.slot)}</td>
                    <td>{formatDateTime(item.appliedAt)}</td>
                    <td>
                      <span className="admin-badge admin-badge--success">
                        선발
                      </span>
                    </td>
                    <td>
                      <span
                        className={`admin-badge ${
                          alreadyConfirmed
                            ? "admin-badge--info"
                            : "admin-badge--muted"
                        }`}
                      >
                        {alreadyConfirmed ? "확정됨" : "대기"}
                      </span>
                    </td>

                    {showAttendanceAction ? (
                      <td>
                        <button
                          type="button"
                          className="admin-btn admin-btn--sm"
                          disabled={!canConfirm || isConfirming}
                          onClick={() => onConfirmAttendance?.(item)}
                        >
                          {alreadyConfirmed
                            ? "확정됨"
                            : isConfirming
                            ? "처리 중..."
                            : "참석 확정"}
                        </button>
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}