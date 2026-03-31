export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!("Notification" in window)) {
    console.error("Este navegador não suporta notificações de desktop");
    return "denied";
  }
  return Notification.requestPermission();
};

export const getNotificationPermission = (): NotificationPermission => {
    if (!("Notification" in window)) {
        return "denied";
    }
    return Notification.permission;
}

export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === "granted") {
    navigator.serviceWorker.getRegistration().then(reg => {
      if (reg) {
        reg.showNotification(title, options);
      } else {
        new Notification(title, options);
      }
    });
  }
};
