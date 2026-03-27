// ✅ 파일: src/components/sections/WeeklyPreviewSection.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { getWeeklyRecommend } from "../../api/recommendApi";
import {
  getWeeklySelectionStats,
  getWeeklySelectionStatsFallback,
} from "../../api/weeklySelectionApi";
import {
  isSelectionPublishedNow,
  toWeekStartDateYYYYMMDD,
} from "../../utils/dateUtils";

// 주간 추천 응답이 어떤 형태든 "3칸"만 뽑아오면 된다.
// 예시 1) { easy: {...}, normal: {...}, hard: {...} }
// 예시 2) { EASY: "...", NORMAL: "...", HARD: "..." }
// 예시 3) [{level:"EASY", ...}, ...]
function normalizeWeekly(data) {
  if (!data) return null;

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
      ? value?.desc || value?.summary || value?.comment || ""
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
      <div
        style={{
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: "0.6px",
          opacity: 0.85,
        }}
      >
        {label}
      </div>
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

function Pill({ children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--line)",
        background: "rgba(0,0,0,0.18)",
        fontSize: 12,
        opacity: 0.92,
      }}
    >
      {children}
    </span>
  );
}

function toInt(v) {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function toBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

/**
 * ✅ 선정 통계 요약
 * - 미리보기에서는 더 이상 bySlot 합산을 하지 않는다.
 * - 백엔드가 준 overallTotal을 그대로 사용한다.
 */
function normalizeStatsSummary(resp, weekStartDate = "") {
  const src =
    resp && typeof resp === "object"
      ? resp
      : getWeeklySelectionStatsFallback(weekStartDate);

  return {
    weekStartDate: String(src?.weekStartDate || weekStartDate || ""),
    overallTotal: toInt(src?.overallTotal),
    countRule: String(src?.countRule || "").trim(),
    excludeOperator: toBool(src?.excludeOperator, false),
    includeWaitlist: toBool(src?.includeWaitlist, false),
  };
}

function buildRuleText(stats) {
  const parts = [];

  if (stats?.countRule) {
    parts.push(stats.countRule);
  } else {
    parts.push("같은 사람이 EASY/NORMAL/HARD에 중복 선정되어도 1명으로 계산");
  }

  parts.push(stats?.excludeOperator ? "운영자 제외" : "운영자 포함");
  parts.push(stats?.includeWaitlist ? "예비 포함" : "예비 제외");

  return parts.join(" · ");
}

export default function WeeklyPreviewSection({ onOpenWeeklyModal }) {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [weekly, setWeekly] = useState(null);

  // ✅ 선정 통계(선정 결과 기준) 요약 표시용
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsErr, setStatsErr] = useState(null);
  const [stats, setStats] = useState(null);

  // ✅ 기준 주차(일요일 기준 YYYY-MM-DD)
  const weekStartDate = toWeekStartDateYYYYMMDD(new Date()) || "";

  // ✅ 공개 여부 (수요일 20시 이후)
  const published = isSelectionPublishedNow(new Date());

  const loadWeeklyRecommend = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const res = await getWeeklyRecommend();
      const data = res?.data ?? res;
      setWeekly(normalizeWeekly(data));
    } catch (e) {
      setErr(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    if (!published) {
      setStats(null);
      setStatsErr(null);
      setStatsLoading(false);
      return;
    }

    if (!weekStartDate) {
      setStats(null);
      setStatsErr(new Error("weekStartDate invalid"));
      setStatsLoading(false);
      return;
    }

    setStatsLoading(true);
    setStatsErr(null);

    try {
      const resp = await getWeeklySelectionStats(weekStartDate);
      const data = resp?.data ?? resp;
      setStats(normalizeStatsSummary(data, weekStartDate));
    } catch (e) {
      setStatsErr(e);
      setStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, [published, weekStartDate]);

  useEffect(() => {
    loadWeeklyRecommend();
    loadStats();
  }, [loadWeeklyRecommend, loadStats]);

  const statsRuleText = useMemo(() => buildRuleText(stats), [stats]);

  const statsErrorLabel = useMemo(() => {
    if (!statsErr) return "";
    const status = statsErr?.status;
    if (status === 404) return "📊 통계 없음";
    if (status === 400) return "📊 통계 없음";
    return "📊 통계 오류";
  }, [statsErr]);

  return (
    <div style={{ height: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <div style={{ fontWeight: 900 }}>금주의 추천 미리보기</div>
        <button className="btn" type="button" onClick={onOpenWeeklyModal}>
          자세히(모달)
        </button>
      </div>

      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        EASY / NORMAL / HARD
      </div>

      {/* ✅ 선정 공개 상태(요약) */}
      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <Pill>
          🗓️ 주차 시작일: <b>{weekStartDate || "-"}</b>
        </Pill>

        <Pill>{published ? "✅ 명단 공개됨" : "⏳ 수요일 20시 공개"}</Pill>

        {published ? (
          statsLoading ? (
            <Pill>📊 통계 불러오는 중...</Pill>
          ) : stats ? (
            <Pill>
              📊 고유 선정 인원 <b>{stats.overallTotal}</b>명
            </Pill>
          ) : statsErr ? (
            <Pill>{statsErrorLabel}</Pill>
          ) : (
            <Pill>📊 통계 없음</Pill>
          )
        ) : (
          <Pill>📌 공개 후 통계 표시</Pill>
        )}
      </div>

      {/* ✅ 추천 카드 */}
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
            onClick={loadWeeklyRecommend}
            style={{ marginTop: 10 }}
          >
            재시도
          </button>
        </div>
      ) : (
        <div className="grid" style={{ marginTop: 12 }}>
          <Card label="EASY" value={weekly?.EASY} />
          <Card label="NORMAL" value={weekly?.NORMAL} />
          <Card label="HARD" value={weekly?.HARD} />
        </div>
      )}

      {/* ✅ 통계 에러가 있을 때만 보이는 작은 안내 + 재시도 */}
      {published && statsErr ? (
        <div style={{ marginTop: 10 }}>
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
            통계를 불러오지 못했어요. (필요하면 다시 시도해 주세요)
          </div>
          <button
            className="btn ghost"
            type="button"
            onClick={loadStats}
            style={{ marginTop: 8 }}
          >
            통계 재시도
          </button>
        </div>
      ) : null}

      {/* ✅ 공개 이후 통계 의미를 짧게 표시 */}
      {published && stats ? (
        <div
          className="muted"
          style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5 }}
        >
          집계 기준: {statsRuleText}
        </div>
      ) : null}
    </div>
  );
}