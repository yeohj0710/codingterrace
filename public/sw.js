self.addEventListener("push", function (event) {
  const data = event.data?.json();
  if (data) {
    const { title, message } = data;
    const options = {
      body: message,
      icon: "/icon.png",
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});
