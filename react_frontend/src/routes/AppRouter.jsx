import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "../pages/Home";
import HomeMobile from "../pages/HomeMobile";
import ApplyPage from "../pages/ApplyPage";

import TileDetailRoute from "../components/mobile/tile/TileDetailRoute";

import BoardEnterPage from "../pages/board/BoardEnterPage";
import BoardPage from "../pages/board/BoardPage";
import BoardDetailPage from "../pages/board/BoardDetailPage";
import BoardAdminPage from "../pages/board/BoardAdminPage";

import AdminEnterPage from "../pages/AdminEnterPage";
import AdminOperationPage from "../pages/AdminOperationPage";

import { isMobileViewport, onViewportChange } from "../utils/responsive";

function GamesPage() {
  return (
    <div className="wrap">
      <div className="section">게임 목록(준비중)</div>
    </div>
  );
}

function Entry({ onOpenJoin, onOpenWeekly, onOpenAiGuide }) {
  const [isMobile, setIsMobile] = useState(() => isMobileViewport());

  useEffect(() => {
    const cleanup = onViewportChange(setIsMobile, undefined, {
      fireImmediately: true,
    });
    return cleanup;
  }, []);

  if (isMobile) {
    return <Navigate to="/m" replace />;
  }

  return (
    <Home
      onOpenJoin={onOpenJoin}
      onOpenWeekly={onOpenWeekly}
      onOpenAiGuide={onOpenAiGuide}
    />
  );
}

function NotFoundRedirect() {
  const [isMobile, setIsMobile] = useState(() => isMobileViewport());

  useEffect(() => {
    const cleanup = onViewportChange(setIsMobile, undefined, {
      fireImmediately: true,
    });
    return cleanup;
  }, []);

  return <Navigate to={isMobile ? "/m" : "/"} replace />;
}

export default function AppRouter({
  onOpenJoin,
  onOpenWeekly,
  onOpenAiGuide,
}) {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Entry
            onOpenJoin={onOpenJoin}
            onOpenWeekly={onOpenWeekly}
            onOpenAiGuide={onOpenAiGuide}
          />
        }
      />

      <Route
        path="/m"
        element={
          <HomeMobile
            onOpenJoin={onOpenJoin}
            onOpenWeekly={onOpenWeekly}
            onOpenAiGuide={onOpenAiGuide}
          />
        }
      />

      <Route
        path="/m/tile/:tileId"
        element={
          <TileDetailRoute
            onOpenJoin={onOpenJoin}
            onOpenWeekly={onOpenWeekly}
            onOpenAiGuide={onOpenAiGuide}
          />
        }
      />

      <Route path="/m/*" element={<Navigate to="/m" replace />} />

      <Route path="/apply" element={<ApplyPage />} />

      <Route path="/board/enter" element={<BoardEnterPage />} />
      <Route path="/board" element={<BoardPage />} />
      <Route path="/board/:postId" element={<BoardDetailPage />} />

      <Route path="/board/admin/new" element={<BoardAdminPage />} />
      <Route path="/board/admin/:postId/edit" element={<BoardAdminPage />} />

      <Route path="/admin" element={<Navigate to="/admin/enter" replace />} />
      <Route path="/admin/enter" element={<AdminEnterPage />} />
      <Route path="/admin/operations" element={<AdminOperationPage />} />
      <Route path="/admin/*" element={<Navigate to="/admin/enter" replace />} />

      <Route path="/games" element={<GamesPage />} />

      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}
