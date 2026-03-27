/**
 * ✅ "로컬" 기준 YYYY-MM-DD
 * - toISOString()는 UTC 기준이라 날짜가 하루 밀릴 수 있어 사용하지 않는다.
 */
export function formatLocalYYYYMMDD(date = new Date()) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd}`;
}

/**
 * ✅ 날짜 계산 안정화
 * - 자정 부근 시간 오차를 피하려고 정오(12:00)로 맞춘다.
 */
function normalizeToNoon(date = new Date()) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;

  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * ✅ 입력값을 Date 객체로 안전하게 변환
 * 지원:
 * - Date
 * - "YYYY-MM-DD"
 * - "YYYY-MM-DDTHH:mm:ss..."
 */
export function parseToDateOrNull(input) {
  if (!input) return null;

  // Date 객체
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return null;
    return new Date(input);
  }

  // 문자열
  if (typeof input === "string") {
    const s = input.trim();
    if (!s) return null;

    const cut = s.slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cut)) return null;

    const [y, m, d] = cut.split("-").map(Number);
    const dt = new Date(y, m - 1, d);

    if (Number.isNaN(dt.getTime())) return null;
    return dt;
  }

  return null;
}

/**
 * ✅ Date | string 입력을 "YYYY-MM-DD"로 정규화
 * 실패 시 null
 */
export function normalizeDateInputToYYYYMMDD(input) {
  const dt = parseToDateOrNull(input);
  if (!dt) return null;

  const d = normalizeToNoon(dt);
  if (!d) return null;

  return formatLocalYYYYMMDD(d) || null;
}

/**
 * ✅ weekStartDate = "일요일" 기준 YYYY-MM-DD
 * - DB의 WEEK_START_DATE(일요일)와 맞춘다.
 */
export function toWeekStartDate(date = new Date()) {
  const d = normalizeToNoon(date);
  if (!d) return "";

  const day = d.getDay(); // 0 = 일요일
  d.setDate(d.getDate() - day);

  return formatLocalYYYYMMDD(d);
}

/**
 * ✅ 입력(Date | string)을 받아 "일요일 기준 YYYY-MM-DD"로 정규화
 * 실패 시 null
 */
export function toWeekStartDateYYYYMMDD(input) {
  const dt = parseToDateOrNull(input);
  const d = normalizeToNoon(dt);

  if (!d) return null;

  const day = d.getDay(); // 0 = 일요일
  d.setDate(d.getDate() - day);

  const out = formatLocalYYYYMMDD(d);
  return out || null;
}

/**
 * ✅ 오늘 기준 주 시작일(일요일)
 */
export function getCurrentWeekStartDate() {
  return toWeekStartDate(new Date());
}

/**
 * ✅ 특정 날짜에 일수 더하기
 * - yyyyMmDd: "YYYY-MM-DD"
 * - offsetDays: 정수
 */
export function addDays(yyyyMmDd, offsetDays = 0) {
  const dt = parseToDateOrNull(yyyyMmDd);
  const d = normalizeToNoon(dt);

  if (!d) return "";

  d.setDate(d.getDate() + Number(offsetDays || 0));
  return formatLocalYYYYMMDD(d);
}

/**
 * ✅ 특정 날짜에 주차 단위 이동
 * - weekStartDate는 일요일 기준 날짜 문자열
 * - offsetWeeks: -1, 0, 1 ...
 */
export function shiftWeekStartDate(weekStartDate, offsetWeeks = 0) {
  const base = toWeekStartDateYYYYMMDD(weekStartDate);
  if (!base) return "";

  return addDays(base, Number(offsetWeeks || 0) * 7);
}

export function getPreviousWeekStartDate(weekStartDate) {
  return shiftWeekStartDate(weekStartDate, -1);
}

export function getNextWeekStartDate(weekStartDate) {
  return shiftWeekStartDate(weekStartDate, 1);
}

/**
 * ✅ 화면 표시용 날짜 포맷
 * 예: 2026.03.15
 */
export function formatDisplayDate(input, separator = ".") {
  const yyyyMmDd = normalizeDateInputToYYYYMMDD(input);
  if (!yyyyMmDd) return "";

  const [yyyy, mm, dd] = yyyyMmDd.split("-");
  return [yyyy, mm, dd].join(separator);
}

/**
 * ✅ 화면 표시용 한글 날짜 포맷
 * 예: 2026년 03월 15일
 */
export function formatDisplayDateKorean(input) {
  const yyyyMmDd = normalizeDateInputToYYYYMMDD(input);
  if (!yyyyMmDd) return "";

  const [yyyy, mm, dd] = yyyyMmDd.split("-");
  return `${yyyy}년 ${mm}월 ${dd}일`;
}

/**
 * ✅ 주간 범위 라벨
 * 예: 2026.03.15 ~ 2026.03.21
 */
export function formatWeekRangeLabel(weekStartDate) {
  const start = toWeekStartDateYYYYMMDD(weekStartDate);
  if (!start) return "";

  const end = addDays(start, 6);
  if (!end) return "";

  return `${formatDisplayDate(start)} ~ ${formatDisplayDate(end)}`;
}

/**
 * ✅ 주간 제목 라벨
 * 예: 2026년 03월 15일 주간
 */
export function formatWeekTitle(weekStartDate) {
  const start = toWeekStartDateYYYYMMDD(weekStartDate);
  if (!start) return "";

  return `${formatDisplayDateKorean(start)} 주간`;
}

/**
 * ✅ 수요일 20시 이후인지(공개 여부 UI용)
 * - "이번 주 참여자" 공개 정책용
 */
export function isSelectionPublishedNow(now = new Date()) {
  const d = new Date(now);
  if (Number.isNaN(d.getTime())) return false;

  const day = d.getDay(); // 0=일, 3=수
  const hour = d.getHours();

  return day > 3 || (day === 3 && hour >= 20);
}