import OpenExternalInKakao from "./client";
import NotificationPanel from "@/components/notificationPanel";
import Board from "@/components/board";

export default async function Home() {
  return (
    <div className="flex flex-col items-center gap-5 mb-10">
      <OpenExternalInKakao />
      <NotificationPanel />
      <Board />
      <div className="text-7xl mt-10">🍀</div>
    </div>
  );
}
