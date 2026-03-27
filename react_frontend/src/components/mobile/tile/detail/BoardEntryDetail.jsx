import { useNavigate } from "react-router-dom";
import "./tileDetails.css";

export default function BoardEntryDetail() {
  const navigate = useNavigate();

  const goBoardEnter = () => {
    navigate("/board/enter");
  };

  const goBoardList = () => {
    navigate("/board");
  };

  return (
    <div className="td-wrap">
      <section className="td-hero">
        <div className="td-hero__content">
          <p className="td-eyebrow">WOORILAND BOARD</p>
          <h2 className="td-title">우리랜드 게시판 입장 안내</h2>
          <p className="td-desc">
            참여 후기, 운영 공지, 안내 글을 확인할 수 있는 공간이야.
            참여 경험이 없는 사람도 읽기 전용으로 둘러볼 수 있고,
            참여 경험이 있는 사람은 인증 후 댓글로 소통할 수 있어.
          </p>
        </div>
      </section>

      <section className="td-card">
        <h3 className="td-card__title">게시판에서는 무엇을 할 수 있나요?</h3>
        <div className="td-card__body">
          <p>
            우리랜드 게시판은 단순한 글 목록이 아니라, 참여자들이 경험을
            나누고 운영 안내를 확인하는 공간이야.
          </p>
          <p>
            공지 확인, 참여 후기 열람, 댓글 소통, 운영자 글 등록 같은 기능이
            권한에 따라 나뉘어 제공돼.
          </p>
        </div>
      </section>

      <section className="td-panelWrap">
        <article className="td-card">
          <h3 className="td-card__title">읽기 전용 사용자</h3>
          <div className="td-card__body">
            <p>아직 참여 경험이 없는 방문자도 게시판을 볼 수 있어.</p>
            <p>
              이 경우에는 공지와 게시글을 열람하는 용도로만 접근하고,
              댓글 작성이나 참여형 기능은 제한돼.
            </p>
          </div>
        </article>

        <article className="td-card">
          <h3 className="td-card__title">참여자</h3>
          <div className="td-card__body">
            <p>
              참여 경험이 있는 사람은 소속부서, 이름, 연락처를 입력해서
              게시판에 입장해.
            </p>
            <p>
              인증이 되면 댓글 작성, 소통 참여 등 읽기 전용보다 넓은 권한을
              사용할 수 있어.
            </p>
          </div>
        </article>

        <article className="td-card">
          <h3 className="td-card__title">관리자</h3>
          <div className="td-card__body">
            <p>
              관리자는 별도의 관리자 권한으로 게시글 작성, 수정, 운영 기능을
              사용할 수 있어.
            </p>
            <p>
              현재 프로젝트에서는 관리자 진입 방식이 일반 사용자 흐름과
              분리되어 설계되어 있어, 게시판 운영 화면으로 이어질 수 있어.
            </p>
          </div>
        </article>
      </section>

      <section className="td-card">
        <h3 className="td-card__title">입장 방식</h3>
        <div className="td-card__body">
          <p>1. 처음 방문한 사람은 읽기 전용으로 게시판을 둘러볼 수 있어.</p>
          <p>
            2. 참여 경험이 있는 사람은 본인 정보를 입력한 뒤 인증된 권한으로
            입장해.
          </p>
          <p>
            3. 권한에 따라 댓글 참여 가능 여부, 운영 기능 사용 여부가 달라져.
          </p>
        </div>
      </section>

      <section className="td-message">
        <strong>안내</strong>
        <p>
          게시판 입장 페이지에서 사용자 상태를 확인한 뒤, 읽기 전용 / 참여자 /
          관리자 흐름으로 나뉘게 돼.
        </p>
      </section>

      <section className="td-cta">
        <button type="button" className="td-btn td-btn--primary" onClick={goBoardEnter}>
          게시판 입장하기
        </button>

        <button type="button" className="td-btn td-btn--ghost" onClick={goBoardList}>
          게시글 먼저 보기
        </button>
      </section>
    </div>
  );
}