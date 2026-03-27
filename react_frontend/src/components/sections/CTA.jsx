// ✅ 파일: src/components/sections/CTA.jsx
// 목적: 원페이지 중간/하단 CTA 배너(강하게)
// ✅ Home에서 glass 껍데기를 감싸므로 내용만 렌더

export default function CTA({ onClick }) {
  return (
    <div aria-label="cta">
      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 900 }}>이번 주 모임, 참여해볼래요?</div>
          <div className="muted" style={{ marginTop: 6 }}>
            신청은 30초면 끝. 운영자가 확인하고 안내해요.
          </div>
        </div>

        <button className="btn primary" type="button" onClick={onClick}>
          참여 신청하기
        </button>
      </div>
    </div>
  );
}