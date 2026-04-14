import db from "@/lib/db";
import { deleteSubscription } from "@/lib/subscription";
import { normalizeInternalUrl } from "@/lib/siteUrl";
import { stripMarkdown } from "@/lib/utils";
import webpush from "web-push";

type SubscriptionFilter = {
  type: string;
  postId?: number | null;
  commentId?: number | null;
};

type SendPushOptions = SubscriptionFilter & {
  title: string;
  message: string;
  url: string;
};

let vapidConfigured = false;

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_KEY;
  const privateKey = process.env.PRIVATE_VAPID_KEY;

  if (!publicKey || !privateKey) {
    throw new Error("Push notification keys are not configured.");
  }

  if (!vapidConfigured) {
    webpush.setVapidDetails(
      "mailto:security@codingterrace.com",
      publicKey,
      privateKey
    );
    vapidConfigured = true;
  }
}

function createPayload(title: string, message: string, url: string) {
  return JSON.stringify({
    title: title.trim().slice(0, 120),
    message: stripMarkdown(message).trim().slice(0, 240),
    url: normalizeInternalUrl(url),
  });
}

async function sendToSubscriptions(
  subscriptions: Array<{
    endpoint: string;
    p256dh: string;
    auth: string;
    type: string;
    postId: number | null;
    commentId: number | null;
  }>,
  payload: string
) {
  configureWebPush();

  await Promise.all(
    subscriptions.map(async (subscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          },
          payload
        );
      } catch (error: any) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await deleteSubscription(
            subscription.endpoint,
            subscription.type,
            subscription.postId,
            subscription.commentId
          );
          return;
        }

        console.error("Failed to send web push notification:", error);
      }
    })
  );
}

export async function sendPushNotification({
  type,
  postId = null,
  commentId = null,
  title,
  message,
  url,
}: SendPushOptions) {
  const subscriptions = await db.subscription.findMany({
    where: {
      type,
      postId,
      commentId,
    },
    select: {
      endpoint: true,
      p256dh: true,
      auth: true,
      type: true,
      postId: true,
      commentId: true,
    },
  });

  if (subscriptions.length === 0) {
    return;
  }

  await sendToSubscriptions(subscriptions, createPayload(title, message, url));
}
