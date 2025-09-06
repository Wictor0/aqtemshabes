import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import Icon from "../ui/Icon";
import { Button } from "../ui/Button";

// Defina constantes para os status para evitar erros de digitação
const MatchStatus = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  DECLINED: "DECLINED",
  CHAT_REQUESTED: "CHAT_REQUESTED",
};

// --- Funções de Ajuda ---

const getStatusBadge = (status) => {
  // ... (código da função continua o mesmo)
};

const getStatusColor = (status) => {
  // ... (código da função continua o mesmo)
};

const getStatusMessage = (status, isHost) => {
  switch (status) {
    case MatchStatus.CHAT_REQUESTED:
      return isHost ? "Você solicitou uma conversa" : "O anfitrião quer conversar com você";
    case MatchStatus.ACCEPTED:
      return isHost ? "Você aceitou este convidado" : "Sua participação foi confirmada!";
    case MatchStatus.DECLINED:
      return isHost ? "Você recusou este convidado" : "Seu interesse foi recusado";
    default:
      return null;
  }
};

// --- Componente Principal ---

export default function MatchCard({
  match,
  isHost = false,
  onAccept,
  onDecline,
  onRequestChat,
}) {
  if (!match || !match.event) return null; // Adicionada verificação extra

  const { event, guest, status, createdAt, personalMessage } = match;
  const statusMessage = getStatusMessage(status, isHost);
  const isPending = status === MatchStatus.PENDING;

  return (
    <Card style={[styles.card, { borderLeftColor: getStatusColor(status) }]}>
      <CardHeader>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <CardTitle style={styles.cardTitle}>
              {isHost ? guest?.name : event?.title}
            </CardTitle>
            <CardDescription>
              {isHost ? "Interessado no seu evento" : `Evento de ${event?.host?.name}`}
            </CardDescription>
          </View>
          <View style={styles.headerRight}>
            {getStatusBadge(status)}
          </View>
        </View>
      </CardHeader>

      <CardContent>
        <View style={styles.detailsBox}>
          <Text style={styles.detailsBoxTitle}>Evento: {event.title}</Text>
          {/* ... (o resto do seu JSX para detalhes do evento) ... */}
        </View>

        {personalMessage && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>
              {isHost ? "Mensagem do interessado:" : "Sua mensagem:"}
            </Text>
            <Text style={styles.messageText}>"{personalMessage}"</Text>
          </View>
        )}

        <View style={styles.footerContainer}>
          <Text style={styles.timestamp}>
            Criado: {new Date(createdAt).toLocaleString("pt-BR")}
          </Text>
          {statusMessage && (
            <View style={styles.statusMessageContainer}>
              <Icon name="information-outline" size={16} color={getStatusColor(status)} />
              <Text style={[styles.statusMessageText, { color: getStatusColor(status) }]}>
                {statusMessage}
              </Text>
            </View>
          )}
        </View>

        {isHost && isPending && (
          <View style={styles.actionsContainer}>
            <Button onPress={() => onAccept?.(match.id)} style={{ flex: 1, backgroundColor: "#22C55E" }} size="sm">
              Aceitar
            </Button>
            <Button onPress={() => onRequestChat?.(match.id)} style={{ flex: 1 }} variant="outline" size="sm">
              Chat
            </Button>
            <Button onPress={() => onDecline?.(match.id)} style={{ flex: 1 }} variant="destructive" size="sm">
              Recusar
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

// --- Estilos ---
const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, marginBottom: 16 },
  headerContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  headerRight: { alignItems: "flex-end", gap: 8 },
  cardTitle: { fontSize: 18, lineHeight: 22 },
  detailsBox: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8, gap: 8, borderWidth: 1, borderColor: "#F3F4F6" },
  detailsBoxTitle: { fontWeight: "500", marginBottom: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, color: "#6B7280" },
  messageContainer: { backgroundColor: "#F3E8FF", padding: 12, borderRadius: 8, marginVertical: 12 },
  messageLabel: { fontWeight: "500", fontSize: 14, color: "#5B21B6", marginBottom: 4 },
  messageText: { fontStyle: "italic", color: "#6D28D9" },
  footerContainer: { marginTop: 8 },
  timestamp: { fontSize: 12, color: "#9CA3AF" },
  statusMessageContainer: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 },
  statusMessageText: { fontSize: 14, fontWeight: "500" },
  actionsContainer: { flexDirection: "row", paddingTop: 16, gap: 8 },
});