import DeptStatsPanel from "../../../sections/DeptStatsPanel";
import "./tileDetails.css";

export default function DeptStatsDetail(props) {
  const weekStartDate =
    props?.weekStartDate ?? props?.ctx?.weekStartDate ?? "";

  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-heroMain">
          <h2 className="td-title">부서별 신청 현황</h2>
          <p className="td-subtitle">
            각 부서의 <b>고유 신청자 수</b>와 현재 신청 상태를 확인할 수 있어요.
          </p>
        </div>
      </section>

      <section className="td-panelWrap" aria-label="dept-stats-detail">
        <DeptStatsPanel weekStartDate={weekStartDate} />
      </section>
    </div>
  );
}