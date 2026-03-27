import WeeklySelectionStatsPanel from "../../../weekly/WeeklySelectionStatsPanel";
import "./tileDetails.css";

export default function WeeklySelectionStatsDetail(props) {
  const weekStartDate =
    props?.weekStartDate ?? props?.ctx?.weekStartDate ?? "";

  return (
    <div className="td-wrap">
      <section
        className="td-panelWrap"
        aria-label="weekly-selection-stats-detail"
      >
        <WeeklySelectionStatsPanel weekStartDate={weekStartDate} />
      </section>
    </div>
  );
}