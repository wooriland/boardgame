import { useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import AiGuideModal from "./ai/AiGuideModal";
import IntroView from "./views/IntroView";
import JoinView from "./views/JoinView";
import WeeklyView from "./views/WeeklyView";

export default function MainModal({ mode, onClose }) {
  const isOpen = Boolean(mode);

  const modalRoot = useMemo(() => {
    return document.getElementById("modal-root") || document.body;
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }

    return () => document.body.classList.remove("modal-open");
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const title =
    mode === "intro"
      ? "동아리 소개"
      : mode === "weekly"
      ? "금주의 보드게임"
      : mode === "join"
      ? "참여 신청"
      : mode === "ai-guide"
      ? "AI 게임 안내"
      : "";

  const content = useMemo(() => {
    if (mode === "intro") {
      return <IntroView key="modal-view-intro" onClose={onClose} />;
    }

    if (mode === "weekly") {
      return <WeeklyView key="modal-view-weekly" onClose={onClose} />;
    }

    if (mode === "join") {
      return <JoinView key="modal-view-join" onClose={onClose} />;
    }

    if (mode === "ai-guide") {
      return <AiGuideModal key="modal-view-ai-guide" onClose={onClose} />;
    }

    return null;
  }, [mode, onClose]);

  if (!isOpen) {
    return null;
  }

  const modalClassName = `modal is-open ${
    mode === "ai-guide" ? "modal--aiGuide" : ""
  }`;
  const modalCardClassName = `modal-card ${
    mode === "weekly"
      ? "modal-card--weekly"
      : mode === "ai-guide"
      ? "modal-card--aiGuide"
      : ""
  }`;

  return createPortal(
    <div className={modalClassName} aria-hidden={!isOpen}>
      <div className="modal-backdrop" onClick={onClose} />

      <div
        className={modalCardClassName}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modalTitle"
      >
        <h3 className="modal-title" id="modalTitle">
          {title}
        </h3>
        {content}
      </div>
    </div>,
    modalRoot
  );
}

