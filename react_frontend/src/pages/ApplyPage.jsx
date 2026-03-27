// ✅ src/pages/ApplyPage.jsx
import JoinView from "../components/views/JoinView";

export default function ApplyPage() {
  return (
    <div className="wrap">
      <div className="section">
        <h2 className="section-title">참여 신청</h2>
        <div className="muted" style={{ marginBottom: 12 }}>
          모달과 동일한 신청 UI를 페이지에서도 제공합니다.
        </div>

        {/* ✅ 기존 JoinView를 그대로 가져다 씀 */}
        <JoinView mode="page" />
      </div>
    </div>
  );
}