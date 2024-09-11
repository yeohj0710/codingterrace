"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    registerServiceWorker();
  }, []);
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
  const handleNotificationClick = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });
      const payload = JSON.stringify({
        title,
        message,
      });
      const response = await fetch("/api/send-notification", {
        method: "POST",
        body: payload,
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
    <div className="flex flex-col items-center mb-10">
      <div className="flex flex-col w-full sm:w-[640px] lg:w-1/2 bg-white p-5 gap-2 relative">
        <span className="text-lg font-bold mb-3">
          모든 사이트 이용자에게 알림 보내기
        </span>
        <input
          type="text"
          placeholder="알림 제목"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-2 border rounded-lg w-full"
        />
        <textarea
          placeholder="알림 내용"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="p-2 border rounded-lg w-full"
        />
        <button
          onClick={handleNotificationClick}
          className="bg-green-400 text-white p-2 rounded-lg hover:bg-green-500"
        >
          알림 보내기
        </button>
        <div className="mt-10">
          <div className="flex flex-row gap-[2%] mb-4">
            <span className="font-bold">게시판</span>
            <Link
              href="/board/new"
              className="bg-green-400 px-2 py-[0.5px] rounded-md hover:bg-green-500"
            >
              <span className="text-sm font-semibold text-white">글쓰기</span>
            </Link>
          </div>
          <div className="w-full h-[50vh] bg-green-400 rounded-lg p-5">
            <span className="font-bold text-white">실시간 채팅</span>
          </div>
        </div>
        <div className="text-7xl mt-20">🍀</div>
      </div>
    </div>
  );
}
