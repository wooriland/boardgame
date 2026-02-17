/**
 * ✅ 공용 모달 1개로 3개 기능 구현
 * - 기존 구조 유지
 * - "참여신청" 서버 연동 완성
 * - ✅ (추가) "금주의 보드게임" 서버 연동 (/api/recommend/weekly)
 *
 * 목표:
 * - [금주의 보드게임] 버튼 클릭 시
 *   1) 모달 열림
 *   2) 서버에서 easy/normal/hard 3칸을 받아서 카드 3개에 매핑
 *   3) 실패하면 사용자에게 메시지 출력
 *
 * 주의:
 * - GitHub Pages 같은 정적 호스팅에서는 "내 서버(168...)"로 직접 호출 시
 *   CORS/HTTP/HTTPS 문제가 날 수 있음
 * - 지금은 서버가 8080으로 열려 있으니, 배포용 API_BASE_URL을 168...로 바꿔서 테스트 가능
 */

// ======================
// ✅ 서버 API 주소
// ======================
//
// 1) 로컬 개발(내 PC Spring)
// - 웹이 로컬이면: http://localhost:8080
//
// 2) 배포 서버(OCI Spring, 지금 네가 올린 서버)
// - http://168.107.60.189:8080
//
// 3) 도메인/프록시(나중에)
// - https://wooriland.duckdns.org (이게 "스프링으로 프록시"가 잡혀있을 때만 안정적)
//
// ------------------------------------------------------
// ✅ 지금 단계 추천:
// - GitHub Pages에서 테스트한다면 https 페이지가 http API를 막을 수 있음(혼합콘텐츠).
// - 가장 확실한 건 "API도 https로 제공"하거나, "같은 도메인으로 프록시"다.
// - 하지만 지금은 일단 성공 확인이 목표이므로,
//   운영 배포 테스트 시 API_BASE_URL을 OCI로 직접 잡아도 됨.
// ------------------------------------------------------
const API_BASE_URL =
  (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://localhost:8080"
    : "http://168.107.60.189:8080"; // ✅ 지금은 OCI 직접 호출(성공 확인용)

// POST /api/applications
const APPLY_ENDPOINT = "/api/applications";

// GET /api/recommend/weekly  ✅ (추가)
const WEEKLY_ENDPOINT = "/api/recommend/weekly";

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

// ✅ (추가) 금주의 보드게임 DOM (index.html에서 추가한 id들)
const weeklyCards = document.getElementById("weeklyCards");
const weeklyStatus = document.getElementById("weeklyStatus");
const weekStartDate = document.getElementById("weekStartDate");

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

    // ✅ (추가) 모달 열리는 즉시 주간 추천 API 호출
    // - 사용자가 "금주의 보드게임"을 눌렀을 때만 호출한다(불필요한 트래픽 방지)
    loadWeeklyRecommendation();

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

// =========================================================
// ✅ (추가) 금주의 보드게임: UI 렌더링 유틸
// =========================================================

/**
 * 서버 응답 예시:
 * {
 *   "weekStartDate":"2026-02-15",
 *   "easy":{"name":"...","difficulty":"EASY","description":"..."},
 *   "normal":{"name":"...","difficulty":"NORMAL","description":"..."},
 *   "hard":{"name":"...","difficulty":"HARD","description":"..."}
 * }
 */

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

  // ✅ weekStartDate 표시(있으면)
  if (weekStartDate && data?.weekStartDate) {
    weekStartDate.textContent = ` (기준일: ${data.weekStartDate})`;
  }

  // ✅ 상태 메시지 숨김
  weeklyStatus.style.display = "none";
  weeklyStatus.textContent = "";

  // ✅ 3개 카드 렌더
  const items = [
    { key: "easy", label: "EASY", value: data?.easy },
    { key: "normal", label: "NORMAL", value: data?.normal },
    { key: "hard", label: "HARD", value: data?.hard },
  ];

  weeklyCards.innerHTML = items.map((it) => {
    const name = it.value?.name ?? "(데이터 없음)";
    const desc = it.value?.description ?? "";
    // difficulty는 서버가 내려주지만, UI에서는 라벨로도 충분해서 둘 다 보여줄 수 있음
    const diff = it.value?.difficulty ?? it.label;

    return `
      <article class="mini-card" data-difficulty="${diff}">
        <!-- ✅ 난이도 뱃지(원하면 CSS로 꾸미기 좋음) -->
        <div class="mini-card-badge">${diff}</div>

        <h4 class="mini-card-title">${escapeHtml(name)}</h4>
        <p class="mini-card-desc">${escapeHtml(desc)}</p>
      </article>
    `;
  }).join("");
}

/**
 * ✅ XSS 방지(서버/DB 문자열을 HTML에 꽂을 때는 기본적으로 escape)
 * - 지금은 내부용이지만 습관 들이면 안전함
 */
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// =========================================================
// ✅ (추가) 금주의 보드게임: 서버 호출
// =========================================================
async function loadWeeklyRecommendation() {
  // ✅ index.html을 아직 수정 안 해서 DOM이 없으면, 여기서 바로 리턴(에러 방지)
  if (!weeklyCards || !weeklyStatus) {
    console.warn("[weekly] DOM이 없습니다. index.html에 weeklyCards/weeklyStatus/weekStartDate id가 있는지 확인하세요.");
    return;
  }

  setWeeklyLoading();

  try {
    const res = await fetch(`${API_BASE_URL}${WEEKLY_ENDPOINT}`, {
      method: "GET",
      headers: {
        // ✅ JSON 응답을 기대한다는 힌트(필수는 아님)
        "Accept": "application/json"
      }
    });

    if (!res.ok) {
      // 서버가 text/plain이나 에러 json을 줄 수 있으니 일단 text로 읽어서 로그에 남김
      const errText = await res.text().catch(() => "");
      console.error("[weekly] 서버 오류:", res.status, errText);
      setWeeklyError(`불러오기 실패 (HTTP ${res.status})`);
      return;
    }

    const data = await res.json();

    // ✅ 최소 데이터 검증
    if (!data?.easy || !data?.normal || !data?.hard) {
      console.warn("[weekly] 응답 구조가 예상과 다릅니다:", data);
      setWeeklyError("추천 데이터 형식이 올바르지 않습니다.");
      return;
    }

    setWeeklySuccess(data);

  } catch (err) {
    console.error("[weekly] 네트워크 예외:", err);

    // ✅ https 페이지에서 http API 호출하면 Mixed Content로 막히는 경우가 많음
    //    이 경우 브라우저 콘솔에 Mixed Content 경고가 뜬다.
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
