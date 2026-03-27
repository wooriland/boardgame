// ✅ 파일: src/components/sections/DeptStatsPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { api } from "../../api/apiClient";

// ✅ ISO 금지, 로컬 YYYY-MM-DD
function normalizeYYYYMMDD(v) {
  if (!v) return "";
  if (v instanceof Date) {
    const yyyy = v.getFullYear();
    const mm = String(v.getMonth() + 1).padStart(2, "0");
    const dd = String(v.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
    return v.slice(0, 10);
  }
  return String(v);
}

function toInt(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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
 * ✅ DeptStatsPanel
 *
 * 역할:
 * - "신청 현황" 전용 카드
 * - 선정 통계가 아니라, 이번 주 신청 데이터를 보여준다.
 *
 * @param {string|Date} weekStartDate - YYYY-MM-DD 또는 Date
 * @param {"card"|"plain"} variant
 *  - "card"(기본): 자체 래퍼 스타일 사용
 *  - "plain": 이미 카드 안에 들어갈 때 중복 래퍼 제거
 */
export default function DeptStatsPanel({ weekStartDate, variant = "card" }) {
  const w = useMemo(() => normalizeYYYYMMDD(weekStartDate), [weekStartDate]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setErr(null);

        const res = await api.get("/api/applications/summary", {
          params: { weekStartDate: w },
        });

        if (!alive) return;
        setData(res);
      } catch (e) {
        if (!alive) return;

        const status = e?.status;
        const serverMsg =
          e?.body?.message ||
          e?.body?.error ||
          e?.bodyText ||
          e?.message ||
          "불러오기에 실패했습니다.";

        let msg = serverMsg;
        if (status === 404) {
          msg = "신청 현황 API가 아직 서버에 반영되지 않았어요. (404)";
        } else if (status === 400) {
          msg = "weekStartDate 형식이 잘못됐어요. (YYYY-MM-DD)";
        } else if (status === 401 || status === 403) {
          msg = "권한 문제로 조회할 수 없어요.";
        } else if (status >= 500) {
          msg = "서버 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
        }

        setErr(msg);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [w]);

  const rows = useMemo(() => {
    const list = Array.isArray(data?.byDept) ? data.byDept : [];

    const normalized = list
      .map((row) => ({
        dept: String(row?.dept || "").trim(),
        total: toInt(row?.total),
      }))
      .filter((row) => row.dept);

    return sortDeptRows(normalized);
  }, [data]);

  const total = toInt(data?.total);
  const wrapperClass = variant === "plain" ? "" : "glassCard";

  return (
    <section className={wrapperClass}>
      <div className="panelHeader">
        <h3>부서별 신청 현황</h3>
        <span className="subtle">{w || "-"}</span>
      </div>

      <div className="subtle" style={{ marginBottom: 10, lineHeight: 1.5 }}>
        이 카드는 <b>신청 현황</b>을 보여줍니다.
        <br />
        선정 통계가 아니라, 이번 주에 신청한 인원을 기준으로 집계합니다.
      </div>

      {loading && <div className="subtle">불러오는 중…</div>}

      {!loading && err && <div className="subtle">⚠ {err}</div>}

      {!loading && !err && data && (
        <>
          <div className="subtle" style={{ marginBottom: 10 }}>
            전체 신청자: <b>{total}</b>명
          </div>

          <div className="deptList">
            {rows.length === 0 ? (
              <div className="subtle">표시할 데이터가 없어요.</div>
            ) : (
              rows.map((row) => (
                <div className="deptRow" key={row.dept}>
                  <div className="deptName">{row.dept}</div>
                  <div className="deptNums">
                    <span>
                      신청 <b>{row.total}</b>명
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </section>
  );
}