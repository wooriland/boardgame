import { getCurrentWeekStartDate, toWeekStartDateYYYYMMDD } from "./dateUtils";

export const BOARD_COMMENT_WINDOW_STORAGE_KEY =
  "wooriland-board-comment-window-map";

function getStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function normalizeDateTimeLocalValue(value) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const normalized = raw.replace(" ", "T");
  const parsed = new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return normalized.slice(0, 16);
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function normalizeWeekStartDate(weekStartDate) {
  return (
    toWeekStartDateYYYYMMDD(weekStartDate) ??
    toWeekStartDateYYYYMMDD(getCurrentWeekStartDate()) ??
    ""
  );
}

function normalizeCommentWindow(payload = {}, fallbackWeekStartDate) {
  const weekStartDate = normalizeWeekStartDate(
    payload.weekStartDate ?? fallbackWeekStartDate
  );

  if (!weekStartDate) return null;

  return {
    weekStartDate,
    targetType: String(payload.targetType ?? "FINAL_PARTICIPANTS").trim() || "FINAL_PARTICIPANTS",
    startAt: normalizeDateTimeLocalValue(payload.startAt),
    endAt: normalizeDateTimeLocalValue(payload.endAt),
    updatedAt: String(payload.updatedAt ?? "").trim(),
  };
}

function readCommentWindowMap() {
  const storage = getStorage();
  if (!storage) return {};

  try {
    const raw = storage.getItem(BOARD_COMMENT_WINDOW_STORAGE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeCommentWindowMap(nextMap) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      BOARD_COMMENT_WINDOW_STORAGE_KEY,
      JSON.stringify(nextMap ?? {})
    );
  } catch {
    //
  }
}

export function getStoredBoardCommentWindow(weekStartDate = getCurrentWeekStartDate()) {
  const normalizedWeek = normalizeWeekStartDate(weekStartDate);
  if (!normalizedWeek) return null;

  const map = readCommentWindowMap();
  return normalizeCommentWindow(map?.[normalizedWeek], normalizedWeek);
}

export function saveBoardCommentWindow(payload = {}) {
  const normalized = normalizeCommentWindow(payload);
  if (!normalized) return null;

  const nextMap = {
    ...readCommentWindowMap(),
    [normalized.weekStartDate]: normalized,
  };

  writeCommentWindowMap(nextMap);
  return normalized;
}

export function clearBoardCommentWindow(weekStartDate = getCurrentWeekStartDate()) {
  const normalizedWeek = normalizeWeekStartDate(weekStartDate);
  if (!normalizedWeek) return;

  const nextMap = { ...readCommentWindowMap() };
  delete nextMap[normalizedWeek];
  writeCommentWindowMap(nextMap);
}

export function resolveBoardCommentWindowStatus(window, now = new Date()) {
  const normalized = normalizeCommentWindow(window);

  if (!normalized?.startAt || !normalized?.endAt) {
    return { key: "inactive", label: "비활성" };
  }

  const startAt = new Date(normalized.startAt);
  const endAt = new Date(normalized.endAt);
  const current = new Date(now);

  if (
    Number.isNaN(startAt.getTime()) ||
    Number.isNaN(endAt.getTime()) ||
    Number.isNaN(current.getTime())
  ) {
    return { key: "inactive", label: "비활성" };
  }

  if (current < startAt) {
    return { key: "scheduled", label: "예약됨" };
  }

  if (current > endAt) {
    return { key: "expired", label: "종료" };
  }

  return { key: "active", label: "활성" };
}

function formatDateTimeLabel(value, short = false) {
  const normalized = normalizeDateTimeLocalValue(value);
  if (!normalized) return "";

  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return normalized.replace("T", " ");
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  if (short) {
    return `${month}.${day} ${hours}:${minutes}`;
  }

  const year = date.getFullYear();
  return `${year}.${month}.${day} ${hours}:${minutes}`;
}

export function formatBoardCommentWindowRange(window, options = {}) {
  const normalized = normalizeCommentWindow(window);
  if (!normalized?.startAt || !normalized?.endAt) {
    return "미설정";
  }

  const short = Boolean(options.short);
  return `${formatDateTimeLabel(normalized.startAt, short)} ~ ${formatDateTimeLabel(
    normalized.endAt,
    short
  )}`;
}
