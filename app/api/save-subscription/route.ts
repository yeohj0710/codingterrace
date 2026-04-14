import db from "@/lib/db";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { NextResponse } from "next/server";
import { z } from "zod";

const subscriptionTypeSchema = z.enum([
  "main",
  "board",
  "technote",
  "weather",
  "postAuthor",
  "commentAuthor",
]);

const saveSubscriptionSchema = z
  .object({
    endpoint: z.string().url().max(2048),
    keys: z.object({
      p256dh: z.string().min(1).max(1024),
      auth: z.string().min(1).max(1024),
    }),
    type: subscriptionTypeSchema,
    postId: z.number().int().positive().nullable().optional(),
    commentId: z.number().int().positive().nullable().optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "postAuthor" && !value.postId) {
      ctx.addIssue({
        code: "custom",
        path: ["postId"],
        message: "postId is required for post author subscriptions.",
      });
    }

    if (value.type === "commentAuthor" && !value.commentId) {
      ctx.addIssue({
        code: "custom",
        path: ["commentId"],
        message: "commentId is required for comment author subscriptions.",
      });
    }

    if (value.type !== "postAuthor" && value.postId) {
      ctx.addIssue({
        code: "custom",
        path: ["postId"],
        message: "postId is only allowed for post author subscriptions.",
      });
    }

    if (value.type !== "commentAuthor" && value.commentId) {
      ctx.addIssue({
        code: "custom",
        path: ["commentId"],
        message: "commentId is only allowed for comment author subscriptions.",
      });
    }

    if (value.type !== "weather") {
      if (value.latitude !== undefined && value.latitude !== null) {
        ctx.addIssue({
          code: "custom",
          path: ["latitude"],
          message: "Location is only allowed for weather subscriptions.",
        });
      }

      if (value.longitude !== undefined && value.longitude !== null) {
        ctx.addIssue({
          code: "custom",
          path: ["longitude"],
          message: "Location is only allowed for weather subscriptions.",
        });
      }
    }
  });

export async function POST(request: Request) {
  const rateLimit = checkRateLimit(`save-subscription:${getClientIp(request)}`, {
    limit: 60,
    windowMs: 60 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many subscription requests." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = saveSubscriptionSchema.safeParse({
      ...body,
      postId: body.postId ?? null,
      commentId: body.commentId ?? null,
      latitude: body.latitude ?? null,
      longitude: body.longitude ?? null,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid subscription payload." },
        { status: 400 }
      );
    }

    const { endpoint, keys, type, postId, commentId, latitude, longitude } =
      parsed.data;

    if (type === "postAuthor" && postId) {
      const post = await db.post.findUnique({
        where: { idx: postId },
        select: { idx: true },
      });

      if (!post) {
        return NextResponse.json({ error: "Post not found." }, { status: 404 });
      }
    }

    if (type === "commentAuthor" && commentId) {
      const comment = await db.comment.findUnique({
        where: { idx: commentId },
        select: { idx: true },
      });

      if (!comment) {
        return NextResponse.json(
          { error: "Comment not found." },
          { status: 404 }
        );
      }
    }

    const existingSubscription = await db.subscription.findFirst({
      where: {
        endpoint,
        type,
        postId: postId ?? null,
        commentId: commentId ?? null,
      },
      select: {
        id: true,
        latitude: true,
        longitude: true,
      },
    });

    if (existingSubscription) {
      await db.subscription.update({
        where: { id: existingSubscription.id },
        data: {
          p256dh: keys.p256dh,
          auth: keys.auth,
          latitude:
            latitude === undefined || latitude === null
              ? existingSubscription.latitude
              : latitude,
          longitude:
            longitude === undefined || longitude === null
              ? existingSubscription.longitude
              : longitude,
        },
      });
    } else {
      await db.subscription.create({
        data: {
          endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
          type,
          postId: postId ?? null,
          commentId: commentId ?? null,
          created_at: new Date(),
          latitude: latitude ?? null,
          longitude: longitude ?? null,
        },
      });
    }

    return NextResponse.json({ message: "Subscription saved." });
  } catch (error) {
    console.error("Failed to save subscription:", error);
    return NextResponse.json(
      { error: "Failed to save subscription." },
      { status: 500 }
    );
  }
}
