/**
 * ✅ 공용 모달 1개로 3개 기능 구현
 *
 * [동아리 소개] [금주의 보드게임] [참여신청]
 *  - footer 버튼 클릭 → 모달 열기(openModalWithView)
 *  - intro/weekly : card(모달) + 확인 버튼 누르면 닫기
 *  - join         : 기존 참여 신청 폼 로직 유지(검증/POST)
 *
 * ✅ 이 구조는 React로 옮길 때도 그대로 쓸 수 있음:
 *  - "현재 모달 뷰 상태"를 state로 들고 조건부 렌더링하면 끝.
 */

// ======================
// (옵션) 서버 API 주소
// - 지금은 localhost로 되어있음
// - 나중에 배포하면 실제 도메인으로 변경
// ======================
const API_BASE_URL = "http://localhost:8080";

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
// - data-modal 값을 읽어서 어떤 뷰를 띄울지 결정
// ======================
const footerButtons = document.querySelectorAll(".footer-btn");

// ======================
// 참여 신청 폼 관련 DOM (기존 로직 유지)
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
// - 3개 카드가 “형식은 같고, 내용만 다름”을 위해
//   section 3개를 번갈아 보이게 한다.
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
}

function closeModal() {
  mainModal.style.display = "none";
  mainModal.setAttribute("aria-hidden", "true");
  hideWarning();
}

// ======================
// ✅ 특정 뷰로 모달 열기
// mode: "intro" | "weekly" | "join"
// ======================
function openModalWithView(mode) {
  hideWarning();
  hideAllViews();

  // (1) 어떤 뷰인지에 따라 타이틀/콘텐츠 노출
  if (mode === "intro") {
    modalTitle.textContent = "동아리 소개";
    viewIntro.hidden = false;

    openModal();
    // 첫 포커스(접근성/UX) - 확인 버튼에 포커스 주고 싶으면 여기서 잡아도 됨.
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

    // (2) 참여신청은 폼 초기화가 필요
    resetJoinForm();

    openModal();
    // 첫 입력에 포커스(UX)
    deptSelect.focus();
    return;
  }

  // 알 수 없는 mode면 그냥 닫기(안전장치)
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

  // 필수: 소속부서, 이름, 연락처
  if (!dept || !name || !phone) return false;

  // '그 외'일 때는 직접입력도 필수
  if (dept === "그 외") {
    const etc = deptEtcInput.value.trim();
    if (!etc) return false;
  }

  // 연락처: 숫자만 허용 (01012345678 형태)
  const onlyDigits = phone.replace(/\D/g, "");
  if (onlyDigits.length < 10 || onlyDigits.length > 11) return false;

  return true;
}

// ======================
// 서버 전송 payload 만들기
// ======================
function buildPayload() {
  const dept = deptSelect.value.trim();
  const phone = phoneInput.value.trim().replace(/\D/g, ""); // 숫자만

  return {
    department: dept, // 1청년부/2청년부/3청년부/4청년부/그 외
    departmentEtc: dept === "그 외" ? deptEtcInput.value.trim() : null,
    name: nameInput.value.trim(),
    phone: phone
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

// (B) 모달 안에서 "확인/닫기" 역할 버튼 처리
// - intro/weekly의 확인 버튼은 data-action="close"를 달아둠
mainModal.addEventListener("click", (e) => {
  const target = e.target;

  // data-action="close"면 닫기
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

    // 2) payload 생성
    const payload = buildPayload();

    // 3) 서버로 POST
    try {
      const res = await fetch(`${API_BASE_URL}/api/participants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("서버 오류:", errText);
        alert("저장에 실패했습니다. (콘솔 확인)");
        return;
      }

      // 성공
      closeModal();
      alert("참여 신청이 완료되었습니다!");
      window.location.href = "./index.html";
    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다. Spring Boot가 실행 중인지 확인해주세요.");
    }
  });
}
