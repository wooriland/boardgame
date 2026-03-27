// ✅ 파일: src/components/KakaoFixedMap.jsx
import { useEffect, useRef } from "react";

const DEST = {
  lat: 37.3848160153474,
  lng: 127.119409411641,
};

export default function KakaoFixedMap({ height = 220 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (!window.kakao || !window.kakao.maps) {
      console.error("[KakaoFixedMap] Kakao SDK not loaded");
      return;
    }

    const { maps } = window.kakao;

    const relayout = (center) => {
      if (!mapRef.current) return;
      mapRef.current.relayout();
      mapRef.current.setCenter(center);
    };

    const init = () => {
      // ✅ load 안에서만 LatLng/Map 생성
      if (mapRef.current) return;

      if (typeof maps.LatLng !== "function") {
        console.error("[KakaoFixedMap] maps.LatLng 없음: SDK 로딩/도메인/스크립트 확인 필요");
        return;
      }

      const center = new maps.LatLng(DEST.lat, DEST.lng);

      const map = new maps.Map(container, { center, level: 3 });
      const marker = new maps.Marker({ position: center });
      marker.setMap(map);

      mapRef.current = map;

      requestAnimationFrame(() => {
        relayout(center);
        setTimeout(() => relayout(center), 50);
        setTimeout(() => relayout(center), 200);
      });

      const onResize = () => relayout(center);
      window.addEventListener("resize", onResize);

      // ✅ cleanup에서 removeEventListener 정확히 보장
      return () => window.removeEventListener("resize", onResize);
    };

    let cleanup = null;

    // ✅ autoload=false면 load 필수
    if (typeof maps.load === "function") {
      maps.load(() => {
        cleanup = init() || null;
      });
    } else {
      cleanup = init() || null;
    }

    return () => {
      if (cleanup) cleanup();
      mapRef.current = null;
    };
  }, []);

  const openMap = () => {
    const url = `https://map.kakao.com/link/map/${encodeURIComponent(DEST.name)},${DEST.lat},${DEST.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div
        ref={containerRef}
        className="kakao-map-container"
        style={{
          width: "100%",
          height,
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.18)",
        }}
      />

      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <div style={{ lineHeight: 1.25 }}>
          <div style={{ fontWeight: 900 }}>{DEST.name}</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {DEST.address}
          </div>
        </div>

        <button
          type="button"
          onClick={openMap}
          style={{
            border: "1px solid rgba(255,255,255,0.18)",
            background: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.92)",
            borderRadius: 12,
            padding: "10px 12px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          지도 크게 보기
        </button>
      </div>
    </div>
  );
}