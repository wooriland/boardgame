import WeeklySelectedPanel from "../../../weekly/WeeklySelectedPanel";
import "./tileDetails.css";

export default function WeeklySelectedDetail(props) {
  const weekStartDate = props?.weekStartDate ?? props?.ctx?.weekStartDate ?? "";

  return (
    <div className="td-wrap">
      <section className="td-panelWrap">
        <WeeklySelectedPanel weekStartDate={weekStartDate} />
      </section>
    </div>
  );
}