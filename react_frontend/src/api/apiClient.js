const RAW_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = (RAW_BASE_URL || "").replace(/\/+$/, "");

/**
 * Date / string / array 파라미터를 API용 문자열로 안전하게 변환
 */
function toDateOnly(value) {
  if (value instanceof Date) {
    const yyyy = value.getFullYear();
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const dd = String(value.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  if (typeof value === "string") {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
    return value;
  }

  return String(value);
}

/**
 * query string 생성
 */
function toQueryString(params) {
  if (!params) return "";

  const usp = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null) return;
        usp.append(key, toDateOnly(item));
      });
      return;
    }

    usp.append(key, toDateOnly(value));
  });

  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Headers 객체를 일반 object로 변환
 */
function headersToObject(headers) {
  const result = {};
  headers.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

/**
 * 헤더 존재 여부를 대소문자 구분 없이 확인
 */
function hasHeader(headers, headerName) {
  const target = String(headerName || "").toLowerCase();
  return Object.keys(headers).some((key) => key.toLowerCase() === target);
}

/**
 * 서버 JSON 에러에서 message 후보 추출
 */
function extractMessageFromBody(body) {
  if (!body) return "";

  if (typeof body === "string") {
    return body.trim();
  }

  if (typeof body !== "object") {
    return "";
  }

  if (typeof body.message === "string" && body.message.trim()) {
    return body.message.trim();
  }

  if (typeof body.error === "string" && body.error.trim()) {
    return body.error.trim();
  }

  if (typeof body.detail === "string" && body.detail.trim()) {
    return body.detail.trim();
  }

  if (typeof body.reason === "string" && body.reason.trim()) {
    return body.reason.trim();
  }

  if (Array.isArray(body.errors) && body.errors.length > 0) {
    const first = body.errors[0];

    if (typeof first === "string" && first.trim()) {
      return first.trim();
    }

    if (
      first &&
      typeof first === "object" &&
      typeof first.message === "string" &&
      first.message.trim()
    ) {
      return first.message.trim();
    }
  }

  return "";
}

/**
 * 공통 에러 메시지 선택
 */
function buildErrorMessage(status, statusText, parsedJson, text) {
  const bodyMessage = extractMessageFromBody(parsedJson);
  if (bodyMessage) return bodyMessage;

  const textMessage = typeof text === "string" ? text.trim() : "";
  if (textMessage) return textMessage;

  if (status === 400) return "잘못된 요청입니다.";
  if (status === 401) return "인증이 필요합니다.";
  if (status === 403) return "권한이 없습니다.";
  if (status === 404) return "요청한 대상을 찾을 수 없습니다.";
  if (status === 409) return "중복된 요청입니다.";
  if (status >= 500) return "서버 처리 중 오류가 발생했습니다.";

  return `HTTP ${status} ${statusText}`;
}

/**
 * 외부 화면에서 쓰기 좋은 에러 메시지 추출 헬퍼
 */
export function getApiErrorMessage(
  error,
  fallback = "요청 처리 중 오류가 발생했습니다."
) {
  if (!error) return fallback;

  if (typeof error.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  if (error.body) {
    const bodyMessage = extractMessageFromBody(error.body);
    if (bodyMessage) return bodyMessage;
  }

  if (typeof error.bodyText === "string" && error.bodyText.trim()) {
    return error.bodyText.trim();
  }

  return fallback;
}

/**
 * fetch 공통 래퍼
 *
 * 지원:
 * - params: query string
 * - body 또는 data: 요청 body
 * - withMeta: status / headers / url 같이 받기
 * - 커스텀 headers 전달
 */
export async function apiFetch(
  path,
  {
    method = "GET",
    headers = {},
    body,
    data,
    params,
    signal,
    withMeta = false,
  } = {}
) {
  if (!BASE_URL) {
    throw new Error(
      "VITE_API_BASE_URL is not set. Check your .env / .env.production"
    );
  }

  const qs = toQueryString(params);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${BASE_URL}${normalizedPath}${qs}`;

  let requestBody = body;
  if (requestBody === undefined && data !== undefined) {
    requestBody = data;
  }

  const finalHeaders = {
    Accept: "application/json",
    ...headers,
  };

  const hasBody = requestBody !== undefined && requestBody !== null;
  let finalBody = requestBody;

  if (
    hasBody &&
    typeof requestBody === "object" &&
    !(requestBody instanceof FormData)
  ) {
    finalBody = JSON.stringify(requestBody);

    if (!hasHeader(finalHeaders, "Content-Type")) {
      finalHeaders["Content-Type"] = "application/json";
    }
  }

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: hasBody ? finalBody : undefined,
    signal,
  });

  const responseHeaders = headersToObject(res.headers);
  const contentType = res.headers.get("content-type") || "";

  if (!res.ok) {
    let parsedJson = null;
    let text = "";

    try {
      if (contentType.includes("application/json")) {
        parsedJson = await res.json();
      } else {
        text = await res.text();
      }
    } catch {
      try {
        text = await res.text();
      } catch {
        text = "";
      }
    }

    const message = buildErrorMessage(
      res.status,
      res.statusText,
      parsedJson,
      text
    );

    const err = new Error(message);
    err.name = "ApiError";
    err.status = res.status;
    err.statusText = res.statusText;
    err.body = parsedJson;
    err.bodyText = text;
    err.url = url;
    err.headers = responseHeaders;
    err.httpMessage = `HTTP ${res.status} ${res.statusText}`;
    throw err;
  }

  let parsedBody = null;

  if (res.status !== 204 && contentType.includes("application/json")) {
    parsedBody = await res.json();
  }

  if (withMeta) {
    return {
      data: parsedBody,
      status: res.status,
      headers: responseHeaders,
      url,
    };
  }

  return parsedBody;
}

export const api = {
  get: (path, options = {}) => apiFetch(path, { ...options, method: "GET" }),

  post: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: "POST", body }),

  put: (path, body, options = {}) =>
    apiFetch(path, { ...options, method: "PUT", body }),

  del: (path, options = {}) => apiFetch(path, { ...options, method: "DELETE" }),

  delete: (path, options = {}) =>
    apiFetch(path, { ...options, method: "DELETE" }),
};