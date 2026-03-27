import { apiFetch } from "./apiClient";
import { getAdminOperationsToken } from "../utils/adminSession";
import { normalizeDateInputToYYYYMMDD } from "../utils/dateUtils";

function buildAdminHeaders(extraHeaders = {}) {
  const token = getAdminOperationsToken();

  return {
    ...(token ? { "X-ADMIN-TOKEN": token } : {}),
    ...extraHeaders,
  };
}

function normalizeYn(value) {
  const v = String(value ?? "").trim().toUpperCase();
  return v === "Y" ? "Y" : "N";
}

function normalizeBoolean(value) {
  if (typeof value === "boolean") return value;

  const v = String(value ?? "").trim().toUpperCase();
  return v === "Y" || v === "TRUE" || v === "1";
}

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.applications)) return payload.applications;
  if (Array.isArray(payload?.list)) return payload.list;
  if (Array.isArray(payload?.content)) return payload.content;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeApplication(item, index = 0) {
  const applicationId =
    item?.applicationId ??
    item?.id ??
    item?.application_id ??
    item?.applicationNo ??
    null;

  const selected =
    normalizeBoolean(item?.selected) ||
    normalizeBoolean(item?.isSelected) ||
    normalizeBoolean(item?.selectedYn) ||
    normalizeBoolean(item?.winnerYn);

  const attendanceConfirmed =
    normalizeBoolean(item?.attendanceConfirmed) ||
    normalizeBoolean(item?.attendanceConfirmedYn) ||
    normalizeBoolean(item?.attendanceYn) ||
    normalizeBoolean(item?.attended);

  return {
    key: applicationId ?? `application-${index}`,
    applicationId,
    weekStartDate: normalizeDateInputToYYYYMMDD(
      item?.weekStartDate ?? item?.week_start_date ?? ""
    ),
    slot: normalizeText(item?.slot ?? item?.timeSlot ?? item?.preferredSlot),
    dept: normalizeText(item?.dept ?? item?.department ?? item?.groupName),
    name: normalizeText(item?.name ?? item?.applicantName ?? item?.userName),
    phone: normalizeText(item?.phone ?? item?.phoneNumber ?? item?.mobile),
    personKey: normalizeText(item?.personKey ?? item?.person_key),
    appliedAt: normalizeText(
      item?.appliedAt ??
        item?.createdAt ??
        item?.requestedAt ??
        item?.registeredAt
    ),
    selected,
    selectedYn: normalizeYn(selected ? "Y" : "N"),
    attendanceConfirmed,
    attendanceConfirmedYn: normalizeYn(attendanceConfirmed ? "Y" : "N"),
    raw: item,
  };
}

function buildWeekParams(weekStartDate) {
  const normalized = normalizeDateInputToYYYYMMDD(weekStartDate);
  return normalized ? { weekStartDate: normalized } : undefined;
}

export async function getAdminApplications({ weekStartDate, signal } = {}) {
  const data = await apiFetch("/api/admin/applications", {
    method: "GET",
    headers: buildAdminHeaders(),
    params: buildWeekParams(weekStartDate),
    signal,
  });

  return extractArray(data).map(normalizeApplication);
}

export async function getAdminSelectedApplications({
  weekStartDate,
  signal,
} = {}) {
  const data = await apiFetch("/api/admin/applications/selected", {
    method: "GET",
    headers: buildAdminHeaders(),
    params: buildWeekParams(weekStartDate),
    signal,
  });

  return extractArray(data).map(normalizeApplication);
}

export async function runAdminSelection({
  weekStartDate,
  size,
  signal,
} = {}) {
  const params = {
    ...(buildWeekParams(weekStartDate) || {}),
  };

  if (size !== undefined && size !== null && String(size).trim() !== "") {
    params.size = Number(size);
  }

  return apiFetch("/api/admin/applications/select", {
    method: "POST",
    headers: buildAdminHeaders(),
    params,
    signal,
  });
}