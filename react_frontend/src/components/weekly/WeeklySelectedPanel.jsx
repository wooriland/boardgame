// ✅ 파일: src/components/weekly/WeeklySelectedPanel.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  extractWeeklySelectionSlotMap,
  getWeeklySelection,
} from "../../api/weeklySelectionApi";
import {
  isSelectionPublishedNow,
  toWeekStartDateYYYYMMDD,
} from "../../utils/dateUtils";

// ✅ row UI
function Row({ dept, name, isOperator, status, waitlistRank }) {
  const deptText = dept || "UNKNOWN";
  const nameText = name || "-";

  const st = String(status || "").toUpperCase();
  const isWaitlist = st === "WAITLIST";

  return (
    <div
      style={{ display: "flex", gap: 8, alignItems: "baseline", lineHeight: 1.6 }}
    >
      <span style={{ fontWeight: 900, opacity: 0.95, whiteSpace: "nowrap" }}>
        {deptText}:
      </span>
      <span style={{ opacity: 0.95 }}>
        {nameText}
        {isOperator ? " ⭐" : ""}
        {isWaitlist ? ` (예비 ${waitlistRank ?? "-"})` : ""}
      </span>
    </div>
  );
}

// ✅ box UI
function Box({ title, children }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: 12,
        background: "rgba(0,0,0,0.18)",
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 900, opacity: 0.85 }}>{title}</div>
      <div style={{ marginTop: 8 }}>{children}</div>
    </div>
  );
}

function ListBlock({ title, items }) {
  const list = Array.isArray(items) ? items : [];

  return (
    <Box title={title}>
      {list.length === 0 ? (
        <div className="muted" style={{ fontSize: 13 }}>
          (표시할 항목이 없습니다)
        </div>
      ) : (
        <div style={{ display: "grid", gap: 6 }}>
          {list.map((x, idx) => (
            <Row
              key={`${x?.applicationId ?? "APP"}-${idx}`}
              dept={x?.dept}
              name={x?.name}
              isOperator={x?.isOperator}
              status={x?.status}
              waitlistRank={x?.waitlistRank}
            />
          ))}
        </div>
      )}
    </Box>
  );
}

function pickBetterArray(primary, fallback) {
  const a = Array.isArray(primary) ? primary : [];
  const b = Array.isArray(fallback) ? fallback : [];

  if (a.length > 0) return a;
  if (b.length > 0) return b;
  return a.length >= b.length ? a : b;
}

function normalizeSlotMap(rawSlots, resp) {
  const base = resp?.data ?? resp ?? {};
  const raw = rawSlots && typeof rawSlots === "object" ? rawSlots : {};

  return {
    EASY: pickBetterArray(raw.EASY, raw.easy ?? base.easy ?? base.EASY),
    NORMAL: pickBetterArray(raw.NORMAL, raw.normal ?? base.normal ?? base.NORMAL),
    HARD: pickBetterArray(raw.HARD, raw.hard ?? base.hard ?? base.HARD),
  };
}

export default function WeeklySelectedPanel({ weekStartDate }) {
  // ✅ weekStartDate 입력이 Date든 string이든 → "일요일 기준 YYYY-MM-DD"
  const w = useMemo(
    () => toWeekStartDateYYYYMMDD(weekStartDate) || "",
    [weekStartDate]
  );

  // ✅ “수요일 20시 이후 공개”
  const published = isSelectionPublishedNow(new Date());

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [slotMap, setSlotMap] = useState({ EASY: [], NORMAL: [], HARD: [] });

  const load = useCallback(async () => {
    if (!w) {
      setErr("weekStartDate가 올바르지 않습니다.");
      setSlotMap({ EASY: [], NORMAL: [], HARD: [] });
      return;
    }

    setLoading(true);
    setErr("");
    setSlotMap({ EASY: [], NORMAL: [], HARD: [] });

    try {
      console.log("[WeeklySelectedPanel] weekStartDate =", w);
      const resp = await getWeeklySelection(w);
      console.log("[WeeklySelectedPanel] raw response =", resp);
      console.log("[WeeklySelectedPanel] response.data =", resp?.data);

      const extracted = extractWeeklySelectionSlotMap(resp);
      const slots = normalizeSlotMap(extracted, resp);

      console.log("[WeeklySelectedPanel] slotMap =", slots);
      console.log("[WeeklySelectedPanel] counts =", {
        EASY: Array.isArray(slots?.EASY) ? slots.EASY.length : -1,
        NORMAL: Array.isArray(slots?.NORMAL) ? slots.NORMAL.length : -1,
        HARD: Array.isArray(slots?.HARD) ? slots.HARD.length : -1,
      });

      setSlotMap(slots);
    } catch (e) {
      const status = e?.status;
      if (status === 404) {
        setErr("아직 이번 주 참여자 명단이 생성되지 않았어요.");
      } else {
        setErr("참여자 명단을 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  }, [w]);

  useEffect(() => {
    // ✅ 공개 전이면 API 호출 안 함
    if (!published) return;
    if (w) load();
  }, [published, w, load]);

  return (
    <div style={{ minHeight: "100%" }}>
      <div style={{ fontWeight: 900 }}>이번 주 참여자</div>

      <div
        className="muted"
        style={{ fontSize: 13, marginTop: 6, lineHeight: 1.5 }}
      >
        {published ? (
          <>
            ✅ 수요일 20시 이후 공개된 참여자 명단입니다.
            <br />
            EASY / NORMAL / HARD별 참가자 목록을 보여줍니다.
          </>
        ) : (
          <>
            ⏳ 참여자 명단은 <b>수요일 저녁 8시</b>에 공개됩니다.
            <br />
            공개 전에는 명단과 선정 통계를 표시하지 않습니다.
          </>
        )}
      </div>

      <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
        <Box title="기준 주차">
          <div style={{ fontSize: 14, fontWeight: 800 }}>{w || "-"}</div>
        </Box>

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
        ) : (
          <>
            <ListBlock title="EASY" items={slotMap.EASY} />
            <ListBlock title="NORMAL" items={slotMap.NORMAL} />
            <ListBlock title="HARD" items={slotMap.HARD} />
          </>
        )}
      </div>
    </div>
  );
}