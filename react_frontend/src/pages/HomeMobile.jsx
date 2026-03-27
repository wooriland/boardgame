import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";

import MobileHeader from "../components/mobile/MobileHeader";
import PageGlass from "../components/mobile/PageGlass";
import TileGlass from "../components/mobile/tile/TileGlass.jsx";

import { MOBILE_PAGES } from "../components/mobile/mobileCards.js";
import "../components/mobile/mobile.css";

import { toWeekStartDateYYYYMMDD } from "../utils/dateUtils";
import {
  createMobileHomeSnapshot,
  getLogicalPageIndexFromTrackIndex,
  getMobileHomeSnapshotFromLocationState,
  getRealTrackIndexForLogicalIndex,
  isSameMobileHomeSnapshot,
  mergeMobileHomeSnapshotIntoLocationState,
} from "../utils/mobileHomeState";

const SCROLL_SETTLE_DELAY_MS = 96;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildLoopSlides(pages) {
  const safePages = Array.isArray(pages) ? pages : [];
  const pageCount = safePages.length;

  if (pageCount <= 1) {
    return safePages.map((page, logicalPageIndex) => ({
      key: `real-${page?.id ?? logicalPageIndex}`,
      page,
      logicalPageIndex,
      isClone: false,
    }));
  }

  return [
    {
      key: `clone-head-${safePages[pageCount - 1]?.id ?? pageCount - 1}`,
      page: safePages[pageCount - 1],
      logicalPageIndex: pageCount - 1,
      isClone: true,
    },
    ...safePages.map((page, logicalPageIndex) => ({
      key: `real-${page?.id ?? logicalPageIndex}`,
      page,
      logicalPageIndex,
      isClone: false,
    })),
    {
      key: `clone-tail-${safePages[0]?.id ?? 0}`,
      page: safePages[0],
      logicalPageIndex: 0,
      isClone: true,
    },
  ];
}

function isBoardEntryTile(tile) {
  const id = String(tile?.id ?? "").toLowerCase();
  return id === "board" || id === "board-enter";
}

function isAiGuideTile(tile) {
  const id = String(tile?.id ?? "").toLowerCase();
  return id === "ai-guide";
}

export default function HomeMobile({
  onOpenJoin,
  onOpenWeekly,
  onOpenAiGuide,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const pageCount = MOBILE_PAGES.length;
  const loopSlides = useMemo(() => buildLoopSlides(MOBILE_PAGES), []);
  const initialHomeSnapshot = useMemo(
    () => getMobileHomeSnapshotFromLocationState(location.state, MOBILE_PAGES),
    [location.state]
  );
  const [logicalPageIndex, setLogicalPageIndex] = useState(
    () => initialHomeSnapshot.logicalPageIndex
  );
  const [trackIndex, setTrackIndex] = useState(
    () => initialHomeSnapshot.trackIndex
  );
  const scrollRef = useRef(null);
  const scrollSettleTimerRef = useRef(null);
  const resizeFrameRef = useRef(0);
  const jumpReleaseFrameRef = useRef(0);
  const isProgrammaticScrollRef = useRef(false);
  const trackIndexRef = useRef(trackIndex);
  const didRestoreInitialTrackRef = useRef(false);

  const weekStartDate = toWeekStartDateYYYYMMDD(new Date()) || "";

  const ctx = useMemo(
    () => ({
      weekStartDate,
      onOpenJoin,
      onOpenWeekly,
      onOpenAiGuide,
    }),
    [weekStartDate, onOpenJoin, onOpenWeekly, onOpenAiGuide]
  );

  useEffect(() => {
    trackIndexRef.current = trackIndex;
  }, [trackIndex]);

  const currentHomeSnapshot = useMemo(
    () =>
      createMobileHomeSnapshot(
        {
          logicalPageIndex,
          trackIndex,
        },
        MOBILE_PAGES
      ),
    [logicalPageIndex, trackIndex]
  );

  const jumpToTrack = useCallback((nextTrackIndex) => {
    const node = scrollRef.current;
    if (!node) return false;

    const viewportWidth = node.clientWidth;
    if (!viewportWidth) return false;

    window.clearTimeout(scrollSettleTimerRef.current);
    window.cancelAnimationFrame(jumpReleaseFrameRef.current);

    isProgrammaticScrollRef.current = true;
    node.classList.add("m-snapList--instant");
    node.scrollTo({
      left: viewportWidth * nextTrackIndex,
      behavior: "auto",
    });

    jumpReleaseFrameRef.current = window.requestAnimationFrame(() => {
      node.classList.remove("m-snapList--instant");

      jumpReleaseFrameRef.current = window.requestAnimationFrame(() => {
        isProgrammaticScrollRef.current = false;
      });
    });

    return true;
  }, []);

  const settleToNearestSlide = useCallback(() => {
    const node = scrollRef.current;
    if (!node || isProgrammaticScrollRef.current) return;

    const viewportWidth = node.clientWidth;
    if (!viewportWidth) return;

    const maxTrackIndex = Math.max(loopSlides.length - 1, 0);
    const rawTrackIndex = Math.round(node.scrollLeft / viewportWidth);
    const boundedTrackIndex = clamp(rawTrackIndex, 0, maxTrackIndex);
    const nextLogicalPageIndex = getLogicalPageIndexFromTrackIndex(
      boundedTrackIndex,
      pageCount
    );
    const normalizedTrackIndex = getRealTrackIndexForLogicalIndex(
      nextLogicalPageIndex,
      pageCount
    );

    setLogicalPageIndex((prev) =>
      prev === nextLogicalPageIndex ? prev : nextLogicalPageIndex
    );

    if (pageCount <= 1) {
      setTrackIndex(0);
      return;
    }

    if (boundedTrackIndex === 0 || boundedTrackIndex === maxTrackIndex) {
      setTrackIndex((prev) =>
        prev === normalizedTrackIndex ? prev : normalizedTrackIndex
      );
      jumpToTrack(normalizedTrackIndex);
      return;
    }

    setTrackIndex((prev) =>
      prev === boundedTrackIndex ? prev : boundedTrackIndex
    );
  }, [jumpToTrack, loopSlides.length, pageCount]);

  const scheduleSettle = useCallback(() => {
    window.clearTimeout(scrollSettleTimerRef.current);
    scrollSettleTimerRef.current = window.setTimeout(
      settleToNearestSlide,
      SCROLL_SETTLE_DELAY_MS
    );
  }, [settleToNearestSlide]);

  useLayoutEffect(() => {
    if (didRestoreInitialTrackRef.current) {
      return;
    }

    didRestoreInitialTrackRef.current = true;
    jumpToTrack(initialHomeSnapshot.trackIndex);
  }, [initialHomeSnapshot.trackIndex, jumpToTrack]);

  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return undefined;

    const restoreTrackPosition = () => {
      window.cancelAnimationFrame(resizeFrameRef.current);
      resizeFrameRef.current = window.requestAnimationFrame(() => {
        jumpToTrack(trackIndexRef.current);
      });
    };

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(restoreTrackPosition)
        : null;

    resizeObserver?.observe(node);
    window.addEventListener("resize", restoreTrackPosition);
    window.addEventListener("orientationchange", restoreTrackPosition);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", restoreTrackPosition);
      window.removeEventListener("orientationchange", restoreTrackPosition);
      window.cancelAnimationFrame(resizeFrameRef.current);
    };
  }, [jumpToTrack]);

  useEffect(() => {
    const locationSnapshot = getMobileHomeSnapshotFromLocationState(
      location.state,
      MOBILE_PAGES
    );

    if (isSameMobileHomeSnapshot(locationSnapshot, currentHomeSnapshot)) {
      return;
    }

    navigate(".", {
      replace: true,
      preventScrollReset: true,
      state: mergeMobileHomeSnapshotIntoLocationState(
        location.state,
        currentHomeSnapshot,
        MOBILE_PAGES
      ),
    });
  }, [currentHomeSnapshot, location.state, navigate]);

  useEffect(() => {
    return () => {
      window.clearTimeout(scrollSettleTimerRef.current);
      window.cancelAnimationFrame(resizeFrameRef.current);
      window.cancelAnimationFrame(jumpReleaseFrameRef.current);
    };
  }, []);

  const getActiveHomeSnapshot = useCallback(() => {
    const node = scrollRef.current;
    if (!node || pageCount <= 1) {
      return currentHomeSnapshot;
    }

    const viewportWidth = node.clientWidth;
    if (!viewportWidth) {
      return currentHomeSnapshot;
    }

    const maxTrackIndex = Math.max(loopSlides.length - 1, 0);
    const rawTrackIndex = Math.round(node.scrollLeft / viewportWidth);
    const boundedTrackIndex = clamp(rawTrackIndex, 0, maxTrackIndex);
    const nextLogicalPageIndex = getLogicalPageIndexFromTrackIndex(
      boundedTrackIndex,
      pageCount
    );

    return createMobileHomeSnapshot(
      {
        logicalPageIndex: nextLogicalPageIndex,
        trackIndex: getRealTrackIndexForLogicalIndex(
          nextLogicalPageIndex,
          pageCount
        ),
      },
      MOBILE_PAGES
    );
  }, [currentHomeSnapshot, loopSlides.length, pageCount]);

  const handleOpenTile = useCallback(
    (tile) => {
      const tileId = tile?.id;
      if (!tileId) return;

      const homeSnapshot = getActiveHomeSnapshot();
      const homeLocationState = mergeMobileHomeSnapshotIntoLocationState(
        location.state,
        homeSnapshot,
        MOBILE_PAGES
      );

      navigate(".", {
        replace: true,
        preventScrollReset: true,
        state: homeLocationState,
      });

      if (isBoardEntryTile(tile)) {
        navigate("/board/enter", { state: homeLocationState });
        return;
      }

      if (isAiGuideTile(tile)) {
        onOpenAiGuide?.();
        return;
      }

      navigate(`/m/tile/${tileId}`, { state: homeLocationState });
    },
    [getActiveHomeSnapshot, location.state, navigate, onOpenAiGuide]
  );

  return (
    <div
      className="m-root"
      style={{ "--m-header-h": "64px" }}
      data-page="home-mobile"
    >
      <MobileHeader title="WOORILAND" />

      <main className="m-main" role="main" aria-label="mobile-home">
        <section
          ref={scrollRef}
          className="m-pager-area m-snapList"
          aria-label="mobile-pages"
          onScroll={scheduleSettle}
          onTouchEnd={scheduleSettle}
          onPointerUp={scheduleSettle}
        >
          {loopSlides.map((slide, slideTrackIndex) => (
            <section
              key={slide.key}
              className="m-snap"
              aria-label={slide?.page?.title ? `page-${slide.page.title}` : "page"}
              data-track-index={slideTrackIndex}
              data-logical-index={slide.logicalPageIndex}
              data-clone={slide.isClone ? "true" : "false"}
            >
              <PageGlass
                page={slide.page}
                showTitle={true}
                columns={2}
                gap={14}
                padding={16}
                minHeight="100%"
              >
                {(slide?.page?.tiles ?? []).map((tile) => (
                  <TileGlass
                    key={`${slide.key}-${tile.id}`}
                    tile={tile}
                    ctx={ctx}
                    className={tile?.className ?? ""}
                    tone={tile?.tone ?? "default"}
                    clickable={true}
                    onClick={() => handleOpenTile(tile)}
                    preview={false}
                  />
                ))}
              </PageGlass>
            </section>
          ))}
        </section>
      </main>
    </div>
  );
}
