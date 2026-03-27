import KakaoFixedMap from "../../../KakaoFixedMap";
import "./tileDetails.css";

export default function MapDetail() {
  return (
    <div className="td-wrap">
      <section className="td-card">
        <div className="td-cardTitle">분당우리교회 드림센터 1011호</div>
        <div className="td-cardText">
          [지도 크게 보기] 버튼을 누르면<br/>큰 지도 화면에서 오시는 길을 찾을 수 있어요.
        </div>
      </section>

      <div className="td-mapFrame">
        <KakaoFixedMap height={320} />
      </div>
    </div>
  );
}