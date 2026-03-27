import { apiFetch } from "./apiClient";
import { getAdminOperationsToken } from "../utils/adminSession";
import { normalizeDateInputToYYYYMMDD } from "../utils/dateUtils";

const SELECTED_ENDPOINT = "/api/admin/selection/candidates";
const ATTENDANCE_ENDPOINT = "/api/admin/attendance";
const WALK_IN_ENDPOINT = "/api/admin/attendance/walk-in";

function buildAdminHeaders(extraHeaders = {}, adminToken) {
  const token = String(adminToken ?? getAdminOperationsToken() ?? "").trim();

  return {
    ...(token ? { "X-ADMIN-TOKEN": token } : {}),
    ...extraHeaders,
  };
}

function normalizeYn(value) {
  const v = String(value ?? "").trim().toUpperCase();
  return v === "Y" ? "Y" : "N";
}

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.attendanceList)) return payload.attendanceList;
  if (Array.isArray(payload?.attendance)) return payload.attendance;
  if (Array.isArray(payload?.selectedList)) return payload.selectedList;
  if (Array.isArray(payload?.selected)) return payload.selected;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;

  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data?.list)) return payload.data.list;
  if (Array.isArray(payload?.data?.content)) return payload.data.content;
  if (Array.isArray(payload?.data?.selected)) return payload.data.selected;
  if (Array.isArray(payload?.data?.attendance)) return payload.data.attendance;

  if (Array.isArray(payload?.result?.items)) return payload.result.items;
  if (Array.isArray(payload?.result?.list)) return payload.result.list;
  if (Array.isArray(payload?.result?.content)) return payload.result.content;

  return [];
}

function normalizeText(value) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

function normalizePhoneDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function formatPhone(value) {
  const digits = normalizePhoneDigits(value);

  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }

  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  return normalizeText(value);
}

function buildPersonKey(dept, name, phone) {
  return [
    normalizeText(dept).toUpperCase(),
    normalizeText(name).toUpperCase(),
    normalizePhoneDigits(phone),
  ].join("|");
}

function normalizeSlot(value) {
  return normalizeText(value ?? "");
}

function normalizeSelectedSlots(value) {
  if (Array.isArray(value)) {
    return value
      .map((slot) => normalizeText(slot).toUpperCase())
      .filter(Boolean);
  }

  const text = normalizeText(value);
  return text ? [text.toUpperCase()] : [];
}

function normalizeSelectedItem(item, index = 0) {
  const applicationId =
    item?.applicationId ??
    item?.id ??
    item?.applyId ??
    item?.application_id ??
    null;

  const dept = normalizeText(
    item?.dept ?? item?.department ?? item?.departmentName
  );
  const name = normalizeText(
    item?.name ?? item?.applicantName ?? item?.userName
  );
  const phone = formatPhone(
    item?.phone ?? item?.phoneNumber ?? item?.mobile ?? item?.contact
  );

  const selectedSlots = normalizeSelectedSlots(
    item?.selectedSlots ?? item?.timeSlots ?? item?.slots ?? item?.slot
  );

  return {
    key: item?.personKey || applicationId || `selected-${index}`,
    applicationId,
    weekStartDate: normalizeDateInputToYYYYMMDD(
      item?.weekStartDate ?? item?.week_start_date ?? ""
    ),
    slot: selectedSlots.join(", "),
    selectedSlots,
    dept,
    name,
    phone,
    personKey:
      normalizeText(item?.personKey) || buildPersonKey(dept, name, phone),
    difficulty: selectedSlots.join(", "),
    applicationStatus: normalizeText(
      item?.status ?? item?.applicationStatus ?? item?.state ?? "SELECTED"
    ),
    entrySource: normalizeText(item?.entrySource ?? "AUTO"),
    confirmed: Boolean(item?.confirmed),
    alreadyAttendance: Boolean(item?.confirmed),
    raw: item,
  };
}

function normalizeAttendanceItem(item, index = 0) {
  const attendanceId =
    item?.attendanceId ??
    item?.id ??
    item?.attendance_id ??
    item?.checkId ??
    null;

  const dept = normalizeText(item?.dept ?? item?.department);
  const name = normalizeText(
    item?.name ?? item?.attendeeName ?? item?.userName
  );
  const phone = formatPhone(
    item?.phone ?? item?.phoneNumber ?? item?.mobile ?? item?.contact
  );

  return {
    key: item?.personKey || attendanceId || `attendance-${index}`,
    attendanceId,
    applicationId: item?.applicationId ?? item?.application_id ?? null,
    weekStartDate: normalizeDateInputToYYYYMMDD(
      item?.weekStartDate ?? item?.week_start_date ?? ""
    ),
    slot: normalizeSlot(item?.slot ?? item?.timeSlot),
    dept,
    name,
    phone,
    personKey:
      normalizeText(item?.personKey) || buildPersonKey(dept, name, phone),
    entrySource: normalizeText(
      item?.entrySource ?? item?.source ?? item?.selectionType ?? "APPLICATION"
    ),
    commentAllowedYn: normalizeYn(
      item?.commentAllowedYn ??
        item?.comment_allowed_yn ??
        item?.canCommentYn ??
        "Y"
    ),
    checkedAt: normalizeText(
      item?.checkedAt ?? item?.createdAt ?? item?.confirmedAt
    ),
    raw: item,
  };
}

function mergeParticipantItem(existing, next) {
  const existingSelectedSlots = Array.isArray(existing.selectedSlots)
    ? existing.selectedSlots
    : [];
  const nextSelectedSlots = Array.isArray(next.selectedSlots)
    ? next.selectedSlots
    : [];

  const mergedSelectedSlots = Array.from(
    new Set([...existingSelectedSlots, ...nextSelectedSlots].filter(Boolean))
  );

  return {
    ...existing,
    ...next,
    dept: next.dept || existing.dept,
    name: next.name || existing.name,
    phone: next.phone || existing.phone,
    slot: mergedSelectedSlots.length
      ? mergedSelectedSlots.join(", ")
      : next.slot || existing.slot,
    selectedSlots: mergedSelectedSlots,
    difficulty:
      mergedSelectedSlots.length
        ? mergedSelectedSlots.join(", ")
        : next.difficulty || existing.difficulty,
    applicationStatus: next.applicationStatus || existing.applicationStatus,
    entrySource: next.entrySource || existing.entrySource,
    checkedAt: next.checkedAt || existing.checkedAt,
    alreadyAttendance:
      next.alreadyAttendance === true || existing.alreadyAttendance === true,
    confirmed: next.confirmed === true || existing.confirmed === true,
    commentAllowedYn:
      next.commentAllowedYn === "Y" || existing.commentAllowedYn === "Y"
        ? "Y"
        : next.commentAllowedYn || existing.commentAllowedYn || "N",
  };
}

function dedupeParticipants(items) {
  const map = new Map();

  items.forEach((item) => {
    const key = item?.personKey || item?.key;

    if (!key) return;

    if (!map.has(key)) {
      map.set(key, item);
      return;
    }

    const existing = map.get(key);
    map.set(key, mergeParticipantItem(existing, item));
  });

  return Array.from(map.values()).sort((a, b) => {
    const deptCompare = String(a.dept ?? "").localeCompare(
      String(b.dept ?? ""),
      "ko"
    );
    if (deptCompare !== 0) return deptCompare;

    return String(a.name ?? "").localeCompare(String(b.name ?? ""), "ko");
  });
}

function buildWeekParams(weekStartDate) {
  const normalized = normalizeDateInputToYYYYMMDD(weekStartDate);
  return normalized ? { weekStartDate: normalized } : undefined;
}

export async function getAdminSelectedParticipants({
  weekStartDate,
  adminToken,
  signal,
} = {}) {
  const data = await apiFetch(SELECTED_ENDPOINT, {
    method: "GET",
    headers: buildAdminHeaders({}, adminToken),
    params: buildWeekParams(weekStartDate),
    signal,
  });

  const extracted = extractArray(data);
  const normalized = extracted.map(normalizeSelectedItem);
  const deduped = dedupeParticipants(normalized);

  console.log("[adminAttendanceApi] selected raw =", data);
  console.log("[adminAttendanceApi] selected extracted =", extracted);
  console.log("[adminAttendanceApi] selected counts =", {
    extracted: extracted.length,
    normalized: normalized.length,
    deduped: deduped.length,
    weekStartDate: buildWeekParams(weekStartDate)?.weekStartDate ?? "",
  });

  return deduped;
}

export async function getAdminAttendanceList({
  weekStartDate,
  adminToken,
  signal,
} = {}) {
  const data = await apiFetch(ATTENDANCE_ENDPOINT, {
    method: "GET",
    headers: buildAdminHeaders({}, adminToken),
    params: buildWeekParams(weekStartDate),
    signal,
  });

  const extracted = extractArray(data);
  const normalized = extracted.map(normalizeAttendanceItem);
  const deduped = dedupeParticipants(normalized);

  console.log("[adminAttendanceApi] attendance raw =", data);
  console.log("[adminAttendanceApi] attendance extracted =", extracted);
  console.log("[adminAttendanceApi] attendance counts =", {
    extracted: extracted.length,
    normalized: normalized.length,
    deduped: deduped.length,
    weekStartDate: buildWeekParams(weekStartDate)?.weekStartDate ?? "",
  });

  return deduped;
}

export async function confirmApplicationAttendance(
  applicationId,
  { adminToken, signal } = {}
) {
  if (!applicationId) {
    throw new Error("applicationId가 필요합니다.");
  }

  return apiFetch(`/api/admin/applications/${applicationId}/attendance`, {
    method: "POST",
    headers: buildAdminHeaders({}, adminToken),
    signal,
  });
}

export async function createWalkInAttendance(
  payload,
  { adminToken, signal } = {}
) {
  const body = {
    weekStartDate: normalizeDateInputToYYYYMMDD(payload?.weekStartDate),
    slot: normalizeSlot(payload?.slot),
    dept: normalizeText(payload?.dept),
    name: normalizeText(payload?.name),
    phone: normalizePhoneDigits(payload?.phone),
    commentAllowedYn: normalizeYn(payload?.commentAllowedYn || "Y"),
  };

  return apiFetch(WALK_IN_ENDPOINT, {
    method: "POST",
    headers: buildAdminHeaders({}, adminToken),
    body,
    signal,
  });
}