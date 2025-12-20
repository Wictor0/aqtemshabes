import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
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
import VerifiedBadge from "../ui/VerifiedBadge";

const MatchStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

const getStatusBadge = (status) => {
  switch (status) {
    case MatchStatus.PENDING:
      return <Badge variant="secondary">Aguardando</Badge>;
    case MatchStatus.ACCEPTED:
      return (
        <Badge 
          variant="success" 
          style={{ backgroundColor: "#22C55E", borderColor: "#22C55E", borderWidth: 1 }}
        >
          <Text style={{ color: "#FFFFFF", fontWeight: "600", fontSize: 12 }}>
            Aceito
          </Text>
        </Badge>
      );
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

export default function MatchCard({
  match,
  isHost = false,
  onAccept,
  onDecline,
}) {
  if (!match || !match.event) return null; 

  const { event, guest, status, personal_message, created_at, dependent_ids } = match;
  const isPending = status === MatchStatus.PENDING;
  const isAccepted = status === MatchStatus.ACCEPTED;

  const eventTitle = match?.event?.title || "Evento sem título";
  const dependentCount = dependent_ids?.length || 0;

  // 👇 LÓGICA DE BLIND BOOKING (OCULTAR NOMES) 👇
  
  let avatarUrl = null;
  let fallbackName = "Usuário";
  let displayName = "";
  let displayRole = null;
  let descriptionText = "";

  if (isHost) {
    // === VISÃO DO ANFITRIÃO ===
    // O anfitrião SEMPRE vê quem está pedindo para entrar (Guest)
    avatarUrl = match?.guest?.avatar_url;
    fallbackName = match?.guest?.full_name || match?.guest?.username || "Convidado";
    displayName = match?.guest?.username || match?.guest?.full_name || "Convidado";
    displayRole = match?.guest?.role; 
    descriptionText = `enviou um pedido para: "${eventTitle}"`;

  } else {
    // === VISÃO DO CONVIDADO ===
    // O convidado só vê o nome do anfitrião SE foi aceito
    const showHostIdentity = isAccepted;

    if (showHostIdentity) {
        avatarUrl = match?.event?.host?.avatar_url;
        fallbackName = match?.event?.host?.full_name || match?.event?.host?.username || "Anfitrião";
        displayName = match?.event?.host?.username || match?.event?.host?.full_name || "Anfitrião";
        displayRole = match?.event?.host?.role;
        descriptionText = `Evento de ${displayName}`;
    } else {
        // Se ainda não foi aceito, esconde tudo
        avatarUrl = null; // Sem foto
        fallbackName = "Anfitrião"; 
        displayName = "Evento"; // Título do Card vira o nome do evento
        displayRole = null; // Sem selo
        descriptionText = `Anfitrião da Comunidade`;
    }
  }

  const finalAvatarUri = avatarUrl || `https://ui-avatars.com/api/?name=${fallbackName.replace(' ', '+')}&background=random`;

  return (
    <Card style={[styles.card, { borderLeftColor: getStatusColor(status) }]}>
      <CardHeader>
        <View style={styles.headerContainer}>
          
          <Image
            style={styles.avatar}
            source={{ uri: finalAvatarUri }}
          />

          <View style={{ flex: 1 }}>
            
            {/* Título Principal */}
            <View style={styles.titleRow}>
                <CardTitle style={styles.cardTitle}>
                    {/* Se for convidado e pendente, mostra título do evento. Se aceito, mostra anfitrião */}
                    {!isHost && !isAccepted ? eventTitle : displayName}
                </CardTitle>
                {/* Mostra selo apenas se tiver role visível */}
                {displayRole && <VerifiedBadge role={displayRole} size={16} />}
            </View>
            
            {/* Descrição */}
            <View style={styles.descRow}>
                <CardDescription>
                    {descriptionText}
                </CardDescription>
            </View>
            
          </View>
          <View style={styles.headerRight}>
            {getStatusBadge(status)}
          </View>
        </View>
      </CardHeader>

      <CardContent>
        <View style={styles.detailsBox}>
          <View style={styles.infoRow}>
            <Icon name="calendar-month-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {formatShabbatDate(new Date(event.date))}
            </Text>
          </View>
          
          {dependentCount > 0 && (
            <View style={styles.infoRow}>
              <Icon name="account-group-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Leva +{dependentCount} dependente{dependentCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
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
    alignItems: "center", 
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12, 
    backgroundColor: '#E5E7EB', 
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  descRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
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