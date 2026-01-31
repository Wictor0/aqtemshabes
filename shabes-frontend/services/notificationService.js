import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Configuração de comportamento das notificações em primeiro plano (Foreground)
 * Atualizado para ELIMINAR o aviso de depreciação do shouldShowAlert.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // Substituído shouldShowAlert pelos novos padrões para evitar avisos
    shouldShowBanner: true, 
    shouldShowList: true,   
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Envia uma notificação Push para outro utilizador via Expo API (Notificação Remota)
 * Reforçado com parâmetros de prioridade e logs de diagnóstico detalhados.
 */
export async function sendPushNotification(targetExpoToken, title, body, data = {}) {
  // 1. Validação rigorosa do Token
  if (!targetExpoToken || typeof targetExpoToken !== 'string') {
    console.error("[PUSH] Erro: Token de destino ausente ou no formato incorreto.");
    return;
  }

  if (!targetExpoToken.startsWith('ExponentPushToken')) {
    console.error("[PUSH] Erro: O token fornecido não é um token válido do Expo (deve começar com ExponentPushToken).");
    return;
  }

  console.log(`[PUSH] Iniciando envio remoto para o destinatário: ${targetExpoToken}`);

  // 2. Construção do Payload otimizado
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
      console.log(`[PUSH] Sucesso: Mensagem aceita pelo Expo. ID: ${resData.data?.id}`);
      if (resData.data?.status === 'error') {
        console.error(`[PUSH] Erro no ticket de entrega do Expo: ${resData.data.message}`);
      }
    } else {
      console.error("[PUSH] O servidor do Expo rejeitou a requisição:", JSON.stringify(resData));
    }
  } catch (error) {
    console.error("[PUSH] Erro de rede ou falha na API do Expo:", error);
  }
}

/**
 * Atalho para notificar anfitrião sobre novo interesse
 */
export async function notifyHostOfNewInterest(hostToken, guestName, eventTitle) {
  return sendPushNotification(
    hostToken,
    "Novo interesse no evento! 🕯️",
    `${guestName} se interessou pelo seu evento: ${eventTitle}`,
    { type: 'NEW_INTEREST' }
  );
}

/**
 * Atalho para notificar convidado sobre decisão do anfitrião
 */
export async function notifyGuestOfMatchAction(guestToken, eventTitle, status) {
  const isAccepted = status === 'accepted' || status === 'ACCEPTED';
  const title = isAccepted ? "Pedido Aceito! ✨" : "Pedido Recusado";
  const body = isAccepted 
    ? `Sua participação no evento "${eventTitle}" foi confirmada!` 
    : `Infelizmente seu pedido para "${eventTitle}" não foi aceito desta vez.`;
  
  return sendPushNotification(guestToken, title, body, { type: 'MATCH_RESPONSE', status });
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
    
    if (finalStatus !== 'granted') {
      console.warn('[PUSH] Permissão negada pelo utilizador.');
      return null;
    }

    try {
      const projectId = Constants?.expoConfig?.extra?.eas?.projectId ?? 
                        Constants?.easConfig?.projectId;
      
      const pushTokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      token = pushTokenData.data;
    } catch (e) {
      console.error("[PUSH] Falha ao gerar token:", e);
    }
  } else {
    console.warn('[PUSH] Necessário dispositivo físico para notificações remotas.');
  }

  return token;
}

/**
 * Dispara uma notificação local
 */
export async function showLocalNotification(title, body) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title || "AquiTemShabes",
        body: body,
        color: '#4F46E5',
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null,
    });
  } catch (error) {
    console.error("[PUSH] Erro ao disparar notificação local:", error);
  }
}