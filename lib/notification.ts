import { categoryToName } from "./utils";

export const requestNotificationPermission = async (showHelp: () => void) => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    showHelp();
    return false;
  }

  const permission = Notification.permission;

  if (permission === "granted") {
    return true;
  }

  if (permission === "default") {
    try {
      const newPermission = await Notification.requestPermission();

      if (newPermission === "granted") {
        return true;
      }
    } catch (error) {
      console.error("알림 권한 요청 중 오류가 발생했습니다:", error);
      return false;
    }
  }

  showHelp();
  return false;
};

export const toggleSubscription = async (
  type: string,
  showHelp?: () => void,
  latitude?: number | null,
  longitude?: number | null
) => {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const response = await fetch("/api/check-subscription", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          type,
          postId: null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();

      if (result.exists) {
        const unsubscribeResponse = await fetch("/api/unsubscribe", {
          method: "POST",
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            type,
            postId: null,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        });
        const unsubscribeResult = await unsubscribeResponse.json();

        if (unsubscribeResponse.ok && !unsubscribeResult.hasOtherSubscriptions) {
          await subscription.unsubscribe();
        }
      } else {
        await saveSubscriptionToServer(
          subscription,
          type,
          null,
          null,
          latitude,
          longitude
        );
        console.log(`알림 구독을 저장했습니다: ${categoryToName(type)}`);
      }
    } else {
      const convertedVapidKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_KEY as string
      );
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      await saveSubscriptionToServer(
        newSubscription,
        type,
        null,
        null,
        latitude,
        longitude
      );
      console.log(`알림 구독을 저장했습니다: ${categoryToName(type)}`);
    }
  } catch (error) {
    console.error("알림 설정을 변경하는 중 오류가 발생했습니다:", error);

    if (
      error instanceof Error &&
      error.name === "NotAllowedError" &&
      showHelp
    ) {
      showHelp();
    }
  }
};

const saveSubscriptionToServer = async (
  subscription: PushSubscription,
  type: string,
  postId?: number | null,
  commentId?: number | null,
  latitude?: number | null,
  longitude?: number | null
) => {
  try {
    const p256dh = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");
    const p256dhBase64 = p256dh
      ? btoa(String.fromCharCode(...new Uint8Array(p256dh)))
      : null;
    const authBase64 = auth
      ? btoa(String.fromCharCode(...new Uint8Array(auth)))
      : null;

    const response = await fetch("/api/save-subscription", {
      method: "POST",
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: p256dhBase64,
          auth: authBase64,
        },
        type,
        postId: postId || null,
        commentId: commentId || null,
        latitude: latitude || null,
        longitude: longitude || null,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("구독 정보를 서버에 저장하지 못했습니다.");
    }

    await response.json();
  } catch (error) {
    console.error("구독 저장 중 오류가 발생했습니다.", error);
  }
};

export const sendNotification = async (
  title: string,
  message: string,
  type: string,
  url: string,
  baseUrl?: string
) => {
  try {
    const payload = JSON.stringify({ title, message, type, url });
    const apiUrl = baseUrl
      ? `${baseUrl}/api/send-notification`
      : "/api/send-notification";
    const response = await fetch(apiUrl, {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("알림을 전송하지 못했습니다.");
    }
  } catch (error) {
    console.error("알림 전송 중 오류가 발생했습니다.", error);
  }
};

export const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};

export async function saveSubscription(subscription: any) {
  try {
    const response = await fetch("/api/save-subscription", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error("구독 저장 중 오류가 발생했습니다.");
    }
  } catch (error) {
    console.error("구독 저장 중 오류가 발생했습니다:", error);
  }
}
