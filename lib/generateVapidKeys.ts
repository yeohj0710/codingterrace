import webpush from "web-push";

export function generateVapidKeys() {
  const vapidKeys = webpush.generateVAPIDKeys();
  console.log("Public VAPID Key:", vapidKeys.publicKey);
  console.log("Private VAPID Key:", vapidKeys.privateKey);
}
