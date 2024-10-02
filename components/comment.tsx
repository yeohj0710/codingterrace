import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import remarkBreaks from "remark-breaks";
import "highlight.js/styles/atom-one-dark.css";
import { getIsOwner } from "@/lib/auth";
import { customSchema } from "@/lib/customSchema";

interface CommentProps {
  comment: any;
  handleDelete: (commentIdx: number, commentPassword?: string) => Promise<void>;
}

export default function Comment({ comment, handleDelete }: CommentProps) {
  const [isOwner, setIsOwner] = useState<boolean>(false);
  useEffect(() => {
    const checkOwnership = async () => {
      if (comment.user) {
        const ownerStatus = await getIsOwner(comment.user.idx);
        setIsOwner(ownerStatus);
      }
    };
    checkOwnership();
  }, [comment.user]);
  return (
    <div className="border-b border-gray-300 py-2 mb-2 last:border-b-0">
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
              rehypePlugins={[[rehypeSanitize, customSchema], rehypeHighlight]}
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
          </div>
          <div className="flex justify-end mt-2">
            {isOwner || comment.password ? (
              <button
                onClick={() => handleDelete(comment.idx, comment.password)}
                className="text-red-500 hover:underline"
              >
                삭제
              </button>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="ml-4 mt-2">
              {comment.replies.map((reply: any) => (
                <Comment
                  key={reply.idx}
                  comment={reply}
                  handleDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
