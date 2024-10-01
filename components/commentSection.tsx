"use client";

import { useEffect, useRef, useState } from "react";
import { getUser } from "@/lib/auth";
import { getComments, addComment, deleteComment } from "@/lib/comment";
import { handleImageChange } from "@/lib/handleImageChange";
import { handlePaste } from "@/lib/handlePaste";
import { customSchema } from "@/lib/customSchema";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import "highlight.js/styles/atom-one-dark.css";

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
  const contentRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const fetchUser = async () => {
      const userData = await getUser();
      setUser(userData);
    };
    const fetchComments = async () => {
      const commentsData = await getComments(postIdx);
      setComments(commentsData);
    };
    fetchUser();
    fetchComments();
  }, [postIdx]);
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
    await addComment(formData);
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
      await deleteComment(commentIdx, inputPassword);
    } else {
      await deleteComment(commentIdx);
    }
    const commentsData = await getComments(postIdx);
    setComments(commentsData);
  };
  const renderComments = (comments: any[]) => {
    return comments.map((comment) => (
      <div key={comment.idx} className="border-b border-gray-300 py-2 mb-2">
        <div className="flex items-start">
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
          <div className="flex-1">
            <div className="flex justify-between items-center -mb-3">
              <div className="flex items-baseline">
                <span className="font-bold">
                  {comment.user?.nickname ?? comment.nickname ?? "익명"}
                </span>
                {!comment.user && comment.ip && (
                  <span className="text-gray-400 ml-2 text-xs">
                    ({comment.ip})
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
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkBreaks]}
                rehypePlugins={[
                  [rehypeSanitize, customSchema],
                  rehypeHighlight,
                ]}
                components={{
                  img: ({ node, ...props }) => (
                    <img
                      {...props}
                      className="mr-4 mb-2"
                      style={{
                        maxHeight: "200px",
                        height: "auto",
                        display: "block",
                      }}
                      alt={props.alt}
                    />
                  ),
                }}
                className="break-all"
              >
                {comment.content}
              </ReactMarkdown>
            </div>
            <div className="flex justify-end mt-2">
              <button
                onClick={() => handleDelete(comment.idx, comment.password)}
                className="text-red-500 hover:underline"
              >
                삭제
              </button>
            </div>
            {comment.replies && comment.replies.length > 0 && (
              <div className="ml-4 mt-2">{renderComments(comment.replies)}</div>
            )}
          </div>
        </div>
      </div>
    ));
  };
  return (
    <div className="mt-8">
      <h2 className="text-lg font-bold mb-4">댓글</h2>
      {comments.length > 0 ? (
        <div>{renderComments(comments)}</div>
      ) : (
        <p className="flex flex-col items-center mt-5 mb-10 text-gray-400">
          댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
        </p>
      )}
      <form onSubmit={handleSubmit} className="mt-3 mb-6">
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
