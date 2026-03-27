import { useCallback, useMemo } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";

import { MOBILE_PAGES } from "../mobileCards";
import { renderTileDetailByKey } from "./tileDetailRegistry.jsx";
import "../mobile.css";

import { toWeekStartDateYYYYMMDD } from "../../../utils/dateUtils";
import {
  getMobileHomeSnapshotFromLocationState,
  mergeMobileHomeSnapshotIntoLocationState,
} from "../../../utils/mobileHomeState";

function findTileById(tileId) {
  for (const page of MOBILE_PAGES) {
    const tiles = Array.isArray(page?.tiles) ? page.tiles : [];

    for (const tile of tiles) {
      if (tile?.id === tileId) {
        return tile;
      }
    }
  }

  return null;
}

function safeObj(value) {
  return value && typeof value === "object" ? value : {};
}

function buildDetailProps(tile, ctx) {
  const base = {
    tile,
    ctx,
    weekStartDate: ctx?.weekStartDate ?? "",
    onOpenJoin: ctx?.onOpenJoin,
    onOpenWeekly: ctx?.onOpenWeekly,
  };

  const previewPropsFn = tile?.previewProps;
  const extra =
    typeof previewPropsFn === "function"
      ? safeObj(previewPropsFn(ctx))
      : safeObj(previewPropsFn);

  return {
    ...base,
    ...extra,
  };
}

function FallbackDetail() {
  return (
    <div className="m-tileDetailFallback">
      아직 준비되지 않은 상세 화면입니다.
    </div>
  );
}

export default function TileDetailRoute({ onOpenJoin, onOpenWeekly }) {
  const { tileId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const homeSnapshot = useMemo(
    () => getMobileHomeSnapshotFromLocationState(location.state, MOBILE_PAGES),
    [location.state]
  );
  const homeLocationState = useMemo(
    () =>
      mergeMobileHomeSnapshotIntoLocationState(
        location.state,
        homeSnapshot,
        MOBILE_PAGES
      ),
    [homeSnapshot, location.state]
  );

  const weekStartDate = toWeekStartDateYYYYMMDD(new Date()) || "";

  const handleOpenJoin = useCallback(() => {
    if (typeof onOpenJoin === "function") {
      onOpenJoin();
      return;
    }

    navigate("/apply", { state: homeLocationState });
  }, [homeLocationState, navigate, onOpenJoin]);

  const handleOpenWeekly = useCallback(() => {
    if (typeof onOpenWeekly === "function") {
      onOpenWeekly();
    }
  }, [onOpenWeekly]);

  const ctx = useMemo(
    () => ({
      weekStartDate,
      onOpenJoin: handleOpenJoin,
      onOpenWeekly: handleOpenWeekly,
      homeSnapshot,
      homeLocationState,
    }),
    [
      handleOpenJoin,
      handleOpenWeekly,
      homeLocationState,
      homeSnapshot,
      weekStartDate,
    ]
  );

  const tile = findTileById(tileId);

  if (!tile) {
    return <Navigate to="/m" replace state={homeLocationState} />;
  }

  const detailKey =
    typeof tile?.detailComponent === "string" ? tile.detailComponent : "";

  const detailProps = buildDetailProps(tile, ctx);
  const detailNode = renderTileDetailByKey(detailKey, detailProps);

  return (
    <div
      className="m-root m-root--tileDetail"
      style={{ "--m-header-h": "64px" }}
      data-page="tile-detail"
    >
      <main
        className="m-main m-main--tileDetail"
        role="main"
        aria-label="tile-detail"
      >
        <section className="m-detail-page" aria-label="tile-detail-page">
          <div className="m-detail-scroll">
            <div className="m-detail-shell">
              <div className="m-detail-body">
                {detailNode ?? <FallbackDetail />}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
