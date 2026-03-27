// ✅ 파일: src/utils/responsive.js
// 목적:
// - 뷰포트(모바일/데스크탑) 판단 및 변경 감지 유틸
// - window가 없는 환경(SSR/테스트)에서도 안전하게 동작
// - matchMedia 지원 여부까지 방어
// - Safari 구버전(addListener/removeListener)까지 호환
// - ✅ 원통 UX 구현에 유용한: viewport size, 모바일 상태 훅 제공

import { useEffect, useMemo, useState } from "react";

export const MOBILE_MEDIA_QUERY = "(max-width: 768px)";

/** ✅ window / matchMedia 존재 여부 */
function canUseMatchMedia() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

/** ✅ window 존재 여부 */
function canUseWindow() {
  return typeof window !== "undefined";
}

/**
 * ✅ 현재 뷰포트가 모바일인가?
 * - 가장 간단한 분기용
 * - SSR/테스트에서는 기본값을 fallback으로 제어 가능
 *
 * @param {string} query
 * @param {{ fallback?: boolean }} options
 */
export function isMobileViewport(query = MOBILE_MEDIA_QUERY, options = {}) {
  const { fallback = false } = options;
  if (!canUseMatchMedia()) return !!fallback;
  return window.matchMedia(query).matches;
}

/**
 * ✅ matchMedia 객체를 가져오기
 * - resize/change 이벤트를 걸고 싶을 때 사용
 */
export function getViewportMql(query = MOBILE_MEDIA_QUERY) {
  if (!canUseMatchMedia()) return null;
  return window.matchMedia(query);
}

/**
 * ✅ matchMedia change 이벤트 등록/해제 래퍼
 * - Safari 구버전(addListener/removeListener)까지 호환
 *
 * @param {(isMobile:boolean)=>void} callback
 * @param {string} query
 * @param {{ fireImmediately?: boolean, fallback?: boolean }} options
 */
export function onViewportChange(callback, query = MOBILE_MEDIA_QUERY, options = {}) {
  const { fireImmediately = false, fallback = false } = options;

  const mql = getViewportMql(query);
  if (!mql) {
    if (fireImmediately) {
      try {
        callback(!!fallback);
      } catch (err) {
        console.error("[responsive] callback error:", err);
      }
    }
    return () => {};
  }

  const safeCall = (value) => {
    try {
      callback(!!value);
    } catch (err) {
      console.error("[responsive] callback error:", err);
    }
  };

  const handler = (e) => safeCall(e.matches);

  if (fireImmediately) safeCall(mql.matches);

  // 최신 브라우저
  if (typeof mql.addEventListener === "function") {
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }

  // Safari 구버전
  if (typeof mql.addListener === "function") {
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }

  return () => {};
}

/**
 * ✅ 뷰포트 크기 가져오기 (원통 UX에서 radius/perspective 계산에 유용)
 * - SSR 안전: fallbackWidth/Height 사용
 * - iOS 주소창/하단바로 innerHeight가 흔들릴 수 있어 visualViewport 우선 옵션 제공
 *
 * @param {{
 *   fallbackWidth?: number,
 *   fallbackHeight?: number,
 *   preferVisualViewport?: boolean
 * }} options
 */
export function getViewportSize(options = {}) {
  const {
    fallbackWidth = 1200,
    fallbackHeight = 800,
    preferVisualViewport = true,
  } = options;

  if (!canUseWindow()) {
    return { width: fallbackWidth, height: fallbackHeight };
  }

  // ✅ iOS Safari에서 실제 보이는 영역은 visualViewport가 더 정확할 때가 있음
  const vv = preferVisualViewport ? window.visualViewport : null;

  const width =
    (vv && vv.width) ||
    window.innerWidth ||
    document.documentElement?.clientWidth ||
    fallbackWidth;

  const height =
    (vv && vv.height) ||
    window.innerHeight ||
    document.documentElement?.clientHeight ||
    fallbackHeight;

  return { width, height };
}

/**
 * ✅ React 훅: 모바일 여부를 상태로 추적
 * - matchMedia change 기반이라 효율적
 */
export function useIsMobileViewport(query = MOBILE_MEDIA_QUERY, options = {}) {
  const { fallback = false } = options;

  const initial = useMemo(
    () => isMobileViewport(query, { fallback }),
    [query, fallback]
  );

  const [isMobile, setIsMobile] = useState(initial);

  useEffect(() => {
    return onViewportChange(setIsMobile, query, {
      fireImmediately: true,
      fallback,
    });
  }, [query, fallback]);

  return isMobile;
}