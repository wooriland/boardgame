/**
 * ✅ 공용 모달 1개로 3개 기능 구현
 * - 기존 구조 유지
 * - "참여신청" 서버 연동 완성
 * - ✅ (추가) "금주의 보드게임" 서버 연동 (/api/recommend/weekly)
 * - ✅ (추가) 참여신청에 timeSlots(EASY/NORMAL/HARD) 복수 선택 추가
 * - ✅ (추가) 신청 옵션 API(/api/apply/options) 연동:
 *    체크박스 라벨: 난이도(시간) 게임이름 (신청수) · 인원
 *
 * ✅ 중요(혼합 콘텐츠):
 * - GitHub Pages는 HTTPS로 열림.
 * - 따라서 API도 HTTPS로 호출해야 브라우저가 차단하지 않는다.
 * - 결론: 배포에서는 https://wooriland.duckdns.org 로만 호출해야 함.
 */

// ======================
// ✅ 서버 API 주소
// ======================
const API_BASE_URL =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:8080"
    : "https://wooriland.duckdns.org"; // ✅ 배포는 HTTPS 도메인으로 고정 (Mixed Content 방지)

// POST /api/applications
const APPLY_ENDPOINT = "/api/applications";

// GET /api/recommend/weekly
const WEEKLY_ENDPOINT = "/api/recommend/weekly";

// ✅ (추가) GET /api/apply/options
const APPLY_OPTIONS_ENDPOINT = "/api/apply/options";

// ======================
// DOM
// ======================
const mainModal = document.getElementById("mainModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalWarning = document.getElementById("modalWarning");

const viewIntro = document.getElementById("viewIntro");
const viewWeekly = document.getElementById("viewWeekly");
const viewJoin = document.getElementById("viewJoin");

const footerButtons = document.querySelectorAll(".footer-btn");

const joinForm = document.getElementById("joinForm");
const cancelBtn = document.getElementById("cancelBtn");

const deptSelect = document.getElementById("deptSelect");
const deptEtcField = document.getElementById("deptEtcField");
const deptEtcInput = document.getElementById("deptEtcInput");

const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");

// ✅ (추가) peopleCount input
const peopleCountInput = document.getElementById("peopleCountInput");

// ✅ 금주의 보드게임 DOM
const weeklyCards = document.getElementById("weeklyCards");
const weeklyStatus = document.getElementById("weeklyStatus");
const weekStartDate = document.getElementById("weekStartDate");

// ✅ timeSlots UI DOM
const slotPanel = document.getElementById("slotPanel");
const slotEasy = document.getElementById("slotEasy");
const slotNormal = document.getElementById("slotNormal");
const slotHard = document.getElementById("slotHard");
const slotWarning = document.getElementById("slotWarning");
const submitBtn = document.getElementById("submitBtn");

// ✅ (추가) 슬롯 라벨 span (index.html에서 id를 부여한 버전)
const slotEasyLabel = document.getElementById("slotEasyLabel");
const slotNormalLabel = document.getElementById("slotNormalLabel");
const slotHardLabel = document.getElementById("slotHardLabel");

// ✅ 신청 옵션 상태(체크박스 라벨 데이터)
let applyOptionsCache = null; // { weekStartDate, options:[...] }
let applyOptionsLoading = false;

// ======================
// 경고 메시지(공용)
// ======================
function showWarning(message = "모두 적으셔야 합니다.") {
  modalWarning.textContent = message;
  modalWarning.style.display = "block";
}

function hideWarning() {
  modalWarning.style.display = "none";
}

// ✅ timeSlots 경고
function showSlotWarning(message = "시간대를 1개 이상 선택해주세요.") {
  if (!slotWarning) return;
  slotWarning.textContent = message;
  slotWarning.style.display = "block";
}

function hideSlotWarning() {
  if (!slotWarning) return;
  slotWarning.style.display = "none";
}

// ======================
// 뷰 제어
// ======================
function hideAllViews() {
  viewIntro.hidden = true;
  viewWeekly.hidden = true;
  viewJoin.hidden = true;
}

function openModal() {
  mainModal.style.display = "flex";
  mainModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
}

function closeModal() {
  mainModal.style.display = "none";
  mainModal.setAttribute("aria-hidden", "true");
  hideWarning();
  hideSlotWarning();
  document.body.classList.remove("modal-open");
}

function openModalWithView(mode) {
  hideWarning();
  hideSlotWarning();
  hideAllViews();

  if (mode === "intro") {
    modalTitle.textContent = "동아리 소개";
    viewIntro.hidden = false;
    openModal();
    return;
  }

  if (mode === "weekly") {
    modalTitle.textContent = "금주의 보드게임";
    viewWeekly.hidden = false;
    openModal();
    loadWeeklyRecommendation();
    return;
  }

  if (mode === "join") {
    modalTitle.textContent = "참여 신청";
    viewJoin.hidden = false;
    resetJoinForm();
    openModal();
    deptSelect.focus();

    // ✅ 신청 모달 열릴 때 옵션 API 호출 → 체크박스 라벨 갱신
    loadApplyOptionsAndRenderLabels();
    return;
  }

  closeModal();
}

// ======================
// 폼 초기화
// ======================
function resetJoinForm() {
  if (!joinForm) return;

  joinForm.reset();

  // dept etc 초기화
  deptEtcField.style.display = "none";
  deptEtcInput.value = "";

  // slot UI 초기화
  if (slotPanel) slotPanel.style.display = "none";
  if (slotEasy) slotEasy.checked = false;
  if (slotNormal) slotNormal.checked = false;
  if (slotHard) slotHard.checked = false;

  hideSlotWarning();

  // submit 버튼 기본 비활성화
  if (submitBtn) submitBtn.disabled = true;

  // peopleCount 기본값
  if (peopleCountInput) {
    if (!peopleCountInput.value) peopleCountInput.value = "1";
  }

  // 라벨 기본값
  renderSlotLabelsFallback();
}

function updateDeptEtcVisibility() {
  if (deptSelect.value === "그 외") {
    deptEtcField.style.display = "block";
    deptEtcInput.focus();
  } else {
    deptEtcField.style.display = "none";
    deptEtcInput.value = "";
  }

  updateJoinUiState();
}

// ======================
// 유효성 검사
// ======================
function validateForm() {
  const dept = deptSelect.value.trim();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  if (!dept || !name || !phone) return false;

  if (dept === "그 외") {
    const etc = deptEtcInput.value.trim();
    if (!etc) return false;
  }

  const onlyDigits = phone.replace(/\D/g, "");
  if (onlyDigits.length < 10 || onlyDigits.length > 11) return false;

  // peopleCount 검증(있을 때만)
  if (peopleCountInput) {
    const n = parseInt(String(peopleCountInput.value || "1"), 10);
    if (Number.isNaN(n) || n < 1 || n > 99) return false;
  }

  return true;
}

// ✅ timeSlots 1개 이상 체크 여부
function hasAnySlotChecked() {
  return !!(slotEasy?.checked || slotNormal?.checked || slotHard?.checked);
}

// ✅ 선택된 슬롯 배열 만들기
function getSelectedSlots() {
  const slots = [];
  if (slotEasy?.checked) slots.push("EASY");
  if (slotNormal?.checked) slots.push("NORMAL");
  if (slotHard?.checked) slots.push("HARD");
  return slots;
}

// ======================
// ✅ 참여 신청 UI 상태 업데이트
// ======================
function updateJoinUiState() {
  const formOk = validateForm();

  // 필수 입력 OK일 때만 slotPanel 오픈
  if (slotPanel) {
    slotPanel.style.display = formOk ? "block" : "none";
  }

  const slotOk = hasAnySlotChecked();

  if (submitBtn) {
    submitBtn.disabled = !(formOk && slotOk);
  }

  hideSlotWarning();
}

// ======================
// payload 생성
// ======================
function buildPayload() {
  const dept = deptSelect.value.trim();
  const finalDept = (dept === "그 외")
    ? deptEtcInput.value.trim()
    : dept;

  const phoneDigits = phoneInput.value.trim().replace(/\D/g, "");

  const timeSlots = getSelectedSlots();

  let peopleCount = 1;
  if (peopleCountInput) {
    const n = parseInt(String(peopleCountInput.value || "1"), 10);
    if (!Number.isNaN(n) && n >= 1 && n <= 99) peopleCount = n;
  }

  return {
    dept: finalDept,
    name: nameInput.value.trim(),
    phone: phoneDigits,
    peopleCount,
    timeSlots
  };
}

// =========================================================
// ✅ 신청 옵션(/api/apply/options): 체크박스 라벨 렌더
// =========================================================

function slotTimeTextFallback(slot) {
  switch (String(slot || "").toUpperCase()) {
    case "EASY": return "13:00~14:00";
    case "NORMAL": return "14:00~15:00";
    case "HARD": return "15:00~16:00";
    default: return "";
  }
}

/**
 * ✅ index.html이 이미 <span id="slotEasyLabel">...</span> 구조이므로
 * span을 새로 만들지 않고 해당 span.textContent만 교체한다.
 */
function setSlotLabel(slot, labelText) {
  const key = String(slot || "").toUpperCase();
  if (key === "EASY" && slotEasyLabel) slotEasyLabel.textContent = labelText;
  if (key === "NORMAL" && slotNormalLabel) slotNormalLabel.textContent = labelText;
  if (key === "HARD" && slotHardLabel) slotHardLabel.textContent = labelText;
}

function renderSlotLabelsFromOptions(optionsResponse) {
  const opts = optionsResponse?.options || [];

  const bySlot = new Map();
  for (const it of opts) {
    if (!it?.slot) continue;
    bySlot.set(String(it.slot).toUpperCase(), it);
  }

  const easy = bySlot.get("EASY");
  const normal = bySlot.get("NORMAL");
  const hard = bySlot.get("HARD");

  const makeText = (slot, it) => {
    const time = it?.timeText || slotTimeTextFallback(slot);
    const name = it?.gameName || "(미정)";
    const cnt = typeof it?.applyCount === "number" ? it.applyCount : 0;

    const minP = it?.minPlayers;
    const maxP = it?.maxPlayers;
    const peopleText =
      (minP != null && maxP != null) ? ` · ${minP}~${maxP}인`
        : (minP != null) ? ` · ${minP}인 이상`
          : (maxP != null) ? ` · 최대 ${maxP}인`
            : "";

    return `${slot}(${time}) ${name} (${cnt})${peopleText}`;
  };

  setSlotLabel("EASY", makeText("EASY", easy));
  setSlotLabel("NORMAL", makeText("NORMAL", normal));
  setSlotLabel("HARD", makeText("HARD", hard));
}

function renderSlotLabelsFallback() {
  setSlotLabel("EASY", `EASY(${slotTimeTextFallback("EASY")})`);
  setSlotLabel("NORMAL", `NORMAL(${slotTimeTextFallback("NORMAL")})`);
  setSlotLabel("HARD", `HARD(${slotTimeTextFallback("HARD")})`);
}

/**
 * ✅ 신청 옵션 API 호출 + 라벨 렌더
 */
async function loadApplyOptionsAndRenderLabels() {
  // 라벨 span이 하나도 없으면 렌더 불가
  if (!slotEasyLabel && !slotNormalLabel && !slotHardLabel) return;

  if (applyOptionsLoading) return;
  applyOptionsLoading = true;

  try {
    const res = await fetch(`${API_BASE_URL}${APPLY_OPTIONS_ENDPOINT}`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[apply/options] 서버 오류:", res.status, errText);
      renderSlotLabelsFallback();
      return;
    }

    const data = await res.json();

    if (!data?.weekStartDate || !Array.isArray(data?.options)) {
      console.warn("[apply/options] 응답 구조가 예상과 다릅니다:", data);
      renderSlotLabelsFallback();
      return;
    }

    applyOptionsCache = data;
    renderSlotLabelsFromOptions(data);

  } catch (err) {
    console.error("[apply/options] 네트워크 예외:", err);
    renderSlotLabelsFallback();
  } finally {
    applyOptionsLoading = false;
  }
}

// =========================================================
// ✅ 금주의 보드게임: UI 렌더링 유틸
// =========================================================

function setWeeklyLoading() {
  if (!weeklyStatus || !weeklyCards) return;
  weeklyStatus.style.display = "block";
  weeklyStatus.textContent = "불러오는 중...";
  weeklyCards.innerHTML = "";
  if (weekStartDate) weekStartDate.textContent = "";
}

function setWeeklyError(message) {
  if (!weeklyStatus || !weeklyCards) return;
  weeklyStatus.style.display = "block";
  weeklyStatus.textContent = message || "불러오기에 실패했습니다.";
  weeklyCards.innerHTML = "";
  if (weekStartDate) weekStartDate.textContent = "";
}

function setWeeklySuccess(data) {
  if (!weeklyStatus || !weeklyCards) return;

  if (weekStartDate && data?.weekStartDate) {
    weekStartDate.textContent = ` (기준일: ${data.weekStartDate})`;
  }

  weeklyStatus.style.display = "none";
  weeklyStatus.textContent = "";

  const items = [
    { key: "easy", label: "EASY", value: data?.easy },
    { key: "normal", label: "NORMAL", value: data?.normal },
    { key: "hard", label: "HARD", value: data?.hard },
  ];

  weeklyCards.innerHTML = items.map((it) => {
    const name = it.value?.name ?? "(데이터 없음)";
    const desc = it.value?.description ?? "";
    const diff = it.value?.difficulty ?? it.label;

    const minP = it.value?.minPlayers;
    const maxP = it.value?.maxPlayers;
    const peopleText =
      (minP != null && maxP != null) ? `${minP}~${maxP}인`
        : (minP != null) ? `${minP}인 이상`
          : (maxP != null) ? `최대 ${maxP}인`
            : "";

    return `
      <article class="mini-card" data-difficulty="${escapeHtml(diff)}">
        <div class="mini-card-badge">${escapeHtml(diff)}</div>
        <h4 class="mini-card-title">${escapeHtml(name)}</h4>
        ${peopleText ? `<div class="mini-card-meta">${escapeHtml(peopleText)}</div>` : ``}
        <p class="mini-card-desc">${escapeHtml(desc)}</p>
      </article>
    `;
  }).join("");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================================================
// ✅ 금주의 보드게임: 서버 호출
// =========================================================
async function loadWeeklyRecommendation() {
  if (!weeklyCards || !weeklyStatus) {
    console.warn("[weekly] DOM이 없습니다. index.html에 weeklyCards/weeklyStatus/weekStartDate id가 있는지 확인하세요.");
    return;
  }

  setWeeklyLoading();

  try {
    const res = await fetch(`${API_BASE_URL}${WEEKLY_ENDPOINT}`, {
      method: "GET",
      headers: { "Accept": "application/json" }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[weekly] 서버 오류:", res.status, errText);
      setWeeklyError(`불러오기 실패 (HTTP ${res.status})`);
      return;
    }

    const data = await res.json();

    if (!data?.easy || !data?.normal || !data?.hard) {
      console.warn("[weekly] 응답 구조가 예상과 다릅니다:", data);
      setWeeklyError("추천 데이터 형식이 올바르지 않습니다.");
      return;
    }

    setWeeklySuccess(data);

  } catch (err) {
    console.error("[weekly] 네트워크 예외:", err);
    setWeeklyError("서버 연결에 실패했습니다. (API 주소/HTTPS/CORS 확인)");
  }
}

// ======================
// 이벤트 등록
// ======================
footerButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.getAttribute("data-modal");
    openModalWithView(mode);
  });
});

mainModal.addEventListener("click", (e) => {
  const target = e.target;
  if (target?.getAttribute?.("data-action") === "close") {
    closeModal();
  }
});

modalBackdrop?.addEventListener("click", closeModal);
cancelBtn?.addEventListener("click", closeModal);
deptSelect?.addEventListener("change", updateDeptEtcVisibility);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mainModal.style.display === "flex") {
    closeModal();
  }
});

// 입력 변화 감지
nameInput?.addEventListener("input", updateJoinUiState);
phoneInput?.addEventListener("input", updateJoinUiState);
deptEtcInput?.addEventListener("input", updateJoinUiState);
deptSelect?.addEventListener("change", updateJoinUiState);
peopleCountInput?.addEventListener("input", updateJoinUiState);

// 체크박스 변화 감지
slotEasy?.addEventListener("change", updateJoinUiState);
slotNormal?.addEventListener("change", updateJoinUiState);
slotHard?.addEventListener("change", updateJoinUiState);

// ======================
// 🚀 참여 신청 서버 전송
// ======================
if (joinForm) {
  joinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideWarning();
    hideSlotWarning();

    if (!validateForm()) {
      showWarning("모두 적으셔야 합니다.");
      updateJoinUiState();
      return;
    }

    if (!hasAnySlotChecked()) {
      showSlotWarning("시간대를 1개 이상 선택해주세요.");
      updateJoinUiState();
      return;
    }

    const payload = buildPayload();

    try {
      const res = await fetch(`${API_BASE_URL}${APPLY_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        console.error("서버 오류:", res.status, errText);
        alert("저장에 실패했습니다.");
        return;
      }

      const data = await res.json();

      closeModal();
      alert(data.message || "참여 신청이 완료 되었습니다!");

      // 신청 직후 신청수 갱신
      applyOptionsCache = null;
      loadApplyOptionsAndRenderLabels();

    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다. HTTPS/API 주소를 확인해주세요.");
    }
  });
}

// 페이지 로드 직후 상태 정리
updateJoinUiState();