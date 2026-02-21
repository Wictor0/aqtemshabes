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

// Atualizado para suportar o contador de pedidos no modo container
const getStatusBadge = (status, isEventContainer, badgeCount) => {
  if (isEventContainer && badgeCount > 0) {
    return (
      <Badge variant="destructive" style={{ backgroundColor: "#F59E0B" }}>
        <Text style={{ color: "#FFF", fontWeight: "bold" }}>{badgeCount} Pedidos</Text>
      </Badge>
    );
  }
};

const getStatusColor = (status, isEventContainer) => {
  if (isEventContainer) return "#4F46E5"; // Cor de destaque para seus eventos
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

  const { 
    event, 
    status, 
    personal_message, 
    created_at, 
    dependent_ids,
    isEventContainer, // Nova prop vinda da HomeScreen
    pendingCount,     // Nova prop vinda da HomeScreen
    hostPhoto         // Nova prop vinda da HomeScreen
  } = match;

  const isPending = status === MatchStatus.PENDING;
  const isAccepted = status === MatchStatus.ACCEPTED;
  const eventTitle = event?.title || "Evento sem título";
  const dependentCount = dependent_ids?.length || 0;

  // --- LÓGICA DE EXIBIÇÃO ATUALIZADA ---
  
  let avatarUrl = null;
  let fallbackName = "Usuário";
  let displayName = "";
  let displayRole = null;
  let descriptionText = "";

  if (isHost) {
    if (isEventContainer) {
      // === VISÃO DE "MEU EVENTO" (CONTAINER) ===
      avatarUrl = hostPhoto; // Exibe sua foto de anfitrião
      fallbackName = "Anfitrião";
      displayName = eventTitle;
      descriptionText = event.description || "Sem descrição disponível.";
    } else {
      // === VISÃO DO ANfitrião SOBRE UM PEDIDO ===
      avatarUrl = match?.guest?.avatar_url;
      fallbackName = match?.guest?.full_name || match?.guest?.username || "Convidado";
      displayName = match?.guest?.username || match?.guest?.full_name || "Convidado";
      displayRole = match?.guest?.role; 
      descriptionText = `enviou um pedido para: "${eventTitle}"`;
    }
  } else {
    // === VISÃO DO CONVIDADO (Blind Booking) ===
    const showHostIdentity = isAccepted;
    if (showHostIdentity) {
        avatarUrl = event?.host?.avatar_url;
        fallbackName = event?.host?.username || "Anfitrião";
        displayName = eventTitle;
        displayRole = null;
        descriptionText = `Aceito por ${fallbackName}`;
    } else {
        avatarUrl = null;
        fallbackName = "Anfitrião"; 
        displayName = "Evento";
        displayRole = null;
        descriptionText = `Anfitrião da Comunidade`;
    }
  }

  const finalAvatarUri = avatarUrl || `https://ui-avatars.com/api/?name=${fallbackName.replace(' ', '+')}&background=random`;

  return (
    <Card style={[styles.card, { borderLeftColor: getStatusColor(status, isEventContainer) }]}>
      <CardHeader>
        <View style={styles.headerContainer}>
          
          <Image
            style={styles.avatar}
            source={{ uri: finalAvatarUri }}
          />

          <View style={{ flex: 1 }}>
            
            <View style={styles.titleRow}>
                <CardTitle style={styles.cardTitle} numberOfLines={1}>
                    {displayName}
                </CardTitle>
                {displayRole && <VerifiedBadge role={displayRole} size={16} />}
            </View>
            
            <View style={styles.descRow}>
                <CardDescription numberOfLines={isEventContainer ? 2 : 1}>
                    {descriptionText}
                </CardDescription>
            </View>
            
          </View>
          <View style={styles.headerRight}>
            {getStatusBadge(status, isEventContainer, pendingCount)}
          </View>
        </View>
      </CardHeader>

      <CardContent>
        <View style={styles.detailsBox}>
          {/* Data do Evento */}
          <View style={styles.infoRow}>
            <Icon name="calendar-month-outline" size={16} color={isEventContainer ? "#4F46E5" : "#6B7280"} />
            <Text style={[styles.infoText, isEventContainer && { color: "#4F46E5", fontWeight: "600" }]}>
              Realização: {formatShabbatDate(new Date(event.date))}
            </Text>
          </View>
          
          {/* Data de Criação (Exibida no Container do Host) */}
          <View style={styles.infoRow}>
            <Icon name="plus-circle-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              Criado em: {new Date(event.created_at).toLocaleDateString("pt-BR")}
            </Text>
          </View>

          {!isEventContainer && dependentCount > 0 && (
            <View style={styles.infoRow}>
              <Icon name="account-group-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                Leva +{dependentCount} dependente{dependentCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {personal_message && !isEventContainer && (
          <View style={styles.messageContainer}>
            <Text style={styles.messageLabel}>
              {isHost ? "Mensagem do interessado:" : "Sua mensagem:"}
            </Text>
            <Text style={styles.messageText}>"{personal_message}"</Text>
          </View>
        )}

        {isHost && isPending && !isEventContainer && (
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

        {/* Rodapé informativo para containers de evento */}
        {isEventContainer && (
          <View style={styles.footerContainer}>
            <Text style={styles.viewDetailsText}>Gerenciar participantes</Text>
            <Icon name="chevron-right" size={16} color="#4F46E5" />
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
    marginTop: 2,
  },
  headerRight: { alignItems: "flex-end", gap: 8, marginLeft: 8 },
  cardTitle: { fontSize: 18, lineHeight: 22, fontWeight: "700" },
  detailsBox: {
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    marginTop: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: "#6B7280" },
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
  footerContainer: { 
    marginTop: 12, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
    paddingTop: 10
  },
  viewDetailsText: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
  timestamp: { fontSize: 12, color: "#9CA3AF" },
  actionsContainer: { flexDirection: "row", paddingTop: 16, gap: 8 },
});