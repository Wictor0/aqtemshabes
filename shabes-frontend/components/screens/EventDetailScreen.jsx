import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Checkbox from 'expo-checkbox';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy'; 

// UI Components
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Textarea } from "../ui/Textarea";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";
import VerifiedBadge from "../ui/VerifiedBadge";

// Hooks, API & Utils
import { useAuth } from "../../context/AuthContext";
import { 
  getEventById, 
  createMatch, 
  getDependents, 
  getMatchById, 
  updateMatchStatus, 
  getEvents,
  getAcceptedGuestsByEvent,
  getMatchesForHost,
  getMatchesForGuest,
  deleteEvent,
  saveInternalNotification 
} from "../../services/api"; 
import { supabase } from "../../services/supabase"; 
import { toast } from "../../hooks/use-toast";
import { formatShabbatDate } from "../../lib/utils";
import { showLocalNotification, sendPushNotification } from "../../services/notificationService";

// 👇 CONFIGURAÇÃO PESSACH 2026 👇
const PESSACH_DAYS = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-07', '2026-04-08', '2026-04-09'];
const GOLD_COLOR = "#D4AF37";

// MAPAS DE TRADUÇÃO
const targetAudienceLabels = {
  "any": "Qualquer pessoa",
  "families": "Famílias",
  "young-adults": "Jovens",
  "young_adults": "Jovens",
  "adults": "Adultos",
  "seniors": "Seniores",
};

const mealTypeLabels = {
  almoço: "Almoço",
  jantar: "Jantar",
  lunch: "Almoço",
  dinner: "Jantar",
};

const getLabel = (value, map) => {
    if (!value) return null;
    let key = Array.isArray(value) ? value[0] : value;
    if (typeof key === 'string') {
        key = key.replace(/[\[\]"']/g, "").trim();
    }
    return map[key] || map[key.toLowerCase()] || key;
};

const calculateAge = (birthDateString) => {
    if (!birthDateString) return '?';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const calculateAgeGroup = (birthDateString) => {
  if (!birthDateString) return null;
  const age = calculateAge(birthDateString);
  if (age >= 18 && age <= 35) return 'Jovens';
  if (age > 35 && age < 60) return 'Adultos';
  if (age >= 60) return 'Seniores';
  return null; 
};

const DependentSelector = ({ dependent, isSelected, onToggle }) => {
    return (
        <TouchableOpacity style={styles.dependentSelectorRow} onPress={onToggle}>
            <Checkbox value={isSelected} onValueChange={onToggle} color={isSelected ? '#4F46E5' : undefined} />
            <Text style={styles.dependentSelectorText}>{dependent.name} ({calculateAge(dependent.birth_date)} anos)</Text>
        </TouchableOpacity>
    );
};

const DependentDisplay = ({ dependent }) => {
    const age = calculateAge(dependent.birth_date);
    return (
        <View style={styles.participantCard}>
            <Icon name="account-child" size={18} color="#6B7280" style={{ marginRight: 8 }}/>
            <Text>{dependent.name} ({age} anos) - {dependent.relationship}</Text>
        </View>
    );
};

export default function EventDetailScreen({ route, navigation }) {
  const { eventId: initialEventId, matchId: initialMatchId, origin } = route.params; 
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [hostedDates, setHostedDates] = useState([]); 
  const [matchDetails, setMatchDetails] = useState(null); 
  const [attendingDependents, setAttendingDependents] = useState([]); 
  const [dependents, setDependents] = useState([]); 
  const [selectedDependentIds, setSelectedDependentIds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [loadingDependents, setLoadingDependents] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [eventRequests, setEventRequests] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // 👇 NOVOS ESTADOS ADICIONADOS 👇
  const [isRetryModalVisible, setIsRetryModalVisible] = useState(false);
  const [retryMessage, setRetryMessage] = useState("");
  const [isSendingRetry, setIsSendingRetry] = useState(false);

  const eventDateStr = event?.date ? event.date.split('T')[0] : "";
  const isPessachEvent = PESSACH_DAYS.includes(eventDateStr);
  const eventCategoryLabel = isPessachEvent ? "Pessach" : "Shabat";

  const fetchEventData = useCallback(async () => {
    try {
      setLoading(true);
      let currentEventId = initialEventId;

      if (!currentEventId && initialMatchId) {
        const { data: matchData } = await getMatchById(initialMatchId);
        if (matchData) {
          currentEventId = matchData.event_id;
          setMatchDetails(matchData);
        }
      }

      if (!currentEventId) {
          toast({ type: "error", title: "ID do evento não encontrado." });
          return navigation.goBack();
      }

      const { data: eventData } = await getEventById(currentEventId);
      setEvent(eventData);

      const { data: allEvents } = await getEvents();
      const userHostedDates = (allEvents || [])
        .filter(e => e.host_id === user.id)
        .map(e => new Date(e.date).toISOString().split('T')[0]);
      setHostedDates(userHostedDates);

      const isUserHost = user?.id === eventData.host_id;

      // 👇 BUSCA DIRETA DA TABELA 'MATCHES' PARA GARANTIR retry_message 👇
      if (isUserHost) {
        const { data: hostMatches } = await supabase
          .from('matches')
          .select('*, guest:profiles(*)')
          .eq('event_id', currentEventId);
        setEventRequests(hostMatches || []);
      } else {
        const { data: guestMatches } = await supabase
          .from('matches')
          .select('*')
          .eq('event_id', currentEventId)
          .eq('guest_id', user.id);
        
        const existingMatch = guestMatches?.[0];
        if (existingMatch) {
          setMatchDetails(existingMatch);
          // Busca dependentes se houver
          const { data: userDeps } = await getDependents();
          if (userDeps && existingMatch.dependent_ids) {
            const attending = userDeps.filter(dep => 
              existingMatch.dependent_ids.includes(dep.id)
            );
            setAttendingDependents(attending);
          }
        }
      }

    } catch (error) {
      console.error("Erro ao buscar detalhes:", error);
      toast({ type: "error", title: "Não foi possível carregar os detalhes." });
    } finally {
      setLoading(false);
    }
  }, [initialEventId, initialMatchId, user.id]);

  useEffect(() => {
    fetchEventData();
  }, [fetchEventData]);

  // 👇 FUNÇÃO PARA ENVIAR O RE-PEDIDO 👇
  const handleSendRetry = async () => {
    if (!retryMessage.trim()) return;
    setIsSendingRetry(true);
    try {
      const { error } = await supabase
        .from('matches')
        .update({ 
          status: 'pending', 
          retry_message: retryMessage,
          retry_count: 1,
          updated_at: new Date().toISOString() 
        })
        .eq('id', matchDetails.id);

      if (error) throw error;

      await saveInternalNotification(
        event.host_id, 
        `Pedido de Insistência! 📣`, 
        `${user?.username} enviou uma nova mensagem para seu evento.`,
        "match_request",
        matchDetails.id
      );

      toast({ type: "success", title: "Novo pedido enviado!", description: "O anfitrião recebeu seu apelo." });
      setIsRetryModalVisible(false);
      setRetryMessage("");
      fetchEventData();
    } catch (error) {
      console.error(error);
      toast({ type: "error", title: "Erro ao reenviar pedido" });
    } finally {
      setIsSendingRetry(false);
    }
  };

const handleDeleteEvent = async () => {
    Alert.alert(
      "Confirmar Cancelamento",
      `Deseja realmente cancelar este ${eventCategoryLabel}? Todos os convidados (confirmados e pendentes) serão avisados imediatamente.`,
      [
        { text: "Manter Evento", style: "cancel" },
        { 
          text: "Sim, Cancelar e Avisar Todos", 
          style: "destructive", 
          onPress: async () => {
            setActionLoading(true);
            try {
              const { data: allMatches } = await getMatchesForHost(user.id);
              const guestsToNotify = (allMatches || []).filter(m => 
                String(m.event_id) === String(event.id) && 
                (m.status === 'accepted' || m.status === 'pending')
              );

              if (guestsToNotify.length > 0) {
                const notiTitle = "Evento Cancelado ❌";
                const notiMsg = `O ${eventCategoryLabel} "${event.title}" foi cancelado pelo anfitrião.`;
                const notificationPromises = guestsToNotify.map(async (match) => {
                  await saveInternalNotification(match.guest_id, notiTitle, notiMsg, "event_cancelled", event.id);
                  if (match.guest?.push_token) {
                    return sendPushNotification(match.guest.push_token, notiTitle, notiMsg, { eventId: event.id, type: 'event_cancelled' });
                  }
                });
                await Promise.all(notificationPromises);
              }
              await deleteEvent(event.id);
              toast({ type: "success", title: "Evento cancelado" });
              navigation.navigate('Main'); 
            } catch (error) {
              console.error(error);
              toast({ type: "error", title: "Erro ao cancelar" });
            } finally {
              setActionLoading(false);
            }
          } 
        }
      ]
    );
  };

  useEffect(() => {
    if (showInterestForm) {
      const fetchUserDependents = async () => {
        setLoadingDependents(true);
        try {
          const { data } = await getDependents();
          setDependents(data || []);
        } catch (error) {
          toast({ type: "error", title: "Erro ao carregar dependentes." });
        } finally {
          setLoadingDependents(false);
        }
      };
      fetchUserDependents();
    }
  }, [showInterestForm]);

  const handleToggleDependent = (dependentId) => {
    setSelectedDependentIds((prev) =>
      prev.includes(dependentId) ? prev.filter((id) => id !== dependentId) : [...prev, dependentId]
    );
  };

  const handleExportAttendanceList = async () => {
    if (!event) return;
    setIsExporting(true);
    try {
      const { data: allAcceptedMatches } = await getAcceptedGuestsByEvent(event.id);
      const filteredMatches = (allAcceptedMatches || []).filter(m => 
        String(m.event_id) === String(event.id) && 
        String(m.status).toLowerCase() === 'accepted' && 
        m.guest_id !== event.host_id
      );

      if (!filteredMatches || filteredMatches.length === 0) {
        setIsExporting(false);
        return Alert.alert("Lista Vazia", "Ainda não há convidados aceitos.");
      }

      const guestRows = filteredMatches.map(match => {
        const guestDisplayName = match.guest?.username || match.guest?.full_name || 'Convidado';
        const guestPhoto = match.guest?.face_photo_url || match.guest?.avatar_url || 'https://via.placeholder.com/100';
        const currentSelectedDepIds = (match.dependent_ids || []).map(id => String(id));
        const attendingDeps = (match.guest?.dependents || []).filter(dep => currentSelectedDepIds.includes(String(dep.id)));

        let html = `
          <tr style="border-bottom: 1px solid #e5e7eb; background-color: #ffffff;">
            <td style="padding: 12px; width: 60px;"><img src="${guestPhoto}" style="width: 50px; height: 50px; border-radius: 25px; object-fit: cover;" /></td>
            <td style="padding: 12px;"><div style="font-weight: bold; font-size: 14px;">${guestDisplayName}</div><div style="font-size: 11px;">Responsável • ${match.guest?.phone || 'N/A'}</div></td>
            <td style="padding: 12px; text-align: center;"><div style="width: 22px; height: 22px; border: 2px solid ${isPessachEvent ? GOLD_COLOR : '#4F46E5'}; border-radius: 4px; display: inline-block;"></div></td>
          </tr>
        `;

        attendingDeps.forEach(dep => {
          html += `
            <tr style="border-bottom: 1px solid #f3f4f6; background-color: #f9fafb;">
              <td style="padding: 8px 12px 8px 40px; width: 60px; text-align: right;">👤</td>
              <td style="padding: 8px 12px;"><div style="font-size: 13px;">${dep.name}</div><div style="font-size: 10px;">Dependente de ${guestDisplayName.split(' ')[0]} • ${calculateAge(dep.birth_date)} anos</div></td>
              <td style="padding: 8px 12px; text-align: center;"><div style="width: 18px; height: 18px; border: 1px solid #9CA3AF; border-radius: 4px; display: inline-block; background-color: #fff;"></div></td>
            </tr>
          `;
        });
        return html;
      }).join('');

      const htmlContent = `
        <html>
          <body style="font-family: Helvetica, sans-serif; padding: 20px;">
            <div style="text-align: center; border-bottom: 3px solid ${isPessachEvent ? GOLD_COLOR : '#4f46e5'}; padding-bottom: 15px; margin-bottom: 25px;">
              <div style="font-size: 24px; font-weight: bold; color: ${isPessachEvent ? GOLD_COLOR : '#4f46e5'};">Lista de Presença</div>
              <div style="font-size: 14px;"><strong>${event.title}</strong></div>
              <div style="font-size: 14px;">${formatShabbatDate(new Date(event.date))}</div>
            </div>
            <table style="width: 100%; border-collapse: collapse;">
              <thead><tr style="background: #f9fafb;"><th>Foto</th><th>Participante</th><th>Check-in</th></tr></thead>
              <tbody>${guestRows}</tbody>
            </table>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const newPath = `${FileSystem.cacheDirectory}lista_${event.id}.pdf`;
      await FileSystem.moveAsync({ from: uri, to: newPath });
      await Sharing.shareAsync(newPath);
    } catch (error) {
      toast({ type: "error", title: "Erro na exportação" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExpressInterest = async () => {
    if (!personalMessage.trim()) return toast({ type: "error", title: "Escreva uma mensagem" });
    setIsSubmitting(true);
    try {
      const matchData = {
        event_id: event.id,
        personal_message: personalMessage,
        dependent_ids: selectedDependentIds,
      };
      
      const response = await createMatch(matchData);
      const newMatchId = response?.data?.id || (Array.isArray(response?.data) ? response?.data[0]?.id : null);

      await saveInternalNotification(
        event.host_id, 
        `Novo pedido de ${eventCategoryLabel}! 🕯️`, 
        `${user?.username || 'Alguém'} quer participar do seu evento.`,
        "match_request",
        newMatchId 
      );

      if (event.host?.push_token) {
        await sendPushNotification(
          event.host.push_token,
          `Novo interesse no ${eventCategoryLabel}! 🕯️`,
          `${user?.username} se interessou pela sua mesa.`,
          { matchId: newMatchId }
        );
      }

      toast({ type: "success", title: "Interesse enviado!" });
      navigation.goBack();
    } catch (error) {
      toast({ type: "error", title: "Erro ao enviar pedido" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMatchAction = (targetMatchId, status) => {
    if (status === 'declined') {
      Alert.alert(
        "Confirmar Recusa",
        "Tem certeza que deseja recusar este pedido? O convidado será notificado e esta ação não poderá ser desfeita.",
        [
          { text: "Cancelar", style: "cancel" },
          { 
            text: "Sim, Recusar", 
            style: "destructive", 
            onPress: () => processMatchAction(targetMatchId, status) 
          }
        ]
      );
    } else {
      processMatchAction(targetMatchId, status);
    }
  };

  const processMatchAction = async (targetMatchId, status) => {
    setActionLoadingId(targetMatchId);
    try {
      await updateMatchStatus(targetMatchId, status);
      const targetMatch = eventRequests.find(m => m.id === targetMatchId) || matchDetails;
      
      const notiTitle = status === 'accepted' ? "Pedido Aceito! ✨" : "Pedido Recusado";
      const notiMsg = status === 'accepted' 
        ? `Sua presença foi confirmada no ${eventCategoryLabel}: ${event?.title}` 
        : `Infelizmente seu pedido para "${event?.title}" não foi aceito.`;

      await saveInternalNotification(targetMatch.guest_id, notiTitle, notiMsg, status === 'accepted' ? "match_accepted" : "match_declined", targetMatchId);

      if (targetMatch?.guest?.push_token) {
        await sendPushNotification(targetMatch.guest.push_token, notiTitle, notiMsg, { matchId: targetMatchId });
      }

      await fetchEventData();
      toast({ type: "success", title: status === "accepted" ? "Aceito!" : "Recusado." });
    } catch (error) {
      console.error("Erro na ação:", error);
      toast({ type: "error", title: "Erro na ação" });
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenWhatsApp = (specificMatch) => {
    const targetMatch = specificMatch || matchDetails;
    if (!targetMatch) return;
    const isUserHost = user?.id === event.host_id;
    const targetPhone = isUserHost ? targetMatch.guest?.phone : event.host?.phone;
    if (!targetPhone) return toast({ type: "error", title: "Telefone não encontrado" });
    Linking.openURL(`whatsapp://send?phone=${targetPhone}`).catch(() => Alert.alert('Erro', 'WhatsApp não instalado.'));
  };

  if (loading) return <SafeAreaView style={styles.loadingContainer}><LoadingSpinner size="large" /></SafeAreaView>;
  if (!event) return <SafeAreaView style={styles.container}><Text>Evento não encontrado.</Text><Button onPress={() => navigation.goBack()}>Voltar</Button></SafeAreaView>;

  const isUserHost = user?.id === event.host_id;
  const hostAgeGroup = event.host ? calculateAgeGroup(event.host.birth_date) : null;
  const showInterestButton = !isUserHost && origin !== "home" && origin !== "agenda" && !matchDetails; 
  const showMatchDetails = (matchDetails || (origin === "home" || origin === "agenda")) && matchDetails && !isUserHost; 
  const isMatchAccepted = showMatchDetails && matchDetails.status === 'accepted';
  const isMatchDeclined = showMatchDetails && matchDetails.status === 'declined';
  const showWhatsAppButton = !isUserHost && isMatchAccepted; 
  const addressToShow = (isMatchAccepted || isUserHost) ? event.full_address : event.approximate_address;
  const showHostIdentity = isUserHost || isMatchAccepted;
  const hostDisplayName = showHostIdentity ? (event.host?.username || event.host?.full_name || "Anfitrião") : "Anfitrião da Comunidade";
  const isDeadlinePassed = event.deadline_datetime && new Date() > new Date(event.deadline_datetime);

  // 👇 LÓGICA DE RE-PEDIDO 👇
  const hasAlreadyRetried = matchDetails?.retry_count >= 1;
  const canRetry = isMatchDeclined && !hasAlreadyRetried;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}><Icon name="chevron-left" size={28} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes de {eventCategoryLabel}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.contentWrapper}>
            <Card style={[{ width: "100%" }, isPessachEvent && { borderColor: GOLD_COLOR, borderWidth: 2 }]}>
              <CardHeader>
                {isPessachEvent && (<Badge style={{ backgroundColor: GOLD_COLOR, alignSelf: 'flex-start', marginBottom: 10 }}><Text style={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}>SEDER DE PESSACH 2026</Text></Badge>)}
                <CardTitle style={[styles.eventTitle, isPessachEvent && { color: GOLD_COLOR }]}>{event.title}</CardTitle>
                <View style={styles.hostInfoContainer}>
                  <CardDescription>Criado por: </CardDescription>
                  {showHostIdentity ? (
                    <>
                      <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: event.host?.id })}><Text style={[styles.hostNameLink, isPessachEvent && { color: GOLD_COLOR }]}>{hostDisplayName}</Text></TouchableOpacity>
                      <VerifiedBadge role={event.host?.role} size={14} style={{ marginLeft: 4 }} />
                    </>
                  ) : (<Text style={styles.hostNameText}>{hostDisplayName}</Text>)}
                </View>
              </CardHeader>
              <CardContent>
                <Text style={styles.description}>{event.description}</Text>
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}><Icon name={isPessachEvent ? "star" : "calendar-month-outline"} color={isPessachEvent ? GOLD_COLOR : "#4F46E5"} size={20} /><Text style={isPessachEvent && { fontWeight: 'bold', color: GOLD_COLOR }}>{formatShabbatDate(new Date(event.date))}</Text></View>
                  {event.meal_type && (<View style={styles.detailItem}><Icon name="silverware-fork-knife" color="#F59E0B" size={20} /><Text>{getLabel(event.meal_type, mealTypeLabels)}</Text></View>)}
                  <View style={styles.detailItem}><Icon name="map-marker-outline" color="#EC4899" size={20} /><Text style={{ flex: 1 }}>{addressToShow}</Text></View>
                  <View style={styles.detailItem}><Icon name="account-group-outline" color="#10B981" size={20} /><Text>{event.max_guests === 0 ? "Sem limites" : `Até ${event.max_guests} convidados`}</Text></View>
                </View>
                <View style={styles.tagsContainer}>
                  {hostAgeGroup && (<Badge variant="outline">Anfitriões: {hostAgeGroup}</Badge>)}
                  {event.target_audience && (<Badge variant="outline">Público: {getLabel(event.target_audience, targetAudienceLabels)}</Badge>)}
                  {event.languages?.map((lang) => (<Badge key={lang} variant="outline">{lang}</Badge>))}
                </View>
                {isUserHost && (
                  <View style={{ gap: 12, marginTop: 20 }}>
                    <Button variant="outline" onPress={handleExportAttendanceList} disabled={isExporting} style={[styles.exportButton, isPessachEvent && { borderColor: GOLD_COLOR }]}>
                        {isExporting ? <ActivityIndicator size="small" color={GOLD_COLOR} /> : (<><Icon name="file-pdf-box" size={20} color={isPessachEvent ? GOLD_COLOR : "#4F46E5"} style={{ marginRight: 8 }} /><Text style={{ color: isPessachEvent ? GOLD_COLOR : '#4F46E5', fontWeight: 'bold' }}>Exportar Lista</Text></>)}
                    </Button>
                    <Button variant="destructive" onPress={handleDeleteEvent} disabled={actionLoading} style={styles.deleteButton}>
                        {actionLoading ? <ActivityIndicator size="small" color="#FFF" /> : (<><Icon name="trash-can-outline" size={20} color="#FFF" style={{ marginRight: 8 }} /><Text style={{ color: '#FFF', fontWeight: 'bold' }}>Deletar Evento</Text></>)}
                    </Button>
                  </View>
                )}
              </CardContent>
            </Card>

            {/* 👇 VISÃO DO ANFITRIÃO: PEDIDOS COM SUPORTE A RE-PEDIDO 👇 */}
            {isUserHost && (
              <View style={{ width: '100%', marginTop: 8 }}>
                <Text style={styles.sectionTitle}>Pedidos de Participação ({eventRequests.length})</Text>
                {eventRequests.map((request) => (
                  <Card key={request.id} style={[styles.requestItemCard, isPessachEvent && { borderColor: GOLD_COLOR }]}>
                    <CardContent style={{ padding: 16 }}>
                      <View style={styles.requestHeader}>
                        <TouchableOpacity style={styles.guestProfileInfo} onPress={() => navigation.navigate('PublicProfile', { userId: request.guest?.id })}>
                          <Image source={{ uri: request.guest?.avatar_url || `https://ui-avatars.com/api/?name=${request.guest?.username}` }} style={styles.avatarMini} />
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.guestNameText}>{request.guest?.username}</Text>
                              <VerifiedBadge role={request.guest?.role} size={14} style={{ marginLeft: 4 }} />
                            </View>
                            <Text style={styles.timestampSmall}>Enviado em {new Date(request.created_at).toLocaleDateString('pt-BR')}</Text>
                          </View>
                        </TouchableOpacity>

                        {/* Indicador de Reconsideração */}
                        {request.retry_count >= 1 && (
                          <Badge style={{ backgroundColor: "#7C3AED", marginRight: 8 }}>
                             <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>INSISTÊNCIA</Text>
                          </Badge>
                        )}
                        
                        <Badge variant={request.status === 'accepted' ? "success" : request.status === 'declined' ? "destructive" : "warning"}>
                          {request.status === 'accepted' ? "Aceito" : request.status === 'declined' ? "Recusado" : "Pendente"}
                        </Badge>
                      </View>

                      <View style={styles.requestContent}>
                        <Text style={styles.messageLabelMini}>Mensagem Original:</Text>
                        <Text style={styles.messageTextMini}>{request.personal_message || 'Sem mensagem.'}</Text>
                        
                        {/* Exibição da Mensagem de Insistência */}
                        {request.retry_message && (
                          <View style={styles.retryMessageHostBox}>
                             <Text style={styles.retryLabelMini}>MENSAGEM DE INSISTÊNCIA:</Text>
                             <Text style={styles.retryTextMini}>{request.retry_message}</Text>
                          </View>
                        )}
                      </View>

                      {request.status === 'pending' && (
                        <View style={styles.requestActionsRow}>
                          <Button variant="destructive" style={{ flex: 1 }} onPress={() => handleMatchAction(request.id, "declined")} disabled={actionLoadingId === request.id}>Recusar</Button>
                          <Button style={{ flex: 1, backgroundColor: "#22C55E" }} onPress={() => handleMatchAction(request.id, "accepted")} disabled={actionLoadingId === request.id}>{actionLoadingId === request.id ? <ActivityIndicator size="small" color="#FFF"/> : "Aceitar"}</Button>
                        </View>
                      )}
                      <TouchableOpacity style={styles.whatsappActionRow} onPress={() => handleOpenWhatsApp(request)}><Icon name="whatsapp" size={18} color="#25D366" /><Text style={styles.whatsappActionText}>WhatsApp</Text></TouchableOpacity>
                    </CardContent>
                  </Card>
                ))}
              </View>
            )}

            {/* VISÃO DO CONVIDADO: DETALHES DO PEDIDO E RETRY */}
            {showMatchDetails && (
              <Card style={[{ width: "100%" }, isPessachEvent && { borderColor: GOLD_COLOR }]}>
                <CardHeader>
                    <CardTitle>Seu Pedido</CardTitle>
                    <Badge variant={matchDetails.status === 'accepted' ? "success" : matchDetails.status === 'declined' ? "destructive" : "warning"}>
                      {matchDetails.status === 'accepted' ? "Aceito" : matchDetails.status === 'declined' ? "Recusado" : "Pendente"}
                    </Badge>
                </CardHeader>
                <CardContent>
                    <Text style={styles.sectionTitle}>Mensagem Original</Text>
                    <Text style={styles.messageText}>"{matchDetails.personal_message || 'Nenhuma mensagem.'}"</Text>
                    
                    {/* Exibição da Mensagem de Insistência enviada */}
                    {matchDetails.retry_message && (
                       <View style={styles.retryDisplayBox}>
                          <Text style={styles.retryLabelSmall}>Mensagem de Insistência:</Text>
                          <Text style={styles.retryTextSmall}>{matchDetails.retry_message}</Text>
                       </View>
                    )}

                    {attendingDependents.map((item) => <DependentDisplay key={item.id} dependent={item} />)}
                    
                    {/* Botão para Nova Tentativa */}
                    {canRetry && (
                      <Button 
                        style={{ marginTop: 20, backgroundColor: "#4F46E5" }} 
                        onPress={() => setIsRetryModalVisible(true)}
                      >
                        Tentar participar novamente
                      </Button>
                    )}

                    {/* Aviso de Limite Atingido */}
                    {isMatchDeclined && hasAlreadyRetried && (
                      <View style={styles.limitBox}>
                         <Icon name="information-outline" size={14} color="#EF4444" />
                         <Text style={styles.limitText}>O limite de tentativas para este evento foi atingido.</Text>
                      </View>
                    )}

                    {showWhatsAppButton && (
                        <TouchableOpacity style={[styles.whatsappButton, isPessachEvent && { backgroundColor: GOLD_COLOR }]} onPress={() => handleOpenWhatsApp()}><Icon name="whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 10 }} /><Text style={styles.whatsappButtonText}>Conversar com Anfitrião</Text></TouchableOpacity>
                    )}
                </CardContent>
              </Card>
            )}

            {showInterestButton && (
              <>
                {isDeadlinePassed ? (
                    <Card style={{ width: "100%", borderColor: '#DC2626' }}><CardContent style={{ alignItems: 'center', padding: 24 }}><Icon name="clock-alert" size={48} color="#DC2626" /><Text style={{ fontSize: 18, fontWeight: 'bold', color: '#DC2626', marginTop: 12 }}>Inscrições Encerradas</Text></CardContent></Card>
                ) : showInterestForm ? (
                    <Card style={[{ width: "100%" }, isPessachEvent && { borderColor: GOLD_COLOR }]}>
                    <CardHeader><CardTitle>Participar</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea placeholder={`Escreva ao anfitrião...`} value={personalMessage} onChangeText={setPersonalMessage} style={{ marginBottom: 16 }} />
                        {dependents.length > 0 && (
                          <View style={styles.dependentsSection}> 
                            <Text style={styles.dependentsTitle}>Acompanhantes</Text> 
                            {dependents.map((dep) => (<DependentSelector key={dep.id} dependent={dep} isSelected={selectedDependentIds.includes(dep.id)} onToggle={() => handleToggleDependent(dep.id)} />))} 
                          </View>
                        )}
                        <View style={styles.actionsContainer}>
                          <Button variant="outline" style={{ flex: 1 }} onPress={() => setShowInterestForm(false)}>Cancelar</Button>
                          <Button style={[{ flex: 1 }, isPessachEvent && { backgroundColor: GOLD_COLOR }]} onPress={handleExpressInterest} disabled={isSubmitting}>{isSubmitting ? <ActivityIndicator size="small" color="#FFF" /> : "Enviar"}</Button>
                        </View>
                    </CardContent>
                    </Card>
                ) : (
                    <LinearGradient colors={isPessachEvent ? [GOLD_COLOR, "#B8860B"] : ["#4F46E5", "#7C3AED"]} style={styles.ctaCard}>
                      <Text style={styles.ctaTitle}>Interessado?</Text>
                      <Button variant="secondary" onPress={() => setShowInterestForm(true)}>Tenho Interesse</Button>
                    </LinearGradient>
                )}
              </>
            )}
          </View>
        </ScrollView>

        {/* MODAL DE RE-PEDIDO */}
        <Modal visible={isRetryModalVisible} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalSheet}>
                <Text style={styles.modalTitle}>Novo Pedido</Text>
                <Text style={styles.modalSub}>Escreva uma nova mensagem para o anfitrião reconsiderar seu pedido. Esta é sua última tentativa.</Text>
                <Textarea 
                  placeholder="Escreva aqui..." 
                  value={retryMessage} 
                  onChangeText={setRetryMessage}
                />
                <View style={styles.modalActions}>
                  <Button variant="outline" style={{ flex: 1 }} onPress={() => setIsRetryModalVisible(false)}>Cancelar</Button>
                  <Button 
                    style={{ flex: 2, backgroundColor: "#4F46E5" }} 
                    onPress={handleSendRetry} 
                    disabled={!retryMessage.trim() || isSendingRetry}
                  >
                    {isSendingRetry ? <ActivityIndicator color="#FFF" /> : "Enviar Novo Pedido"}
                  </Button>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </Modal>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", backgroundColor: "white", ...Platform.select({ ios: { paddingTop: 0, paddingBottom: 12 }, android: { paddingTop: 40, paddingBottom: 12 } }) },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  scrollContent: { padding: 16, paddingBottom: 40, alignItems: "center" },
  contentWrapper: { width: "100%", maxWidth: 700, gap: 24 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  eventTitle: { fontSize: 24, fontWeight: "bold" },
  hostInfoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  hostNameLink: { color: '#4F46E5', textDecorationLine: 'underline', fontSize: 14 },
  hostNameText: { color: '#374151', fontSize: 14, fontWeight: '500' },
  description: { fontSize: 16, color: "#6B7280", marginVertical: 16 },
  detailsGrid: { gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  ctaCard: { padding: 20, borderRadius: 12, alignItems: "center", gap: 12, width: '100%' },
  ctaTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  actionsContainer: { flexDirection: "row", gap: 12, marginTop: 16 },
  dependentsSection: { marginVertical: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, width: '100%' },
  dependentsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  dependentSelectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  dependentSelectorText: { marginLeft: 12, fontSize: 15 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8 },
  messageText: { fontStyle: 'italic', color: '#4B5563' },
  participantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  whatsappButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', padding: 14, borderRadius: 12, marginTop: 20 },
  whatsappButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  exportButton: { borderStyle: 'dashed', borderColor: '#4F46E5', width: '100%', height: 50 },
  deleteButton: { width: '100%', height: 50, backgroundColor: '#DC2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, 
  requestItemCard: { marginBottom: 12 },
  requestHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  guestProfileInfo: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarMini: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  guestNameText: { fontSize: 15, fontWeight: 'bold' },
  timestampSmall: { fontSize: 11, color: '#9CA3AF' },
  requestContent: { backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, marginBottom: 12 },
  messageLabelMini: { fontSize: 11, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase' },
  messageTextMini: { fontSize: 14, fontStyle: 'italic', color: '#374151', marginBottom: 8 },
  requestActionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  whatsappActionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, backgroundColor: '#ECFDF5', borderRadius: 8 },
  whatsappActionText: { color: '#059669', fontWeight: 'bold' },
  
  // NOVOS ESTILOS PARA INSISTÊNCIA
  retryMessageHostBox: { marginTop: 10, padding: 10, backgroundColor: '#EEF2FF', borderRadius: 6, borderWidth: 1, borderColor: '#C7D2FE' },
  retryLabelMini: { fontSize: 10, fontWeight: '900', color: '#4F46E5', marginBottom: 2 },
  retryTextMini: { fontSize: 14, fontWeight: '600', color: '#1E1B4B' },
  retryDisplayBox: { marginTop: 12, padding: 12, backgroundColor: '#F0F9FF', borderRadius: 8, borderLeftWidth: 4, borderLeftColor: '#0EA5E9' },
  retryLabelSmall: { fontSize: 11, fontWeight: 'bold', color: '#0369A1', marginBottom: 4 },
  retryTextSmall: { fontSize: 13, color: '#075985', fontStyle: 'italic' },
  limitBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 15, padding: 10, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  limitText: { color: '#B91C1C', fontSize: 12, fontWeight: '500' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: 'white', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#6B7280', marginBottom: 16, lineHeight: 20 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 }
});