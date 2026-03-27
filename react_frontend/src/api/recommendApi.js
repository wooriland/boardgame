// ✅ 파일: src/api/recommendApi.js
import { apiFetch } from "./apiClient";

/**
 * ✅ 금주의 보드게임 추천
 * - GET /api/recommend/weekly
 * - apiFetch가 공통으로 baseURL/에러처리를 담당한다고 가정
 */
export async function getWeeklyRecommend() {
  // apiFetch가 JSON을 return 하든, { data } 형태로 return 하든
  // 호출부(WeeklyPreviewSection)에서 안전하게 처리할 수 있게
  // 여기서는 "그대로" 반환한다.
  return await apiFetch("/api/recommend/weekly");
}