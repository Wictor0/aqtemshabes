import React, { useState } from "react"; // 👈 Adicionado useState
import { View, Text, StyleSheet, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager } from "react-native";
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

// Habilita animações no Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MatchStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

const PESSACH_DAYS = [
  '2026-04-01', '2026-04-02', '2026-04-03', 
  '2026-04-07', '2026-04-08', '2026-04-09'
];

const renderStatusBadges = (isEventContainer, pendingCount, acceptedCount, declinedCount, status) => {
  // Se for container de anfitrião, mostra contadores
  if (isEventContainer) {
    return (
      <View style={styles.badgeRow}>
        {acceptedCount > 0 && (
          <Badge style={{ backgroundColor: "#22C55E" }}>
            <Text style={styles.badgeText}>{acceptedCount} Aceitos</Text>
          </Badge>
        )}
        {pendingCount > 0 && (
          <Badge style={{ backgroundColor: "#F59E0B" }}>
            <Text style={styles.badgeText}>{pendingCount} Pendentes</Text>
          </Badge>
        )}
        {declinedCount > 0 && (
          <Badge style={{ backgroundColor: "#EF4444" }}>
            <Text style={styles.badgeText}>{declinedCount} Recusados</Text>
          </Badge>
        )}
      </View>
    );
  }

  // Se for card de convidado, mostra a tag única de status
  const statusColors = {
    [MatchStatus.ACCEPTED]: "#22C55E",
    [MatchStatus.DECLINED]: "#EF4444",
    [MatchStatus.PENDING]: "#F59E0B",
  };

  return (
    <View style={styles.badgeRow}>
       <Badge style={{ backgroundColor: statusColors[status] || "#6B7280" }}>
          <Text style={styles.badgeText}>
            {status === 'accepted' ? 'Aceito' : status === 'declined' ? 'Recusado' : 'Pendente'}
          </Text>
       </Badge>
    </View>
  );
};

const getStatusColor = (status, isEventContainer, isPessach) => {
  if (isPessach) return "#D4AF37";
  if (isEventContainer) return "#4F46E5"; 
  switch (status) {
    case MatchStatus.ACCEPTED: return "#22C55E";
    case MatchStatus.DECLINED: return "#EF4444";
    default: return "#F59E0B";
  }
};

export default function MatchCard({
  match,
  isHost = false,
  onAccept,
  onDecline,
}) {
  const [isExpanded, setIsExpanded] = useState(false); // 👈 Controle da Sanfona

  if (!match || !match.event) return null; 

  const { 
    event, 
    status, 
    personal_message, 
    dependent_ids,
    isEventContainer,
    pendingCount,
    acceptedCount,
    declinedCount,
    hostPhoto
  } = match;

  const eventDateStr = event.date ? event.date.split('T')[0] : "";
  const isPessachEvent = PESSACH_DAYS.includes(eventDateStr);
  const isPending = status === MatchStatus.PENDING;
  const isAccepted = status === MatchStatus.ACCEPTED;
  const eventTitle = event?.title || "Evento sem título";
  const dependentCount = dependent_ids?.length || 0;

  let avatarUrl = null;
  let fallbackName = "Usuário";
  let displayName = "";
  let displayRole = null;
  let descriptionText = "";

  if (isHost) {
    if (isEventContainer) {
      avatarUrl = hostPhoto;
      fallbackName = "Anfitrião";
      displayName = isPessachEvent ? `Pessach: ${eventTitle}` : eventTitle;
      descriptionText = event.description || "Sem descrição disponível.";
    } else {
      avatarUrl = match?.guest?.avatar_url;
      fallbackName = match?.guest?.full_name || match?.guest?.username || "Convidado";
      displayName = match?.guest?.username || match?.guest?.full_name || "Convidado";
      displayRole = match?.guest?.role; 
      descriptionText = `enviou um pedido para: "${isPessachEvent ? 'Pessach' : 'Shabat'}"`;
    }
  } else {
    if (isAccepted) {
        avatarUrl = event?.host?.avatar_url;
        fallbackName = event?.host?.username || "Anfitrião";
        displayName = isPessachEvent ? `Pessach: ${eventTitle}` : eventTitle;
        descriptionText = `Aceito por ${fallbackName}`;
    } else {
        avatarUrl = null;
        fallbackName = "Anfitrião"; 
        displayName = isPessachEvent ? `Pessach: ${eventTitle}` : `Evento ${eventTitle}`;
        descriptionText = `Anfitrião da Comunidade`;
    }
  }

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const finalAvatarUri = avatarUrl || `https://ui-avatars.com/api/?name=${fallbackName.replace(' ', '+')}&background=random`;

  return (
    <Card style={[
        styles.card, 
        { borderLeftColor: getStatusColor(status, isEventContainer, isPessachEvent) },
        isPessachEvent && { borderColor: '#D4AF37', borderWidth: 1 }
    ]}>
      {/* 👇 AREA CLICÁVEL (HEADER) 👇 */}
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
        <CardHeader>
          {isPessachEvent && (
              <Badge style={{ backgroundColor: "#D4AF37", alignSelf: 'flex-start', marginBottom: 6 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>PESSACH 2026</Text>
              </Badge>
          )}
          <View style={styles.headerContainer}>
            <Image style={styles.avatar} source={{ uri: finalAvatarUri }} />

            <View style={{ flex: 1 }}>
              <View style={styles.titleRow}>
                  <CardTitle style={[styles.cardTitle, isPessachEvent && { color: '#D4AF37' }]} numberOfLines={1}>
                      {displayName}
                  </CardTitle>
                  {displayRole && <VerifiedBadge role={displayRole} size={16} />}
                  <Icon 
                    name={isExpanded ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color="#9CA3AF" 
                    style={{ marginLeft: 'auto' }}
                  />
              </View>
              
              <View style={styles.descRow}>
                  <CardDescription numberOfLines={1}>
                      {descriptionText}
                  </CardDescription>
              </View>
            </View>
          </View>
          
          {/* 👇 TAGS SEMPRE VISÍVEIS 👇 */}
          {renderStatusBadges(isEventContainer, pendingCount, acceptedCount, declinedCount, status)}
        </CardHeader>
      </TouchableOpacity>

      {/* 👇 CONTEÚDO EXPANSÍVEL (SANFONA) 👇 */}
      {isExpanded && (
        <CardContent>
          <View style={styles.detailsBox}>
            <View style={styles.infoRow}>
              <Icon 
                  name={isPessachEvent ? "star" : "calendar-month-outline"} 
                  size={16} 
                  color={isPessachEvent ? "#D4AF37" : (isEventContainer ? "#4F46E5" : "#6B7280")} 
              />
              <Text style={[styles.infoText, (isEventContainer || isPessachEvent) && { color: isPessachEvent ? "#D4AF37" : "#4F46E5", fontWeight: "600" }]}>
                Realização: {formatShabbatDate(new Date(event.date))}
              </Text>
            </View>
            
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
            <View style={[styles.messageContainer, isPessachEvent && { backgroundColor: '#FFFDF0' }]}>
              <Text style={[styles.messageLabel, isPessachEvent && { color: '#D4AF37' }]}>
                {isHost ? "Mensagem do interessado:" : "Sua mensagem:"}
              </Text>
              <Text style={[styles.messageText, isPessachEvent && { color: '#B8860B' }]}>{personal_message}</Text>
            </View>
          )}

          {isHost && isPending && !isEventContainer && (
            <View style={styles.actionsContainer}>
              <Button
                onPress={() => onAccept?.(match.id)}
                style={{ flex: 1, backgroundColor: isPessachEvent ? "#D4AF37" : "#22C55E" }}
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

          {/* Botão de Ver Detalhes (Navegação) */}
          <View style={styles.footerContainer}>
            <Text style={[styles.viewDetailsText, isPessachEvent && { color: "#D4AF37" }]}>
              {isEventContainer ? "Gerenciar participantes" : "Ver todos os detalhes"}
            </Text>
            <Icon name="chevron-right" size={16} color={isPessachEvent ? "#D4AF37" : "#4F46E5"} />
          </View>
        </CardContent>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, marginBottom: 16, overflow: 'hidden' },
  headerContainer: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#E5E7EB' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1 },
  descRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: "700", maxWidth: '85%' },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 }, 
  badgeText: { color: "#FFF", fontWeight: "bold", fontSize: 10 },
  detailsBox: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: "#F3F4F6", marginTop: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: "#6B7280" },
  messageContainer: { backgroundColor: "#F3E8FF", padding: 12, borderRadius: 8, marginVertical: 12 },
  messageLabel: { fontWeight: "500", fontSize: 14, color: "#5B21B6", marginBottom: 4 },
  messageText: { fontStyle: "italic", color: "#6D28D9" },
  footerContainer: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10 },
  viewDetailsText: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
  actionsContainer: { flexDirection: "row", paddingTop: 16, gap: 8 },
});