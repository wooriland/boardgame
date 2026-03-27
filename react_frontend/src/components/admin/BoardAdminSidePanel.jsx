import { useCallback, useEffect, useMemo, useState } from "react";
import AttendanceListPanel from "./AttendanceListPanel";
import WalkInAttendanceForm from "./WalkInAttendanceForm";
import AdminWeekSelector from "./AdminWeekSelector";
import AdminMessageBar from "./AdminMessageBar";
import {
  confirmApplicationAttendance,
  createWalkInAttendance,
  getAdminAttendanceList,
  getAdminSelectedParticipants,
} from "../../api/adminAttendanceApi";
import { addDays, getCurrentWeekStartDate } from "../../utils/dateUtils";
import {
  clearBoardCommentWindow,
  formatBoardCommentWindowRange,
  getStoredBoardCommentWindow,
  resolveBoardCommentWindowStatus,
  saveBoardCommentWindow,
} from "../../utils/boardCommentWindow";

function formatCount(value) {
  const num = Number(value ?? 0);
  if (Number.isNaN(num)) return "0";
  return num.toLocaleString("ko-KR");
}

function formatDateTime(value) {
  if (!value) return "-";

  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return new Intl.DateTimeFormat("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  } catch {
    return String(value);
  }
}

function extractApiErrorMessage(error, fallbackMessage) {
  if (error?.body?.message) return error.body.message;
  if (error?.body?.error) return error.body.error;

  if (typeof error?.bodyText === "string" && error.bodyText.trim()) {
    return error.bodyText;
  }

  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message;
  }

  return fallbackMessage;
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePhone(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function buildDefaultCommentWindowDraft(weekStartDate) {
  return {
    weekStartDate,
    targetType: "FINAL_PARTICIPANTS",
    startAt: "",
    endAt: "",
  };
}

function buildSavedCommentWindowDraft(window, weekStartDate) {
  if (!window) {
    return buildDefaultCommentWindowDraft(weekStartDate);
  }

  return {
    weekStartDate,
    targetType: window.targetType ?? "FINAL_PARTICIPANTS",
    startAt: window.startAt ?? "",
    endAt: window.endAt ?? "",
  };
}

function buildRecommendedCommentWindowDraft(weekStartDate) {
  return {
    weekStartDate,
    targetType: "FINAL_PARTICIPANTS",
    startAt: `${weekStartDate}T00:00`,
    endAt: `${addDays(weekStartDate, 6)}T23:59`,
  };
}

const INITIAL_WALK_IN_FORM = {
  slot: "",
  dept: "",
  name: "",
  phone: "",
  commentAllowedYn: "Y",
};

export default function BoardAdminSidePanel({ adminToken = "" }) {
  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStartDate());
  const [selectedItems, setSelectedItems] = useState([]);
  const [attendanceItems, setAttendanceItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const [showWalkInForm, setShowWalkInForm] = useState(false);
  const [walkInForm, setWalkInForm] = useState(INITIAL_WALK_IN_FORM);

  const [savedCommentWindow, setSavedCommentWindow] = useState(() =>
    getStoredBoardCommentWindow(getCurrentWeekStartDate())
  );
  const [commentWindowDraft, setCommentWindowDraft] = useState(() =>
    buildSavedCommentWindowDraft(
      getStoredBoardCommentWindow(getCurrentWeekStartDate()),
      getCurrentWeekStartDate()
    )
  );

  const hasAdminToken = Boolean(String(adminToken ?? "").trim());

  const attendanceKeySet = useMemo(
    () => new Set(attendanceItems.map((item) => item.personKey)),
    [attendanceItems]
  );

  const resolvedSelectedItems = useMemo(() => {
    return selectedItems.map((item) => ({
      ...item,
      alreadyAttendance: attendanceKeySet.has(item.personKey),
    }));
  }, [selectedItems, attendanceKeySet]);

  const commentWindowStatus = useMemo(
    () => resolveBoardCommentWindowStatus(savedCommentWindow),
    [savedCommentWindow]
  );

  const commentWindowRangeText = useMemo(
    () => formatBoardCommentWindowRange(savedCommentWindow),
    [savedCommentWindow]
  );

  const commentWindowDirty = useMemo(() => {
    return (
      String(commentWindowDraft.startAt ?? "") !==
        String(savedCommentWindow?.startAt ?? "") ||
      String(commentWindowDraft.endAt ?? "") !==
        String(savedCommentWindow?.endAt ?? "")
    );
  }, [commentWindowDraft, savedCommentWindow]);

  const clearMessages = useCallback(() => {
    setErrorMsg("");
    setSuccessMsg("");
  }, []);

  const fetchPanelData = useCallback(async () => {
    console.log("[BoardAdminSidePanel] weekStartDate =", weekStartDate);
    console.log("[BoardAdminSidePanel] hasAdminToken =", hasAdminToken);

    if (!hasAdminToken) {
      console.log("[BoardAdminSidePanel] selectedList =", []);
      console.log("[BoardAdminSidePanel] attendanceList =", []);
      console.log("[BoardAdminSidePanel] counts =", {
        selected: 0,
        attendance: 0,
      });
      setSelectedItems([]);
      setAttendanceItems([]);
      return;
    }

    setLoading(true);
    clearMessages();

    try {
      const [selectedList, attendanceList] = await Promise.all([
        getAdminSelectedParticipants({
          weekStartDate,
          adminToken,
        }),
        getAdminAttendanceList({
          weekStartDate,
          adminToken,
        }),
      ]);

      console.log("[BoardAdminSidePanel] selectedList =", selectedList);
      console.log("[BoardAdminSidePanel] attendanceList =", attendanceList);
      console.log("[BoardAdminSidePanel] counts =", {
        selected: Array.isArray(selectedList) ? selectedList.length : -1,
        attendance: Array.isArray(attendanceList) ? attendanceList.length : -1,
      });

      setSelectedItems(Array.isArray(selectedList) ? selectedList : []);
      setAttendanceItems(Array.isArray(attendanceList) ? attendanceList : []);
      setUpdatedAt(new Date().toISOString());
    } catch (error) {
      console.error("관리자 참여자 패널 조회 실패:", error);
      setErrorMsg(
        extractApiErrorMessage(
          error,
          "운영 패널 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."
        )
      );
    } finally {
      setLoading(false);
    }
  }, [adminToken, clearMessages, hasAdminToken, weekStartDate]);

  useEffect(() => {
    fetchPanelData();
  }, [fetchPanelData]);

  useEffect(() => {
    console.log("[BoardAdminSidePanel] render counts =", {
      selectedItems: selectedItems.length,
      attendanceItems: attendanceItems.length,
      resolvedSelectedItems: resolvedSelectedItems.length,
    });
  }, [attendanceItems.length, resolvedSelectedItems.length, selectedItems.length]);

  useEffect(() => {
    const storedWindow = getStoredBoardCommentWindow(weekStartDate);
    setSavedCommentWindow(storedWindow);
    setCommentWindowDraft(buildSavedCommentWindowDraft(storedWindow, weekStartDate));
  }, [weekStartDate]);

  async function handleConfirmSelected(item) {
    if (!item?.applicationId) {
      setErrorMsg("신청 번호가 없어 참석 확정을 진행할 수 없습니다.");
      return;
    }

    setSubmitting(true);
    clearMessages();

    try {
      await confirmApplicationAttendance(item.applicationId, {
        adminToken,
      });

      setSuccessMsg(
        `${item.name} 참여자를 최종 참여자 목록에 반영했습니다.`
      );
      await fetchPanelData();
    } catch (error) {
      console.error("참석 확정 실패:", error);
      setErrorMsg(
        extractApiErrorMessage(
          error,
          "참석 확정 처리에 실패했습니다. 다시 시도해주세요."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleWalkInChange(e) {
    const { name, value } = e.target;

    setWalkInForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleWalkInSubmit(e) {
    e.preventDefault();

    const dept = normalizeText(walkInForm.dept);
    const name = normalizeText(walkInForm.name);
    const phone = normalizePhone(walkInForm.phone);

    if (!dept || !name || !phone) {
      setErrorMsg("부서, 이름, 연락처를 모두 입력해주세요.");
      return;
    }

    setSubmitting(true);
    clearMessages();

    try {
      await createWalkInAttendance(
        {
          weekStartDate,
          slot: walkInForm.slot,
          dept,
          name,
          phone,
          commentAllowedYn: "Y",
        },
        { adminToken }
      );

      setSuccessMsg(`${name} 참여자를 현장 참여자로 추가했습니다.`);
      setWalkInForm(INITIAL_WALK_IN_FORM);
      setShowWalkInForm(false);

      await fetchPanelData();
    } catch (error) {
      console.error("현장 참여자 추가 실패:", error);
      setErrorMsg(
        extractApiErrorMessage(
          error,
          "현장 참여자 추가에 실패했습니다. 다시 시도해주세요."
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelWalkIn() {
    setShowWalkInForm(false);
    setWalkInForm(INITIAL_WALK_IN_FORM);
  }

  function handleCommentWindowDraftChange(e) {
    const { name, value } = e.target;

    setCommentWindowDraft((prev) => ({
      ...prev,
      [name]: value,
      weekStartDate,
      targetType: "FINAL_PARTICIPANTS",
    }));
  }

  function handleApplyRecommendedWindow() {
    setCommentWindowDraft(buildRecommendedCommentWindowDraft(weekStartDate));
  }

  function handleResetCommentWindowForm() {
    setCommentWindowDraft(buildSavedCommentWindowDraft(savedCommentWindow, weekStartDate));
  }

  function handleClearCommentWindow() {
    clearMessages();
    clearBoardCommentWindow(weekStartDate);
    setSavedCommentWindow(null);
    setCommentWindowDraft(buildDefaultCommentWindowDraft(weekStartDate));
    setSuccessMsg("댓글 권한 기간을 비활성 상태로 초기화했습니다.");
  }

  function handleSaveCommentWindow() {
    const startAt = String(commentWindowDraft.startAt ?? "").trim();
    const endAt = String(commentWindowDraft.endAt ?? "").trim();

    clearMessages();

    if (!startAt || !endAt) {
      setErrorMsg("댓글 가능 시작일시와 종료일시를 모두 입력해주세요.");
      return;
    }

    const startDate = new Date(startAt);
    const endDate = new Date(endAt);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      setErrorMsg("댓글 권한 기간 형식을 다시 확인해주세요.");
      return;
    }

    if (endDate <= startDate) {
      setErrorMsg("댓글 가능 종료일시는 시작일시보다 뒤여야 합니다.");
      return;
    }

    const nextWindow = saveBoardCommentWindow({
      weekStartDate,
      targetType: "FINAL_PARTICIPANTS",
      startAt,
      endAt,
      updatedAt: new Date().toISOString(),
    });

    setSavedCommentWindow(nextWindow);
    setCommentWindowDraft(buildSavedCommentWindowDraft(nextWindow, weekStartDate));
    setSuccessMsg("댓글 권한 기간을 저장했습니다.");
  }

  return (
    <div className="board-sidePanel">
      <section className="board-panel board-sidePanelSection">
        <div className="board-sidePanelHeader">
          <div>
            <p className="board-sideEyebrow">OPERATIONS PANEL</p>
            <h2 className="board-sideTitle">운영 패널</h2>
            <p className="board-sideSectionDesc">
              운영 기준 주차와 최종 참여자, 댓글 권한 기간을 한 화면에서 관리합니다.
            </p>
          </div>

          <div className="board-sideHeaderActions">
            <button
              type="button"
              className="board-btn board-btnGhost board-btnInline"
              onClick={fetchPanelData}
              disabled={!hasAdminToken || loading || submitting}
            >
              새로고침
            </button>
          </div>
        </div>

        {!hasAdminToken ? (
          <div className="board-message board-message-error">
            관리자 토큰이 없어 운영 패널을 사용할 수 없습니다. 입장 화면에서 관리자 입장을
            다시 진행해주세요.
          </div>
        ) : (
          <>
            <AdminWeekSelector
              value={weekStartDate}
              onChange={(nextWeek) => {
                setWeekStartDate(nextWeek);
                clearMessages();
              }}
              disabled={loading || submitting}
              variant="board"
              title="운영 기준 주차"
            />

            <div className="board-sideStatRow">
              <div className="board-sideStatCard">
                <strong>{formatCount(selectedItems.length)}</strong>
                <span>자동 선별 인원</span>
              </div>

              <div className="board-sideStatCard">
                <strong>{formatCount(attendanceItems.length)}</strong>
                <span>최종 참여자</span>
              </div>
            </div>

            {updatedAt ? (
              <p className="board-sideMiniText">
                마지막 갱신: {formatDateTime(updatedAt)}
              </p>
            ) : null}

            <AdminMessageBar
              variant="board"
              errorMessage={errorMsg}
              successMessage={successMsg}
            />
          </>
        )}
      </section>

      {hasAdminToken && (
        <>
          <AttendanceListPanel
            title="자동 선별 참여자"
            subtitle="선별된 인원은 참석 확정하면 댓글 권한 대상에 반영됩니다."
            items={resolvedSelectedItems}
            loading={loading}
            emptyText="자동 선별 참여자가 없습니다."
            variant="selected"
            submitting={submitting}
            onConfirm={handleConfirmSelected}
          />

          <AttendanceListPanel
            title="이번 주 최종 참여자"
            subtitle="이 목록에 포함된 인원은 댓글 가능 기간 내 댓글 작성 대상입니다."
            items={attendanceItems}
            loading={loading}
            emptyText="아직 확정된 최종 참여자가 없습니다."
            variant="attendance"
          />

          <section className="board-panel board-sidePanelSection">
            <div className="board-sidePanelHeader">
              <div>
                <h3 className="board-sideSectionTitle">댓글 권한 설정</h3>
                <p className="board-sideSectionDesc">
                  적용 대상은 이번 주 최종 참여자 전체이며, 시작일시와 종료일시 기준으로
                  상태를 관리합니다.
                </p>
              </div>

              <span className={`board-statusBadge is-${commentWindowStatus.key}`}>
                {commentWindowStatus.label}
              </span>
            </div>

            <div className="board-inlineSummary">
              <div className="board-inlineSummaryItem">
                <span>적용 대상</span>
                <strong>이번 주 최종 참여자</strong>
              </div>
              <div className="board-inlineSummaryItem">
                <span>저장된 기간</span>
                <strong>{commentWindowRangeText}</strong>
              </div>
            </div>

            <div className="board-form">
              <div className="board-field">
                <label htmlFor="boardCommentWindowStartAt">댓글 가능 시작일시</label>
                <input
                  id="boardCommentWindowStartAt"
                  type="datetime-local"
                  name="startAt"
                  value={commentWindowDraft.startAt ?? ""}
                  onChange={handleCommentWindowDraftChange}
                  disabled={loading || submitting}
                />
              </div>

              <div className="board-field">
                <label htmlFor="boardCommentWindowEndAt">댓글 가능 종료일시</label>
                <input
                  id="boardCommentWindowEndAt"
                  type="datetime-local"
                  name="endAt"
                  value={commentWindowDraft.endAt ?? ""}
                  onChange={handleCommentWindowDraftChange}
                  disabled={loading || submitting}
                />
              </div>
            </div>

            <div className="board-formActions">
              <button
                type="button"
                className="board-btn board-btnPrimary"
                onClick={handleSaveCommentWindow}
                disabled={loading || submitting}
              >
                저장
              </button>

              <button
                type="button"
                className="board-btn board-btnGhost"
                onClick={handleClearCommentWindow}
                disabled={loading || submitting}
              >
                즉시 OFF
              </button>

              <button
                type="button"
                className="board-btn board-btnGhost"
                onClick={handleApplyRecommendedWindow}
                disabled={loading || submitting}
              >
                이번 주 전체 기간
              </button>

              {commentWindowDirty && (
                <button
                  type="button"
                  className="board-btn board-btnSecondary"
                  onClick={handleResetCommentWindowForm}
                  disabled={loading || submitting}
                >
                  변경 취소
                </button>
              )}
            </div>
          </section>

          <section className="board-panel board-sidePanelSection">
            <div className="board-sidePanelHeader">
              <div>
                <h3 className="board-sideSectionTitle">참여 인원 추가</h3>
                <p className="board-sideSectionDesc">
                  현장 참여자는 추가 후 최종 참여자 목록에 포함됩니다.
                </p>
              </div>

              <div className="board-sideHeaderActions">
                <button
                  type="button"
                  className="board-btn board-btnPrimary board-btnInlineWide"
                  onClick={() => setShowWalkInForm((prev) => !prev)}
                  disabled={loading || submitting}
                >
                  {showWalkInForm ? "입력 닫기" : "현장 참여자 추가"}
                </button>
              </div>
            </div>

            {showWalkInForm ? (
              <WalkInAttendanceForm
                form={walkInForm}
                onChange={handleWalkInChange}
                onSubmit={handleWalkInSubmit}
                onCancel={handleCancelWalkIn}
                submitting={submitting}
              />
            ) : (
              <div className="board-emptyState">
                필요한 경우 현장 참여자를 추가해 최종 참여자 목록으로 바로 반영할 수 있습니다.
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}