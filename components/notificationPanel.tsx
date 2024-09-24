"use client";

import { useState, useEffect } from "react";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/solid";
import {
  requestNotificationPermission,
  sendNotification,
  toggleSubscription,
} from "@/lib/notification";
import CustomAlert from "./customAlert";

export default function NotificationPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  useEffect(() => {
    const registerServiceWorker = async () => {
      if (!("serviceWorker" in navigator)) {
        window.alert("이 브라우저에서는 알림을 지원하지 않습니다.");
        return;
      }
      try {
        await navigator.serviceWorker.register("/sw.js");
        await requestNotificationPermission(() => setIsAlertVisible(true));
        await checkNotificationStatus();
      } catch (error) {
        window.alert(`service worker 등록에 실패했습니다: ${error}`);
      }
    };
    registerServiceWorker();
  }, []);
  const checkNotificationStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      window.alert(`구독 상태 확인 중 에러가 발생했습니다: ${error}`);
    }
  };
  const handleNotificationToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      window.alert("이 브라우저는 푸시 알림을 지원하지 않습니다.");
      return;
    }
    try {
      setIsProcessing(true);
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
      await toggleSubscription("main", () => setIsAlertVisible(true));
      await checkNotificationStatus();
    } catch (error) {
      window.alert(`알림 on/off 전환 중 에러가 발생했습니다: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleNotificationSend = async () => {
    setIsSending(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update();
      }
      const url = "https://codingterrace.com";
      await sendNotification(title, message, "main", url);
    } catch (error) {
      window.alert(`알림 발송 중 에러가 발생했습니다: ${error}`);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <>
      {isAlertVisible && (
        <CustomAlert onClose={() => setIsAlertVisible(false)} />
      )}
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 bg-white p-5 gap-2 relative sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-lg font-bold">
            모든 사이트 이용자에게 알림 보내기
          </span>
          <button
            onClick={handleNotificationToggle}
            className="text-gray-500"
            disabled={isProcessing}
          >
            {isSubscribed ? (
              <BellIcon className="w-6 h-6 text-green-500" />
            ) : (
              <BellSlashIcon className="w-6 h-6 text-red-500" />
            )}
          </button>
        </div>
        <span className="text-sm">
          알림 설정과 알림 기능은{" "}
          <span className="text-red-500">인터넷을 종료해도</span> 유지됩니다!
        </span>
        <span className="text-sm mb-3">
          다른 유저들과 익명으로 어디서나 간편하게 소통해 보세요.
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
          onClick={handleNotificationSend}
          className={`${
            isSending ? "bg-gray-400" : "bg-green-400 hover:bg-green-500"
          } text-white p-2 rounded-lg`}
          disabled={isSending}
        >
          {isSending ? "알림 발송 중" : "알림 보내기"}
        </button>
      </div>
    </>
  );
}
