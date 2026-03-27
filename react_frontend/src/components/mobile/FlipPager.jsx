// ✅ 파일: src/components/mobile/FlipPager.jsx
// 목적:
// - "N페이지 전환 컨테이너"
// - 좌우 스와이프 시 "제자리 Y축 회전 교체" 애니메이션 제공
//
// 안정화 포인트:
// - Glass(backdrop-filter) 콘텐츠를 3D 트리 밖(2D overlay)에서 렌더
// - 3D 느낌은 2D에서 perspective + rotateY로 시각적으로 구현
// - Hook 순서 규칙 준수: useTransform은 항상 같은 순서로 호출
// - dragDirectionLock 적용
// - 무한 회전(순환 인덱스) 지원
//
// 이번 정리의 핵심:
// - 페이지 전환 컨테이너 역할만 담당
// - 주간 통계/신청 현황의 의미 구분은 각 카드 컴포넌트가 책임진다
// - 이 파일은 화면 전환만 안정적으로 처리한다

import { useMemo, useState } from "react";
import {
  motion,
  animate,
  useMotionValue,
  useTransform,
  useReducedMotion,
} from "framer-motion";

const MotionDiv = motion.div;

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

// ✅ 음수도 안전한 모듈로
function mod(n, m) {
  if (m <= 0) return 0;
  return ((n % m) + m) % m;
}

function getSwipeDirection(offsetX, velocityX, thresholdPx) {
  const swipePower = Math.abs(offsetX) * velocityX;
  const swipeConfidence = 800;

  if (offsetX <= -thresholdPx || swipePower <= -swipeConfidence) return +1;
  if (offsetX >= thresholdPx || swipePower >= swipeConfidence) return -1;
  return 0;
}

export default function FlipPager({
  pages = [],
  ctx = null,
  initialIndex = 0,
  onIndexChange,
  renderPage,
  className = "",
  height = "calc(100dvh - var(--m-header-h, 64px))",
  perspective = 900,
  dragThreshold = 90,
  maxRotateDeg = 60,
  loop = true,
}) {
  const reduceMotion = useReducedMotion();

  const pageCount = pages?.length ?? 0;
  const maxIndex = Math.max(0, pageCount - 1);

  const [index, setIndex] = useState(() =>
    pageCount > 0 ? mod(initialIndex, pageCount) : 0
  );
  const [direction, setDirection] = useState(0); // -1(prev) / +1(next)

  const effectiveIndex = useMemo(() => {
    if (pageCount <= 0) return 0;
    return loop ? mod(index, pageCount) : clamp(index, 0, maxIndex);
  }, [index, pageCount, loop, maxIndex]);

  const canLoop = loop && pageCount > 1;

  const canGoPrev = useMemo(() => {
    if (pageCount <= 1) return false;
    return canLoop ? true : effectiveIndex > 0;
  }, [pageCount, canLoop, effectiveIndex]);

  const canGoNext = useMemo(() => {
    if (pageCount <= 1) return false;
    return canLoop ? true : effectiveIndex < maxIndex;
  }, [pageCount, canLoop, effectiveIndex, maxIndex]);

  const x = useMotionValue(0);

  const progress = useTransform(x, (v) =>
    clamp(Math.abs(v) / dragThreshold, 0, 1)
  );

  const currentOpacity = useTransform(progress, (p) => 1 - p);
  const incomingOpacity = useTransform(progress, (p) => p);

  const currentScale = useTransform(progress, (p) => 1 - p * 0.02);
  const incomingScale = useTransform(progress, (p) => 0.98 + p * 0.02);

  const currentRotateDeg = useTransform(progress, (p) => {
    if (direction === 0) return 0;
    const sign = direction === +1 ? -1 : +1;
    return sign * (p * maxRotateDeg);
  });

  const incomingRotateDeg = useTransform(progress, (p) => {
    if (direction === 0) return 0;
    const sign = direction === +1 ? +1 : -1;
    return sign * ((1 - p) * maxRotateDeg);
  });

  const currentTransform = useTransform(
    [currentRotateDeg, currentScale],
    ([deg, sc]) => `perspective(${perspective}px) rotateY(${deg}deg) scale(${sc})`
  );

  const incomingTransform = useTransform(
    [incomingRotateDeg, incomingScale],
    ([deg, sc]) => `perspective(${perspective}px) rotateY(${deg}deg) scale(${sc})`
  );

  const safeRenderPage = useMemo(() => {
    if (typeof renderPage === "function") return renderPage;

    return (page) => (
      <div style={{ padding: 18, color: "rgba(255,255,255,0.92)" }}>
        <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 10 }}>
          {page?.title ?? page?.id ?? "Page"}
        </div>
        <div style={{ opacity: 0.75, fontSize: 13 }}>
          renderPage(page)를 전달하면 여기가 실제 페이지 UI로 대체됩니다.
        </div>
      </div>
    );
  }, [renderPage]);

  const incomingIndex = useMemo(() => {
    if (pageCount <= 0) return 0;

    if (direction === +1) {
      if (!canGoNext) return effectiveIndex;
      const next = effectiveIndex + 1;
      return loop ? mod(next, pageCount) : next;
    }

    if (direction === -1) {
      if (!canGoPrev) return effectiveIndex;
      const prev = effectiveIndex - 1;
      return loop ? mod(prev, pageCount) : prev;
    }

    return effectiveIndex;
  }, [direction, effectiveIndex, canGoPrev, canGoNext, loop, pageCount]);

  function commitMove(dir) {
    if (pageCount <= 1) return;
    if (dir === +1 && !canGoNext) return;
    if (dir === -1 && !canGoPrev) return;

    setIndex((prev) => {
      const next = loop
        ? mod(prev + dir, pageCount)
        : clamp(prev + dir, 0, maxIndex);

      onIndexChange?.(next);
      return next;
    });
  }

  function snapBack() {
    animate(x, 0, { type: "spring", stiffness: 380, damping: 32 });
    setDirection(0);
  }

  const currentPage = pages[effectiveIndex];
  const incomingPage = pages[incomingIndex];

  const rootStyle = useMemo(
    () => ({
      height,
      "--m-perspective": `${perspective}px`,
      position: "relative",
      isolation: "isolate",
      transform: "translate3d(0,0,0)",
      WebkitTransform: "translate3d(0,0,0)",
      contain: "layout paint",
    }),
    [height, perspective]
  );

  if (reduceMotion) {
    const page = pages[effectiveIndex];

    return (
      <div className={`m-flip ${className}`.trim()} style={rootStyle}>
        <div
          className="m-flip__overlay"
          style={{
            position: "absolute",
            inset: 0,
            isolation: "isolate",
            transform: "translate3d(0,0,0)",
            WebkitTransform: "translate3d(0,0,0)",
          }}
        >
          {safeRenderPage(page, ctx, effectiveIndex)}
        </div>
      </div>
    );
  }

  return (
    <div className={`m-flip ${className}`.trim()} style={rootStyle}>
      <MotionDiv
        className="m-flip__drag"
        style={{ x }}
        drag={pageCount > 1 ? "x" : false}
        dragDirectionLock
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={1}
        onDragStart={() => setDirection(0)}
        onDrag={(_, info) => {
          if (pageCount <= 1) return;

          const dx = info.offset.x;

          if (dx < 0 && canGoNext) setDirection(+1);
          else if (dx > 0 && canGoPrev) setDirection(-1);
          else setDirection(0);
        }}
        onDragEnd={(_, info) => {
          if (pageCount <= 1) return;

          const dx = info.offset.x;
          const vx = info.velocity.x;
          const dir = getSwipeDirection(dx, vx, dragThreshold);

          if (dir === +1 && canGoNext) {
            animate(x, -dragThreshold, { duration: 0.12 }).then(() => {
              commitMove(+1);
              x.set(0);
              setDirection(0);
            });
          } else if (dir === -1 && canGoPrev) {
            animate(x, dragThreshold, { duration: 0.12 }).then(() => {
              commitMove(-1);
              x.set(0);
              setDirection(0);
            });
          } else {
            snapBack();
          }
        }}
      />

      <div
        className="m-flip__overlay"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          isolation: "isolate",
          transform: "translate3d(0,0,0)",
          WebkitTransform: "translate3d(0,0,0)",
        }}
      >
        <MotionDiv
          aria-hidden={direction === 0}
          style={{
            position: "absolute",
            inset: 0,
            opacity: direction === 0 ? 0 : incomingOpacity,
            transform: incomingTransform,
            WebkitTransform: incomingTransform,
            transformOrigin: direction === +1 ? "0% 50%" : "100% 50%",
            willChange: "transform, opacity",
            pointerEvents: "none",
          }}
        >
          {safeRenderPage(incomingPage, ctx, incomingIndex)}
        </MotionDiv>

        <MotionDiv
          style={{
            position: "absolute",
            inset: 0,
            opacity: currentOpacity,
            transform: currentTransform,
            WebkitTransform: currentTransform,
            transformOrigin: direction === +1 ? "100% 50%" : "0% 50%",
            willChange: "transform, opacity",
            pointerEvents: "auto",
          }}
        >
          {safeRenderPage(currentPage, ctx, effectiveIndex)}
        </MotionDiv>
      </div>
    </div>
  );
}