// ✅ 파일: src/components/views/JoinView.jsx
import { useEffect, useMemo, useState } from "react";
import { getApplyOptions, postApplication } from "../../api/applyApi";

/**
 * ✅ 참여 신청 뷰
 *
 * 적용 사항
 * - 모달 내부 "취소" 버튼 제거
 * - 슬롯 선택 UI 정리
 * - 연락처 숫자만 저장
 * - 신청 인원 입력 안정화
 * - "그 외"가 아닐 때 deptEtc 자동 정리
 * - 입력/슬롯 변경 시 경고 자동 해제
 * - 신청 옵션 API 실패 시 fallback 라벨 사용
 */
export default function JoinView({ onClose }) {
  // -------------------------
  // 폼 상태
  // -------------------------
  const [dept, setDept] = useState("");
  const [deptEtc, setDeptEtc] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [peopleCount, setPeopleCount] = useState("1");

  // timeSlots
  const [slotEasy, setSlotEasy] = useState(false);
  const [slotNormal, setSlotNormal] = useState(false);
  const [slotHard, setSlotHard] = useState(false);

  // 경고 메시지
  const [warn, setWarn] = useState("");
  const [slotWarn, setSlotWarn] = useState("");

  // 신청 옵션(라벨)
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [options, setOptions] = useState(null); // { weekStartDate, options:[...] }

  // -------------------------
  // 유틸
  // -------------------------
  const phoneDigits = useMemo(
    () => String(phone || "").replace(/\D/g, ""),
    [phone]
  );

  const normalizedDept = useMemo(() => String(dept || "").trim(), [dept]);
  const normalizedDeptEtc = useMemo(() => String(deptEtc || "").trim(), [deptEtc]);
  const normalizedName = useMemo(() => String(name || "").trim(), [name]);

  function slotTimeTextFallback(slot) {
    switch (String(slot || "").toUpperCase()) {
      case "EASY":
        return "13:00~14:00";
      case "NORMAL":
        return "14:00~15:00";
      case "HARD":
        return "15:00~16:00";
      default:
        return "";
    }
  }

  // ✅ 선택된 슬롯 배열
  const selectedSlots = useMemo(() => {
    const s = [];
    if (slotEasy) s.push("EASY");
    if (slotNormal) s.push("NORMAL");
    if (slotHard) s.push("HARD");
    return s;
  }, [slotEasy, slotNormal, slotHard]);

  const hasAnySlot = selectedSlots.length > 0;

  const finalDept = useMemo(() => {
    if (normalizedDept === "그 외") {
      return normalizedDeptEtc;
    }
    return normalizedDept;
  }, [normalizedDept, normalizedDeptEtc]);

  // -------------------------
  // ✅ 신청 옵션 API 로드
  // -------------------------
  async function loadOptions() {
    setOptionsLoading(true);

    try {
      const res = await getApplyOptions();

      if (!res?.weekStartDate || !Array.isArray(res?.options)) {
        console.warn("[apply/options] 응답 구조가 예상과 다름:", res);
        setOptions(null);
        return;
      }

      setOptions(res);
    } catch (e) {
      console.error(e);
      setOptions(null);
    } finally {
      setOptionsLoading(false);
    }
  }

  useEffect(() => {
    loadOptions();
  }, []);

  // ✅ 소속부서가 "그 외"가 아니면 직접입력값 정리
  useEffect(() => {
    if (dept !== "그 외" && deptEtc) {
      setDeptEtc("");
    }
  }, [dept, deptEtc]);

  // ✅ 입력이 바뀌면 경고 자동 해제
  useEffect(() => {
    if (warn) {
      setWarn("");
    }
  }, [dept, deptEtc, name, phone, peopleCount, warn]);

  // ✅ 슬롯이 바뀌면 슬롯 경고 자동 해제
  useEffect(() => {
    if (slotWarn && hasAnySlot) {
      setSlotWarn("");
    }
  }, [slotEasy, slotNormal, slotHard, hasAnySlot, slotWarn]);

  // -------------------------
  // ✅ 라벨 생성
  // -------------------------
  const slotLabelMap = useMemo(() => {
    const map = new Map();

    const opts = options?.options || [];
    for (const it of opts) {
      if (!it?.slot) continue;
      map.set(String(it.slot).toUpperCase(), it);
    }

    function makeText(slot) {
      const it = map.get(slot);
      if (!it) {
        return `${slot}(${slotTimeTextFallback(slot)})`;
      }

      const time = it?.timeText || slotTimeTextFallback(slot);
      const gameName = it?.gameName || "(미정)";
      const cnt = typeof it?.applyCount === "number" ? it.applyCount : 0;

      const minP = it?.minPlayers;
      const maxP = it?.maxPlayers;
      const peopleText =
        minP != null && maxP != null
          ? ` · ${minP}~${maxP}인`
          : minP != null
          ? ` · ${minP}인 이상`
          : maxP != null
          ? ` · 최대 ${maxP}인`
          : "";

      return `${slot}(${time}) ${gameName} (${cnt})${peopleText}`;
    }

    return {
      EASY: makeText("EASY"),
      NORMAL: makeText("NORMAL"),
      HARD: makeText("HARD"),
    };
  }, [options]);

  // -------------------------
  // ✅ 폼 유효성 검사
  // -------------------------
  const formOk = useMemo(() => {
    if (!finalDept || !normalizedName || !phoneDigits) return false;

    // 전화번호 10~11자리
    if (phoneDigits.length < 10 || phoneDigits.length > 11) return false;

    const pc = Number(String(peopleCount || "").trim());
    if (!Number.isFinite(pc) || pc < 1 || pc > 99) return false;

    return true;
  }, [finalDept, normalizedName, phoneDigits, peopleCount]);

  const showSlotPanel = formOk;
  const canSubmit = formOk && hasAnySlot;

  // -------------------------
  // ✅ 제출(payload 생성)
  // -------------------------
  function buildPayload() {
    const pc = Number(String(peopleCount || "").trim());

    return {
      dept: finalDept,
      name: normalizedName,
      phone: phoneDigits,
      peopleCount: Number.isFinite(pc) ? pc : 1,
      timeSlots: selectedSlots.map((s) => String(s).toUpperCase()),
    };
  }

  async function onSubmit(e) {
    e.preventDefault();
    setWarn("");
    setSlotWarn("");

    if (!formOk) {
      setWarn("모든 정보를 올바르게 입력해주세요.");
      return;
    }

    if (!hasAnySlot) {
      setSlotWarn("시간대를 1개 이상 선택해주세요.");
      return;
    }

    const payload = buildPayload();

    console.log("[POST /api/applications] payload =", payload);

    try {
      const res = await postApplication(payload);
      alert(res?.message || "참여 신청이 완료 되었습니다!");
      onClose?.();
    } catch (err) {
      console.error(err);

      const msg =
        err?.data?.message ||
        err?.message ||
        "저장에 실패했습니다. 서버 로그를 확인해주세요.";

      alert(msg);
    }
  }

  return (
    <section>
      {warn && <p className="modal-warning">{warn}</p>}

      <form onSubmit={onSubmit}>
        <label className="field">
          <span className="field-label">소속부서</span>
          <select
            className="field-input"
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            required
          >
            <option value="">선택하세요</option>
            <option value="1청년부">1청년부</option>
            <option value="2청년부">2청년부</option>
            <option value="3청년부">3청년부</option>
            <option value="4청년부">4청년부</option>
            <option value="그 외">그 외</option>
          </select>
        </label>

        {dept === "그 외" && (
          <label className="field">
            <span className="field-label">소속부서(직접입력)</span>
            <input
              className="field-input"
              type="text"
              placeholder="예: 신혼다락방"
              value={deptEtc}
              onChange={(e) => setDeptEtc(e.target.value)}
            />
          </label>
        )}

        <label className="field">
          <span className="field-label">이름</span>
          <input
            className="field-input"
            type="text"
            placeholder="홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">연락처</span>
          <input
            className="field-input"
            type="tel"
            inputMode="numeric"
            placeholder="01012345678"
            value={phone}
            maxLength={11}
            onChange={(e) => {
              const digitsOnly = String(e.target.value || "").replace(/\D/g, "");
              setPhone(digitsOnly);
            }}
            required
          />
        </label>

        <label className="field">
          <span className="field-label">신청 인원</span>
          <input
            className="field-input"
            type="number"
            min="1"
            max="99"
            value={peopleCount}
            onChange={(e) => setPeopleCount(e.target.value)}
            inputMode="numeric"
            aria-describedby="peopleCountHint"
          />
          <small id="peopleCountHint" className="field-hint">
            예: 3명 같이 참여면 3 입력
          </small>
        </label>

        {showSlotPanel && (
          <div className="slot-panel">
            <p className="modal-text" style={{ marginTop: 8 }}>
              참여할 시간대를 선택해주세요. (복수 선택 가능)
            </p>

            <div
              style={{
                display: "grid",
                gap: 10,
                marginTop: 10,
              }}
            >
              <label
                className="slot-item"
                style={{ display: "flex", gap: 10, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={slotEasy}
                  onChange={(e) => setSlotEasy(e.target.checked)}
                />
                <span>{slotLabelMap.EASY}</span>
              </label>

              <label
                className="slot-item"
                style={{ display: "flex", gap: 10, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={slotNormal}
                  onChange={(e) => setSlotNormal(e.target.checked)}
                />
                <span>{slotLabelMap.NORMAL}</span>
              </label>

              <label
                className="slot-item"
                style={{ display: "flex", gap: 10, alignItems: "center" }}
              >
                <input
                  type="checkbox"
                  checked={slotHard}
                  onChange={(e) => setSlotHard(e.target.checked)}
                />
                <span>{slotLabelMap.HARD}</span>
              </label>
            </div>

            {slotWarn && (
              <p className="modal-warning" style={{ marginTop: 10 }}>
                {slotWarn}
              </p>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button type="submit" className="btn" disabled={!canSubmit}>
            참여 신청하기
          </button>
        </div>

        <p
          className="muted"
          style={{ marginTop: 10, fontSize: 12, lineHeight: 1.5 }}
        >
          닫기: 바깥을 클릭하거나 ESC를 누르면 됩니다.
        </p>

        {optionsLoading && (
          <p className="modal-text" style={{ marginTop: 10, opacity: 0.7 }}>
            신청 옵션 불러오는 중...
          </p>
        )}
      </form>
    </section>
  );
}