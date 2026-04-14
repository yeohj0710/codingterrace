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
import CustomAlert from "@/components/customAlert";

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
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const canWrite = category !== "technote" || isOperator;

  useEffect(() => {
    const checkUserOperator = async () => {
      const isOp = await isUserOperator();
      setIsOperator(isOp);
    };

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
            type: category,
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

    checkUserOperator();
    checkSubscriptionStatus();
  }, [category]);

  const handleNotificationToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsAlertVisible(true);
      return;
    }

    try {
      setIsProcessing(true);

      if (!isSubscribed) {
        const permissionGranted = await requestNotificationPermission(() => {
          setIsAlertVisible(true);
        });

        if (!permissionGranted) {
          return;
        }
      }

      setIsAlertVisible(false);
      await toggleSubscription(category, () => {
        setIsAlertVisible(true);
      });

      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(Boolean(subscription) ? !isSubscribed : false);
    } catch (error) {
      console.error("알림 설정 중 오류가 발생했습니다:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full rounded-md border border-gray-200 bg-white px-5 py-7 shadow-sm sm:w-[640px] xl:w-1/2">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <Link href={basePath} className="text-xl font-semibold text-slate-900">
              {title}
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setRefreshKey((prev) => prev + 1);
                }}
                className={`flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-emerald-300 hover:text-emerald-600 ${
                  isRefreshing ? "animate-spin" : ""
                }`}
                aria-label={`${title} 새로고침`}
              >
                <ArrowPathIcon className="h-4 w-4" />
              </button>
              <button
                onClick={handleNotificationToggle}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-emerald-300 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isProcessing}
                aria-label={`${title} 알림 설정`}
              >
                {isSubscribed === null || isProcessing ? (
                  <div className="h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                ) : isSubscribed ? (
                  <BellIcon className="h-5 w-5 text-emerald-500" />
                ) : (
                  <BellSlashIcon className="h-5 w-5 text-rose-400" />
                )}
              </button>
            </div>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            알림을 켜 두면 {title}의 새 글을 바로 받아볼 수 있어요.
          </p>
        </div>

        {canWrite ? (
          <Link
            href={`${basePath}/new`}
            className="shrink-0 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600"
          >
            글쓰기
          </Link>
        ) : null}
      </div>

      {isAlertVisible ? (
        <CustomAlert onClose={() => setIsAlertVisible(false)} />
      ) : Notification.permission === "denied" ? (
        <button
          type="button"
          onClick={() => setIsAlertVisible(true)}
          className="mb-4 text-sm font-medium text-emerald-700 transition hover:text-emerald-800"
        >
          알림 허용 방법 보기
        </button>
      ) : null}

      <PostList
        category={category}
        basePath={basePath}
        postsPerPage={postsPerPage}
        refreshKey={refreshKey}
        setIsRefreshing={setIsRefreshing}
      />

      {category === "board" ? (
        <p className="mt-6 text-xs leading-5 text-slate-400">
          부적절한 게시글은 운영 정책에 따라 삭제될 수 있습니다.
        </p>
      ) : null}
    </div>
  );
}
