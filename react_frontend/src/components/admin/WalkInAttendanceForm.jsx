const DEFAULT_FORM = {
  slot: "",
  dept: "",
  name: "",
  phone: "",
  commentAllowedYn: "Y",
};

export default function WalkInAttendanceForm({
  title = "현장 참석자 추가",
  subtitle = "현장에서 확인한 참여자를 직접 등록하면 이번 주 댓글 권한 대상에 반영됩니다.",
  form = DEFAULT_FORM,
  onChange,
  onSubmit,
  onCancel,
  submitting = false,
}) {
  function handleChange(e) {
    onChange?.(e);
  }

  function handleSubmit(e) {
    onSubmit?.(e);
  }

  return (
    <form className="board-inlineForm" onSubmit={handleSubmit}>
      <div>
        <h4 className="board-sideSectionTitle">{title}</h4>
        <p className="board-sideSectionDesc">{subtitle}</p>
      </div>

      <div className="board-inlineFormGrid">
        <div className="board-field">
          <label htmlFor="walkInSlot">슬롯</label>
          <select
            id="walkInSlot"
            name="slot"
            value={form.slot ?? ""}
            onChange={handleChange}
            disabled={submitting}
          >
            <option value="">선택</option>
            <option value="AM">오전</option>
            <option value="PM">오후</option>
          </select>
        </div>

        <div className="board-field">
          <label htmlFor="walkInDept">소속부서</label>
          <input
            id="walkInDept"
            type="text"
            name="dept"
            value={form.dept ?? ""}
            onChange={handleChange}
            disabled={submitting}
            placeholder="예: 청년부"
          />
        </div>

        <div className="board-field">
          <label htmlFor="walkInName">이름</label>
          <input
            id="walkInName"
            type="text"
            name="name"
            value={form.name ?? ""}
            onChange={handleChange}
            disabled={submitting}
            placeholder="참석자 이름"
          />
        </div>

        <div className="board-field">
          <label htmlFor="walkInPhone">연락처</label>
          <input
            id="walkInPhone"
            type="text"
            name="phone"
            value={form.phone ?? ""}
            onChange={handleChange}
            disabled={submitting}
            placeholder="010-1234-5678"
          />
        </div>
      </div>

      <div className="board-formActions">
        <button
          type="submit"
          className="board-btn board-btnPrimary"
          disabled={submitting}
        >
          {submitting ? "저장 중..." : "현장 참석자 등록"}
        </button>

        <button
          type="button"
          className="board-btn board-btnGhost"
          onClick={onCancel}
          disabled={submitting}
        >
          취소
        </button>
      </div>
    </form>
  );
}