import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Badge } from "../ui/Badge";
import Icon from "../ui/Icon";
import { Button } from "../ui/Button";
import { formatShabbatDate } from "../../lib/utils";

// Status agora em minúsculas para corresponder à base de dados
const MatchStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

// --- Funções de Ajuda ---

const getStatusBadge = (status) => {
  switch (status) {
    case MatchStatus.PENDING:
      return <Badge variant="secondary">Aguardando</Badge>;
    case MatchStatus.ACCEPTED:
      return <Badge variant="success">Aceito</Badge>;
    case MatchStatus.DECLINED:
      return <Badge variant="destructive">Recusado</Badge>;
    default:
      return <Badge variant="outline">Desconhecido</Badge>;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case MatchStatus.ACCEPTED:
      return "#22C55E";
    case MatchStatus.DECLINED:
      return "#EF4444";
    default:
      return "#F59E0B";
  }
};

// --- Componente Principal ---

export default function MatchCard({
  match,
  isHost = false,
  onAccept,
  onDecline,
}) {
  if (!match || !match.event) return null;

  const { event, guest, status, personal_message, created_at } = match;
  const isPending = status === MatchStatus.PENDING;

  // Acessa os nomes de forma segura, com um texto alternativo
  const guestName = match?.guest?.full_name || "Convidado";
  const hostName = match?.event?.host?.full_name || "Anfitrião";
  const eventTitle = match?.event?.title || "Evento sem título";

  return (
    <Card style={[styles.card, { borderLeftColor: getStatusColor(status) }]}>
      <CardHeader>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <CardTitle style={styles.cardTitle}>
              {isHost ? guestName : eventTitle}
            </CardTitle>
            <CardDescription>
              {isHost
                ? `enviou um pedido para: "${eventTitle}"`
                : `Evento de ${hostName}`}
            </CardDescription>
          </View>
          <View style={styles.headerRight}>
            {getStatusBadge(status)}
          </View>
        </View>
      </CardHeader>

      <CardContent>
        <View style={styles.detailsBox}>
          <View style={styles.infoRow}>
            <Icon name="calendar-month-outline" size={16} />
            <Text style={styles.infoText}>
              {formatShabbatDate(new Date(event.date))}
            </Text>
          </View>
        </View>

        {personal_message && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>
              {isHost ? "Mensagem do interessado:" : "Sua mensagem:"}
            </Text>
            <Text style={styles.messageText}>"{personal_message}"</Text>
          </View>
        )}

        <View style={styles.footerContainer}>
          <Text style={styles.timestamp}>
            Criado: {new Date(created_at).toLocaleString("pt-BR")}
          </Text>
        </View>

        {isHost && isPending && (
          <View style={styles.actionsContainer}>
            <Button
              onPress={() => onAccept?.(match.id)}
              style={{ flex: 1, backgroundColor: "#22C55E" }}
              size="sm"
            >
              Aceitar
            </Button>
            <Button
              onPress={() => onDecline?.(match.id)}
              style={{ flex: 1 }}
              variant="destructive"
              size="sm"
            >
              Recusar
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, marginBottom: 16 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerRight: { alignItems: "flex-end", gap: 8 },
  cardTitle: { fontSize: 18, lineHeight: 22 },
  detailsBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginTop: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, color: "#6B7280" },
  messageContainer: {
    backgroundColor: "#F3E8FF",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  messageLabel: {
    fontWeight: "500",
    fontSize: 14,
    color: "#5B21B6",
    marginBottom: 4,
  },
  messageText: { fontStyle: "italic", color: "#6D28D9" },
  footerContainer: { marginTop: 12 },
  timestamp: { fontSize: 12, color: "#9CA3AF" },
  actionsContainer: { flexDirection: "row", paddingTop: 16, gap: 8 },
});

