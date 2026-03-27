// ✅ 파일: src/App.jsx
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import poster from "./assets/poster.png";

import AppRouter from "./routes/AppRouter";
import FooterNav from "./components/FooterNav";
import MainModal from "./components/MainModal";
import { useIsMobileViewport } from "./utils/responsive";

/**
 * ✅ App: 전체 조립
 * - 라우팅은 AppRouter
 * - ✅ /m 라우트에서는 FooterNav만 제거
 * - ✅ MainModal은 모바일/데스크톱 모두 렌더
 *   → 모바일 상세 화면의 [참여 신청] 버튼에서도 기존 참여 신청 모달 재사용 가능
 * - ✅ 배경(bg)이 컨텐츠를 덮지 않도록 z-index 분리
 */
export default function App() {
  // ✅ "intro" | "weekly" | "join" | null
  const [mode, setMode] = useState(null);

  const { pathname } = useLocation();
  const isMobileViewport = useIsMobileViewport();

  // ✅ 모바일 라우트 판별 (/m, /m/...)
  const isMobileRoute = useMemo(() => {
    return pathname === "/m" || pathname.startsWith("/m/");
  }, [pathname]);

  const isBoardRoute = useMemo(() => {
    return pathname === "/board" || pathname.startsWith("/board/");
  }, [pathname]);

  const shouldHideFooterNav =
    isMobileRoute || (isMobileViewport && isBoardRoute);

  useEffect(() => {
    document.body.classList.toggle("footer-nav-hidden", shouldHideFooterNav);

    return () => {
      document.body.classList.remove("footer-nav-hidden");
    };
  }, [shouldHideFooterNav]);

  // ✅ 공용 모달 오픈 함수
  const openJoinModal = () => setMode("join");
  const openWeeklyModal = () => setMode("weekly");
  const openAiGuideModal = () => setMode("ai-guide");
  const closeModal = () => setMode(null);

  return (
    <>
      {/* ✅ 배경은 항상 맨 뒤 */}
      <div
        className="bg"
        aria-hidden="true"
        style={{
          "--poster-url": `url(${poster})`,
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* ✅ 앱 UI는 항상 위 */}
      <div style={{ position: "relative", zIndex: 1, minHeight: "100dvh" }}>
        {/* ✅ 라우터 */}
        <AppRouter
          onOpenJoin={openJoinModal}
          onOpenWeekly={openWeeklyModal}
          onOpenAiGuide={openAiGuideModal}
        />

        {/* ✅ 하단 메뉴: 모바일 라우트에서는 제거 */}
        {!shouldHideFooterNav && <FooterNav onOpen={(m) => setMode(m)} />}

        {/* ✅ 공용 모달: 모바일/데스크톱 모두 렌더 */}
        <MainModal mode={mode} onClose={closeModal} />
      </div>
    </>
  );
}
