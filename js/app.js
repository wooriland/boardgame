/**
 * ✅ 공용 모달 1개로 3개 기능 구현
 * - 기존 구조 유지
 * - "참여신청" 서버 연동 완성
 */

// ======================
// ✅ 서버 API 주소 (최종 배포 구조)
// - 로컬 개발: http://localhost:8080
// - 배포(GitHub Pages): https://wooriland.duckdns.org
// ======================
const API_BASE_URL =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:8080"
    : "https://wooriland.duckdns.org";

// POST /api/applications
const APPLY_ENDPOINT = "/api/applications";

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

// ======================
// 경고 메시지
// ======================
function showWarning(message = "모두 적으셔야 합니다.") {
  modalWarning.textContent = message;
  modalWarning.style.display = "block";
}

function hideWarning() {
  modalWarning.style.display = "none";
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
  document.body.classList.remove("modal-open");
}

function openModalWithView(mode) {
  hideWarning();
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
    return;
  }

  if (mode === "join") {
    modalTitle.textContent = "참여 신청";
    viewJoin.hidden = false;
    resetJoinForm();
    openModal();
    deptSelect.focus();
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
  deptEtcField.style.display = "none";
  deptEtcInput.value = "";
}

function updateDeptEtcVisibility() {
  if (deptSelect.value === "그 외") {
    deptEtcField.style.display = "block";
    deptEtcInput.focus();
  } else {
    deptEtcField.style.display = "none";
    deptEtcInput.value = "";
  }
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

  return true;
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

  return {
    dept: finalDept,
    name: nameInput.value.trim(),
    phone: phoneDigits
  };
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

// ======================
// 🚀 참여 신청 서버 전송
// ======================
if (joinForm) {
  joinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideWarning();

    if (!validateForm()) {
      showWarning("모두 적으셔야 합니다.");
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
        const errText = await res.text();
        console.error("서버 오류:", errText);
        alert("저장에 실패했습니다.");
        return;
      }

      const data = await res.json();

      closeModal();
      alert(data.message || "참여 신청이 완료 되었습니다!");

    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다. HTTPS/API 주소를 확인해주세요.");
    }
  });
}
