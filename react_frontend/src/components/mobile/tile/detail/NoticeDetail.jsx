import "./tileDetails.css";

export default function NoticeDetail() {
  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-heroMain">
          <h2 className="td-title">공지</h2>
          <p className="td-subtitle">
            동아리 운영과 참여를 위해 알아두면 좋은 기본 공지 영역입니다.
          </p>
        </div>
      </section>

      <section className="td-card">
        <div className="td-kicker">NOTICE</div>
        <div className="td-cardTitle">기본 안내</div>
        <ul className="td-bullets">
          <li>참여 조건과 운영 일정을 먼저 확인해 주세요.</li>
          <li>주간 추천과 신청 기간은 주차 기준으로 갱신됩니다.</li>
          <li>상세 공지 기능은 추후 게시판과 연결할 수 있습니다.</li>
        </ul>
      </section>

      <section className="td-card">
        <div className="td-kicker">FUTURE</div>
        <div className="td-cardTitle">확장 계획</div>
        <div className="td-cardText">
          이후에는 실제 공지 목록, 중요 공지 상단 고정, 일정 카드 등을 붙여서 더
          실서비스에 가깝게 만들 수 있습니다.
        </div>
      </section>
    </div>
  );
}