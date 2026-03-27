// ✅ 파일: src/components/sections/Header.jsx
// 목적: 데스크탑(PC) 화면 상단에서 "유리(blur) 카드 톤" + 기업형 원페이지 메뉴/CTA
// 보완:
// - 게시판으로 바로 이동할 수 있는 버튼 추가
// - 헤더에서는 게시판 세션/토큰을 직접 건드리지 않음
// - 모바일에서는 Home.jsx 분기에서 Header를 렌더하지 않게 한다(= MobileHeader 사용)

export default function Header() {
  return (
    <header
      aria-label="header"
      style={{
        position: "sticky",
        top: 0,
        zIndex: 60,
        paddingTop: 12,
        background:
          "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0))",
        backdropFilter: "blur(8px)",
      }}
    >
      <div className="container">
        <section className="section" style={{ margin: 0 }} aria-label="header-card">
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
            }}
          >
            {/* 로고/브랜드 */}
            <div style={{ minWidth: 210 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  letterSpacing: "-0.3px",
                }}
              >
                WOORILAND
              </div>
              <div className="muted" style={{ fontSize: 13 }}>
                코이노니아 · 보드게임 동아리 · 주간 추천 · 참여 신청
              </div>
            </div>
          </div>
        </section>
      </div>
    </header>
  );
}