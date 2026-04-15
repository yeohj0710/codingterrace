"use client";

import { useEffect, useState } from "react";
import { isUserOperator } from "@/lib/auth";
import {
  requestNotificationPermission,
  toggleSubscription,
} from "@/lib/notification";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/solid";

export default function Weather() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isWakingUp, setIsWakingUp] = useState(false);
  const [showSendWeatherButton, setShowSendWeatherButton] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOperator, setIsOperator] = useState(false);

  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!("serviceWorker" in navigator)) {
        console.error("이 브라우저는 서비스 워커를 지원하지 않습니다.");
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
          throw new Error("구독 상태를 확인하지 못했습니다.");
        }

        const result = await response.json();
        setIsSubscribed(result.exists);
      } catch (error) {
        console.error("구독 상태 확인 중 오류:", error);
        setIsSubscribed(false);
      }
    };

    checkSubscriptionStatus();
    isUserOperator().then(setIsOperator).catch(() => setIsOperator(false));
  }, []);

  const handleNotificationToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      window.alert("이 브라우저에서는 알림 기능을 지원하지 않습니다.");
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

      let latitude: number | null = null;
      let longitude: number | null = null;

      if (!isSubscribed) {
        if ("geolocation" in navigator) {
          const getPosition = () => {
            return new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0,
              });
            });
          };

          try {
            const position = await getPosition();
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;

            const response = await fetch(
              `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=ko`
            );
            const locationData = await response.json();
            const addressParts =
              locationData.localityInfo?.administrative
                ?.map((item: any) => item.name)
                .filter((name: string) => name !== "대한민국")
                .reduce((unique: string[], name: string) => {
                  if (!unique.includes(name)) {
                    unique.push(name);
                  }
                  return unique;
                }, [])
                .join(" ") || "";
            const address = addressParts || "현재 위치";

            const userConfirmed = window.confirm(
              `현재 위치로 확인된 '${address}' 기준 날씨를 알림으로 받아볼까요?`
            );

            if (!userConfirmed) {
              window.alert("위치 확인을 취소했습니다.");
              setIsProcessing(false);
              return;
            }

            await toggleSubscription(
              "weather",
              () => {
                window.alert("알림 권한이 필요합니다.");
              },
              latitude,
              longitude
            );
          } catch (error) {
            console.error("위치 정보를 가져오는 중 오류:", error);
            window.alert(
              "위치 권한을 허용해야 날씨 알림 기능을 사용할 수 있습니다."
            );
            setIsProcessing(false);
            return;
          }
        } else {
          window.alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
        }
      } else {
        await toggleSubscription("weather", () => {
          window.alert("알림 권한이 필요합니다.");
        });
      }

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
      } else {
        setIsSubscribed(!isSubscribed);
      }
    } catch (error) {
      console.error("알림 설정 중 오류:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    setIsWakingUp(false);

    try {
      let latitude: number | null = null;
      let longitude: number | null = null;

      if ("geolocation" in navigator) {
        const getPosition = () => {
          return new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0,
            });
          });
        };

        try {
          const position = await getPosition();
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.error("위치 정보를 가져오는 중 오류:", error);
          window.alert(
            "위치 권한을 허용해야 날씨 미리보기 기능을 사용할 수 있습니다."
          );
          setLoading(false);
          return;
        }
      } else {
        window.alert("이 브라우저에서는 위치 정보를 지원하지 않습니다.");
        setLoading(false);
        return;
      }

      const wakeUpTimeout = setTimeout(() => {
        setIsWakingUp(true);
      }, 10000);

      const response = await fetch(
        `/api/weather?latitude=${latitude}&longitude=${longitude}`,
        { method: "GET" }
      );

      clearTimeout(wakeUpTimeout);

      if (!response.ok) {
        throw new Error(
          "날씨 서버를 깨우는 중입니다. 잠시 후 다시 시도해 주세요."
        );
      }

      const result = await response.json();
      const weatherMessage = result.message || "날씨 정보를 불러오지 못했습니다.";
      setData(weatherMessage);
      setShowSendWeatherButton(true);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
      setIsWakingUp(false);
    }
  };

  const sendWeatherNotifications = async () => {
    try {
      setIsSending(true);
      const response = await fetch("/api/weather", { method: "GET" });

      if (!response.ok) {
        throw new Error("날씨 알림 발송 중 오류가 발생했습니다.");
      }

      window.alert("날씨 알림을 발송했습니다.");
    } catch (error: any) {
      console.error("날씨 알림 발송 중 오류:", error);
      window.alert(`날씨 알림 발송에 실패했습니다: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 bg-white p-5 gap-2 relative sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-bold text-lg">날씨 미리보기</span>
        <button
          onClick={handleNotificationToggle}
          className="text-gray-500"
          disabled={isProcessing}
          aria-label="날씨 알림 설정"
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
        <span className="text-xs text-red-400 ml-2 hidden sm:block">
          * 알림을 켜 두면 현재 위치 기준 날씨를 알림으로 받아볼 수 있어요.
        </span>
        <span className="text-xs text-red-400 block sm:hidden w-full mt-1">
          * 알림을 켜 두면 현재 위치 기준 날씨를 알림으로 받아볼 수 있어요.
        </span>
      </div>
      <div className="flex flex-col text-sm text-gray-500 gap-1">
        <span>&quot;오늘 우산이 필요할까?&quot; 매번 확인하기 번거로우셨죠?</span>
        <span>코딩테라스가 현재 위치 기준 날씨를 빠르게 알려드릴게요.</span>
        <span className="text-xs text-blue-400 mt-1">
          * 서버가 오래 쉬고 있었다면 처음엔 응답까지 30초 정도 걸릴 수 있어요.
        </span>
      </div>
      {isWakingUp && (
        <div className="flex items-center mt-2 text-sm text-gray-500">
          날씨 서버를 깨우는 중입니다...
          <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-gray-500 rounded-full animate-spin"></div>
        </div>
      )}
      {data && (
        <div className="mt-2 p-3 bg-green-100 text-green-800 rounded-md">
          {data}
        </div>
      )}
      {error && (
        <div className="mt-2 p-3 bg-green-100 text-green-800 rounded-md">
          {error}
        </div>
      )}
      {showSendWeatherButton && isOperator && (
        <div className="mt-2 px-4 py-3 border border-gray-200 rounded-lg shadow-md bg-gray-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">
              날씨 알림 구독자들에게 각 위치 기준 알림을 지금 보낼까요?
            </p>
            <button
              onClick={sendWeatherNotifications}
              className={`px-4 py-1 mt-2 sm:mt-0 sm:ml-4 rounded-md flex items-center justify-center ${
                isSending
                  ? "bg-blue-400 text-white cursor-not-allowed opacity-75"
                  : "bg-blue-400 text-white hover:bg-blue-500"
              }`}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  알림 발송 중...
                  <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </>
              ) : (
                <>날씨 알림 보내기</>
              )}
            </button>
          </div>
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
            날씨 정보를 불러오는 중...
            <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
          </>
        ) : (
          <>현재 위치 날씨 확인</>
        )}
      </button>
    </div>
  );
}
