import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

const getNotifications = async () => {
  if (isExpoGo) {
    return null;
  }
  const module = await import('expo-notifications');
  return module;
};

const ensureHandler = async () => {
  const Notifications = await getNotifications();
  if (!Notifications) {
    return null;
  }
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  return Notifications;
};

export async function ensureNotificationPermissions(
  Notifications: Awaited<ReturnType<typeof getNotifications>>
) {
  if (!Notifications) {
    return false;
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) {
    return true;
  }
  const request = await Notifications.requestPermissionsAsync();
  return request.granted;
}

export async function scheduleFakeMessage(
  title: string,
  body: string,
  delaySeconds = 2
) {
  const Notifications = await ensureHandler();
  if (!Notifications) {
    return;
  }

  const granted = await ensureNotificationPermissions(Notifications);
  if (!granted) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: {
      seconds: delaySeconds,
    },
  });
}
