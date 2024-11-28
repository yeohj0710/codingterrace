import NotificationPanel from "@/components/notificationPanel";
import OpenExternalInKakao from "@/components/openExternalInKakao";
import { generatePageMetadata } from "@/lib/metadata";

export async function generateMetadata() {
  return generatePageMetadata("알림 보내기", "/notification");
}

export default function NotificationPage() {
  return (
    <div className="flex flex-col items-center my-5 sm:my-10">
      <OpenExternalInKakao path="/notification" />
      <NotificationPanel />
    </div>
  );
}
