export const requestNotificationPermission = async (showAlert: () => void) => {
  const permission = Notification.permission;
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
  if (permission === "denied" || permission !== "granted") {
    showAlert();
    return false;
  }
  return true;
};

export const toggleSubscription = async (
  type: string,
  showAlert: () => void
) => {
  if (!("serviceWorker" in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
    } else {
      const convertedVapidKey = urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_KEY as string
      );
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
      await saveSubscriptionToServer(newSubscription, type);
    }
  } catch (error) {
    console.error("알림 on/off 전환 중 에러가 발생했습니다:", error);
    if (error instanceof Error && error.name === "NotAllowedError") {
      showAlert();
    }
  }
};

const saveSubscriptionToServer = async (
  subscription: PushSubscription,
  type: string
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
        type: type,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("subscription 저장에 실패하였습니다.");
    }
    await response.json();
  } catch (error) {
    console.error("subscription 저장 중 에러가 발생하였습니다:", error);
  }
};

export const sendNotification = async (
  title: string,
  message: string,
  type: string,
  url: string
) => {
  try {
    const payload = JSON.stringify({ title, message, type, url });
    const response = await fetch("/api/send-notification", {
      method: "POST",
      body: payload,
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!response.ok) {
      throw new Error("알림 전송에 실패하였습니다.");
    }
  } catch (error) {
    console.error("알림 발송 중 에러가 발생하였습니다:", error);
  }
};

const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};
