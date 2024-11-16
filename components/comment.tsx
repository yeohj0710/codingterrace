import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import { getIsOwner } from "@/lib/auth";
import { customSchema } from "@/lib/customSchema";
import { handleImageChange } from "@/lib/handleImageChange";
import { handlePaste } from "@/lib/handlePaste";
import { updateComment } from "@/lib/comment";
import "highlight.js/styles/atom-one-dark.css";

interface CommentProps {
  comment: any;
  handleDelete: (commentIdx: number, commentPassword?: string) => Promise<void>;
  refreshComments: () => void;
}

export default function Comment({
  comment,
  handleDelete,
  refreshComments,
}: CommentProps) {
  const [isOwner, setIsOwner] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedNickname, setEditedNickname] = useState(comment.nickname || "");
  const [editedPassword, setEditedPassword] = useState(comment.password || "");
  const [editedContent, setEditedContent] = useState(comment.content);
  const [isUploadingImages, setIsUploadingImages] = useState<boolean>(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const checkOwnership = async () => {
      if (comment.user) {
        const ownerStatus = await getIsOwner(comment.user.idx);
        setIsOwner(ownerStatus);
      } else {
        setIsOwner(false);
      }
    };
    checkOwnership();
  }, [comment.user]);
  const handleEdit = () => {
    if (comment.password) {
      const inputPassword = window.prompt("댓글 비밀번호를 입력해 주세요.");
      if (inputPassword !== comment.password) {
        alert("비밀번호가 올바르지 않습니다.");
        return;
      }
    }
    setIsEditing(true);
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(comment.content);
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
      alert("이미지 업로드 중입니다. 잠시만 기다려 주세요.");
      return;
    }
    const isConfirmed = window.confirm("정말로 댓글을 수정할까요?");
    if (!isConfirmed) {
      return;
    }
    const formData = new FormData();
    formData.append("idx", comment.idx.toString());
    formData.append("content", editedContent);
    formData.append("nickname", editedNickname);
    if (!comment.user) {
      formData.append("password", editedPassword);
    }
    try {
      await updateComment(formData);
      setIsEditing(false);
      refreshComments();
    } catch (error: any) {
      alert(error.message || "댓글 수정에 실패했습니다.");
    }
  };
  return (
    <div className="border-b border-gray-300 py-2 mb-2 last:border-b-0">
      <div className="flex items-start">
        {comment.user?.avatar ? (
          <img
            src={comment.user.avatar.replace("/public", "/avatar")}
            alt={`${comment.user.nickname ?? "익명"}의 프로필 이미지`}
            className="w-10 h-10 rounded-full object-cover mr-4"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full mr-4"></div>
        )}
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
            {isEditing ? (
              <div className="mt-6">
                {!comment.user && (
                  <div className="flex gap-4 mb-2">
                    <input
                      type="text"
                      name="nickname"
                      placeholder="닉네임 (선택)"
                      value={editedNickname}
                      onChange={(e) => setEditedNickname(e.target.value)}
                      className="w-full sm:w-1/2 px-2 py-1.5 border rounded-lg"
                    />
                    <input
                      type="password"
                      name="password"
                      placeholder="비밀번호 (선택)"
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
                        maxWidth: "100%",
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
            )}
          </div>
          <div className="flex justify-end mt-2">
            {(isOwner || comment.password) &&
              (!isEditing ? (
                <div className="text-gray-500 text-sm">
                  <button onClick={handleEdit} className="hover:underline mr-2">
                    수정
                  </button>
                  <button
                    onClick={() => handleDelete(comment.idx, comment.password)}
                    className="hover:underline"
                  >
                    삭제
                  </button>
                </div>
              ) : null)}
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-4 mt-2">
              {comment.replies.map((reply: any) => (
                <Comment
                  key={reply.idx}
                  comment={reply}
                  handleDelete={handleDelete}
                  refreshComments={refreshComments}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
