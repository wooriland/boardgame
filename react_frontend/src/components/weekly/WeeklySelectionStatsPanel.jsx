// ✅ 파일: src/components/weekly/WeeklySelectionStatsPanel.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getWeeklySelectionStats,
  getWeeklySelectionStatsFallback,
} from "../../api/weeklySelectionApi";
import {
  isSelectionPublishedNow,
  toWeekStartDateYYYYMMDD,
} from "../../utils/dateUtils";

/** ✅ 안전 숫자 변환 (NaN 방지) */
function toInt(v) {
  if (v == null) return 0;
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** ✅ 안전 boolean 변환 */
function toBool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return fallback;
}

/** ✅ 부서 출력 순서 고정 */
function getDeptOrder(dept) {
  const d = String(dept || "").trim();
  switch (d) {
    case "1청년부":
      return 1;
    case "2청년부":
      return 2;
    case "3청년부":
      return 3;
    case "4청년부":
      return 4;
    case "그 외":
      return 5;
    default:
      return 99;
  }
}

function sortDeptRows(rows) {
  return [...rows].sort((a, b) => {
    const orderDiff = getDeptOrder(a?.dept) - getDeptOrder(b?.dept);
    if (orderDiff !== 0) return orderDiff;
    return String(a?.dept || "").localeCompare(String(b?.dept || ""), "ko");
  });
}

/**
 * ✅ 서버 최종 통계 응답만 사용
 * - 프론트에서 bySlot 재합산하지 않음
 * - overallByDept / overallTotal / countRule / excludeOperator / includeWaitlist
 *   를 그대로 신뢰해서 표시
 */
function normalizeOverallStats(resp, weekStartDate = "") {
  const fallback = getWeeklySelectionStatsFallback(weekStartDate);

  const safe = resp && typeof resp === "object" ? resp : fallback;

  const overallByDept = Array.isArray(safe.overallByDept)
    ? safe.overallByDept
        .map((row) => ({
          dept: String(row?.dept || "").trim(),
          count: toInt(row?.count),
        }))
        .filter((row) => row.dept && row.count >= 0)
    : [];

  return {
    weekStartDate: String(safe.weekStartDate || weekStartDate || ""),
    overallByDept: sortDeptRows(overallByDept),
    overallTotal: toInt(safe.overallTotal),
    countRule: String(safe.countRule || "").trim(),
    excludeOperator: toBool(safe.excludeOperator, false),
    includeWaitlist: toBool(safe.includeWaitlist, false),
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

export default function WeeklySelectionStatsPanel({ weekStartDate }) {
  // ✅ 입력이 Date든 string이든, "일요일 기준 YYYY-MM-DD"로 통일
  const w = useMemo(
    () => toWeekStartDateYYYYMMDD(weekStartDate) || "",
    [weekStartDate]
  );

  const published = isSelectionPublishedNow(new Date());

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(() =>
    normalizeOverallStats(getWeeklySelectionStatsFallback(w), w)
  );

  const load = useCallback(async () => {
    if (!w) {
      setErr("weekStartDate가 올바르지 않습니다.");
      setStats(normalizeOverallStats(getWeeklySelectionStatsFallback(""), ""));
      return;
    }

    setLoading(true);
    setErr("");
    setStats(normalizeOverallStats(getWeeklySelectionStatsFallback(w), w));

    try {
      const resp = await getWeeklySelectionStats(w);
      setStats(normalizeOverallStats(resp, w));
    } catch (e) {
      const status = e?.status;
      if (status === 404) {
        setErr("아직 선정 결과가 생성되지 않았어요.");
      } else {
        setErr("선정 통계를 불러오지 못했습니다.");
      }
      setStats(normalizeOverallStats(getWeeklySelectionStatsFallback(w), w));
    } finally {
      setLoading(false);
    }
  }, [w]);

  useEffect(() => {
    if (!published) return;
    if (w) load();
  }, [published, w, load]);

  const rows = stats.overallByDept || [];
  const total = toInt(stats.overallTotal);
  const ruleText = buildRuleText(stats);

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <h3 className="h3" style={{ margin: 0 }}>
          부서별 선정 통계
        </h3>
        <span className="muted" style={{ fontSize: 12, whiteSpace: "nowrap" }}>
          {w || "-"}
        </span>
      </div>

      <div
        className="muted"
        style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}
      >
        {published ? (
          <>
            ✅ 이 카드는 <b>백엔드 최종 통계</b>를 그대로 표시합니다.
            <br />
            {ruleText}
          </>
        ) : (
          <>
            ⏳ 통계는 <b>수요일 저녁 8시</b> 이후 공개됩니다.
          </>
        )}
      </div>

      <div style={{ marginTop: 12 }}>
        {!published ? (
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            아직 공개 전입니다.
            <br />
            수요일 20시 이후에 다시 확인해 주세요.
          </div>
        ) : loading ? (
          <div className="muted" style={{ fontSize: 13 }}>
            불러오는 중...
          </div>
        ) : err ? (
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {err}
            <div style={{ marginTop: 10 }}>
              <button className="btn ghost" type="button" onClick={load}>
                재시도
              </button>
            </div>
          </div>
        ) : rows.length === 0 ? (
          <div className="muted" style={{ fontSize: 13 }}>
            표시할 통계가 없습니다.
          </div>
        ) : (
          <div>
            <div
              style={{
                marginBottom: 10,
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              전체 고유 선정 인원: {total}명
            </div>

            <div
              className="muted"
              style={{
                fontSize: 12,
                marginBottom: 10,
                lineHeight: 1.5,
              }}
            >
              집계 기준: {ruleText}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {rows.map((s) => (
                <span
                  key={s.dept}
                  style={{
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.10)",
                    padding: "6px 10px",
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {s.dept}: {s.count}명
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}