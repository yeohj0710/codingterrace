"use client";

import { useEffect, useState } from "react";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/solid";
import { isUserOperator } from "@/lib/auth";
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
  const [isOperator, setIsOperator] = useState(false);

  useEffect(() => {
    const initializeNotification = async () => {
      if (!("serviceWorker" in navigator)) {
        console.error("이 브라우저는 서비스 워커를 지원하지 않습니다.");
        return;
      }

      try {
        await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        await checkNotificationStatus();
      } catch (error) {
        console.error("서비스 워커를 준비하지 못했습니다:", error);
      }
    };

    const loadPrivileges = async () => {
      setIsOperator(await isUserOperator());
    };

    initializeNotification();
    loadPrivileges();
  }, []);

  const checkNotificationStatus = async () => {
    if (!("serviceWorker" in navigator)) {
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
        throw new Error("구독 상태를 확인하지 못했습니다.");
      }

      const result = await response.json();
      setIsSubscribed(result.exists);
    } catch (error) {
      console.error("구독 상태를 확인하지 못했습니다:", error);
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
        setIsAlertVisible(true);
      });

      if (!permissionGranted) {
        return;
      }

      setIsAlertVisible(false);
      await toggleSubscription("main", () => {
        setIsAlertVisible(true);
      });
      await checkNotificationStatus();
    } catch (error) {
      console.error("알림 설정을 변경하지 못했습니다:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotificationSend = async () => {
    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle || !trimmedMessage) {
      window.alert("알림 제목과 내용을 모두 입력해 주세요.");
      return;
    }

    setIsSending(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        await registration.update();
      }

      await sendNotification(
        trimmedTitle,
        trimmedMessage,
        "main",
        "https://codingterrace.com"
      );
      window.alert("알림을 전송했습니다.");
      setTitle("");
      setMessage("");
    } catch (error) {
      console.error("알림 전송에 실패했습니다:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col w-full gap-3 sm:w-[640px] xl:w-1/2 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-slate-900">
              사이트 알림
            </span>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isSubscribed
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {isSubscribed ? "알림 켜짐" : "알림 꺼짐"}
            </span>
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            사이트를 닫아도 새 글과 공지 알림을 계속 받아볼 수 있어요.
          </p>
        </div>

        <button
          onClick={handleNotificationToggle}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isProcessing}
          aria-label="사이트 알림 설정"
        >
          {isSubscribed === null || isProcessing ? (
            <div className="h-5 w-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          ) : isSubscribed ? (
            <BellIcon className="h-5 w-5 text-emerald-500" />
          ) : (
            <BellSlashIcon className="h-5 w-5 text-rose-400" />
          )}
        </button>
      </div>

      {isAlertVisible && <CustomAlert onClose={() => setIsAlertVisible(false)} />}

      {!isAlertVisible && Notification.permission === "denied" ? (
        <button
          type="button"
          onClick={() => setIsAlertVisible(true)}
          className="self-start text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          알림 허용 방법 보기
        </button>
      ) : null}

      {isOperator ? (
        <div className="border-t border-gray-100 pt-4">
          <p className="mb-3 text-sm leading-6 text-slate-600">
            운영자 계정은 알림을 구독한 전체 사용자에게 공지 알림을 보낼 수 있어요.
          </p>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="알림 제목"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
            />
            <textarea
              placeholder="알림 내용"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-28 w-full rounded-md border border-gray-200 px-3 py-2 text-sm outline-none transition focus:border-emerald-400"
            />
            <div className="flex justify-end">
              <button
                onClick={handleNotificationSend}
                className={`rounded-md px-4 py-2 text-sm font-medium text-white transition ${
                  isSending
                    ? "bg-gray-400"
                    : "bg-emerald-500 hover:bg-emerald-600"
                }`}
                disabled={isSending}
              >
                {isSending ? "전송 중..." : "알림 보내기"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm leading-6 text-slate-500">
          전체 공지 알림 발송은 운영자 계정만 사용할 수 있어요.
        </p>
      )}
    </div>
  );
}
