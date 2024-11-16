"use client";

import Link from "next/link";
import PostList from "@/components/postList";
import { useState, useEffect } from "react";
import { isUserOperator } from "@/lib/auth";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/solid";
import {
  requestNotificationPermission,
  toggleSubscription,
} from "@/lib/notification";

interface BoardProps {
  category: string;
  title: string;
  basePath: string;
  postsPerPage: number;
}

export default function BoardComponent({
  category,
  title,
  basePath,
  postsPerPage,
}: BoardProps) {
  const [isOperator, setIsOperator] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const canWrite = category !== "technote" || isOperator;
  useEffect(() => {
    const checkUserOperator = async () => {
      const isOp = await isUserOperator();
      setIsOperator(isOp);
    };
    const checkSubscriptionStatus = async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) {
        setIsSubscribed(false);
        return;
      }
      try {
        const p256dh = subscription.getKey("p256dh");
        const auth = subscription.getKey("auth");
        const p256dhBase64 = p256dh
          ? btoa(String.fromCharCode(...new Uint8Array(p256dh)))
          : null;
        const authBase64 = auth
          ? btoa(String.fromCharCode(...new Uint8Array(auth)))
          : null;
        const response = await fetch("/api/check-subscription", {
          method: "POST",
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            keys: {
              p256dh: p256dhBase64,
              auth: authBase64,
            },
            type: category,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const result = await response.json();
        setIsSubscribed(result.exists);
      } catch (error) {
        console.error("Error checking subscription status:", error);
      }
    };
    checkUserOperator();
    checkSubscriptionStatus();
  }, [category]);
  const handleNotificationToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      window.alert("이 브라우저는 알림을 지원하지 않습니다.");
      return;
    }
    try {
      setIsProcessing(true);
      const permissionGranted = await requestNotificationPermission(() => {
        window.alert("알림 권한이 필요합니다.");
      });
      if (!permissionGranted) {
        setIsProcessing(false);
        return;
      }
      await toggleSubscription(category, () => {
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
      window.alert(`알림 설정 중 에러가 발생했습니다: ${error}`);
    } finally {
      setIsProcessing(false);
    }
  };
  return (
    <div className="w-full sm:w-[640px] xl:w-1/2 px-5 py-7 bg-white sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
      <div className="flex flex-row gap-[2%] justify-between mb-6 items-center">
        <div className="flex items-center">
          <Link href={basePath} className="font-bold text-xl">
            {title}
          </Link>
          <div className="flex items-center ml-2">
            <button
              onClick={() => {
                setRefreshKey((prev) => prev + 1);
              }}
              className={`mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            >
              <ArrowPathIcon className="w-5 h-5 text-gray-500" />
            </button>
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
            <span className="text-xs text-red-400 ml-2">
              알림을 켜서 해당 게시판의 새 글 알림을 받아볼 수 있어요.
            </span>
          </div>
        </div>
        <div className="flex items-center">
          {canWrite && (
            <Link
              href={`${basePath}/new`}
              className="bg-green-400 px-3 py-1 rounded-md hover:bg-green-500 ml-2"
            >
              <span className="text-sm font-semibold text-white">글쓰기</span>
            </Link>
          )}
        </div>
      </div>
      {category === "board" && (
        <span className="text-xs text-gray-400 block -mt-3 mb-3 ml-1">
          * 부적절한 게시글은 임의로 삭제될 수 있습니다.
        </span>
      )}
      <PostList
        category={category}
        basePath={basePath}
        postsPerPage={postsPerPage}
        refreshKey={refreshKey}
        setIsRefreshing={setIsRefreshing}
      />
    </div>
  );
}
