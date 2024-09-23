self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", function (event) {
  const data = event.data?.json();
  if (data) {
    const { title, message, url } = data;
    const modifiedMessage = `${message}\n(알림을 누르면 코딩테라스로 이동해요.)`;
    const options = {
      body: modifiedMessage,
      icon: "/icon.png",
      data: { url },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data.url;
  console.log("Notification clicked, URL:", url);
  event.waitUntil(
    clients.matchAll({ type: "window" }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
