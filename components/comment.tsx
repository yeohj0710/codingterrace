"use client";

import React, { useEffect, useRef, useState } from "react";
import { getIsOwner, getUser } from "@/lib/auth";
import { getSafeEmbedSrc } from "@/lib/contentSecurity";
import { customSchema } from "@/lib/customSchema";
import { handleImageChange } from "@/lib/handleImageChange";
import { handlePaste } from "@/lib/handlePaste";
import {
  addComment,
  updateComment,
  verifyCommentPassword,
} from "@/lib/comment";
import {
  saveSubscription,
  urlBase64ToUint8Array,
} from "@/lib/notification";
import { remarkYoutubeEmbed } from "@/lib/remarkYoutubeEmbed";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkBreaks from "remark-breaks";
import remarkGfm from "remark-gfm";
import "highlight.js/styles/atom-one-dark.css";

interface CommentProps {
  comment: any;
  handleDelete: (commentIdx: number, requiresPassword: boolean) => Promise<void>;
  refreshComments: () => void;
  indentLevel?: number;
  index?: number;
}

export default function Comment({
  comment,
  handleDelete,
  refreshComments,
  indentLevel = 0,
}: CommentProps) {
  const [user, setUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNickname, setEditedNickname] = useState(comment.nickname || "");
  const [editedPassword, setEditedPassword] = useState("");
  const [verifiedGuestPassword, setVerifiedGuestPassword] = useState("");
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [replyNickname, setReplyNickname] = useState("");
  const [replyPassword, setReplyPassword] = useState("");
  const [isUploadingReplyImages, setIsUploadingReplyImages] = useState(false);
  const replyContentRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const maxIndentLevel = 1;
  const currentIndentLevel =
    indentLevel < maxIndentLevel ? indentLevel : maxIndentLevel;

  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const checkOwnership = async () => {
      if (comment.user) {
        setIsOwner(await getIsOwner(comment.user.idx));
        return;
      }

      setIsOwner(false);
    };
    checkOwnership();
  }, [comment.user]);

  const handleEdit = async () => {
    if (comment.hasPassword) {
      const inputPassword = window.prompt("댓글 비밀번호를 입력해 주세요.");

      if (!inputPassword) {
        return;
      }

      let isValidPassword = false;

      try {
        isValidPassword = await verifyCommentPassword(comment.idx, inputPassword);
      } catch {
        isValidPassword = false;
      }

      if (!isValidPassword) {
        alert("댓글 비밀번호가 올바르지 않습니다.");
        return;
      }

      setVerifiedGuestPassword(inputPassword);
      setEditedPassword(inputPassword);
    }

    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.content);
    setEditedNickname(comment.nickname || "");
    setEditedPassword("");
    setVerifiedGuestPassword("");
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
  };

  const onImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(
      event,
      setIsUploadingImages,
      editedContent,
      setEditedContent,
      contentRef
    );
  };

  const handlePasteEvent = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    await handlePaste(
      event,
      setIsUploadingImages,
      editedContent,
      setEditedContent,
      contentRef
    );
  };

  const handleSaveEdit = async () => {
    if (isUploadingImages) {
      alert("이미지 업로드가 아직 끝나지 않았어요. 잠시만 기다려 주세요.");
      return;
    }

    const formData = new FormData();
    formData.append("idx", comment.idx.toString());
    formData.append("content", editedContent);
    formData.append("nickname", editedNickname);

    if (!comment.user) {
      formData.append("currentPassword", verifiedGuestPassword);
      formData.append("password", editedPassword);
    }

    try {
      await updateComment(formData);
      setIsEditing(false);
      setVerifiedGuestPassword("");
      refreshComments();
    } catch (error: any) {
      alert(error.message || "댓글을 수정하지 못했습니다.");
    }
  };

  const handleImageClick = (src: string) => {
    setSelectedImage(src);
  };

  const handleReply = () => {
    setIsReplying((prev) => !prev);
  };

  const handleCancelReply = () => {
    setIsReplying(false);
    setReplyContent("");
    setReplyNickname("");
    setReplyPassword("");
  };

  const handleReplyContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    setReplyContent(e.target.value);
  };

  const onReplyImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleImageChange(
      event,
      setIsUploadingReplyImages,
      replyContent,
      setReplyContent,
      replyContentRef
    );
  };

  const handleReplyPasteEvent = async (
    event: React.ClipboardEvent<HTMLTextAreaElement>
  ) => {
    await handlePaste(
      event,
      setIsUploadingReplyImages,
      replyContent,
      setReplyContent,
      replyContentRef
    );
  };

  const handleReplySubmit = async () => {
    if (isUploadingReplyImages) {
      alert("이미지 업로드가 아직 끝나지 않았어요. 잠시만 기다려 주세요.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("postIdx", comment.postIdx.toString());
      formData.append("content", replyContent);
      formData.append("parentIdx", comment.idx.toString());

      if (!user) {
        formData.append("nickname", replyNickname);
        formData.append("password", replyPassword);
      }

      const newComment = await addComment(formData);
      setIsReplying(false);
      setReplyContent("");
      setReplyNickname("");
      setReplyPassword("");
      refreshComments();

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
    } catch (error: any) {
      alert(error?.message || "답글을 등록하지 못했습니다.");
    }
  };

  return (
    <>
      <hr
        className="border-t border-gray-300 mb-2"
        style={{ marginLeft: `${currentIndentLevel * 40}px` }}
      />
      <div
        className="py-2"
        style={{ marginLeft: `${currentIndentLevel * 40}px` }}
      >
        <div className="flex items-start">
          {comment.user?.avatar ? (
            <img
              src={comment.user.avatar.replace("/public", "/avatar")}
              alt={`${comment.user.nickname ?? "익명"} 프로필 이미지`}
              className="w-10 h-10 rounded-full object-cover mr-4"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
          )}
          <div className="flex-1">
            <div className="flex justify-between items-center -mb-2">
              <div className="flex items-center flex-wrap">
                <span className="font-bold">
                  {comment.user?.nickname ?? comment.nickname ?? "익명"}
                </span>
                {!comment.user && comment.ip && (
                  <span className="text-gray-400 ml-2 text-xs">
                    ({comment.ip})
                  </span>
                )}
                {comment.parent && (
                  <span className="hidden sm:block text-xs text-gray-500 ml-2">
                    @{comment.parent.user?.nickname ?? comment.parent.nickname}
                  </span>
                )}
              </div>
              <span className="text-sm text-gray-600">
                {new Date(comment.created_at).toLocaleString("ko-KR", {
                  year: "2-digit",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false,
                  timeZone: "Asia/Seoul",
                })}
              </span>
            </div>
            <div className="prose max-w-none">
              {isEditing ? (
                <div className="mt-6">
                  {!comment.user && (
                    <div className="flex gap-4 mb-2">
                      <input
                        type="text"
                        name="nickname"
                        placeholder="닉네임"
                        value={editedNickname}
                        onChange={(e) => setEditedNickname(e.target.value)}
                        className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
                      />
                      <input
                        type="password"
                        name="password"
                        placeholder="비밀번호"
                        value={editedPassword}
                        onChange={(e) => setEditedPassword(e.target.value)}
                        className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
                        autoComplete="off"
                      />
                    </div>
                  )}
                  <textarea
                    ref={contentRef}
                    value={editedContent}
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
                  <div className="flex justify-between items-center mt-2">
                    <div className="relative inline-block">
                      <label
                        htmlFor={`comment-image-${comment.idx}`}
                        className="mt-2 px-4 py-2 bg-green-400 text-white rounded-lg cursor-pointer hover:bg-green-500"
                      >
                        이미지 선택
                      </label>
                      <input
                        onChange={onImageChange}
                        type="file"
                        id={`comment-image-${comment.idx}`}
                        name="image"
                        accept="image/*"
                        multiple
                        className="hidden"
                      />
                    </div>
                    <div className="text-sm">
                      <button
                        onClick={handleSaveEdit}
                        className="text-green-500 hover:underline mr-2"
                      >
                        저장
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="text-gray-500 hover:underline"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <ReactMarkdown
                    remarkPlugins={[
                      remarkGfm,
                      remarkBreaks,
                      remarkYoutubeEmbed,
                    ]}
                    rehypePlugins={[
                      rehypeRaw,
                      [rehypeSanitize, customSchema],
                      rehypeHighlight,
                    ]}
                    components={{
                      a: ({ node, href, children, ...props }) => {
                        const isExternal =
                          typeof href === "string" &&
                          /^https?:\/\//i.test(href);

                        return (
                          <a
                            {...props}
                            href={href}
                            target={isExternal ? "_blank" : props.target}
                            rel={
                              isExternal
                                ? "noopener noreferrer nofollow"
                                : props.rel
                            }
                          >
                            {children}
                          </a>
                        );
                      },
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="mr-4 mt-4 -mb-2 cursor-pointer"
                          style={{
                            maxHeight: "200px",
                            maxWidth: "100%",
                            height: "auto",
                            display: "block",
                          }}
                          alt={props.alt}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onClick={() => handleImageClick(props.src!)}
                        />
                      ),
                      iframe: ({ node, src, title, allow, ...props }) => {
                        const safeSrc = getSafeEmbedSrc(src);

                        if (!safeSrc) {
                          return null;
                        }

                        return (
                          <iframe
                            {...props}
                            src={safeSrc}
                            allow={allow}
                            className="block mt-4 -mb-2"
                            title={title || "삽입된 동영상"}
                            loading="lazy"
                            referrerPolicy="strict-origin-when-cross-origin"
                            sandbox="allow-same-origin allow-scripts allow-popups"
                          />
                        );
                      },
                    }}
                    className="break-all [&>*]:mb-0 text-base"
                  >
                    {comment.content}
                  </ReactMarkdown>

                  {selectedImage && (
                    <div
                      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
                      onClick={() => setSelectedImage(null)}
                    >
                      <button
                        className="absolute top-5 right-5 text-white text-3xl z-50"
                        onClick={() => setSelectedImage(null)}
                      >
                        &times;
                      </button>
                      <img
                        src={selectedImage}
                        alt="댓글 이미지"
                        className="max-h-full max-w-full"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <div className="text-gray-500 text-sm">
                <button onClick={handleReply} className="hover:underline mr-2">
                  답글
                </button>
                {(isOwner || comment.hasPassword) && !isEditing && (
                  <>
                    <button
                      onClick={handleEdit}
                      className="hover:underline mr-2"
                    >
                      수정
                    </button>
                    <button
                      onClick={() =>
                        handleDelete(comment.idx, comment.hasPassword)
                      }
                      className="hover:underline"
                    >
                      삭제
                    </button>
                  </>
                )}
              </div>
            </div>
            {isReplying && (
              <div className="mt-4 mb-4">
                {!user && (
                  <div className="flex gap-4 mb-2">
                    <input
                      type="text"
                      name="nickname"
                      placeholder="닉네임"
                      value={replyNickname}
                      onChange={(e) => setReplyNickname(e.target.value)}
                      className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
                    />
                    <input
                      type="password"
                      name="password"
                      placeholder="비밀번호"
                      value={replyPassword}
                      onChange={(e) => setReplyPassword(e.target.value)}
                      className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
                      autoComplete="off"
                    />
                  </div>
                )}
                <div className="relative">
                  <textarea
                    ref={replyContentRef}
                    value={replyContent}
                    onChange={handleReplyContentChange}
                    onPaste={handleReplyPasteEvent}
                    rows={4}
                    className="w-full p-2 border rounded-lg"
                    disabled={isUploadingReplyImages}
                  />
                  {isUploadingReplyImages && (
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
                      htmlFor={`reply-image-${comment.idx}`}
                      className="mt-2 px-4 py-2 bg-green-400 text-white rounded-lg cursor-pointer hover:bg-green-500"
                    >
                      이미지 선택
                    </label>
                    <input
                      onChange={onReplyImageChange}
                      type="file"
                      id={`reply-image-${comment.idx}`}
                      name="image"
                      accept="image/*"
                      multiple
                      className="hidden"
                    />
                  </div>
                  <div className="text-sm">
                    <button
                      onClick={handleReplySubmit}
                      className="text-green-500 hover:underline mr-2"
                    >
                      등록
                    </button>
                    <button
                      onClick={handleCancelReply}
                      className="text-gray-500 hover:underline"
                    >
                      취소
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
