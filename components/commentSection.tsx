"use client";

import { useEffect, useState, useRef } from "react";
import { getUser } from "@/lib/auth";
import { getComments, addComment, deleteComment } from "@/lib/comment";
import { handleImageChange } from "@/lib/handleImageChange";
import { handlePaste } from "@/lib/handlePaste";
import Comment from "./comment";
import {
  saveSubscription,
  sendNotificationToPostAuthor,
  urlBase64ToUint8Array,
} from "@/lib/notification";
import CommentTree from "./commentTree";
import { stripMarkdown } from "@/lib/utils";

interface CommentSectionProps {
  postIdx: number;
}

export default function CommentSection({ postIdx }: CommentSectionProps) {
  const [user, setUser] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [content, setContent] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    const fetchComments = async () => {
      setIsLoading(true);
      const commentsData = await getComments(postIdx);
      setComments(commentsData);
      setIsLoading(false);
    };
    fetchUser();
    fetchComments();
  }, [postIdx]);
  const refreshComments = async () => {
    const commentsData = await getComments(postIdx);
    setComments(commentsData);
  };
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
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
    const formData = new FormData();
    formData.append("postIdx", String(postIdx));
    formData.append("content", content);
    if (!user) {
      formData.append("nickname", nickname);
      formData.append("password", password);
    }
    const newComment = await addComment(formData);
    if ("serviceWorker" in navigator && "PushManager" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        const registration = await navigator.serviceWorker.ready;
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
          const convertedVapidKey = urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_KEY as string
          );
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey,
          });
        }
        const subscriptionData = {
          ...subscription.toJSON(),
          type: "commentAuthor",
          postId: null,
          commentId: newComment.idx,
        };
        await saveSubscription(subscriptionData);
        console.log(
          "댓글에 대한 subscription이 등록되었습니다:",
          subscriptionData
        );
      } else {
        console.warn("알림 권한이 필요합니다.");
      }
    }
    setContent("");
    setIsSubmitting(false);
    await refreshComments();
    try {
      const notificationTitle = "내 글에 댓글이 달렸어요.";
      const maxLength = 50;
      const strippedContent = stripMarkdown(content);
      const truncatedContent =
        strippedContent.length > maxLength
          ? strippedContent.slice(0, maxLength) + "..."
          : strippedContent;
      const notificationMessage = truncatedContent;
      const postUrl = window.location.href;
      await sendNotificationToPostAuthor(
        postIdx,
        notificationTitle,
        notificationMessage,
        postUrl
      );
    } catch (error) {
      console.error(`알림 발송 중 에러가 발생하였습니다: ${error}`);
    }
    setContent("");
    setIsSubmitting(false);
    const commentsData = await getComments(postIdx);
    setComments(commentsData);
  };
  const handleDelete = async (commentIdx: number, commentPassword?: string) => {
    if (commentPassword) {
      const inputPassword = window.prompt("댓글 비밀번호를 입력해 주세요.");
      if (inputPassword !== commentPassword) {
        alert("비밀번호가 올바르지 않습니다.");
        return;
      }
    }
    const isConfirmed = window.confirm("정말로 댓글을 삭제할까요?");
    if (!isConfirmed) {
      return;
    }
    await deleteComment(commentIdx, commentPassword);
    const commentsData = await getComments(postIdx);
    setComments(commentsData);
  };
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">댓글 {comments.length}개</h2>
      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[...Array(1)].map((_, index) => (
            <div
              key={index}
              className="border-b border-gray-300 py-2 mb-2 flex"
            >
              <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/6"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-12 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        comments
          .filter((comment) => !comment.parentIdx)
          .map((comment) => (
            <CommentTree
              key={comment.idx}
              comment={comment}
              comments={comments}
              handleDelete={handleDelete}
              refreshComments={refreshComments}
            />
          ))
      ) : (
        <p className="text-gray-400 text-center mt-10 mb-16">
          댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-2 mb-6">
        {!user && (
          <div className="flex gap-4 mb-2">
            <input
              type="text"
              name="nickname"
              placeholder="닉네임 (선택)"
              value={nickname}
              onChange={handleNicknameChange}
              className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
            />
            <input
              type="password"
              name="password"
              placeholder="비밀번호 (선택)"
              value={password}
              onChange={handlePasswordChange}
              className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
              autoComplete="off"
            />
          </div>
        )}
        <div className="relative">
          <textarea
            ref={contentRef}
            name="content"
            placeholder="댓글을 입력해 주세요."
            required
            value={content}
            onChange={handleContentChange}
            onPaste={handlePasteEvent}
            rows={4}
            className="w-full p-2 border rounded-lg"
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
        <div className="flex justify-between items-center mt-2">
          <div className="relative inline-block">
            <label
              htmlFor="comment-image"
              className="mt-2 px-4 py-2 bg-green-400 text-white rounded-lg cursor-pointer hover:bg-green-500"
            >
              이미지 선택
            </label>
            <input
              onChange={onImageChange}
              type="file"
              id="comment-image"
              name="image"
              accept="image/*"
              multiple
              className="hidden"
            />
          </div>
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
                등록 중
                <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              </>
            ) : (
              "등록"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
