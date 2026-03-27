// ✅ 파일: src/components/sections/Hero.jsx
export default function Hero({ rightSlot = null, onPrimaryClick, onSecondaryClick }) {
  return (
    <div aria-label="hero">
      <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.6px" }}>
        한 주에 한 번, <span style={{ color: "var(--brand)" }}>검증된 추천</span>으로
        <br />
        바로 즐기는 보드게임 모임
      </h1>

      <p className="muted" style={{ marginTop: 10, lineHeight: 1.6 }}>
        처음 와도 부담 없게 난이도별(EASY/NORMAL/HARD)로 안내해요.
        <br />
        신청은 간단하게, 운영은 안정적으로.
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
        <button className="btn primary" type="button" onClick={onPrimaryClick}>
          참여 신청하기
        </button>

        {/* ✅ secondary가 있을 때만 렌더 */}
        {typeof onSecondaryClick === "function" ? (
          <button className="btn" type="button" onClick={onSecondaryClick}>
            금주의 추천 보기(모달)
          </button>
        ) : null}
      </div>

      {rightSlot ? <div style={{ marginTop: 14 }}>{rightSlot}</div> : null}
    </div>
  );
}