// ✅ 파일: src/api/weeklySelectionApi.js
import { apiFetch } from "./apiClient";
import { toWeekStartDateYYYYMMDD } from "../utils/dateUtils";

/**
 * ✅ slot 정규화/검증
 * - 허용: EASY | NORMAL | HARD (대소문자 무관)
 */
export function normalizeSlot(slot) {
  if (!slot) return null;
  const s = String(slot).trim().toUpperCase();
  if (s === "EASY" || s === "NORMAL" || s === "HARD") return s;
  return null;
}

/**
 * ✅ 내부 공용: weekStartDate를 "일요일 기준 YYYY-MM-DD"로 강제
 */
function requireWeekStartDate(weekStartDate) {
  const w = toWeekStartDateYYYYMMDD(weekStartDate);
  if (!w) {
    throw new Error(
      `weekStartDate is required. (예: YYYY-MM-DD) 받은 값: ${String(
        weekStartDate
      )}`
    );
  }
  return w;
}

function requireSlot(slot) {
  const s = normalizeSlot(slot);
  if (!s) {
    throw new Error(
      `slot is invalid. allowed: EASY | NORMAL | HARD. 받은 값: ${String(slot)}`
    );
  }
  return s;
}

// ---------------------------------------------------------
// ✅ fallback / primitive helpers
// ---------------------------------------------------------

function toSafeString(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function toSafeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toSafeBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

/**
 * ✅ 통계 응답 기본 형태
 * - 백엔드 응답이 비었거나 일부 필드가 빠져도
 *   프론트 전체가 항상 같은 형태를 받도록 보장
 */
function createWeeklySelectionStatsFallback(weekStartDate = "") {
  return {
    weekStartDate: weekStartDate || "",
    bySlot: {
      EASY: [],
      NORMAL: [],
      HARD: [],
    },
    overallByDept: [],
    overallTotal: 0,
    countRule: "",
    excludeOperator: false,
    includeWaitlist: false,
  };
}

// ---------------------------------------------------------
// ✅ 응답 정규화 helpers
// ---------------------------------------------------------

function normalizeDeptCountRow(row) {
  return {
    dept: toSafeString(row?.dept).trim(),
    count: toSafeNumber(row?.count, 0),
  };
}

function normalizeDeptCountList(list) {
  if (!Array.isArray(list)) return [];
  return list
    .map(normalizeDeptCountRow)
    .filter((row) => row.dept && row.count >= 0);
}

function normalizeBySlot(bySlot) {
  const src = bySlot && typeof bySlot === "object" ? bySlot : {};

  return {
    EASY: normalizeDeptCountList(src.EASY),
    NORMAL: normalizeDeptCountList(src.NORMAL),
    HARD: normalizeDeptCountList(src.HARD),
  };
}

function isArrayWithItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasDeclaredSlotArray(container) {
  return Boolean(
    Array.isArray(container?.EASY) ||
      Array.isArray(container?.easy) ||
      Array.isArray(container?.NORMAL) ||
      Array.isArray(container?.normal) ||
      Array.isArray(container?.HARD) ||
      Array.isArray(container?.hard)
  );
}

function pickPreferredSlotArray(upperValue, lowerValue) {
  if (isArrayWithItems(upperValue)) return upperValue;
  if (isArrayWithItems(lowerValue)) return lowerValue;
  if (Array.isArray(upperValue)) return upperValue;
  if (Array.isArray(lowerValue)) return lowerValue;
  return [];
}

export function extractWeeklySelectionSlotMap(payload) {
  const p = payload?.data ?? payload;

  const candidates = [p?.bySlot, p?.slots, p?.selection, p?.result, p];
  let fallback = null;

  for (const candidate of candidates) {
    if (!candidate || typeof candidate !== "object") continue;

    const slotMap = {
      EASY: pickPreferredSlotArray(candidate?.EASY, candidate?.easy),
      NORMAL: pickPreferredSlotArray(candidate?.NORMAL, candidate?.normal),
      HARD: pickPreferredSlotArray(candidate?.HARD, candidate?.hard),
    };

    const hasAnyItems =
      slotMap.EASY.length > 0 ||
      slotMap.NORMAL.length > 0 ||
      slotMap.HARD.length > 0;

    if (hasAnyItems) {
      return slotMap;
    }

    if (!fallback && hasDeclaredSlotArray(candidate)) {
      fallback = slotMap;
    }
  }

  return fallback || { EASY: [], NORMAL: [], HARD: [] };
}

/**
 * ✅ 주간 선정 결과 전체 조회 응답 정규화
 * - 선정 결과 자체는 백엔드 원형을 최대한 유지
 * - 다만 최소한의 안전장치로 null/undefined 방어만 수행
 */
function normalizeWeeklySelectionResponse(data, fallbackWeekStartDate = "") {
  if (!data || typeof data !== "object") {
    return {
      weekStartDate: fallbackWeekStartDate || "",
      EASY: [],
      NORMAL: [],
      HARD: [],
    };
  }

  const slotMap = extractWeeklySelectionSlotMap(data);

  return {
    ...data,
    weekStartDate: toSafeString(
      data.weekStartDate,
      fallbackWeekStartDate || ""
    ),
    EASY: slotMap.EASY,
    NORMAL: slotMap.NORMAL,
    HARD: slotMap.HARD,
  };
}

/**
 * ✅ 슬롯별 선정 결과 조회 응답 정규화
 * - slot 결과가 배열일 수도 있고,
 *   { slot, items } 같은 객체일 수도 있으므로 최대한 안전하게 처리
 */
function normalizeWeeklySelectionBySlotResponse(
  data,
  slot,
  fallbackWeekStartDate = ""
) {
  const s = normalizeSlot(slot);

  if (Array.isArray(data)) {
    return {
      slot: s,
      weekStartDate: fallbackWeekStartDate || "",
      items: data,
    };
  }

  if (!data || typeof data !== "object") {
    return {
      slot: s,
      weekStartDate: fallbackWeekStartDate || "",
      items: [],
    };
  }

  const items = Array.isArray(data.items)
    ? data.items
    : Array.isArray(data[s])
    ? data[s]
    : [];

  return {
    ...data,
    slot: toSafeString(data.slot || s, s),
    weekStartDate: toSafeString(
      data.weekStartDate,
      fallbackWeekStartDate || ""
    ),
    items,
  };
}

/**
 * ✅ 부서별 선정 통계 응답 정규화
 *
 * 기대 응답 구조:
 * {
 *   weekStartDate,
 *   bySlot: { EASY, NORMAL, HARD },
 *   overallByDept: [],
 *   overallTotal: 0,
 *   countRule,
 *   excludeOperator,
 *   includeWaitlist
 * }
 */
function normalizeWeeklySelectionStatsResponse(data, fallbackWeekStartDate = "") {
  const base = createWeeklySelectionStatsFallback(fallbackWeekStartDate);

  if (!data || typeof data !== "object") {
    return base;
  }

  return {
    weekStartDate: toSafeString(
      data.weekStartDate,
      fallbackWeekStartDate || ""
    ),
    bySlot: normalizeBySlot(data.bySlot),
    overallByDept: normalizeDeptCountList(data.overallByDept),
    overallTotal: toSafeNumber(data.overallTotal, 0),
    countRule: toSafeString(data.countRule, ""),
    excludeOperator: toSafeBoolean(data.excludeOperator, false),
    includeWaitlist: toSafeBoolean(data.includeWaitlist, false),
  };
}

// ---------------------------------------------------------
// ✅ API Contracts
// ---------------------------------------------------------

/**
 * ✅ 주간 선정 결과 전체 조회 (EASY/NORMAL/HARD 그룹)
 * GET /api/weekly/selection?weekStartDate=YYYY-MM-DD
 */
export async function getWeeklySelection(weekStartDate) {
  const w = requireWeekStartDate(weekStartDate);

  const data = await apiFetch("/api/weekly/selection", {
    method: "GET",
    params: { weekStartDate: w },
  });

  return normalizeWeeklySelectionResponse(data, w);
}

/**
 * ✅ 슬롯별 선정 결과 조회
 * GET /api/weekly/selection/{slot}?weekStartDate=YYYY-MM-DD
 */
export async function getWeeklySelectionBySlot(slot, weekStartDate) {
  const s = requireSlot(slot);
  const w = requireWeekStartDate(weekStartDate);

  const data = await apiFetch(`/api/weekly/selection/${s}`, {
    method: "GET",
    params: { weekStartDate: w },
  });

  return normalizeWeeklySelectionBySlotResponse(data, s, w);
}

/**
 * ✅ 부서별 선정 통계
 * GET /api/weekly/selection/stats?weekStartDate=YYYY-MM-DD
 *
 * 정규화 후 반환 구조:
 * {
 *   weekStartDate,
 *   bySlot: { EASY, NORMAL, HARD },
 *   overallByDept: [],
 *   overallTotal: 0,
 *   countRule: "",
 *   excludeOperator: false,
 *   includeWaitlist: false
 * }
 */
export async function getWeeklySelectionStats(weekStartDate) {
  const w = requireWeekStartDate(weekStartDate);

  const data = await apiFetch("/api/weekly/selection/stats", {
    method: "GET",
    params: { weekStartDate: w },
  });

  return normalizeWeeklySelectionStatsResponse(data, w);
}

/**
 * ✅ 외부에서 fallback이 필요할 때 사용할 수 있도록 export
 * - 화면에서 API 실패 시 임시 기본값으로 사용 가능
 */
export function getWeeklySelectionStatsFallback(weekStartDate) {
  const w = toWeekStartDateYYYYMMDD(weekStartDate) || "";
  return createWeeklySelectionStatsFallback(w);
}
