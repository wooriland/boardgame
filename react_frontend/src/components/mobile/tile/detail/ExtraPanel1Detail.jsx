import "./tileDetails.css";

export default function ExtraPanel1Detail() {
  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-heroMain">
          <h2 className="td-title">추가 패널 영역 #1</h2>
          <p className="td-subtitle">
            이 영역은 커뮤니티 콘텐츠를 확장하기 위한 공간이에요.
          </p>
        </div>
      </section>

      <section className="td-card">
        <div className="td-kicker">PLAN</div>
        <div className="td-cardTitle">배치 가능한 콘텐츠</div>
        <ul className="td-bullets">
          <li>공지 링크</li>
          <li>사진 모음</li>
          <li>플레이 후기</li>
          <li>외부 게시판 연결</li>
          <li>행사 안내 카드</li>
        </ul>
      </section>

      <section className="td-card">
        <div className="td-kicker">NEXT STEP</div>
        <div className="td-cardTitle">다음 구현 방향</div>
        <div className="td-cardText">
          지금은 텍스트 중심 안내 화면으로 두고, 이후 게시판이나 이미지형 카드로
          확장하면 자연스럽게 연결할 수 있습니다.
        </div>
      </section>
    </div>
  );
}