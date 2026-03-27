import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "../api/apiClient";
import {
  getAdminApplications,
  getAdminSelectedApplications,
  runAdminSelection,
} from "../api/adminApplicationApi";
import {
  confirmApplicationAttendance,
  createWalkInAttendance,
  getAdminAttendanceList,
} from "../api/adminAttendanceApi";

import AdminWeekSelector from "../components/admin/AdminWeekSelector";
import AdminMessageBar from "../components/admin/AdminMessageBar";
import ApplicationListPanel from "../components/admin/ApplicationListPanel";
import SelectedApplicationPanel from "../components/admin/SelectedApplicationPanel";
import SelectionActionPanel from "../components/admin/SelectionActionPanel";
import AttendanceListPanel from "../components/admin/AttendanceListPanel";
import WalkInAttendanceForm from "../components/admin/WalkInAttendanceForm";

import {
  formatWeekRangeLabel,
  getCurrentWeekStartDate,
} from "../utils/dateUtils";
import {
  clearAdminOperationsToken,
  getAdminOperationsToken,
  maskAdminOperationsToken,
} from "../utils/adminSession";
import "./AdminOperationPage.css";

const TAB_APPLICATIONS = "applications";
const TAB_ATTENDANCE = "attendance";

function normalizePositiveInt(value, fallback = 5) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return Math.floor(num);
}

const initialWalkInForm = {
  slot: "",
  dept: "",
  name: "",
  phone: "",
  commentAllowedYn: "Y",
};

export default function AdminOperationPage() {
  const navigate = useNavigate();

  const [weekStartDate, setWeekStartDate] = useState(getCurrentWeekStartDate());
  const [activeTab, setActiveTab] = useState(TAB_APPLICATIONS);

  const [applications, setApplications] = useState([]);
  const [selectedApplications, setSelectedApplications] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);

  const [loadingApplications, setLoadingApplications] = useState(false);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [runningSelection, setRunningSelection] = useState(false);
  const [confirmingApplicationId, setConfirmingApplicationId] = useState(null);
  const [savingWalkIn, setSavingWalkIn] = useState(false);

  const [selectionSize, setSelectionSize] = useState("5");
  const [walkInForm, setWalkInForm] = useState(initialWalkInForm);

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const adminTokenMasked = maskAdminOperationsToken();

  const effectiveSelectedApplications = useMemo(() => {
    if (selectedApplications.length > 0) return selectedApplications;
    return applications.filter((item) => item.selectedYn === "Y");
  }, [applications, selectedApplications]);

  const stats = useMemo(() => {
    return {
      applications: applications.length,
      selected: effectiveSelectedApplications.length,
      attendance: attendanceList.length,
    };
  }, [
    applications.length,
    effectiveSelectedApplications.length,
    attendanceList.length,
  ]);

  const ensureToken = useCallback(() => {
    const token = getAdminOperationsToken();
    if (token) return true;

    navigate("/admin/enter", {
      replace: true,
      state: { message: "운영 관리자 토큰을 먼저 입력해주세요." },
    });
    return false;
  }, [navigate]);

  const loadApplications = useCallback(async () => {
    if (!ensureToken()) return;

    setLoadingApplications(true);

    try {
      const [allList, selectedList] = await Promise.all([
        getAdminApplications({ weekStartDate }),
        getAdminSelectedApplications({ weekStartDate }),
      ]);

      setApplications(allList);
      setSelectedApplications(selectedList);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "신청/선발 목록을 불러오지 못했습니다.")
      );
    } finally {
      setLoadingApplications(false);
    }
  }, [ensureToken, weekStartDate]);

  const loadAttendance = useCallback(async () => {
    if (!ensureToken()) return;

    setLoadingAttendance(true);

    try {
      const list = await getAdminAttendanceList({ weekStartDate });
      setAttendanceList(list);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "참석 목록을 불러오지 못했습니다.")
      );
    } finally {
      setLoadingAttendance(false);
    }
  }, [ensureToken, weekStartDate]);

  const refreshAll = useCallback(async () => {
    setErrorMessage("");
    await Promise.all([loadApplications(), loadAttendance()]);
  }, [loadApplications, loadAttendance]);

  useEffect(() => {
    if (!ensureToken()) return;
    refreshAll();
  }, [ensureToken, refreshAll]);

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  async function handleRunSelection() {
    clearMessages();

    const size = normalizePositiveInt(selectionSize, 5);

    setRunningSelection(true);
    try {
      await runAdminSelection({
        weekStartDate,
        size,
      });

      setSuccessMessage(`랜덤 선발을 실행했습니다. (선발 인원: ${size}명)`);
      await refreshAll();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "랜덤 선발 실행에 실패했습니다.")
      );
    } finally {
      setRunningSelection(false);
    }
  }

  async function handleConfirmAttendance(item) {
    if (!item?.applicationId) {
      setErrorMessage("참석 확정 대상의 applicationId가 없습니다.");
      return;
    }

    clearMessages();
    setConfirmingApplicationId(item.applicationId);

    try {
      await confirmApplicationAttendance(item.applicationId);
      setSuccessMessage(`${item.name || "신청자"}님의 참석을 확정했습니다.`);
      await refreshAll();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "참석 확정 처리에 실패했습니다.")
      );
    } finally {
      setConfirmingApplicationId(null);
    }
  }

  function handleWalkInFieldChange(e) {
    const { name, value } = e.target;
    setWalkInForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleWalkInSubmit(e) {
    e.preventDefault();
    clearMessages();

    if (!String(walkInForm.slot || "").trim()) {
      setErrorMessage("현장 참석자의 슬롯을 선택해주세요.");
      return;
    }
    if (!String(walkInForm.dept || "").trim()) {
      setErrorMessage("현장 참석자의 부서를 입력해주세요.");
      return;
    }
    if (!String(walkInForm.name || "").trim()) {
      setErrorMessage("현장 참석자의 이름을 입력해주세요.");
      return;
    }
    if (!String(walkInForm.phone || "").trim()) {
      setErrorMessage("현장 참석자의 연락처를 입력해주세요.");
      return;
    }

    setSavingWalkIn(true);

    try {
      await createWalkInAttendance({
        weekStartDate,
        ...walkInForm,
      });

      setSuccessMessage(`${walkInForm.name}님을 현장 참석자로 등록했습니다.`);
      setWalkInForm((prev) => ({
        ...initialWalkInForm,
        slot: prev.slot,
        dept: prev.dept,
      }));
      await refreshAll();
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "현장 참석자 등록에 실패했습니다.")
      );
    } finally {
      setSavingWalkIn(false);
    }
  }

  function handleLogout() {
    clearAdminOperationsToken();
    navigate("/admin/enter", {
      replace: true,
      state: { message: "운영 관리자 토큰이 제거되었습니다." },
    });
  }

  const isBusy =
    loadingApplications ||
    loadingAttendance ||
    runningSelection ||
    savingWalkIn ||
    confirmingApplicationId !== null;

  return (
    <div className="admin-op-page">
      <div className="admin-op-container">
        <header className="admin-op-header">
          <div>
            <h1 className="admin-page-title">운영 관리자 화면</h1>
            <p className="admin-page-subtitle">
              {formatWeekRangeLabel(weekStartDate)}
            </p>
          </div>

          <div className="admin-op-header__actions">
            <div className="admin-token-badge">
              토큰: {adminTokenMasked || "없음"}
            </div>

            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={refreshAll}
              disabled={isBusy}
            >
              새로고침
            </button>

            <button
              type="button"
              className="admin-btn admin-btn--danger"
              onClick={handleLogout}
            >
              토큰 제거
            </button>
          </div>
        </header>

        <AdminMessageBar
          errorMessage={errorMessage}
          successMessage={successMessage}
        />

        <AdminWeekSelector
          value={weekStartDate}
          onChange={(nextWeek) => {
            setWeekStartDate(nextWeek);
            clearMessages();
          }}
          disabled={isBusy}
        />

        <section className="admin-stat-grid">
          <article className="admin-stat-card">
            <div className="admin-stat-card__label">전체 신청</div>
            <div className="admin-stat-card__value">{stats.applications}</div>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-card__label">선발 인원</div>
            <div className="admin-stat-card__value">{stats.selected}</div>
          </article>

          <article className="admin-stat-card">
            <div className="admin-stat-card__label">최종 참석</div>
            <div className="admin-stat-card__value">{stats.attendance}</div>
          </article>
        </section>

        <section className="admin-tabs">
          <button
            type="button"
            className={`admin-tab ${
              activeTab === TAB_APPLICATIONS ? "is-active" : ""
            }`}
            onClick={() => setActiveTab(TAB_APPLICATIONS)}
          >
            신청 관리
          </button>

          <button
            type="button"
            className={`admin-tab ${
              activeTab === TAB_ATTENDANCE ? "is-active" : ""
            }`}
            onClick={() => setActiveTab(TAB_ATTENDANCE)}
          >
            참석 관리
          </button>
        </section>

        {activeTab === TAB_APPLICATIONS ? (
          <div className="admin-section-stack">
            <SelectionActionPanel
              selectionSize={selectionSize}
              onSelectionSizeChange={setSelectionSize}
              onRunSelection={handleRunSelection}
              running={runningSelection}
              disabled={isBusy}
              applicationsCount={stats.applications}
              selectedCount={stats.selected}
            />

            <ApplicationListPanel
              title="전체 신청자 목록"
              items={applications}
              loading={loadingApplications}
              emptyText="이번 주 신청자가 없습니다."
            />

            <SelectedApplicationPanel
              title="선발 결과 목록"
              items={effectiveSelectedApplications}
              loading={loadingApplications}
              emptyText="아직 선발 결과가 없습니다."
            />
          </div>
        ) : (
          <div className="admin-section-stack">
            <SelectedApplicationPanel
              title="참석 확정 대상(선발자)"
              items={effectiveSelectedApplications}
              loading={loadingApplications}
              emptyText="참석 확정 가능한 선발자가 없습니다."
              showAttendanceAction
              confirmingApplicationId={confirmingApplicationId}
              onConfirmAttendance={handleConfirmAttendance}
            />

            <WalkInAttendanceForm
              form={walkInForm}
              onChange={handleWalkInFieldChange}
              onSubmit={handleWalkInSubmit}
              submitting={savingWalkIn}
            />

            <AttendanceListPanel
              title="최종 참석자 목록"
              items={attendanceList}
              loading={loadingAttendance}
              emptyText="아직 최종 참석자가 없습니다."
            />
          </div>
        )}
      </div>
    </div>
  );
}