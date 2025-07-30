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
import { MatchStatus } from "../../lib/mock-data";
import { formatTime } from "../../lib/utils";
import { Button } from "../ui/Button"; // 1. Importe o componente Button

// Funções de ajuda para o estilo
const getStatusBadge = (status) => {
  switch (status) {
    case MatchStatus.PENDING:
      return <Badge variant="secondary">Aguardando</Badge>;
    case MatchStatus.ACCEPTED:
      return <Badge variant="success">Aceito</Badge>;
    case MatchStatus.DECLINED:
      return <Badge variant="destructive">Recusado</Badge>;
    case MatchStatus.CHAT_REQUESTED:
      return (
        <Badge style={{ backgroundColor: "#3B82F6", color: "#1D4ED8" }}>
          Chat Solicitado
        </Badge>
      );
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
    case MatchStatus.CHAT_REQUESTED:
      return "#3B82F6";
    default:
      return "#F59E0B";
  }
};

const getStatusMessage = (status, isHost) => {
  switch (status) {
    case MatchStatus.CHAT_REQUESTED:
      return isHost
        ? "Você solicitou uma conversa"
        : "O anfitrião quer conversar com você";
    case MatchStatus.ACCEPTED:
      return isHost
        ? "Você aceitou este convidado"
        : "Sua participação foi confirmada!";
    case MatchStatus.DECLINED:
      return isHost
        ? "Você recusou este convidado"
        : "Seu interesse foi recusado";
    default:
      return null;
  }
};

export default function MatchCard({
  match,
  isHost = false,
  onAccept,
  onDecline,
  onRequestChat,
}) {
  // 2. Adicione as novas props
  if (!match) return null;

  const event = match.event;
  const guest = match.guest;
  const statusMessage = getStatusMessage(match.status, isHost);
  const isPending = match.status === MatchStatus.PENDING;

  return (
    <Card
      style={[styles.card, { borderLeftColor: getStatusColor(match.status) }]}
    >
      <CardHeader>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <CardTitle style={styles.cardTitle}>
              {isHost ? guest?.name : event?.title}
            </CardTitle>
            <CardDescription>
              {isHost
                ? "Interessado no seu evento"
                : `Evento de ${event?.host?.name}`}
            </CardDescription>
          </View>
          <View style={styles.headerRight}>
            {getStatusBadge(match.status)}
            {match.matchScore && (
              <View style={styles.matchScoreBadge}>
                <Icon name="star" color="#D97706" size={12} />
                <Text style={styles.matchScoreText}>
                  {Math.round(match.matchScore * 100)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      </CardHeader>

      <CardContent>
        <View style={styles.detailsBox}>
          <Text style={styles.detailsBoxTitle}>Evento: {event.title}</Text>
          <View style={styles.infoRow}>
            <Icon name="calendar-month-outline" size={16} />
            <Text style={styles.infoText}>
              {new Date(event.date).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={16} />
            <Text style={styles.infoText}>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="map-marker-outline" size={16} />
            <Text style={styles.infoText}>{event.approximateAddress}</Text>
          </View>
        </View>

        {match.personalMessage && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>
              {isHost ? "Mensagem do interessado:" : "Sua mensagem:"}
            </Text>
            <Text style={styles.messageText}>"{match.personalMessage}"</Text>
          </View>
        )}

        <View style={styles.footerContainer}>
          <Text style={styles.timestamp}>
            Criado: {new Date(match.createdAt).toLocaleString("pt-BR")}
          </Text>
          {statusMessage && (
            <View style={styles.statusMessageContainer}>
              <Icon
                name="information-outline"
                size={16}
                color={getStatusColor(match.status)}
              />
              <Text
                style={[
                  styles.statusMessageText,
                  { color: getStatusColor(match.status) },
                ]}
              >
                {statusMessage}
              </Text>
            </View>
          )}
        </View>

        {/* 3. Adicione os botões de ação para o anfitrião */}
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
              onPress={() => onRequestChat?.(match.id)}
              style={{ flex: 1 }}
              variant="outline"
              size="sm"
            >
              Chat
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
  matchScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  matchScoreText: { fontSize: 12, fontWeight: "500", color: "#92400E" },
  detailsBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  detailsBoxTitle: { fontWeight: "500", marginBottom: 4 },
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
  footerContainer: { marginTop: 8 },
  timestamp: { fontSize: 12, color: "#9CA3AF" },
  statusMessageContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  statusMessageText: { fontSize: 14, fontWeight: "500" },
  actionsContainer: { flexDirection: "row", paddingTop: 16, gap: 8 }, // Estilo para os botões de ação
});
