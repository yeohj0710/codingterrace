import OpenExternalInKakao from "@/components/openExternalInKakao";
import NotificationPanel from "@/components/notificationPanel";
import BoardComponent from "@/components/boardComponent";
import Weather from "@/components/weather";

export default async function Home() {
  return (
    <div className="flex flex-col items-center gap-8 my-5 sm:my-8">
      <OpenExternalInKakao path="/" />
      <BoardComponent
        category="technote"
        title="기술노트"
        basePath="/technote"
        postsPerPage={1}
      />
      <BoardComponent
        category="board"
        title="자유게시판"
        basePath="/board"
        postsPerPage={6}
      />
      <Weather />
      <NotificationPanel />
    </div>
  );
}
