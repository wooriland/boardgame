import { api } from "./apiClient";

export const BOARD_ADMIN_TOKEN_KEY = "wooriland-board-admin-token";
export const BOARD_SESSION_KEY = "wooriland-board-session";

const ENDPOINTS = {
  enterReadOnly: "/api/board/enter/read-only",
  enterParticipant: "/api/board/enter/participant",
  enterAdmin: "/api/board/enter/admin",

  posts: "/api/board/posts",
  postDetail: (postId) => `/api/board/posts/${postId}`,
  postView: (postId) => `/api/board/posts/${postId}/view`,

  comments: (postId) => `/api/board/posts/${postId}/comments`,
  commentDelete: (commentId) => `/api/board/comments/${commentId}`,

  postLikeToggle: (postId) => `/api/board/posts/${postId}/like`,

  createPost: "/api/board/posts",
  updatePost: (postId) => `/api/board/posts/${postId}`,
  deletePost: (postId) => `/api/board/posts/${postId}`,
};

function getStorage() {
  try {
    if (typeof window === "undefined") return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function removeEmptyValues(obj = {}) {
  const result = {};

  Object.entries(obj).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    result[key] = value;
  });

  return result;
}

function unwrapResponse(response) {
  if (response == null) return response;

  if (typeof response === "object") {
    if ("data" in response && response.data !== undefined && response.data !== null) {
      return response.data;
    }

    if ("result" in response && response.result !== undefined && response.result !== null) {
      return response.result;
    }
  }

  return response;
}

function normalizeText(value) {
  return String(value ?? "").trim();
}

function normalizeRole(role) {
  return String(role ?? "READ_ONLY").trim().toUpperCase();
}

function normalizeBoardIdentity(payload = {}) {
  return {
    dept: payload.dept ?? "",
    name: payload.name ?? "",
    phone: payload.phone ?? "",
  };
}

function normalizeBooleanLike(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "boolean") return value;

  const normalized = String(value).trim().toUpperCase();

  if (normalized === "Y" || normalized === "TRUE" || normalized === "1") {
    return true;
  }

  if (normalized === "N" || normalized === "FALSE" || normalized === "0") {
    return false;
  }

  return Boolean(value);
}

export function resolveBoardCanComment(payload = {}, fallback) {
  if (!payload || typeof payload !== "object") {
    return normalizeBooleanLike(fallback);
  }

  const candidates = [
    payload.canComment,
    payload.canWriteComment,
    payload.commentAllowed,
    payload.commentAllowedYn,
    payload.canCommentYn,
    payload.finalParticipant,
    payload.finalParticipantYn,
    payload.isFinalParticipant,
    payload.attendanceConfirmed,
    payload.attendanceConfirmedYn,
    payload.attendanceYn,
    payload.attended,
    payload.viewerCanComment,
    payload.access?.canComment,
    payload.access?.commentAllowedYn,
    payload.access?.canCommentYn,
    payload.access?.attendanceConfirmed,
    payload.access?.attendanceConfirmedYn,
    payload.access?.attendanceYn,
    payload.access?.attended,
  ];

  for (const candidate of candidates) {
    const resolved = normalizeBooleanLike(candidate);
    if (resolved !== undefined) {
      return resolved;
    }
  }

  return normalizeBooleanLike(fallback);
}

function normalizeBoardSessionResponse(payload = {}, fallback = {}) {
  const identity = normalizeBoardIdentity({
    dept: payload.dept ?? fallback.dept,
    name: payload.name ?? fallback.name,
    phone: payload.phone ?? fallback.phone,
  });

  const enteredType = normalizeRole(
    payload.enteredType ??
      payload.enter_type ??
      fallback.enteredType ??
      fallback.role ??
      "READ_ONLY"
  );

  const role = normalizeRole(
    payload.role ??
      payload.userRole ??
      payload.writerRole ??
      fallback.role ??
      enteredType
  );

  const canComment =
    resolveBoardCanComment(payload, resolveBoardCanComment(fallback)) ?? false;

  const displayName =
    normalizeText(
      payload.displayName ??
        payload.writerDisplayName ??
        fallback.displayName
    ) || normalizeText(identity.name) || "게시판 이용자";

  const adminToken = normalizeText(
    payload.adminToken ?? fallback.adminToken ?? ""
  );

  return {
    ...fallback,
    ...payload,
    ...identity,
    role,
    enteredType,
    displayName,
    canComment,
    adminToken,
  };
}

export function getStoredBoardAdminToken() {
  const storage = getStorage();
  if (!storage) return "";

  try {
    return storage.getItem(BOARD_ADMIN_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function saveBoardAdminToken(token) {
  const storage = getStorage();
  if (!storage) return;

  try {
    const normalized = String(token ?? "").trim();

    if (!normalized) {
      storage.removeItem(BOARD_ADMIN_TOKEN_KEY);
      return;
    }

    storage.setItem(BOARD_ADMIN_TOKEN_KEY, normalized);
  } catch {
    //
  }
}

export function clearBoardAdminToken() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(BOARD_ADMIN_TOKEN_KEY);
  } catch {
    //
  }
}

export function getStoredBoardSession() {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(BOARD_SESSION_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function saveBoardSession(session) {
  const storage = getStorage();
  if (!storage) return;

  try {
    if (!session || typeof session !== "object") {
      storage.removeItem(BOARD_SESSION_KEY);
      return;
    }

    storage.setItem(BOARD_SESSION_KEY, JSON.stringify(session));
  } catch {
    //
  }
}

export function clearBoardSession() {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.removeItem(BOARD_SESSION_KEY);
  } catch {
    //
  }
}

function getAdminHeaders() {
  const token = getStoredBoardAdminToken();
  return token ? { "X-ADMIN-TOKEN": token } : {};
}

function extractAdminToken(metaResponse) {
  if (!metaResponse || typeof metaResponse !== "object") return "";

  const responseBody =
    metaResponse?.data && typeof metaResponse.data === "object"
      ? unwrapResponse(metaResponse.data)
      : unwrapResponse(metaResponse);

  if (responseBody && typeof responseBody === "object") {
    const bodyToken =
      responseBody.adminToken ||
      responseBody.token ||
      responseBody.admin_token ||
      responseBody?.data?.adminToken ||
      "";

    if (bodyToken) {
      return String(bodyToken).trim();
    }
  }

  const headerToken =
    metaResponse?.headers?.["x-admin-token"] ||
    metaResponse?.headers?.["X-ADMIN-TOKEN"] ||
    "";

  return String(headerToken || "").trim();
}

export async function enterBoardReadOnly() {
  clearBoardAdminToken();

  const response = await api.post(ENDPOINTS.enterReadOnly);
  const data = unwrapResponse(response);

  const normalized = normalizeBoardSessionResponse(data, {
    role: "READ_ONLY",
    enteredType: "READ_ONLY",
    displayName: "게시판 이용자",
    canComment: false,
    adminToken: "",
  });

  saveBoardSession(normalized);
  return normalized;
}

export async function enterBoardParticipant(payload = {}) {
  clearBoardAdminToken();

  const body = normalizeBoardIdentity(payload);
  const response = await api.post(ENDPOINTS.enterParticipant, body);
  const data = unwrapResponse(response);

  const normalized = normalizeBoardSessionResponse(data, {
    ...body,
    role: "PARTICIPANT",
    enteredType: "PARTICIPANT",
    adminToken: "",
  });

  saveBoardSession(normalized);
  return normalized;
}

export async function enterBoardAdmin(payload = {}) {
  const body = normalizeBoardIdentity(payload);

  const response = await api.post(ENDPOINTS.enterAdmin, body, {
    withMeta: true,
  });

  const data =
    response?.data && typeof response.data === "object"
      ? unwrapResponse(response.data)
      : unwrapResponse(response);

  const adminToken = extractAdminToken(response);

  if (adminToken) {
    saveBoardAdminToken(adminToken);
  } else {
    clearBoardAdminToken();
  }

  const normalized = normalizeBoardSessionResponse(
    {
      ...(data && typeof data === "object" ? data : {}),
      adminToken,
    },
    {
      ...body,
      role: "ADMIN",
      enteredType: "ADMIN",
      canComment: true,
      adminToken,
    }
  );

  saveBoardSession(normalized);

  return normalized;
}

export async function enterBoard({ role, dept, name, phone } = {}) {
  const normalizedRole = normalizeRole(role);

  if (normalizedRole === "READ_ONLY") {
    return enterBoardReadOnly();
  }

  if (normalizedRole === "ADMIN") {
    return enterBoardAdmin({ dept, name, phone });
  }

  return enterBoardParticipant({ dept, name, phone });
}

export async function refreshBoardSession(session = getStoredBoardSession()) {
  if (!session || typeof session !== "object") {
    return null;
  }

  const role = normalizeRole(session.role ?? session.enteredType);

  if (role === "ADMIN") {
    return enterBoardAdmin(session);
  }

  if (role === "PARTICIPANT") {
    return enterBoardParticipant(session);
  }

  return enterBoardReadOnly();
}

export async function getBoardPosts(params = {}) {
  const query = removeEmptyValues({
    category: params.category,
    keyword: params.keyword,
    page: params.page,
    size: params.size,
    sort: params.sort,
  });

  const response = await api.get(ENDPOINTS.posts, { params: query });
  return unwrapResponse(response);
}

export async function getBoardPostDetail(postId) {
  const response = await api.get(ENDPOINTS.postDetail(postId));
  return unwrapResponse(response);
}

export async function increaseBoardPostViewCount(postId) {
  const response = await api.post(ENDPOINTS.postView(postId));
  return unwrapResponse(response);
}

export async function getBoardComments(postId) {
  const response = await api.get(ENDPOINTS.comments(postId));
  return unwrapResponse(response);
}

export async function createBoardComment(postId, payload = {}) {
  const body = {
    ...normalizeBoardIdentity(payload),
    content: payload.content ?? "",
    parentCommentId: payload.parentCommentId ?? null,
  };

  const response = await api.post(ENDPOINTS.comments(postId), body);
  return unwrapResponse(response);
}

export async function deleteBoardComment(commentId, payload = {}) {
  const body = normalizeBoardIdentity(payload);

  const response = await api.delete(ENDPOINTS.commentDelete(commentId), {
    data: body,
  });
  return unwrapResponse(response);
}

export async function toggleBoardPostLike(postId, payload = {}) {
  const body = normalizeBoardIdentity(payload);

  const response = await api.post(ENDPOINTS.postLikeToggle(postId), body);
  return unwrapResponse(response);
}

export async function createBoardPostByAdmin(payload = {}) {
  const body = {
    category: payload.category ?? "",
    title: payload.title ?? "",
    content: payload.content ?? "",
    isNotice: payload.isNotice ?? "N",
    isHot: payload.isHot ?? "N",
    writerRole: payload.writerRole ?? "ADMIN",
    writerDisplayName: payload.writerDisplayName ?? "관리자",
  };

  const response = await api.post(ENDPOINTS.createPost, body, {
    headers: getAdminHeaders(),
  });
  return unwrapResponse(response);
}

export async function updateBoardPostByAdmin(postId, payload = {}) {
  const body = {
    category: payload.category ?? "",
    title: payload.title ?? "",
    content: payload.content ?? "",
    isNotice: payload.isNotice ?? "N",
    isHot: payload.isHot ?? "N",
  };

  const response = await api.put(ENDPOINTS.updatePost(postId), body, {
    headers: getAdminHeaders(),
  });
  return unwrapResponse(response);
}

export async function deleteBoardPostByAdmin(postId) {
  const response = await api.delete(ENDPOINTS.deletePost(postId), {
    headers: getAdminHeaders(),
    data: {},
  });
  return unwrapResponse(response);
}

const boardApi = {
  enterBoardReadOnly,
  enterBoardParticipant,
  enterBoardAdmin,
  enterBoard,
  refreshBoardSession,

  getBoardPosts,
  getBoardPostDetail,
  increaseBoardPostViewCount,

  getBoardComments,
  createBoardComment,
  deleteBoardComment,

  toggleBoardPostLike,

  createBoardPostByAdmin,
  updateBoardPostByAdmin,
  deleteBoardPostByAdmin,

  getStoredBoardAdminToken,
  saveBoardAdminToken,
  clearBoardAdminToken,

  getStoredBoardSession,
  saveBoardSession,
  clearBoardSession,

  resolveBoardCanComment,
};

export default boardApi;
