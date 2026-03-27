import "./tileDetails.css";

export default function ContactDetail() {
  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-heroMain">
          <h2 className="td-title">문의</h2>
          <p className="td-subtitle">
            문의가 필요할 때 바로 확인할 수 있도록<br/>연락처 정보를 정리했습니다.
          </p>
        </div>
      </section>

      <div className="td-contactGrid">
        <section className="td-contactItem">
          <div className="td-contactLabel">담당자</div>
          <div className="td-contactValue">권혁철</div>
        </section>

        <section className="td-contactItem">
          <div className="td-contactLabel">연락처</div>
          <div className="td-contactValue">010-9250-8070</div>
        </section>

        <section className="td-contactItem">
          <div className="td-contactLabel">소속 안내</div>
          <div className="td-contactValue">
            2026년 기준 3청년부
          </div>
        </section>
      </div>

      <section className="td-card">
        <div className="td-kicker">CONTACT GUIDE</div>
        <div className="td-cardTitle">문의 전 확인하면 좋은 내용</div>
        <ul className="td-bullets">
          <li>참여 가능 주차인지</li>
          <li>추천 게임 / 신청 일정</li>
          <li>장소와 시간</li>
          <li>처음 참여하는 경우 필요한 안내</li>
        </ul>
      </section>
    </div>
  );
}