"use client";

import { useEffect, useRef, useState } from "react";
import { getUser } from "@/lib/auth";
import { addComment, deleteComment, getComments } from "@/lib/comment";
import { handleImageChange } from "@/lib/handleImageChange";
import { handlePaste } from "@/lib/handlePaste";
import {
  saveSubscription,
  urlBase64ToUint8Array,
} from "@/lib/notification";
import CommentTree from "./commentTree";

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
      alert("Images are still uploading. Please wait.");
      return;
    }

    setIsSubmitting(true);

    try {
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
        }
      }

      setContent("");
      setNickname("");
      setPassword("");
      await refreshComments();
    } catch (error: any) {
      alert(error?.message || "Failed to create the comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (
    commentIdx: number,
    requiresPassword: boolean
  ) => {
    const suppliedPassword = requiresPassword
      ? window.prompt("Enter the comment password.")
      : null;

    if (requiresPassword && !suppliedPassword) {
      return;
    }

    const isConfirmed = window.confirm("Delete this comment?");

    if (!isConfirmed) {
      return;
    }

    try {
      await deleteComment(commentIdx, suppliedPassword);
      const commentsData = await getComments(postIdx);
      setComments(commentsData);
    } catch (error: any) {
      alert(error?.message || "Failed to delete the comment.");
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">Comments {comments.length}</h2>
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
          No comments yet. Be the first to start the conversation.
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-2 mb-6">
        {!user && (
          <div className="flex gap-4 mb-2">
            <input
              type="text"
              name="nickname"
              placeholder="Nickname"
              value={nickname}
              onChange={handleNicknameChange}
              className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
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
            placeholder="Write a comment"
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
                Uploading image...
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
              Choose image
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
                Posting...
                <div className="ml-2 w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
              </>
            ) : (
              "Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
