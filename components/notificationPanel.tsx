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
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  useEffect(() => {
    const initializeNotification = async () => {
      if (!("serviceWorker" in navigator)) {
        console.error("Service Worker를 지원하지 않는 브라우저입니다.");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const permissionGranted = await requestNotificationPermission(() => {
          setIsAlertVisible(true);
        });
        if (!permissionGranted) {
          console.warn("알림 권한이 거부되었습니다.");
          return;
        }
        await checkNotificationStatus();
      } catch (error) {
        console.error("Service Worker 초기화 중 에러:", error);
      }
    };
    initializeNotification();
  }, []);
  const checkNotificationStatus = async () => {
    if (!("serviceWorker" in navigator)) {
      console.error("ServiceWorker를 지원하지 않는 브라우저입니다.");
      setIsSubscribed(false);
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }
      const response = await fetch("/api/check-subscription", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          type: "main",
          postId: null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error("구독 상태 확인 중 서버 응답 오류");
      }
      const result = await response.json();
      setIsSubscribed(result.exists);
    } catch (error) {
      console.error("구독 상태 확인 중 에러:", error);
      setIsSubscribed(false);
    }
  };
  const handleNotificationToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsAlertVisible(true);
      return;
    }
    setIsProcessing(true);
    try {
      const permissionGranted = await requestNotificationPermission(() => {
        setIsProcessing(false);
        setIsSubscribed(false);
        setIsAlertVisible(true);
      });
      if (!permissionGranted) {
        setIsProcessing(false);
        setIsAlertVisible(true);
        return;
      }
      await toggleSubscription(
        "main",
        () => {
          setIsAlertVisible(true);
        },
        null
      );
      await checkNotificationStatus();
    } catch (error) {
      console.error("알림 on/off 전환 중 에러:", error);
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
      await sendNotification(title, message, "main", url, undefined);
      window.alert("알림이 성공적으로 발송되었습니다!");
    } catch (error) {
      console.error("알림 발송 중 에러:", error);
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
            {isSubscribed === null ? (
              <div className="w-6 h-6 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
            ) : isProcessing ? (
              <div className="w-6 h-6 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
            ) : isSubscribed ? (
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
          className={`flex items-center justify-center ${
            isSending ? "bg-gray-400" : "bg-green-400 hover:bg-green-500"
          } text-white p-2 rounded-lg`}
          disabled={isSending}
        >
          {isSending ? (
            <>
              알림 발송 중
              <div className="w-4 h-4 ml-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            </>
          ) : (
            "알림 보내기"
          )}
        </button>
      </div>
    </>
  );
}
