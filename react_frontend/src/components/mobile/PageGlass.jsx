// ✅ 파일: src/components/mobile/PageGlass.jsx
// 목적:
// - "큰 카드(페이지)"의 외곽 Glass 스타일 + 기본 레이아웃 제공
// - FlipPager renderPage에서 쓰는 Page 래퍼
// - 내부에 2열 Grid 제공(타일은 children으로 받음)
//
// ✅ 모바일 합성 안정화(이번 수정):
// - backdrop-filter가 걸린 요소(.m-page__shell)에 transform/translateZ/backface를 제거
// - 대신 isolation/contain/will-change로 레이어 안정화
// - 최상위(m-page)는 부모(FlipPager overlay)가 absolute/inset을 이미 잡으므로 absolute 제거(중복 방지)

import { memo } from "react";

/** 간단 className 합치기 */
function cx(...args) {
  return args.filter(Boolean).join(" ");
}

function PageGlassImpl({
  page,
  children,
  className = "",
  showTitle = true,
  columns = 2,
  gap = 14,
  padding = 16,
  minHeight = "100%",
}) {
  const title = page?.title ?? "";

  return (
    <section
      className={cx("m-page", className)}
      style={{
        // ✅ 부모(FlipPager overlay)가 absolute/inset:0를 관리 → 여기선 "레이아웃만"
        width: "100%",
        height: "100%",

        // ✅ 중앙 고정 카드처럼
        display: "grid",
        placeItems: "center",

        // ✅ 화면 가장자리 안전 여백
        padding: 16,

        // ✅ 합성 안정화 (transform 금지)
        isolation: "isolate",
        contain: "layout paint",
        willChange: "opacity",

        // ✅ 클릭/스크롤 이벤트는 정상 동작
        pointerEvents: "auto",
      }}
      aria-label={title ? `page-${title}` : "page"}
    >
      <div
        className="m-page__shell"
        style={{
          // ✅ 폭/높이: % 기반으로 단순화
          width: "min(980px, 94vw)",
          height: "100%",
          maxHeight: "min(760px, calc(100% - 8px))",
          minHeight,

          borderRadius: 22,
          overflow: "hidden",

          // ✅ Glass (큰 카드)
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.16)",
          boxShadow:
            "0 18px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18)",

          // ✅ 핵심: backdrop-filter + transform 조합 금지 (모바일 합성 버그)
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",

          // ✅ transform/backface 제거 (중요)
          transform: "none",
          WebkitTransform: "none",
          backfaceVisibility: "visible",
          WebkitBackfaceVisibility: "visible",

          // ✅ 합성 안정화: 2D 안전 속성
          isolation: "isolate",
          contain: "paint",
          willChange: "opacity",

          // ✅ 내용 배치
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* ✅ 상단 캡(헤더 영역) */}
        {showTitle ? (
          <div
            className="m-page__cap"
            style={{
              padding: `${padding}px ${padding}px 12px`,
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                fontWeight: 900,
                letterSpacing: "-0.02em",
                fontSize: 15,
                color: "rgba(255,255,255,0.94)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title}
            </div>

            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.65)",
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            />
          </div>
        ) : null}

        {/* ✅ Grid 영역 */}
        <div
          className="m-page__grid"
          style={{
            flex: 1,
            padding: `${showTitle ? 10 : padding}px ${padding}px ${padding}px`,
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gap,
            alignContent: "start",
            overflow: "hidden",
            minHeight: 0,

            // ✅ 합성 안정화
            contain: "paint",
          }}
        >
          {children}
        </div>

        {/* ✅ 바닥 라이트(은은한 반사) */}
        <div
          aria-hidden
          className="m-page__glow"
          style={{
            height: 44,
            position: "relative",
            overflow: "hidden",
            flexShrink: 0,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "-10%",
              right: "-10%",
              bottom: "-20px",
              height: 80,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.18), rgba(255,255,255,0) 70%)",
              filter: "blur(6px)",
              opacity: 0.7,

              // ✅ transform 금지(필터+transform도 합성 꼬임 유발 가능)
              transform: "none",
            }}
          />
        </div>
      </div>
    </section>
  );
}

export default memo(PageGlassImpl);