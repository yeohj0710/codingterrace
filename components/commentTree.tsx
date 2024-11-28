import Comment from "./comment";

interface CommentTreeProps {
  comment: any;
  comments: any[];
  handleDelete: (commentIdx: number, commentPassword?: string) => Promise<void>;
  refreshComments: () => void;
  indentLevel?: number;
}

export default function CommentTree({
  comment,
  comments,
  handleDelete,
  refreshComments,
  indentLevel = 0,
}: CommentTreeProps) {
  const childComments = comments.filter((c) => c.parentIdx === comment.idx);
  const parentIndex = comments.findIndex((c) => c.idx === comment.idx);
  return (
    <>
      <Comment
        comment={comment}
        handleDelete={handleDelete}
        refreshComments={refreshComments}
        indentLevel={indentLevel}
        index={parentIndex}
      />
      {childComments.map((childComment, childIndex) => (
        <CommentTree
          key={childComment.idx}
          comment={childComment}
          comments={comments}
          handleDelete={handleDelete}
          refreshComments={refreshComments}
          indentLevel={indentLevel + 1}
        />
      ))}
    </>
  );
}
