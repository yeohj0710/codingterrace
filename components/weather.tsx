"use client";

import { useEffect, useState } from "react";
import {
  requestNotificationPermission,
  toggleSubscription,
  sendNotification,
} from "@/lib/notification";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/solid";

export default function Weather() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
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
            type: "weather",
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
    checkSubscriptionStatus();
  }, []);
  const handleNotificationToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      window.alert("이 브라우저는 알림을 지원하지 않습니다.");
      return;
    }
    try {
      setIsProcessing(true);
      if (!isSubscribed) {
        const permissionGranted = await requestNotificationPermission(() => {
          setIsProcessing(false);
          setIsSubscribed(false);
          window.alert("알림 권한이 필요합니다.");
        });
        if (!permissionGranted) {
          setIsProcessing(false);
          return;
        }
      }
      await toggleSubscription("weather", () => {
        window.alert("알림 권한이 필요합니다.");
      });
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
      } else {
        setIsSubscribed(!isSubscribed);
      }
    } catch (error) {
      console.error("알림 설정 중 에러:", error);
    } finally {
      setIsProcessing(false);
    }
  };
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/weather", { method: "GET" });
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const result = await response.json();
      const weatherMessage =
        result.message || "날씨 데이터가 존재하지 않습니다.";
      setData(weatherMessage);
      await sendNotification(
        "오늘의 날씨",
        weatherMessage,
        "weather",
        "python"
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 bg-white p-5 gap-2 relative sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-lg">날씨 알리미</span>
        <button
          onClick={handleNotificationToggle}
          className="text-gray-500"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <div className="w-6 h-6 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
          ) : isSubscribed ? (
            <BellIcon className="w-6 h-6 text-green-500" />
          ) : (
            <BellSlashIcon className="w-6 h-6 text-red-500" />
          )}
        </button>
        <span className="text-xs text-red-400 ml-2 hidden sm:block">
          * 알림을 켜서 내일 날씨를 매일 오전 7시 알림으로 받아보세요.
        </span>
        <span className="text-xs text-red-400 block sm:hidden w-full mt-1">
          * 알림을 켜서 내일 날씨를 매일 오전 7시 알림으로 받아보세요.
        </span>
      </div>
      <div className="flex flex-col text-sm text-gray-500 gap-1">
        <span>&quot;오늘 패딩 입을 날씨인가?&quot; 매번 확인하기 귀찮죠?</span>
        <span>코딩테라스가 날씨를 1초 만에 확인하게 도와드릴게요.</span>
      </div>
      {data && (
        <div className="mt-2 p-3 bg-green-100 text-green-800 rounded-md">
          {data}
        </div>
      )}
      {error && (
        <div className="mt-2 p-3 bg-red-100 text-red-800 rounded-md">
          {error}
        </div>
      )}
      <button
        onClick={fetchData}
        className={`px-4 py-2 mt-3 rounded-md flex items-center justify-center ${
          loading
            ? "bg-green-400 text-white cursor-not-allowed opacity-75"
            : "bg-green-400 text-white hover:bg-green-500"
        }`}
        disabled={loading}
      >
        {loading ? (
          <>
            날씨 알림 발송 중
            <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          </>
        ) : (
          <>날씨 알림 수동 발송</>
        )}
      </button>
    </div>
  );
}
