// ✅ 파일: src/components/weekly/WeeklyRecommendPanel.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { getWeeklyRecommend } from "../../api/recommendApi";
import { toWeekStartDateYYYYMMDD } from "../../utils/dateUtils";

function normalizeWeekly(data) {
  if (!data) return null;

  // 배열 형태: [{level/difficulty, ...}, ...]
  if (Array.isArray(data)) {
    const map = {};
    for (const item of data) {
      const key = String(item?.level || item?.difficulty || "").toUpperCase();
      if (key) map[key] = item;
    }
    return {
      EASY: map.EASY || null,
      NORMAL: map.NORMAL || null,
      HARD: map.HARD || null,
    };
  }

  // 객체 형태
  const easy = data.EASY ?? data.easy ?? data?.weekly?.easy ?? null;
  const normal = data.NORMAL ?? data.normal ?? data?.weekly?.normal ?? null;
  const hard = data.HARD ?? data.hard ?? data?.weekly?.hard ?? null;

  return { EASY: easy, NORMAL: normal, HARD: hard };
}

function Card({ label, value }) {
  const title =
    typeof value === "string"
      ? value
      : value?.title || value?.name || value?.gameTitle || "-";

  const sub =
    typeof value === "object"
      ? value?.desc ||
        value?.summary ||
        value?.comment ||
        value?.description ||
        ""
      : "";

  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: 14,
        background: "rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.85 }}>{label}</div>

      <div style={{ marginTop: 6, fontSize: 16, fontWeight: 800 }}>{title}</div>

      {sub ? (
        <div
          className="muted"
          style={{ marginTop: 6, fontSize: 13, lineHeight: 1.4 }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

/**
 * ✅ WeeklyRecommendPanel
 *
 * 역할:
 * - "금주의 추천" 전용 카드
 * - 선정 명단/선정 통계와 다르게 추천 게임 정보를 보여준다.
 *
 * props:
 * - weekStartDate?: Date | "YYYY-MM-DD" | ISO string ...
 */
export default function WeeklyRecommendPanel({ weekStartDate }) {
  // ✅ 기준 주차(표시/동기화용)
  const w = useMemo(
    () => toWeekStartDateYYYYMMDD(weekStartDate || new Date()) || "",
    [weekStartDate]
  );

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [weekly, setWeekly] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      // ✅ 현재 API가 weekStartDate 파라미터를 받지 않는다면 그대로 호출
      // 나중에 서버가 지원하면 getWeeklyRecommend(w) 형태로 바꾸면 됨
      const res = await getWeeklyRecommend();
      const data = res?.data ?? res;
      setWeekly(normalizeWeekly(data));
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div style={{ height: "100%" }}>
      {/* ✅ 상단 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ fontWeight: 900 }}>금주의 추천</div>
        <span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
          {w || "-"}
        </span>
      </div>

      <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>
        이번 주 추천 게임입니다.
        <br />
        EASY / NORMAL / HARD 기준으로 확인할 수 있습니다.
      </div>

      {loading ? (
        <div className="muted" style={{ marginTop: 12 }}>
          불러오는 중...
        </div>
      ) : err ? (
        <div style={{ marginTop: 12 }}>
          <div className="muted" style={{ lineHeight: 1.5 }}>
            추천을 불러오지 못했어요.
          </div>

          <button
            className="btn"
            type="button"
            onClick={load}
            style={{ marginTop: 10 }}
          >
            재시도
          </button>
        </div>
      ) : (
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <Card label="EASY" value={weekly?.EASY} />
          <Card label="NORMAL" value={weekly?.NORMAL} />
          <Card label="HARD" value={weekly?.HARD} />
        </div>
      )}
    </div>
  );
}