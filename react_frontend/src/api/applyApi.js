// ✅ 파일: src/api/applyApi.js
import { apiFetch } from "./apiClient";

/** ✅ GET /api/apply/options */
export function getApplyOptions() {
  return apiFetch("/api/apply/options");
}

/** ✅ POST /api/applications */
export function postApplication(payload) {
  return apiFetch("/api/applications", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}