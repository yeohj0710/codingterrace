"use server";

import db from "@/lib/db";
import { hashGuestPassword, isHashedPassword, verifyStoredPassword } from "@/lib/password";
import { sendPushNotification } from "@/lib/push";
import { checkRateLimit, getRequestRateLimitKey } from "@/lib/security";
import getSession from "@/lib/session";
import { publicUserSelect } from "@/lib/selects";
import { formatIp, stripMarkdown } from "@/lib/utils";
import { headers } from "next/headers";
import { z } from "zod";

const commentMutationSchema = z.object({
  postIdx: z.number().int().positive(),
  parentIdx: z.number().int().positive().nullable(),
  content: z.string().trim().min(1).max(5000),
  nickname: z.string().trim().max(12).optional().nullable(),
  password: z.string().trim().max(128).optional().nullable(),
  currentPassword: z.string().trim().max(128).optional().nullable(),
});

async function getCommentForMutation(idx: number) {
  return db.comment.findUnique({
    where: { idx },
    select: {
      idx: true,
      postIdx: true,
      password: true,
      user: {
        select: {
          idx: true,
        },
      },
    },
  });
}

async function verifyGuestCommentAccess(
  idx: number,
  suppliedPassword: string | null | undefined
) {
  const comment = await getCommentForMutation(idx);

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.user) {
    throw new Error("This comment must be managed by the account owner.");
  }

  const isValidPassword = await verifyStoredPassword(
    comment.password,
    suppliedPassword
  );

  if (!isValidPassword) {
    return false;
  }

  if (comment.password && !isHashedPassword(comment.password)) {
    await db.comment.update({
      where: { idx: comment.idx },
      data: {
        password: await hashGuestPassword(suppliedPassword),
      },
    });
  }

  return true;
}

export async function getComments(postIdx: number) {
  const comments = await db.comment.findMany({
    where: { postIdx },
    select: {
      idx: true,
      content: true,
      created_at: true,
      updated_at: true,
      nickname: true,
      ip: true,
      postIdx: true,
      parentIdx: true,
      password: true,
      user: {
        select: publicUserSelect,
      },
      Comment: {
        select: {
          idx: true,
          nickname: true,
          user: {
            select: publicUserSelect,
          },
        },
      },
    },
    orderBy: { created_at: "asc" },
  });

  return comments.map((comment) => ({
    idx: comment.idx,
    content: comment.content,
    created_at: comment.created_at,
    updated_at: comment.updated_at,
    nickname: comment.nickname,
    ip: comment.ip,
    postIdx: comment.postIdx,
    parentIdx: comment.parentIdx,
    hasPassword: Boolean(comment.password),
    user: comment.user,
    parent: comment.Comment,
  }));
}

export async function verifyCommentPassword(idx: number, password: string) {
  return verifyGuestCommentAccess(idx, password);
}

export async function addComment(formData: FormData) {
  const rateLimit = checkRateLimit(getRequestRateLimitKey("comment-create"), {
    limit: 20,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    throw new Error("Too many comments. Please try again later.");
  }

  const parsed = commentMutationSchema.safeParse({
    postIdx: Number(formData.get("postIdx")),
    parentIdx: formData.get("parentIdx")
      ? Number(formData.get("parentIdx"))
      : null,
    content: formData.get("content"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    currentPassword: null,
  });

  if (!parsed.success) {
    throw new Error("Invalid comment input.");
  }

  const { postIdx, parentIdx, content, nickname, password } = parsed.data;
  const post = await db.post.findUnique({
    where: { idx: postIdx },
    select: {
      idx: true,
      category: true,
    },
  });

  if (!post) {
    throw new Error("Post not found.");
  }

  if (parentIdx) {
    const parentComment = await db.comment.findUnique({
      where: { idx: parentIdx },
      select: {
        idx: true,
        postIdx: true,
      },
    });

    if (!parentComment || parentComment.postIdx !== postIdx) {
      throw new Error("Invalid parent comment.");
    }
  }

  const session = await getSession();
  let commentData: {
    content: string;
    post: { connect: { idx: number } };
    parent?: { connect: { idx: number } };
    user?: { connect: { idx: number } };
    nickname?: string;
    password?: string | null;
    ip?: string;
  } = {
    content,
    post: { connect: { idx: postIdx } },
    parent: parentIdx ? { connect: { idx: parentIdx } } : undefined,
  };

  if (session.idx) {
    commentData.user = { connect: { idx: session.idx } };
  } else {
    const headerStore = headers();
    const ip = headerStore.get("x-forwarded-for");
    commentData.nickname = nickname || "Anonymous";
    commentData.password = await hashGuestPassword(password);
    commentData.ip = formatIp(ip);
  }

  const newComment = await db.comment.create({
    data: commentData,
    select: {
      idx: true,
      postIdx: true,
      parentIdx: true,
    },
  });

  const preview = stripMarkdown(content);
  const truncatedPreview =
    preview.length > 50 ? `${preview.slice(0, 50)}...` : preview;
  const postUrl = `/${post.category}/${postIdx}`;

  try {
    if (parentIdx) {
      await sendPushNotification({
        type: "commentAuthor",
        commentId: parentIdx,
        title: "새 답글이 달렸어요.",
        message: truncatedPreview,
        url: postUrl,
      });
    } else {
      await sendPushNotification({
        type: "postAuthor",
        postId: postIdx,
        title: "새 댓글이 달렸어요.",
        message: truncatedPreview,
        url: postUrl,
      });
    }
  } catch (error) {
    console.error("Failed to send comment notification:", error);
  }

  return newComment;
}

export async function deleteComment(
  commentIdx: number,
  suppliedPassword?: string | null
) {
  const session = await getSession();
  const comment = await getCommentForMutation(commentIdx);

  if (!comment) {
    throw new Error("Comment not found.");
  }

  if (comment.user) {
    if (session.idx !== comment.user.idx) {
      throw new Error("You do not have permission to delete this comment.");
    }
  } else {
    const isValidPassword = await verifyGuestCommentAccess(
      commentIdx,
      suppliedPassword
    );

    if (!isValidPassword) {
      throw new Error("Invalid comment password.");
    }
  }

  await db.comment.delete({ where: { idx: commentIdx } });
}

export async function updateComment(formData: FormData) {
  const idx = Number(formData.get("idx"));

  if (Number.isNaN(idx) || idx <= 0) {
    throw new Error("Invalid comment id.");
  }

  const existingComment = await getCommentForMutation(idx);

  if (!existingComment) {
    throw new Error("Comment not found.");
  }

  const parsed = commentMutationSchema.safeParse({
    postIdx: existingComment.postIdx,
    parentIdx: null,
    content: formData.get("content"),
    nickname: formData.get("nickname"),
    password: formData.get("password"),
    currentPassword: formData.get("currentPassword"),
  });

  if (!parsed.success) {
    throw new Error("Invalid comment input.");
  }

  const session = await getSession();

  if (existingComment.user) {
    if (!session.idx || session.idx !== existingComment.user.idx) {
      throw new Error("You do not have permission to edit this comment.");
    }
  } else {
    const isValidPassword = await verifyGuestCommentAccess(
      idx,
      parsed.data.currentPassword
    );

    if (!isValidPassword) {
      throw new Error("Invalid comment password.");
    }

    if (!parsed.data.password?.trim()) {
      throw new Error("Guest comments must keep a password.");
    }
  }

  const updateData: {
    content: string;
    updated_at: Date;
    nickname?: string;
    password?: string | null;
  } = {
    content: parsed.data.content,
    updated_at: new Date(),
  };

  if (!existingComment.user) {
    updateData.nickname = parsed.data.nickname || "Anonymous";
    updateData.password = await hashGuestPassword(parsed.data.password);
  }

  await db.comment.update({
    where: { idx },
    data: updateData,
  });
}
