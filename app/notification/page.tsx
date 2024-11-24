import NotificationPanel from "@/components/notificationPanel";
import OpenExternalInKakao from "@/components/openExternalInKakao";

export default function NotificationPage() {
  return (
    <div className="flex flex-col items-center my-5 sm:my-10">
      <OpenExternalInKakao />
      <NotificationPanel />
    </div>
  );
}
