/**
 * ✅ 공용 모달 1개로 3개 기능 구현
 * - 너의 기존 구조 그대로 유지
 * - "참여신청"만 서버 연동으로 완성
 */

// ======================
// ✅ 서버 API 주소 (중요)
// - GitHub Pages에서 localhost는 절대 안됨
// - 로컬 개발(내 PC)에서는 localhost 사용
// - 배포(GitHub Pages)에서는 OCI Compute 퍼블릭 IP 사용
//
// ⚠️ 주의: GitHub Pages는 HTTPS라서
// 백엔드가 HTTP면 Mixed Content로 막힐 수 있음.
// 그 경우엔 Nginx + HTTPS(도메인) 붙여서 https://api.xxx 로 바꿔야 함
// ======================
const API_BASE_URL =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:8080"
    : "http://140.245.68.121:8080";

// ✅ 우리가 만든 컨트롤러 기준 엔드포인트
// POST /api/applications
const APPLY_ENDPOINT = "/api/applications";

// ======================
// DOM 가져오기 (모달 공용)
// ======================
const mainModal = document.getElementById("mainModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const modalTitle = document.getElementById("modalTitle");
const modalWarning = document.getElementById("modalWarning");

// ======================
// 모달 내부 3개 "뷰" 섹션
// ======================
const viewIntro = document.getElementById("viewIntro");
const viewWeekly = document.getElementById("viewWeekly");
const viewJoin = document.getElementById("viewJoin");

// ======================
// footer 버튼들
// ======================
const footerButtons = document.querySelectorAll(".footer-btn");

// ======================
// 참여 신청 폼 관련 DOM
// ======================
const joinForm = document.getElementById("joinForm");
const cancelBtn = document.getElementById("cancelBtn");

const deptSelect = document.getElementById("deptSelect");
const deptEtcField = document.getElementById("deptEtcField");
const deptEtcInput = document.getElementById("deptEtcInput");

const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");

// ======================
// 유틸: 경고 메시지
// ======================
function showWarning(message = "모두 적으셔야 합니다.") {
  modalWarning.textContent = message;
  modalWarning.style.display = "block";
}

function hideWarning() {
  modalWarning.style.display = "none";
}

// ======================
// 유틸: 모든 뷰 숨기기
// ======================
function hideAllViews() {
  viewIntro.hidden = true;
  viewWeekly.hidden = true;
  viewJoin.hidden = true;
}

// ======================
// 모달 열기/닫기
// ======================
function openModal() {
  mainModal.style.display = "flex";
  mainModal.setAttribute("aria-hidden", "false");

  // (선택) 배경 스크롤 방지
  document.body.classList.add("modal-open");
}

function closeModal() {
  mainModal.style.display = "none";
  mainModal.setAttribute("aria-hidden", "true");
  hideWarning();

  // (선택) 배경 스크롤 복구
  document.body.classList.remove("modal-open");
}

// ======================
// ✅ 특정 뷰로 모달 열기
// ======================
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
// 참여신청 폼 초기화
// ======================
function resetJoinForm() {
  if (!joinForm) return;

  joinForm.reset();
  deptEtcField.style.display = "none";
  deptEtcInput.value = "";
}

// ======================
// '그 외' 입력란 표시/숨김
// ======================
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
// 참여신청 입력값 검증
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

  // ✅ 전화번호는 숫자만 남겨 길이 체크 (10~11)
  const onlyDigits = phone.replace(/\D/g, "");
  if (onlyDigits.length < 10 || onlyDigits.length > 11) return false;

  return true;
}

// ======================
// ✅ 서버 전송 payload 만들기 (백엔드 DTO에 맞춤)
// 백엔드: { dept, name, phone }
// - dept가 "그 외"면 deptEtcInput 값을 dept로 보냄
// - phone은 숫자만 보내기
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

// =====================================================
// 이벤트 등록
// =====================================================

// (A) footer 버튼 클릭 → 모달 오픈
footerButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mode = btn.getAttribute("data-modal");
    openModalWithView(mode);
  });
});

// (B) 모달 안에서 "확인" 버튼(data-action="close") 처리
mainModal.addEventListener("click", (e) => {
  const target = e.target;
  if (target && target.getAttribute && target.getAttribute("data-action") === "close") {
    closeModal();
  }
});

// (C) 배경(dim) 클릭 → 닫기
if (modalBackdrop) {
  modalBackdrop.addEventListener("click", closeModal);
}

// (D) 참여신청: 취소 버튼 → 닫기
if (cancelBtn) {
  cancelBtn.addEventListener("click", closeModal);
}

// (E) 참여신청: 소속부서 변경 → '그 외' 토글
if (deptSelect) {
  deptSelect.addEventListener("change", updateDeptEtcVisibility);
}

// (F) ESC 키 → 닫기
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && mainModal && mainModal.style.display === "flex") {
    closeModal();
  }
});

// (G) 참여신청: 폼 제출(참여 버튼)
if (joinForm) {
  joinForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideWarning();

    // 1) 프론트 유효성 검사
    if (!validateForm()) {
      showWarning("모두 적으셔야 합니다.");
      return;
    }

    // 2) payload 생성 (백엔드 DTO에 맞게)
    const payload = buildPayload();

    // 3) 서버로 POST
    try {
      const res = await fetch(`${API_BASE_URL}${APPLY_ENDPOINT}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      // ✅ 서버가 200이 아니면 실패 처리
      if (!res.ok) {
        const errText = await res.text();
        console.error("서버 오류:", errText);
        alert("저장에 실패했습니다. (콘솔 확인)");
        return;
      }

      // ✅ 성공 응답(JSON)
      const data = await res.json();

      // 4) 닫고 메시지 출력
      closeModal();
      alert(data.message || "참여 신청이 완료 되었습니다!");

    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다. API 주소/서버 실행/CORS/HTTPS를 확인해주세요.");
    }
  });
}
