// ✅ 파일: src/components/sections/About.jsx
// 목적: About 4카드(누가/언제/어디서/어떻게) - "내용만" 렌더
// ✅ Home(데스크탑)에서는 glass/section 껍데기를 감싸므로 여기서는 중첩 방지
// ✅ 모바일에서도 동일 컴포넌트를 Detail로 쓰므로, 작은 화면에서 4열이 깨지지 않게 "반응형 그리드"로 변경
//
// 변경 사항(모바일 대응):
// 1) id="about" 유지 (Header/MobileHeader의 '소개' 스크롤 타겟)
// 2) inline grid -> 반응형(auto-fit)로 변경 (모바일 1~2열, 데스크탑 4열)
// 3) 카드 padding/폰트 약간 조정 (모바일 가독성)
// 4) id가 있는 요소가 헤더에 가려질 수 있으니 scrollMarginTop 추가

function AboutCard({ title, desc }) {
  return (
    <div
      style={{
        border: "1px solid var(--line)",
        borderRadius: 14,
        padding: 14,
        background: "rgba(0,0,0,0.22)",
      }}
    >
      <div style={{ fontWeight: 800 }}>{title}</div>
      <div className="muted" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.55 }}>
        {desc}
      </div>
    </div>
  );
}

export default function About() {
  return (
    <div
      id="about"
      aria-label="about"
      style={{
        // ✅ sticky/fixed header에 가려지지 않도록 (모바일 헤더 높이 고려)
        scrollMarginTop: 96,
      }}
    >
      <h2 className="section-title">우리랜드는 이렇게 운영돼요</h2>

      {/* ✅ 반응형 그리드(모바일에서도 깨지지 않게) */}
      <div
        style={{
          display: "block",
          gap: 12,
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
        }}
      >
        <AboutCard title="누가" desc="1청년부~4청년부, 모든 청년교구를 초대합니다." />
        <AboutCard title="언제" desc="모임이 활성화 되는 주의 토요일 오후 1시 ~ 6시까지" />
        <AboutCard title="어디서" desc="드림센터 1011호" />
        <AboutCard
          title="어떻게"
          desc="참여 신청하기 → 부서, 이름, 연락처, 신청인원 입력 → 참여 가능한 시간 체크 후 참여 버튼 클릭"
        />
      </div>
    </div>
  );
}