"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const registerServiceWorker = async () => {
      if ("serviceWorker" in navigator) {
        try {
          const registration = await navigator.serviceWorker.register("/sw.js");
          console.log(
            "Service Worker registered with scope:",
            registration.scope
          );
        } catch (error) {
          console.error("Service Worker registration failed:", error);
        }
      }
    };
    registerServiceWorker();
  }, []);
  const handleNotificationClick = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });
      const response = await fetch("/api/send-notification", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error during notification subscription:", error);
    }
  };
  return (
    <div className="flex flex-col h-[150vh] bg-white p-5 gap-2 relative">
      <button onClick={handleNotificationClick}>알림</button>
      <div className="flex flex-row gap-[2%]">
        <span className="font-bold">게시판</span>
        <button className="bg-green-400 px-2 py-[0.5px] rounded-md">
          <span className="text-sm font-semibold text-white">글쓰기</span>
        </button>
      </div>
      <div className="mt-20 w-full h-[50vh] bg-green-400 rounded-lg p-5">
        <span className="font-bold text-white">실시간 채팅</span>
      </div>
      <div className="text-7xl mt-20">🍀</div>
    </div>
  );
}
