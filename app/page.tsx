"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    openExternalInKakao();
    requestNotificationPermission();
    registerServiceWorker();
  }, []);
  const openExternalInKakao = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = "https://codingterrace.com";
    if (userAgent.includes("kakaotalk")) {
      window.location.href =
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetUrl);
    }
  };
  const requestNotificationPermission = async () => {
    if (Notification.permission === "denied") {
      alert("사이트 설정에서 알림 권한을 허용해 주세요.");
    } else if (Notification.permission === "default") {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          alert("사이트 설정에서 알림 권한을 허용해 주세요.");
        }
      } catch (error) {
        console.error("알림 권한 요청 중 오류 발생:", error);
      }
    }
  };
  const saveSubscriptionToServer = async (subscription: PushSubscription) => {
    try {
      const response = await fetch("/api/save-subscription", {
        method: "POST",
        body: JSON.stringify(subscription),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("Failed to save subscription on the server");
      }
      const result = await response.json();
      console.log("Subscription saved:", result);
    } catch (error) {
      console.error("Error saving subscription to the server:", error);
    }
  };
  const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        const convertedVapidKey = urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_KEY as string
        );
        if (!subscription) {
          const newSubscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });

          await saveSubscriptionToServer(newSubscription);
        }
        console.log("Service Worker가 등록되었습니다: ", registration.scope);
      } catch (error) {
        console.error("Service Worker 등록에 실패하였습니다:", error);
      }
    }
  };
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, "+")
      .replace(/_/g, "/");
    const rawData = atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };
  const handleNotificationClick = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        const convertedVapidKey = urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_KEY as string
        );
        const newSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey,
        });
        await saveSubscriptionToServer(newSubscription);
      }
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
        throw new Error("알림 전송에 실패하였습니다.");
      }
    } catch (error) {
      console.error("Notification Subscription 중 에러 발생:", error);
    }
  };
  return (
    <div className="flex flex-col items-center mb-10">
      <div className="flex flex-col w-full sm:w-[640px] lg:w-1/2 bg-white p-5 gap-2 relative">
        <span className="text-lg font-bold">
          모든 사이트 이용자에게 알림 보내기
        </span>
        <span className="text-sm">
          알림을 보내거나 받으려면 크롬 알림 권한 허용이 필요해요.
        </span>
        <span className="text-sm mb-3">
          반드시 카카오톡 브라우저가 아닌 <b>크롬</b> 앱으로 접속해야 권한
          허용이 가능합니다!
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
