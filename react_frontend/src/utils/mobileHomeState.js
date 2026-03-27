const MOBILE_HOME_STATE_KEY = "mobileHome";

function toSafeStateObject(value) {
  return value && typeof value === "object" ? value : {};
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeLogicalPageIndex(value, pageCount) {
  if (pageCount <= 0) return 0;

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return 0;

  return ((parsed % pageCount) + pageCount) % pageCount;
}

export function getRealTrackIndexForLogicalIndex(logicalPageIndex, pageCount) {
  if (pageCount <= 1) return 0;
  return normalizeLogicalPageIndex(logicalPageIndex, pageCount) + 1;
}

export function getLogicalPageIndexFromTrackIndex(trackIndex, pageCount) {
  if (pageCount <= 0) return 0;
  if (pageCount === 1) return 0;

  const maxTrackIndex = pageCount + 1;
  const safeTrackIndex = clamp(
    Number.parseInt(trackIndex, 10) || 0,
    0,
    maxTrackIndex
  );

  if (safeTrackIndex === 0) {
    return pageCount - 1;
  }

  if (safeTrackIndex === maxTrackIndex) {
    return 0;
  }

  return safeTrackIndex - 1;
}

export function normalizeTrackIndex(trackIndex, pageCount) {
  if (pageCount <= 1) return 0;

  const logicalPageIndex = getLogicalPageIndexFromTrackIndex(
    trackIndex,
    pageCount
  );

  return getRealTrackIndexForLogicalIndex(logicalPageIndex, pageCount);
}

export function createMobileHomeSnapshot(snapshot, pages) {
  const safePages = Array.isArray(pages) ? pages : [];
  const pageCount = safePages.length;

  const logicalPageIndex = normalizeLogicalPageIndex(
    snapshot?.logicalPageIndex,
    pageCount
  );

  const defaultTrackIndex = getRealTrackIndexForLogicalIndex(
    logicalPageIndex,
    pageCount
  );

  const trackIndex = normalizeTrackIndex(
    snapshot?.trackIndex ?? defaultTrackIndex,
    pageCount
  );

  const pageId =
    pageCount > 0 && safePages[logicalPageIndex]?.id
      ? String(safePages[logicalPageIndex].id)
      : "";

  return {
    logicalPageIndex,
    trackIndex,
    pageId,
  };
}

export function getMobileHomeSnapshotFromLocationState(locationState, pages) {
  const safeState = toSafeStateObject(locationState);
  return createMobileHomeSnapshot(safeState[MOBILE_HOME_STATE_KEY], pages);
}

export function mergeMobileHomeSnapshotIntoLocationState(
  locationState,
  snapshot,
  pages
) {
  return {
    ...toSafeStateObject(locationState),
    [MOBILE_HOME_STATE_KEY]: createMobileHomeSnapshot(snapshot, pages),
  };
}

export function isSameMobileHomeSnapshot(a, b) {
  return (
    a?.logicalPageIndex === b?.logicalPageIndex &&
    a?.trackIndex === b?.trackIndex &&
    a?.pageId === b?.pageId
  );
}
