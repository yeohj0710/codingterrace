"use client";

import { useEffect, useRef, useState } from "react";
import Input from "@/components/input";
import { getUser } from "@/lib/auth";
import { getPost, uploadPost, updatePost } from "@/lib/post";
import { handlePaste } from "@/lib/handlePaste";
import { useRouter } from "next/navigation";
import { handleImageChange } from "@/lib/handleImageChange";
import { sendNotification, saveSubscription } from "@/lib/notification";
import { clearPostCache } from "@/lib/cache";
import { categoryToName, stripMarkdown } from "@/lib/utils";

interface PostFormProps {
  mode: "add" | "edit";
  idx?: string;
  category: string;
  basePath: string;
}

export default function PostForm({
  mode,
  idx,
  category,
  basePath,
}: PostFormProps) {
  const [user, setUser] = useState<any>(null);
  const [post, setPost] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [content, setContent] = useState("");
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();
  useEffect(() => {
    const fetchAllData = async () => {
      const userData = await getUser();
      setUser(userData);
      if (mode === "edit" && idx) {
        const postData = await getPost(Number(idx), category);
        if (!postData) {
          alert("존재하지 않는 게시물입니다.");
          router.push(basePath);
          return;
        }
        setPost(postData);
        setTitle(postData.title);
        setContent(postData.content);
        setNickname(postData.nickname ?? "");
        if (postData.user) {
          if (!userData || userData.idx !== postData.user.idx) {
            alert("게시글을 수정할 권한이 없습니다.");
            router.push(basePath);
            return;
          }
        } else {
          if (postData.password) {
            const passwordInput =
              window.prompt("게시글 비밀번호를 입력해 주세요.");
            if (passwordInput !== postData.password) {
              alert("비밀번호가 올바르지 않습니다.");
              router.push(basePath);
              return;
            }
            setPassword(passwordInput!);
          } else {
            alert("게시글을 수정할 권한이 없습니다.");
            router.push(basePath);
            return;
          }
        }
      }
    };
    fetchAllData();
  }, [mode, idx, category, basePath, router]);
  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };
  const handleContentChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setContent(event.target.value);
  };
  const handleNicknameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(event.target.value);
  };
  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };
  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(
      event,
      setIsUploadingImages,
      content,
      setContent,
      contentRef
    );
  };
  const handlePasteEvent = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    await handlePaste(
      event,
      setIsUploadingImages,
      content,
      setContent,
      contentRef
    );
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isUploadingImages) {
      alert("이미지 업로드 중입니다. 잠시만 기다려 주세요.");
      return;
    }
    setIsSubmitting(true);
    let postId;
    try {
      const formData = new FormData(e.currentTarget);
      if (mode === "add") {
        postId = await uploadPost(category, basePath, formData);
        const notificationTitle = `${categoryToName(
          category
        )}에 새 글이 게시되었어요.`;
        const strippedContent = stripMarkdown(content);
        const maxLength = 50;
        const truncatedContent =
          strippedContent.length > maxLength
            ? strippedContent.slice(0, maxLength) + "..."
            : strippedContent;
        const notificationMessage = `${title}\n${truncatedContent}`;
        const postUrl = `${basePath}`;
        await sendNotification(
          notificationTitle,
          notificationMessage,
          category,
          postUrl
        );
        if ("serviceWorker" in navigator && "PushManager" in window) {
          const permission = await Notification.requestPermission();
          if (permission === "granted") {
            const registration = await navigator.serviceWorker.ready;
            let subscription = await registration.pushManager.getSubscription();
            if (!subscription) {
              subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
              });
            }
            const subscriptionData = {
              ...subscription.toJSON(),
              type: "postAuthor",
              postId,
            };
            await saveSubscription(subscriptionData);
            console.log(
              "게시글에 대한 subscription이 등록되었습니다:",
              subscriptionData
            );
          } else {
            console.warn("알림 권한이 필요합니다.");
          }
        }
      } else if (mode === "edit" && idx) {
        formData.append("idx", idx);
        await updatePost(category, formData);
      }
      clearPostCache(category);
    } catch (error) {
      console.error("게시글 처리 중 에러가 발생했습니다:", error);
    } finally {
      setIsSubmitting(false);
    }
    if (postId) {
      router.push(`${basePath}/${postId}`);
    }
  };
  if (mode === "edit" && !post) {
    return null;
  }
  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 mx-auto pt-8 sm:pb-10">
        <h1 className="text-xl font-bold ml-5 sm:ml-0 sm:mb-5">
          {mode === "add" ? "게시글 작성" : "게시글 수정"}
        </h1>
        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-lg"
        >
          {mode === "edit" && idx && (
            <input type="hidden" name="idx" value={idx} />
          )}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              제목
            </label>
            <Input
              name="title"
              type="text"
              required
              placeholder="제목을 입력해 주세요."
              className="w-full p-2 border rounded-lg"
              value={title}
              onChange={handleTitleChange}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 mb-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                작성자
              </label>
              {user ? (
                <div className="px-2 py-1.5 border rounded-lg text-gray-500 bg-gray-200">
                  {user.nickname ?? "익명"}
                </div>
              ) : (
                <Input
                  name="nickname"
                  type="text"
                  placeholder="닉네임을 입력해 주세요. (선택)"
                  className="w-full px-2 py-1.5 border rounded-lg"
                  value={nickname}
                  onChange={handleNicknameChange}
                  autoComplete="off"
                />
              )}
            </div>
            <div className="w-full sm:w-1/2">
              <label className="block text-gray-700 text-sm font-bold mb-2">
                비밀번호
                <label className="text-xs">
                  (비회원 게시글 {mode === "add" ? "삭제" : "수정"} 시 필요)
                </label>
              </label>
              {user ? (
                <div className="px-2 py-1.5 border rounded-lg text-gray-500 bg-gray-200">
                  &nbsp;
                </div>
              ) : (
                <input
                  name="password"
                  type="password"
                  placeholder="비밀번호를 입력해 주세요."
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full px-2 py-1.5 border rounded-lg"
                  required={mode === "edit"}
                  autoComplete="off"
                />
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2">
              내용
            </label>
            <div className="relative">
              <textarea
                ref={contentRef}
                name="content"
                placeholder="내용을 입력해 주세요."
                required
                value={content}
                onChange={handleContentChange}
                onPaste={handlePasteEvent}
                rows={10}
                className="w-full p-3 border rounded-lg"
                disabled={isUploadingImages}
              />
              {isUploadingImages && (
                <div className="absolute inset-0 flex justify-center items-center bg-opacity-75 bg-white">
                  <div className="w-5 h-5 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
                  <span className="ml-3 text-lg text-gray-700">
                    이미지 업로드 중...
                  </span>
                </div>
              )}
            </div>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-4">
              이미지 추가
            </label>
            <div className="relative inline-block">
              <label
                htmlFor="image"
                className="mt-2 px-4 py-2 bg-green-400 text-white rounded-lg cursor-pointer hover:bg-green-500"
              >
                이미지 선택
              </label>
              <input
                onChange={onImageChange}
                type="file"
                id="image"
                name="image"
                accept="image/*"
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded-lg flex items-center justify-center ${
                isSubmitting
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed opacity-50"
                  : "bg-green-400 text-white hover:bg-green-500"
              }`}
            >
              {isSubmitting ? (
                <>
                  {mode === "add" ? "등록 중" : "수정 중"}
                  <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </>
              ) : mode === "add" ? (
                "등록"
              ) : (
                "수정"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
