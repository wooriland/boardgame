// ✅ 파일: src/components/sections/FooterInfo.jsx
// 목적: 기업형 페이지용 Footer(정보용)
// ⚠️ 하단 고정 FooterNav(기능 메뉴)와 역할이 다르다.
// ✅ Home에서 glass 껍데기를 감싸므로 내용만 렌더

export default function FooterInfo() {
  return (
    <div aria-label="footer-info">
      <div style={{ fontWeight: 900 }}>WOORILAND</div>

      <div className="muted" style={{ marginTop: 8, lineHeight: 1.6, fontSize: 13 }}>
        · 코이노니아 보드게임 동아리 운영 보조 플랫폼 (내부 운영용)
        <br />
        · 문의/공지/신청/주간 추천을 안정적으로 관리하는 것이 목표
      </div>

      <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
        © {new Date().getFullYear()} Wooriland. All rights reserved.
      </div>
    </div>
  );
}