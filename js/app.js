/**
 * 참여 신청 기능 (나이 입력 제거 버전)
 * - [참여 신청] 클릭 -> 모달 열기
 * - 필수값 체크 (소속부서 / 그 외 직접입력(조건부) / 이름)
 * - 모두 입력되면 Spring Boot로 POST 전송
 * - 성공하면 join_done.html로 이동(임시)
 */

const API_BASE_URL = "http://localhost:8080"; // 스프링부트 기본 포트

// ===== DOM 가져오기 =====
const joinBtn = document.getElementById("joinBtn");
const joinModal = document.getElementById("joinModal");
const modalBackdrop = document.getElementById("modalBackdrop");
const cancelBtn = document.getElementById("cancelBtn");

const joinForm = document.getElementById("joinForm");
const modalWarning = document.getElementById("modalWarning");

const deptSelect = document.getElementById("deptSelect");
const deptEtcField = document.getElementById("deptEtcField");
const deptEtcInput = document.getElementById("deptEtcInput");

const nameInput = document.getElementById("nameInput");
const phoneInput = document.getElementById("phoneInput");


// 문의하기 버튼은 아직 기능이 없으니, 있어도 되고 없어도 되게 처리
const contactBtn = document.getElementById("contactBtn");

// ===== 유틸 함수 =====
function showWarning(message = "모두 적으셔야 합니다.") {
  modalWarning.textContent = message;
  modalWarning.style.display = "block";
}

function hideWarning() {
  modalWarning.style.display = "none";
}

// 모달 열기
function openModal() {
  hideWarning();

  // 폼 초기화
  joinForm.reset();
  deptEtcField.style.display = "none";
  deptEtcInput.value = "";

  joinModal.style.display = "flex";
  joinModal.setAttribute("aria-hidden", "false");

  // 첫 입력에 포커스(UX)
  deptSelect.focus();
}

// 모달 닫기
function closeModal() {
  joinModal.style.display = "none";
  joinModal.setAttribute("aria-hidden", "true");
}

// '그 외' 입력란 표시/숨김
function updateDeptEtcVisibility() {
  if (deptSelect.value === "그 외") {
    deptEtcField.style.display = "block";
    deptEtcInput.focus();
  } else {
    deptEtcField.style.display = "none";
    deptEtcInput.value = "";
  }
}

// 입력값 검증
function validateForm() {
  const dept = deptSelect.value.trim();
  const name = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  // 필수: 소속부서, 이름
  if (!dept || !name || !phone) return false;

  // '그 외'일 때는 직접입력도 필수
  if (dept === "그 외") {
    const etc = deptEtcInput.value.trim();
    if (!etc) return false;
  }

  // 연락처: 숫자만 허용(01012345678 형태)
  const onlyDigits = phone.replace(/\D/g, "");
  if (onlyDigits.length < 10 || onlyDigits.length > 11) return false;

  return true;
}

// 서버 전송 payload 만들기
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

// ===== 이벤트 등록 =====

// 참여 신청 클릭 -> 모달 열기
if (joinBtn) {
  joinBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
}

// 문의하기(임시)
if (contactBtn) {
  contactBtn.addEventListener("click", (e) => {
    e.preventDefault();
    alert("문의하기 기능은 다음 단계에서 연결할게요!");
  });
}

// 배경 클릭 -> 닫기
if (modalBackdrop) {
  modalBackdrop.addEventListener("click", closeModal);
}

// 취소 버튼 -> 닫기
if (cancelBtn) {
  cancelBtn.addEventListener("click", closeModal);
}

// 소속부서 변경 -> '그 외' 입력칸 토글
if (deptSelect) {
  deptSelect.addEventListener("change", updateDeptEtcVisibility);
}

// ESC 키로 모달 닫기(편의)
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && joinModal && joinModal.style.display === "flex") {
    closeModal();
  }
});

// 폼 제출(참여 버튼)
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
        // 서버가 준 에러를 콘솔에 남겨서 디버깅하기 쉽게
        const errText = await res.text();
        console.error("서버 오류:", errText);
        alert("저장에 실패했습니다. (콘솔 확인)");
        return;
      }

      // 성공
      closeModal();
      // ✅ 아직 join_done.html이 없으니 메인으로 돌아가기
      window.location.href = "./index.html";
      alert("참여 신청이 완료되었습니다!");
      // 또는 현재 페이지 새로고침을 원하면 아래로 바꿔도 됨:
      // window.location.reload();
    } catch (err) {
      console.error(err);
      alert("서버 연결에 실패했습니다. Spring Boot가 실행 중인지 확인해주세요.");
    }
  });
}
