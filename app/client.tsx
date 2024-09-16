"use client";

import { useEffect, useState } from "react";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/solid";
import {
  requestNotificationPermission,
  sendNotification,
  toggleSubscription,
} from "@/lib/notification";
import Link from "next/link";
import CustomAlert from "@/components/customAlert";

interface Post {
  title: string;
  idx: number;
  category: string;
  nickname: string | null;
  ip: string | null;
  content: string;
  created_at: Date;
  user: {
    idx: number;
    id: string;
    password: string;
    nickname: string;
    created_at: Date;
    updated_at: Date;
  } | null;
}

export default function HomeClient({ posts }: { posts: Post[] }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  useEffect(() => {
    openExternalInKakao();
    requestNotificationPermission(() => setIsAlertVisible(true));
    checkNotificationStatus();
  }, []);
  const openExternalInKakao = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const targetUrl = "https://codingterrace.com";
    if (userAgent.includes("kakaotalk")) {
      window.location.href =
        "kakaotalk://web/openExternal?url=" + encodeURIComponent(targetUrl);
    }
  };
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
      await toggleSubscription("main", () => setIsAlertVisible(true));
      await checkNotificationStatus();
    } catch (error) {
      console.error("알림 on/off 전환 중 에러가 발생했습니다:", error);
      if (error instanceof Error && error.name === "NotAllowedError") {
        setIsAlertVisible(true);
      }
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
      {isAlertVisible && (
        <CustomAlert onClose={() => setIsAlertVisible(false)} />
      )}
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
        <div className="mt-10">
          <div className="flex flex-row gap-[2%] mb-4">
            <span className="font-bold text-xl">게시판</span>
            <Link
              href="/board/new"
              className="bg-green-400 px-2 py-[0.5px] rounded-md hover:bg-green-500"
            >
              <span className="text-sm font-semibold text-white">글쓰기</span>
            </Link>
          </div>
          <div className="w-full bg-gray-50 p-4 rounded-lg shadow">
            {posts.length > 0 ? (
              posts.map((post: Post) => (
                <Link
                  key={post.idx}
                  href={`/board/${post.idx}`}
                  className="block mb-4 p-4 bg-white shadow-sm rounded hover:bg-gray-100"
                >
                  <h2 className="text-lg font-semibold">{post.title}</h2>
                  <p className="text-sm text-gray-600 mt-2">{post.content}</p>
                  <div className="flex justify-between items-center mt-4 text-xs text-gray-500">
                    <span>{post.nickname || post.user?.nickname}</span>
                    <span>
                      {new Date(post.created_at).toLocaleString("ko-KR", {
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        timeZone: "Asia/Seoul",
                      })}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <span className="text-sm text-gray-500">게시글이 없습니다.</span>
            )}
          </div>
        </div>
        <div className="w-full h-[50vh] bg-green-400 rounded-lg p-5 mt-10">
          <span className="font-bold text-white">실시간 채팅</span>
        </div>
      </div>
      <div className="text-7xl mt-10 mb-5">🍀</div>
    </div>
  );
}
