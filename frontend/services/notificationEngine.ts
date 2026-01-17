import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermissions() {
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
  const granted = await ensureNotificationPermissions();
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
