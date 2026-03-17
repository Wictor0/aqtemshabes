import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Configuração de comportamento das notificações em primeiro plano (Foreground)
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, 
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Envia uma notificação Push para outro utilizador via Expo API (Notificação Remota)
 */
export async function sendPushNotification(targetExpoToken, title, body, data = {}) {
  if (!targetExpoToken || typeof targetExpoToken !== 'string') {
    console.error("[PUSH] Erro: Token de destino ausente.");
    return;
  }

  if (!targetExpoToken.startsWith('ExponentPushToken')) {
    console.error("[PUSH] Erro: Token inválido.");
    return;
  }

  const message = {
    to: targetExpoToken,
    sound: 'default',
    title: title,
    body: body,
    data: { 
      ...data, 
      origin: 'remote_push',
      sentAt: new Date().toISOString() 
    },
    priority: 'high',         
    channelId: 'default',    
    badge: 1,               
  };

  try {
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Accept-encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    const resData = await response.json();
    if (response.ok) {
      console.log(`[PUSH] Sucesso ID: ${resData.data?.id}`);
    }
  } catch (error) {
    console.error("[PUSH] Erro de rede:", error);
  }
}

/**
 * Atalho para notificar anfitrião sobre novo interesse
 * 👇 ATUALIZADO: Agora aceita eventId para redirecionamento 👇
 */
export async function notifyHostOfNewInterest(hostToken, guestName, eventTitle, eventId) {
  return sendPushNotification(
    hostToken,
    "Novo interesse no evento! 🕯️",
    `${guestName} se interessou pelo seu evento: ${eventTitle}`,
    { type: 'NEW_INTEREST', eventId: eventId } // 👈 Passando ID para o clique
  );
}

/**
 * Atalho para notificar convidado sobre decisão do anfitrião
 * 👇 ATUALIZADO: Agora aceita eventId para redirecionamento 👇
 */
export async function notifyGuestOfMatchAction(guestToken, eventTitle, status, eventId) {
  const isAccepted = status === 'accepted' || status === 'ACCEPTED';
  const title = isAccepted ? "Pedido Aceito! ✨" : "Pedido Recusado";
  const body = isAccepted 
    ? `Sua participação no evento "${eventTitle}" foi confirmada!` 
    : `Infelizmente seu pedido para "${eventTitle}" não foi aceito desta vez.`;
  
  return sendPushNotification(guestToken, title, body, { 
    type: 'MATCH_RESPONSE', 
    status, 
    eventId: eventId // 👈 Passando ID para o clique
  });
}

/**
 * Regista o dispositivo e obtém o token único
 */
export async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'AquiTemShabes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4F46E5',
      showBadge: true,
    });
  }

  const isDevice = Constants.isDevice ?? (Platform.OS !== 'web');

  if (isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') return null;

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                        Constants?.easConfig?.projectId;
      
      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = pushTokenData.data;
    } catch (e) {
      console.error("[PUSH] Falha ao gerar token:", e);
    }
  }

  return token;
}

/**
 * Dispara uma notificação local
 * 👇 ATUALIZADO: Agora aceita o parâmetro data para Deep Linking 👇
 */
export async function showLocalNotification(title, body, data = {}) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "AquiTemShabes",
        body: body,
        color: '#4F46E5',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: data, // 👈 Importante: contém o eventId para o clique funcionar
      },
      trigger: null,
    });
  } catch (error) {
    console.error("[PUSH] Erro ao disparar notificação local:", error);
  }
}