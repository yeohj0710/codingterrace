"use client";

import { useEffect, useState } from "react";
import { BellIcon, BellSlashIcon } from "@heroicons/react/24/solid";
import { isUserOperator } from "@/lib/auth";
import {
  requestNotificationPermission,
  sendNotification,
  toggleSubscription,
} from "@/lib/notification";
import CustomAlert from "./customAlert";

export default function NotificationPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAlertVisible, setIsAlertVisible] = useState(false);
  const [isOperator, setIsOperator] = useState(false);

  useEffect(() => {
    const initializeNotification = async () => {
      if (!("serviceWorker" in navigator)) {
        console.error("Service Worker is not supported in this browser.");
        return;
      }

      try {
        await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        const permissionGranted = await requestNotificationPermission(() => {
          setIsAlertVisible(true);
        });

        if (!permissionGranted) {
          return;
        }

        await checkNotificationStatus();
      } catch (error) {
        console.error("Failed to initialize the Service Worker:", error);
      }
    };

    const loadPrivileges = async () => {
      setIsOperator(await isUserOperator());
    };

    initializeNotification();
    loadPrivileges();
  }, []);

  const checkNotificationStatus = async () => {
    if (!("serviceWorker" in navigator)) {
      setIsSubscribed(false);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        return;
      }

      const response = await fetch("/api/check-subscription", {
        method: "POST",
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          type: "main",
          postId: null,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check the subscription state.");
      }

      const result = await response.json();
      setIsSubscribed(result.exists);
    } catch (error) {
      console.error("Failed to check the subscription state:", error);
      setIsSubscribed(false);
    }
  };

  const handleNotificationToggle = async () => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setIsAlertVisible(true);
      return;
    }

    setIsProcessing(true);

    try {
      const permissionGranted = await requestNotificationPermission(() => {
        setIsProcessing(false);
        setIsSubscribed(false);
        setIsAlertVisible(true);
      });

      if (!permissionGranted) {
        setIsProcessing(false);
        setIsAlertVisible(true);
        return;
      }

      await toggleSubscription("main", () => {
        setIsAlertVisible(true);
      });
      await checkNotificationStatus();
    } catch (error) {
      console.error("Failed to toggle notifications:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotificationSend = async () => {
    setIsSending(true);

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (registration) {
        await registration.update();
      }

      await sendNotification(title, message, "main", "https://codingterrace.com");
      window.alert("The notification was sent.");
    } catch (error) {
      console.error("Failed to send the notification:", error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      {isAlertVisible && (
        <CustomAlert onClose={() => setIsAlertVisible(false)} />
      )}
      <div className="flex flex-col w-full sm:w-[640px] xl:w-1/2 bg-white p-5 gap-2 relative sm:border sm:border-gray-200 sm:rounded-lg sm:shadow-lg">
        <div className="flex justify-between items-center mb-1">
          <span className="text-lg font-bold">Send a Site Notification</span>
          <button
            onClick={handleNotificationToggle}
            className="text-gray-500"
            disabled={isProcessing}
          >
            {isSubscribed === null ? (
              <div className="w-6 h-6 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
            ) : isProcessing ? (
              <div className="w-6 h-6 border-4 border-t-transparent border-green-500 rounded-full animate-spin"></div>
            ) : isSubscribed ? (
              <BellIcon className="w-6 h-6 text-green-500" />
            ) : (
              <BellSlashIcon className="w-6 h-6 text-red-500" />
            )}
          </button>
        </div>
        <span className="text-sm">
          Site notifications keep working even after you close the tab.
        </span>
        {isOperator ? (
          <>
            <span className="text-sm mb-3">
              Operator accounts can send a broadcast to all subscribed users.
            </span>
            <input
              type="text"
              placeholder="Notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-2 border rounded-lg w-full"
            />
            <textarea
              placeholder="Notification message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="p-2 border rounded-lg w-full"
            />
            <button
              onClick={handleNotificationSend}
              className={`flex items-center justify-center ${
                isSending ? "bg-gray-400" : "bg-green-400 hover:bg-green-500"
              } text-white p-2 rounded-lg`}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  Sending...
                  <div className="w-4 h-4 ml-2 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </>
              ) : (
                "Send Notification"
              )}
            </button>
          </>
        ) : (
          <span className="text-sm mb-3 text-gray-500">
            Broadcast sending is available only to operator accounts.
          </span>
        )}
      </div>
    </>
  );
}
