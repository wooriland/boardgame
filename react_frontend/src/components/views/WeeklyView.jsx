// ✅ 파일: src/components/views/WeeklyView.jsx
import { useEffect, useMemo, useState } from "react";
import { getWeeklyRecommend } from "../../api/recommendApi";
import {
  extractWeeklySelectionSlotMap,
  getWeeklySelection,
  getWeeklySelectionStats,
  getWeeklySelectionStatsFallback,
} from "../../api/weeklySelectionApi";
import {
  isSelectionPublishedNow,
  toWeekStartDateYYYYMMDD,
} from "../../utils/dateUtils";

import DeptStatsPanel from "../sections/DeptStatsPanel";

/**
 * ✅ WeeklyView (공용 모달)
 *
 * ✅ 목표(UI)
 * - 좌측 3등분(3개 카드):
 *   1) 이번 주 참여자(선정 명단)
 *   2) 부서별 선정 통계
 *   3) 부서별 신청 현황
 * - 우측 패널:
 *   - 금주의 추천(EASY/NORMAL/HARD)
 *
 * ✅ 공개 정책
 * - 선정 명단/선정 통계: 수요일 20시 이후에만 공개
 * - 부서별 신청 현황: 공개 전에도 볼 수 있음(운영측/집계)
 *
 * ✅ 핵심 원칙
 * - 추천 / 선정 명단 / 선정 통계 / 신청 통계를 각각 독립적으로 관리
 * - 한 카드의 데이터를 다른 카드 계산에 재사용하지 않음
 * - 선정 통계는 백엔드 최종 응답(overallByDept / overallTotal)을 그대로 사용
 */
export default function WeeklyView({ onClose }) {
  // =========================================================
  // ✅ 기준 주차 / 공개 여부
  // =========================================================
  const weekStartDate = useMemo(
    () => toWeekStartDateYYYYMMDD(new Date()) || "",
    []
  );
  const published = useMemo(() => isSelectionPublishedNow(new Date()), []);

  // =========================================================
  // ✅ 추천(우측)
  // =========================================================
  const [recLoading, setRecLoading] = useState(true);
  const [recErrorMsg, setRecErrorMsg] = useState("");
  const [recData, setRecData] = useState(null);

  // =========================================================
  // ✅ 선정(좌측 1칸)
  // =========================================================
  const [selLoading, setSelLoading] = useState(true);
  const [selErrorMsg, setSelErrorMsg] = useState("");
  const [selData, setSelData] = useState(null);

  // =========================================================
  // ✅ 선정 통계(좌측 2칸)
  // =========================================================
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsErrorMsg, setStatsErrorMsg] = useState("");
  const [statsData, setStatsData] = useState(() =>
    getWeeklySelectionStatsFallback(weekStartDate)
  );

  // =========================================================
  // ✅ 추천 로드
  // =========================================================
  async function loadRecommend() {
    setRecLoading(true);
    setRecErrorMsg("");
    setRecData(null);

    try {
      const res = await getWeeklyRecommend();
      const data = res?.data ?? res;

      // ✅ 기존 가정 유지: {easy, normal, hard}
      if (!data?.easy || !data?.normal || !data?.hard) {
        setRecErrorMsg("추천 데이터 형식이 올바르지 않습니다.");
        return;
      }

      setRecData(data);
    } catch (e) {
      console.error(e);
      setRecErrorMsg("서버 연결에 실패했습니다. (API 주소/HTTPS/CORS 확인)");
    } finally {
      setRecLoading(false);
    }
  }

  // =========================================================
  // ✅ 선정 명단 로드(공개 후)
  // =========================================================
  async function loadSelection() {
    setSelLoading(true);
    setSelErrorMsg("");
    setSelData(null);

    try {
      console.log("[WeeklyView] weekStartDate =", weekStartDate);
      const res = await getWeeklySelection(weekStartDate);
      console.log("[WeeklyView] raw response =", res);
      const data = res?.data ?? res;
      console.log("[WeeklyView] response.data =", res?.data);
      console.log("[WeeklyView] base payload =", data);
      setSelData(data);

      const slotMap = extractWeeklySelectionSlotMap(data);
      const selectedCounts = {
        EASY: slotMap.EASY.length,
        NORMAL: slotMap.NORMAL.length,
        HARD: slotMap.HARD.length,
      };
      console.log("[WeeklyView] counts =", selectedCounts);
    } catch (e) {
      console.error(e);
      if (e?.status === 404) {
        setSelErrorMsg("아직 이번 주 참여자 명단이 생성되지 않았어요.");
      } else {
        setSelErrorMsg("참여자 명단을 불러오지 못했습니다.");
      }
    } finally {
      setSelLoading(false);
    }
  }

  // =========================================================
  // ✅ 선정 통계 로드(공개 후)
  // =========================================================
  async function loadStats() {
    setStatsLoading(true);
    setStatsErrorMsg("");
    setStatsData(getWeeklySelectionStatsFallback(weekStartDate));

    try {
      const res = await getWeeklySelectionStats(weekStartDate);
      const data = res?.data ?? res;
      setStatsData(normalizeStatsResponse(data, weekStartDate));
    } catch (e) {
      console.error(e);
      if (e?.status === 404) {
        setStatsErrorMsg("통계 데이터가 아직 없습니다.");
      } else {
        setStatsErrorMsg("통계를 불러오지 못했습니다.");
      }
      setStatsData(getWeeklySelectionStatsFallback(weekStartDate));
    } finally {
      setStatsLoading(false);
    }
  }

  // =========================================================
  // ✅ mount 시 로드
  // =========================================================
  useEffect(() => {
    loadRecommend();

    if (published) {
      loadSelection();
      loadStats();
    } else {
      // ✅ 공개 전은 “대기 상태”로 표시
      setSelLoading(false);
      setStatsLoading(false);
      setStatsData(getWeeklySelectionStatsFallback(weekStartDate));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // ✅ 추천 카드 렌더용 (우측)
  // =========================================================
  const recommendItems = [
    { label: "EASY", value: recData?.easy },
    { label: "NORMAL", value: recData?.normal },
    { label: "HARD", value: recData?.hard },
  ];

  // =========================================================
  // ✅ 선정 리스트 정규화 (좌측 1칸)
  // - 메인 카드와 동일한 공통 기준으로 해석
  // =========================================================
  const selected = extractWeeklySelectionSlotMap(selData);

  const statsRows = Array.isArray(statsData?.overallByDept)
    ? statsData.overallByDept
    : [];
  const statsTotal = toInt(statsData?.overallTotal);
  const statsRuleText = buildRuleText(statsData);

  return (
    <section>
      {/* ✅ 전체 레이아웃: 좌(3등분) + 우(추천) */}
      <div className="weekly-modal-grid">
        {/* =====================================================
            ✅ LEFT: 3등분
            ===================================================== */}
        <div className="weekly-modal-left">
          {/* 1) 이번 주 참여자 */}
          <div className="weekly-modal-card">
            <div className="weekly-modal-scroll">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                이번 주 참여자
              </div>

              <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                {published
                  ? "✅ 수요일 20시 이후 공개된 참여자 명단입니다."
                  : "⏳ 참여자 명단은 수요일 20시에 공개됩니다."}
              </div>

              {!published ? (
                <div style={{ marginTop: 12 }} className="muted">
                  아직 공개 전입니다.
                  <br />
                  수요일 20시 이후에 다시 확인해 주세요.
                </div>
              ) : selLoading ? (
                <div style={{ marginTop: 12 }} className="muted">
                  참여자 명단 불러오는 중...
                </div>
              ) : selErrorMsg ? (
                <div style={{ marginTop: 12 }}>
                  <div className="muted" style={{ lineHeight: 1.6 }}>
                    {selErrorMsg}
                  </div>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ marginTop: 10 }}
                    onClick={() => {
                      loadSelection();
                    }}
                  >
                    다시 불러오기
                  </button>
                </div>
              ) : (
                <>
                  <SelectionSection title="EASY" items={selected.EASY} />
                  <SelectionSection title="NORMAL" items={selected.NORMAL} />
                  <SelectionSection title="HARD" items={selected.HARD} />
                </>
              )}
            </div>
          </div>

          {/* 2) 부서별 선정 통계 */}
          <div className="weekly-modal-card">
            <div className="weekly-modal-scroll">
              <div style={{ fontWeight: 900, marginBottom: 6 }}>
                부서별 선정 통계
              </div>

              <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                {published ? (
                  <>
                    ✅ 백엔드 최종 통계를 그대로 표시합니다.
                    <br />
                    {statsRuleText}
                  </>
                ) : (
                  "⏳ 선정 통계는 수요일 20시 이후 공개됩니다."
                )}
              </div>

              {!published ? (
                <div style={{ marginTop: 12 }} className="muted">
                  아직 공개 전입니다.
                </div>
              ) : statsLoading ? (
                <div style={{ marginTop: 12 }} className="muted">
                  통계 불러오는 중...
                </div>
              ) : statsErrorMsg ? (
                <div style={{ marginTop: 12 }}>
                  <div className="muted" style={{ lineHeight: 1.6 }}>
                    {statsErrorMsg}
                  </div>
                  <button
                    type="button"
                    className="btn ghost"
                    style={{ marginTop: 10 }}
                    onClick={loadStats}
                  >
                    다시 불러오기
                  </button>
                </div>
              ) : statsRows.length === 0 ? (
                <div style={{ marginTop: 12 }} className="muted">
                  표시할 통계가 없습니다.
                </div>
              ) : (
                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                  <div style={{ fontSize: 14, fontWeight: 800 }}>
                    전체 고유 선정 인원: {statsTotal}명
                  </div>

                  <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
                    집계 기준: {statsRuleText}
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {statsRows.map((row) => (
                      <span
                        key={row.dept}
                        style={{
                          border: "1px solid var(--line)",
                          borderRadius: 999,
                          padding: "4px 10px",
                          background: "rgba(0,0,0,0.18)",
                          fontSize: 12,
                        }}
                      >
                        {row.dept}: <b>{toInt(row.count)}</b>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 3) 부서별 신청 현황 (항상 표시) */}
          <div className="weekly-modal-card">
            <div className="weekly-modal-scroll">
              <DeptStatsPanel weekStartDate={weekStartDate} />
            </div>
          </div>
        </div>

        {/* =====================================================
            ✅ RIGHT: 추천(EASY/NORMAL/HARD)
            ===================================================== */}
        <div className="weekly-modal-card">
          <div className="weekly-modal-scroll">
            <div style={{ fontWeight: 900, marginBottom: 6 }}>금주의 추천</div>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              (일요일 기준으로 자동 갱신됩니다)
              <br />
              {recData?.weekStartDate
                ? `(기준일: ${recData.weekStartDate})`
                : `(기준일: ${weekStartDate})`}
            </div>

            {recLoading ? (
              <p className="weekly-status" aria-live="polite">
                추천 불러오는 중...
              </p>
            ) : recErrorMsg ? (
              <>
                <p className="weekly-status" aria-live="polite">
                  {recErrorMsg}
                </p>
                <div
                  className="modal-actions"
                  style={{ justifyContent: "space-between" }}
                >
                  <button type="button" className="btn ghost" onClick={loadRecommend}>
                    재시도
                  </button>
                </div>
              </>
            ) : (
              <div className="weekly-cards" style={{ marginTop: 12 }}>
                {recommendItems.map((it) => {
                  const name = it.value?.name ?? "(데이터 없음)";
                  const desc = it.value?.description ?? "";
                  const diff = it.value?.difficulty ?? it.label;

                  const minP = it.value?.minPlayers;
                  const maxP = it.value?.maxPlayers;
                  const peopleText =
                    minP != null && maxP != null
                      ? `${minP}~${maxP}인`
                      : minP != null
                      ? `${minP}인 이상`
                      : maxP != null
                      ? `최대 ${maxP}인`
                      : "";

                  return (
                    <article
                      key={it.label}
                      className="mini-card"
                      data-difficulty={diff}
                    >
                      <div className="mini-card-badge">{diff}</div>
                      <h4 className="mini-card-title">{name}</h4>
                      {peopleText && (
                        <div className="mini-card-meta">{peopleText}</div>
                      )}
                      <p className="mini-card-desc">{desc}</p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ 하단 버튼 */}
      <div className="modal-actions" style={{ marginTop: 18 }}>
        <button type="button" className="btn" onClick={onClose}>
          확인
        </button>
      </div>
    </section>
  );
}

/** ✅ 안전 숫자 변환 */
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

/** ✅ 통계 응답 정규화 */
function normalizeStatsResponse(resp, weekStartDate = "") {
  const src =
    resp && typeof resp === "object"
      ? resp
      : getWeeklySelectionStatsFallback(weekStartDate);

  const overallByDept = Array.isArray(src?.overallByDept)
    ? src.overallByDept
        .map((row) => ({
          dept: String(row?.dept || "").trim(),
          count: toInt(row?.count),
        }))
        .filter((row) => row.dept && row.count >= 0)
    : [];

  return {
    weekStartDate: String(src?.weekStartDate || weekStartDate || ""),
    overallByDept: sortDeptRows(overallByDept),
    overallTotal: toInt(src?.overallTotal),
    countRule: String(src?.countRule || "").trim(),
    excludeOperator: toBool(src?.excludeOperator, false),
    includeWaitlist: toBool(src?.includeWaitlist, false),
  };
}

/** ✅ 집계 규칙 문구 */
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

function SelectionSection({ title, items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{title}</div>

      {list.length === 0 ? (
        <div className="muted" style={{ fontSize: 13 }}>
          (표시할 항목이 없습니다)
        </div>
      ) : (
        <ul style={{ margin: 0, paddingLeft: 16, lineHeight: 1.8 }}>
          {list.map((x, idx) => (
            <li key={`${x?.applicationId ?? "OP"}-${idx}`}>
              <b>{x?.name ?? "-"}</b> ({x?.dept ?? "UNKNOWN"})
              {x?.isOperator ? " ⭐" : ""}
              {String(x?.status || "").toUpperCase() === "WAITLIST"
                ? `  [예비 ${x?.waitlistRank ?? "-"}]`
                : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
