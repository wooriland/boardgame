function renderMessage(message, variant, type, key) {
  const text = String(message ?? "").trim();
  if (!text) return null;

  if (variant === "board") {
    return (
      <div key={key} className={`board-message board-message-${type}`}>
        {text}
      </div>
    );
  }

  return (
    <div key={key} className={`admin-message admin-message--${type}`}>
      {text}
    </div>
  );
}

export default function AdminMessageBar({
  errorMessage = "",
  successMessage = "",
  infoMessage = "",
  variant = "admin",
}) {
  const items = [
    renderMessage(errorMessage, variant, "error", "error"),
    renderMessage(successMessage, variant, "success", "success"),
    renderMessage(infoMessage, variant, "info", "info"),
  ].filter(Boolean);

  if (items.length === 0) {
    return null;
  }

  if (variant === "board") {
    return <div className="board-form">{items}</div>;
  }

  return <div className="admin-message-bar">{items}</div>;
}