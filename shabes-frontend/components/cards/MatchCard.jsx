import React, { useState } from "react"; 
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  TouchableOpacity, 
  LayoutAnimation, 
  Platform, 
  UIManager,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard
} from "react-native";
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

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const MatchStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

const PESSACH_DAYS = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-07', '2026-04-08', '2026-04-09'];

const renderStatusBadges = (isEventContainer, pendingCount, acceptedCount, declinedCount, retryCount, status) => {
  if (isEventContainer) {
    // 👇 SUBTRAIMOS AS INSISTÊNCIAS DOS PENDENTES GERAIS PARA NÃO REPETIR A TAG 👇
    const displayPending = Math.max(0, (pendingCount || 0) - (retryCount || 0));

    return (
      <View style={styles.badgeRow}>
        {acceptedCount > 0 && (
          <Badge style={{ backgroundColor: "#22C55E" }}><Text style={styles.badgeText}>{acceptedCount} Aceitos</Text></Badge>
        )}
        {displayPending > 0 && (
          <Badge style={{ backgroundColor: "#F59E0B" }}><Text style={styles.badgeText}>{displayPending} Pendentes</Text></Badge>
        )}
        {retryCount > 0 && (
          <Badge style={{ backgroundColor: "#7C3AED" }}><Text style={styles.badgeText}>{retryCount} Insistências</Text></Badge>
        )}
        {declinedCount > 0 && (
          <Badge style={{ backgroundColor: "#EF4444" }}><Text style={styles.badgeText}>{declinedCount} Recusados</Text></Badge>
        )}
      </View>
    );
  }

  // 👇 LÓGICA PARA CARD INDIVIDUAL: SE FOR INSISTÊNCIA PENDENTE, MOSTRA APENAS A TAG ROXA 👇
  if (status === MatchStatus.PENDING && retryCount > 0) {
    return (
      <View style={styles.badgeRow}>
        <Badge style={{ backgroundColor: "#7C3AED" }}>
          <Text style={styles.badgeText}>Insistência</Text>
        </Badge>
      </View>
    );
  }

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
  onRetry, 
}) {
  const [isExpanded, setIsExpanded] = useState(false); 
  const [isRetryModalVisible, setIsRetryModalVisible] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const [isSendingRetry, setIsSendingRetry] = useState(false);

  if (!match || !match.event) return null; 

  const { 
    event, status, personal_message, retry_message, retry_count, 
    dependent_ids, isEventContainer, pendingCount, acceptedCount, declinedCount, hostPhoto
  } = match;

  const eventDateStr = event.date ? event.date.split('T')[0] : "";
  const isPessachEvent = PESSACH_DAYS.includes(eventDateStr);
  const isPending = status === MatchStatus.PENDING;
  const isAccepted = status === MatchStatus.ACCEPTED;
  const isDeclined = status === MatchStatus.DECLINED;
  
  const hasAlreadyRetried = Number(retry_count || 0) >= 1;
  const canRetry = !isHost && isDeclined && !hasAlreadyRetried;

  const eventTitle = event?.title || "Evento sem título";
  const dependentCount = dependent_ids?.length || 0;

  const isAnonymousHost = !isHost;

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
        fallbackName = event?.host?.username || event?.host?.full_name || "Anfitrião";
        displayName = isPessachEvent ? `Pessach: ${eventTitle}` : eventTitle;
        descriptionText = `Aceito por ${fallbackName}`;
        displayRole = event?.host?.role;
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

  const handleSendRetry = async () => {
    if (!retryMessage.trim()) return;
    setIsSendingRetry(true);
    try {
      await onRetry?.(match.id, retryMessage);
      setIsRetryModalVisible(false);
      setRetryMessage("");
    } finally {
      setIsSendingRetry(false);
    }
  };

  const finalAvatarUri = avatarUrl || `https://ui-avatars.com/api/?name=${fallbackName.replace(' ', '+')}&background=random`;

  return (
    <Card style={[
        styles.card, 
        { borderLeftColor: getStatusColor(status, isEventContainer, isPessachEvent) },
        isPessachEvent && { borderColor: '#D4AF37', borderWidth: 1 }
    ]}>
      <TouchableOpacity onPress={toggleExpand} activeOpacity={0.7}>
        <CardHeader style={styles.cardheadertoppadding}>
          {isPessachEvent && (
              <Badge style={{ backgroundColor: "#D4AF37", alignSelf: 'flex-start', marginBottom: 6 }}>
                  <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>PESSACH 2026</Text>
              </Badge>
          )}
          <View style={styles.headerContainer}>
            {isAnonymousHost ? (
              <View style={[styles.anonymousAvatar, isPessachEvent ? { backgroundColor: '#FFFDF0', borderColor: '#D4AF37' } : { backgroundColor: '#F3E8FF', borderColor: '#4F46E5' }]}>
                <Icon name="star-david" size={28} color={isPessachEvent ? "#D4AF37" : "#4F46E5"} />
              </View>
            ) : (
              <Image style={styles.avatar} source={{ uri: finalAvatarUri }} />
            )}

            <View style={{ flex: 1, marginRight: 8 }}>
              <View style={styles.titleRow}>
                  <CardTitle style={[styles.cardTitle, isPessachEvent && { color: '#D4AF37' }]} numberOfLines={1}>{displayName}</CardTitle>
                  {displayRole && <VerifiedBadge role={displayRole} size={16} />}
                  {isHost && hasAlreadyRetried && !isEventContainer && (
                    <Badge style={{ backgroundColor: '#7C3AED', marginLeft: 6 }}>
                        <Text style={{ color: 'white', fontSize: 8, fontWeight: 'bold' }}>APELO</Text>
                    </Badge>
                  )}
              </View>
              <View style={styles.descRow}>
                  <CardDescription numberOfLines={1}>{descriptionText}</CardDescription>
              </View>
            </View>

            <View style={styles.rightActionsContainer}>
              {renderStatusBadges(isEventContainer, pendingCount, acceptedCount, declinedCount, retry_count, status)}
              <Icon name={isExpanded ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF" style={{ marginTop: 4 }} />
            </View>
          </View>
        </CardHeader>
      </TouchableOpacity>

      {isExpanded && (
        <CardContent>
          <View style={styles.detailsBox}>
            <View style={styles.infoRow}>
              <Icon name={isPessachEvent ? "star" : "calendar-month-outline"} size={16} color={isPessachEvent ? "#D4AF37" : (isEventContainer ? "#4F46E5" : "#6B7280")} />
              <Text style={[styles.infoText, (isEventContainer || isPessachEvent) && { color: isPessachEvent ? "#D4AF37" : "#4F46E5", fontWeight: "600" }]}>
                Realização: {formatShabbatDate(new Date(event.date))}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Icon name="plus-circle-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>Criado em: {new Date(event.created_at).toLocaleDateString("pt-BR")}</Text>
            </View>
            {!isEventContainer && dependentCount > 0 && (
              <View style={styles.infoRow}>
                <Icon name="account-group-outline" size={16} color="#6B7280" />
                <Text style={styles.infoText}>Leva +{dependentCount} dependente{dependentCount > 1 ? 's' : ''}</Text>
              </View>
            )}
          </View>

          {personal_message && !isEventContainer && (
            <View style={[styles.messageContainer, isPessachEvent && { backgroundColor: '#FFFDF0' }]}>
              <Text style={styles.messageLabel}>Mensagem Inicial:</Text>
              <Text style={[styles.messageText, isPessachEvent && { color: '#B8860B' }]}>{personal_message}</Text>
            </View>
          )}

          {retry_message && !isEventContainer && (
            <View style={[styles.messageContainer, styles.retryContainer, isPessachEvent && { borderColor: '#D4AF37' }]}>
              <View style={styles.retryHeader}>
                 <Icon name="alert-circle-outline" size={14} color="#4F46E5" />
                 <Text style={styles.retryLabel}>MENSAGEM DE RECONSIDERAÇÃO:</Text>
              </View>
              <Text style={styles.retryText}>{retry_message}</Text>
            </View>
          )}

          {isHost && isPending && !isEventContainer && (
            <View style={styles.actionsContainer}>
              <Button onPress={() => onAccept?.(match.id)} style={{ flex: 1, backgroundColor: isPessachEvent ? "#D4AF37" : "#22C55E" }} size="sm">Aceitar</Button>
              <Button onPress={() => onDecline?.(match.id)} style={{ flex: 1 }} variant="destructive" size="sm">Recusar</Button>
            </View>
          )}

          {canRetry && (
            <View style={styles.actionsContainer}>
              <Button 
                onPress={() => setIsRetryModalVisible(true)} 
                style={{ flex: 1, backgroundColor: "#4F46E5" }} 
                size="sm"
              >
                Tentar participar novamente
              </Button>
            </View>
          )}

          {!isHost && isDeclined && hasAlreadyRetried && (
            <View style={styles.limitNotice}>
                <Icon name="information-outline" size={14} color="#EF4444" />
                <Text style={styles.limitNoticeText}>O limite de tentativas para este evento foi atingido.</Text>
            </View>
          )}

          <View style={styles.footerContainer}>
            <Text style={[styles.viewDetailsText, isPessachEvent && { color: "#D4AF37" }]}>{isEventContainer ? "Gerenciar participantes" : "Ver todos os detalhes"}</Text>
            <Icon name="chevron-right" size={16} color={isPessachEvent ? "#D4AF37" : "#4F46E5"} />
          </View>
        </CardContent>
      )}

      <Modal visible={isRetryModalVisible} transparent animationType="fade" onRequestClose={() => setIsRetryModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Novo Pedido</Text>
                <TouchableOpacity onPress={() => setIsRetryModalVisible(false)}><Icon name="x" size={24} color="#6B7280" /></TouchableOpacity>
              </View>
              <Text style={styles.modalSub}>Explique por que você gostaria de participar. Esta é sua última chance.</Text>
              <TextInput 
                style={styles.retryInput} 
                placeholder="Escreva sua nova mensagem..." 
                multiline 
                value={retryMessage} 
                onChangeText={setRetryMessage}
                maxLength={300}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsRetryModalVisible(false)}><Text style={styles.cancelBtnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.confirmBtn, !retryMessage.trim() && { opacity: 0.5 }]} 
                  onPress={handleSendRetry} 
                  disabled={!retryMessage.trim() || isSendingRetry}
                >
                  {isSendingRetry ? <ActivityIndicator color="#FFF" /> : <Text style={styles.confirmBtnText}>Enviar Pedido</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, marginBottom: 16, overflow: 'hidden', },
  cardheadertoppadding: { paddingTop: 4 },
  headerContainer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 64 },
  avatar: { width: 50, height: 48, borderRadius: 24, marginRight: 12, backgroundColor: '#E5E7EB' },
  anonymousAvatar: { width: 50, height: 48, borderRadius: 24, marginRight: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 2 },
  descRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4, marginTop: 2 },
  cardTitle: { fontSize: 17, lineHeight: 22, fontWeight: "700" },
  badgeRow: { flexDirection: "column", alignItems: "flex-end", gap: 4 }, 
  badgeText: { color: "#FFF", fontWeight: "bold", fontSize: 10 },
  rightActionsContainer: { alignItems: 'flex-end', justifyContent: 'flex-start' },
  detailsBox: { backgroundColor: "#F9FAFB", padding: 12, borderRadius: 8, gap: 6, borderWidth: 1, borderColor: "#F3F4F6", marginTop: 4 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 13, color: "#6B7280" },
  messageContainer: { backgroundColor: "#F3F4F6", padding: 12, borderRadius: 8, marginTop: 12 },
  messageLabel: { fontWeight: "bold", fontSize: 11, color: "#6B7280", marginBottom: 4, textTransform: 'uppercase' },
  messageText: { fontStyle: "italic", color: "#374151" },
  retryContainer: { backgroundColor: "#EEF2FF", borderWidth: 1, borderColor: "#C7D2FE" },
  retryHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  retryLabel: { fontWeight: "900", fontSize: 11, color: "#4F46E5" },
  retryText: { color: "#1E1B4B", fontWeight: "600" },
  limitNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  limitNoticeText: { color: '#B91C1C', fontSize: 12, fontWeight: '500', flex: 1 },
  footerContainer: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "#F3F4F6", paddingTop: 10 },
  viewDetailsText: { fontSize: 12, fontWeight: "600", color: "#4F46E5" },
  actionsContainer: { flexDirection: "row", paddingTop: 16, gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: 'white', borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  retryInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 12, height: 120, textAlignVertical: 'top', fontSize: 16 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  cancelBtn: { flex: 1, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#4B5563', fontWeight: '600' },
  confirmBtn: { flex: 2, padding: 14, alignItems: 'center', borderRadius: 10, backgroundColor: '#4F46E5' },
  confirmBtnText: { color: 'white', fontWeight: 'bold' }
});