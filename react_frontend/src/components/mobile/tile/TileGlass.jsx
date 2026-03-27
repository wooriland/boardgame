// ✅ 파일: src/components/mobile/tile/TileGlass.jsx

import { memo, useMemo } from "react";

import WeeklySelectedPanel from "../../weekly/WeeklySelectedPanel";
import WeeklySelectionStatsPanel from "../../weekly/WeeklySelectionStatsPanel";
import DeptStatsPanel from "../../sections/DeptStatsPanel";
import WeeklyRecommendPanel from "../../weekly/WeeklyRecommendPanel";
import KakaoFixedMap from "../../KakaoFixedMap";

function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function safeObj(v) {
  return v && typeof v === "object" ? v : {};
}

function buildBasePreviewProps(ctx) {
  const c = ctx || {};
  return {
    weekStartDate: c.weekStartDate || "",
    onOpenJoin: c.onOpenJoin,
    onOpenWeekly: c.onOpenWeekly,
  };
}

/**
 * ✅ \n 줄바꿈을 확실히 살리기 위한 렌더러
 */
function renderMultilineText(text = "") {
  const normalized = String(text).replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  return lines.map((line, idx) => (
    <span key={`${line}-${idx}`}>
      {line}
      {idx < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function renderPreviewByKey(previewKey, props) {
  switch (previewKey) {
    case "WeeklySelectedPanel":
      return <WeeklySelectedPanel {...props} />;

    case "WeeklySelectionStatsPanel":
      return <WeeklySelectionStatsPanel {...props} />;

    case "DeptStatsPanel":
      return <DeptStatsPanel {...props} variant="plain" />;

    case "WeeklyRecommendPanel":
      return <WeeklyRecommendPanel {...props} />;

    case "KakaoFixedMap":
      return <KakaoFixedMap {...props} />;

    default:
      return null;
  }
}

function TileGlassImpl({
  tile,
  ctx = null,
  className = "",
  tone = "default",
  clickable = false,
  onClick,
  minHeight = 132,
  preview = false,
}) {
  const title = tile?.title ?? "";
  const summary = tile?.summary ?? "";

  const previewKey =
    typeof tile?.previewComponent === "string" ? tile.previewComponent : "";

  const propsForPreview = useMemo(() => {
    const base = buildBasePreviewProps(ctx);
    const previewPropsFn = tile?.previewProps;
    const extra =
      typeof previewPropsFn === "function"
        ? safeObj(previewPropsFn(ctx))
        : safeObj(previewPropsFn);

    return { ...base, ...extra };
  }, [ctx, tile?.previewProps]);

  const showPreview = preview && !!previewKey;
  const isClickable = clickable && typeof onClick === "function";

  const toneStyle =
    tone === "accent"
      ? {
          border: "1px solid rgba(255,255,255,0.22)",
          background: "rgba(255,255,255,0.10)",
        }
      : tone === "muted"
      ? {
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(255,255,255,0.06)",
        }
      : {
          border: "1px solid rgba(255,255,255,0.16)",
          background: "rgba(255,255,255,0.08)",
        };

  const handleKeyDown = (e) => {
    if (!isClickable) return;

    if (e.key === "Enter") {
      e.preventDefault();
      onClick();
    }

    if (e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <article
      className={cx(
        "m-tile",
        isClickable ? "m-tile--clickable" : "",
        className
      )}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      aria-label={isClickable ? `${title} 상세 보기` : undefined}
      onClick={isClickable ? onClick : undefined}
      onKeyDown={isClickable ? handleKeyDown : undefined}
      style={{
        minHeight,
        borderRadius: 18,
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        ...toneStyle,
        boxShadow:
          "0 10px 26px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.16)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        transform: "none",
        WebkitTransform: "none",
        backfaceVisibility: "visible",
        WebkitBackfaceVisibility: "visible",
        isolation: "isolate",
        contain: "layout paint",
        willChange: "opacity",
        cursor: isClickable ? "pointer" : "default",
        userSelect: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div style={{ padding: "14px 14px 0" }}>
        <div
          className="m-tile__title"
          style={{
            fontWeight: 900,
            letterSpacing: "-0.02em",
            fontSize: 14,
            color: "rgba(255,255,255,0.94)",
            lineHeight: 1.25,
            whiteSpace: "normal",
            wordBreak: "keep-all",
            overflowWrap: "anywhere",
          }}
        >
          {renderMultilineText(title)}
        </div>

        <div
          className="m-tile__summary"
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "rgba(255,255,255,0.70)",
            lineHeight: 1.4,
            whiteSpace: "normal",
            wordBreak: "keep-all",
            overflowWrap: "anywhere",
            overflow: "hidden",
          }}
        >
          {renderMultilineText(summary)}
        </div>
      </div>

      {showPreview ? (
        <div
          className="m-tile__preview"
          style={{
            flex: 1,
            padding: "0 12px 12px",
            overflow: "hidden",
            display: "grid",
            alignContent: "start",
            minHeight: 0,
            contain: "paint",
          }}
        >
          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.10)",
              background: "rgba(0,0,0,0.18)",
              padding: 10,
              minHeight: 0,
            }}
          >
            {renderPreviewByKey(previewKey, propsForPreview)}
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }} />
      )}

      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          background:
            "linear-gradient(130deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 40%)",
          opacity: 0.45,
        }}
      />

      <div
        aria-hidden
        style={{
          position: "absolute",
          left: "-20%",
          right: "-20%",
          bottom: "-30px",
          height: 90,
          borderRadius: 999,
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.16), rgba(255,255,255,0) 70%)",
          filter: "blur(8px)",
          opacity: 0.55,
          pointerEvents: "none",
          transform: "none",
        }}
      />
    </article>
  );
}

export default memo(TileGlassImpl);