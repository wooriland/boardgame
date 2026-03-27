import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function isTileDetailPath(pathname) {
  return /^\/m\/tile\/[^/]+$/.test(pathname || "");
}

function isMobileHomePath(pathname) {
  return pathname === "/m";
}

export default function MobileHeader({
  title = "WOORILAND",
  detailTitle = "",
  showBack,
  onBack,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location?.pathname || "";
  const isDetailPage = isTileDetailPath(pathname);
  const isHomePage = isMobileHomePath(pathname);

  const resolvedShowBack =
    typeof showBack === "boolean" ? showBack : isDetailPage;

  const resolvedTitle = useMemo(() => {
    if (resolvedShowBack && detailTitle) return detailTitle;
    return title;
  }, [detailTitle, resolvedShowBack, title]);

  const handleBack = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }

    if (isDetailPage) {
      const historyIndex =
        typeof window !== "undefined"
          ? Number(window.history?.state?.idx ?? 0)
          : 0;

      if (historyIndex > 0) {
        navigate(-1);
        return;
      }

      navigate("/m", {
        replace: true,
        state: location.state,
      });
      return;
    }

    if (!isHomePage) {
      navigate(-1);
    }
  };

  return (
    <header className="m-header" aria-label="mobile-header">
      <div className="m-header-inner">
        <div className="m-header-side m-header-side--left">
          {resolvedShowBack ? (
            <button
              type="button"
              className="m-header-btn"
              onClick={handleBack}
              aria-label="Back"
              title="Back"
            >
              {"<"}
            </button>
          ) : (
            <div className="m-header-sidePlaceholder" aria-hidden="true" />
          )}
        </div>

        <div className="m-header-center" aria-label="mobile-title">
          <div
            className="m-title"
            title={typeof resolvedTitle === "string" ? resolvedTitle : ""}
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {resolvedTitle}
          </div>
        </div>

        <div className="m-header-side m-header-side--right">
          <div className="m-header-sidePlaceholder" aria-hidden="true" />
        </div>
      </div>
    </header>
  );
}
