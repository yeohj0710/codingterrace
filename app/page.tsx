"use client";

import { useState, useEffect } from "react";
import {
  BellIcon as SolidBellIcon,
  BellSlashIcon as SolidBellSlashIcon,
} from "@heroicons/react/24/solid";
import {
  requestNotificationPermission,
  toggleNotification,
  sendNotification,
} from "@/lib/notification";
import Link from "next/link";
import CustomAlert from "@/components/customAlert";

export default function Home() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  useEffect(() => {
    requestNotificationPermission(() => setIsAlertVisible(true));
    checkNotificationStatus();
  }, []);
  const checkNotificationStatus = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error("구독 상태 확인 중 에러가 발생했습니다:", error);
    }
  };
  const handleNotificationToggle = async () => {
    setIsSubscribed((prev) => !prev);
    try {
      setIsProcessing(true);
      await toggleNotification("main");
      await checkNotificationStatus();
    } catch (error) {
      console.error("알림 on/off 처리 중 에러가 발생했습니다:", error);
      setIsSubscribed((prev) => !prev);
    } finally {
      setIsProcessing(false);
    }
  };
  const handleNotificationSend = async () => {
    setIsSending(true);
    try {
      await sendNotification(title, message, "main");
    } catch (error) {
      console.error("알림 발송 중 에러가 발생했습니다:", error);
    } finally {
      setIsSending(false);
    }
  };
  return (
    <div className="flex flex-col items-center mb-10">
      {isAlertVisible && <CustomAlert />}
      <div className="flex flex-col w-full sm:w-[640px] lg:w-1/2 bg-white p-5 gap-2 relative">
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
              <SolidBellIcon className="w-6 h-6 text-green-500" />
            ) : (
              <SolidBellSlashIcon className="w-6 h-6 text-red-500" />
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
