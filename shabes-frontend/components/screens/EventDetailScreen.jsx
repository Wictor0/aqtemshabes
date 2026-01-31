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
  FlatList,
  Linking, 
  Alert,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Checkbox from 'expo-checkbox';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
// 👇 Importação corrigida para evitar o erro de deprecation no Expo SDK
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
  getAcceptedGuestsByEvent 
} from "../../services/api"; 
import { toast } from "../../hooks/use-toast";
import { formatShabbatDate } from "../../lib/utils";
// 👇 Importação dos serviços de notificação (Local e Remoto)
import { showLocalNotification, sendPushNotification } from "../../services/notificationService";

// MAPAS DE TRADUÇÃO ATUALIZADOS E COMPLETOS
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
  const { eventId, origin, matchId } = route.params; 
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

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const { data: eventData } = await getEventById(eventId);
        setEvent(eventData);

        const { data: allEvents } = await getEvents();
        const userHostedDates = allEvents
          .filter(e => e.host_id === user.id)
          .map(e => new Date(e.date).toISOString().split('T')[0]);
        setHostedDates(userHostedDates);

        if (origin === 'home' && matchId) {
          const { data: matchData } = await getMatchById(matchId);
          setMatchDetails(matchData);
          
          if (matchData && matchData.guest && matchData.guest.dependents && matchData.dependent_ids) {
            const attending = matchData.guest.dependents.filter(dep => 
              matchData.dependent_ids.includes(dep.id)
            );
            setAttendingDependents(attending);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar detalhes:", error);
        toast({ type: "error", title: "Não foi possível carregar os detalhes." });
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [eventId, matchId, origin, user.id]);

  useEffect(() => {
    if (showInterestForm) {
      const fetchUserDependents = async () => {
        setLoadingDependents(true);
        try {
          const { data } = await getDependents();
          setDependents(data || []);
        } catch (error) {
          toast({ type: "error", title: "Não foi possível carregar seus dependentes." });
        } finally {
          setLoadingDependents(false);
        }
      };
      fetchUserDependents();
    } else {
      setSelectedDependentIds([]);
    }
  }, [showInterestForm]);

  const handleToggleDependent = (dependentId) => {
    setSelectedDependentIds((prev) =>
      prev.includes(dependentId)
        ? prev.filter((id) => id !== dependentId)
        : [...prev, dependentId]
    );
  };

  /**
   * LÓGICA DE EXPORTAÇÃO DE LISTA DE PRESENÇA (PDF)
   */
  const handleExportAttendanceList = async () => {
    if (!event) return;
    setIsExporting(true);

    try {
      const { data: allAcceptedMatches } = await getAcceptedGuestsByEvent(eventId);

      const filteredGuests = allAcceptedMatches.filter(m => 
        String(m.event_id) === String(eventId) && 
        (String(m.status).toLowerCase() === 'accepted') && 
        m.guest_id !== event.host_id
      );

      if (!filteredGuests || filteredGuests.length === 0) {
        setIsExporting(false);
        return Alert.alert("Lista Vazia", "Ainda não há convidados aceitos especificamente para este evento.");
      }

      const guestRows = filteredGuests.map(match => `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 12px; width: 60px;">
            <img src="${match.guest?.face_photo_url || match.guest?.avatar_url || 'https://via.placeholder.com/100'}" 
                 style="width: 50px; height: 50px; border-radius: 25px; object-fit: cover; border: 1px solid #ddd;" />
          </td>
          <td style="padding: 12px;">
            <div style="font-weight: bold; font-size: 14px; color: #1f2937;">${match.guest?.full_name || 'Convidado'}</div>
            <div style="font-size: 11px; color: #6b7280;">${match.guest?.phone || 'N/A'}</div>
          </td>
          <td style="padding: 12px; text-align: center;">
            <div style="width: 20px; height: 20px; border: 1px solid #d1d5db; border-radius: 4px; display: inline-block;"></div>
          </td>
        </tr>
      `).join('');

      const htmlContent = `
        <html>
          <head>
            <style>
              body { font-family: Helvetica, Arial, sans-serif; padding: 20px; color: #374151; }
              .header { text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 15px; margin-bottom: 25px; }
              .header-title { font-size: 24px; font-weight: bold; color: #4f46e5; }
              .event-info { font-size: 14px; color: #6b7280; margin-top: 5px; }
              .host-card { background-color: #f5f3ff; padding: 20px; border-radius: 12px; border: 1px solid #ddd6fe; margin-bottom: 30px; text-align: center; }
              .host-label { font-size: 11px; text-transform: uppercase; color: #4f46e5; font-weight: bold; letter-spacing: 1px; }
              .host-name { font-size: 22px; font-weight: bold; color: #1e1b4b; margin-top: 5px; }
              table { width: 100%; border-collapse: collapse; margin-top: 10px; }
              th { text-align: left; padding: 12px; background-color: #f9fafb; font-size: 12px; color: #4b5563; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
              .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #eee; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="header-title">Lista de Presença (Carômetro)</div>
              <div class="event-info"><strong>${event.title}</strong></div>
              <div class="event-info">${formatShabbatDate(new Date(event.date))}</div>
            </div>
            <div class="host-card">
              <div class="host-label">Anfitrião do Evento</div>
              <div class="host-name">${event.host?.full_name || 'Membro da Comunidade'}</div>
            </div>
            <table>
              <thead><tr><th>Foto</th><th>Nome Completo</th><th style="text-align: center;">Check-in</th></tr></thead>
              <tbody>${guestRows}</tbody>
            </table>
            <div class="footer">Gerado por AquiTemShabes em ${new Date().toLocaleDateString('pt-BR')}</div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      const cleanTitle = event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const fileName = `lista_presenca_${cleanTitle}.pdf`;
      const newPath = `${FileSystem.cacheDirectory}${fileName}`;

      await FileSystem.moveAsync({ from: uri, to: newPath });
      await Sharing.shareAsync(newPath, { UTI: '.pdf', mimeType: 'application/pdf' });

    } catch (error) {
      console.error("Erro na exportação PDF:", error);
      toast({ type: "error", title: "Erro na exportação" });
    } finally {
      setIsExporting(false);
    }
  };

  /**
   * LÓGICA DE DEMONSTRAÇÃO DE INTERESSE COM NOTIFICAÇÃO PUSH
   */
  const handleExpressInterest = async () => {
    // Verificações de conflito de agenda
    const eventDateString = new Date(event.date).toISOString().split('T')[0];
    if (hostedDates.includes(eventDateString)) {
      return toast({ 
        type: "error", 
        title: "Conflito de Agenda", 
        description: "Você já está organizando um evento para este dia." 
      });
    }

    if (!personalMessage.trim()) {
      return toast({ type: "error", title: "Por favor, escreva uma mensagem pessoal" });
    }

    setIsSubmitting(true);
    try {
      const matchData = {
        event_id: eventId,
        personal_message: personalMessage,
        dependent_ids: selectedDependentIds,
      };
      
      // 1. Cria o registro de Match no Banco de Dados
      await createMatch(matchData);

      // 2. 🔔 NOTIFICAÇÃO REMOTA PERSONALIZADA PARA O ANFITRIÃO
      // Capturamos o push_token do anfitrião que deve estar populado no objeto 'event'
      const hostToken = event.host?.push_token;
      const guestName = user?.full_name || "Um novo usuário";
      const eventTitle = event?.title || "seu evento";

      // LOGS DE DEPURAÇÃO PARA O TERMINAL
      console.log(`[AquiTemShabes] Tentativa de notificar anfitrião ID: ${event.host_id}`);
      console.log(`[AquiTemShabes] Push Token do Anfitrião: ${hostToken || 'NÃO ENCONTRADO'}`);

      if (hostToken) {
        await sendPushNotification(
          hostToken,
          "Novo interesse no evento! 🕯️",
          `${guestName} se interessou pelo seu evento: ${eventTitle}`
        );
        console.log(`[AquiTemShabes] Notificação enviada para o Anfitrião: ${guestName} -> ${eventTitle}`);
      } else {
        console.warn("[AquiTemShabes] O Anfitrião ainda não possui um token de notificação cadastrado.");
      }

      // 3. Notificação Local de Sucesso para o Convidado
      await showLocalNotification("AquiTemShabes", "Seu pedido de participação foi enviado!");

      toast({ type: "success", title: "Interesse enviado!", description: "O anfitrião foi notificado." });
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao enviar interesse:", error);
      toast({ type: "error", title: "Erro ao enviar pedido" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMatchAction = async (status) => {
    if (!matchId) return;
    setActionLoading(true);
    try {
      await updateMatchStatus(matchId, status);
      
      const guestName = matchDetails?.guest?.full_name || "Convidado";
      const eventTitle = event?.title || "evento";

      // 🔔 NOTIFICAÇÃO REMOTA PARA O CONVIDADO
      if (matchDetails?.guest?.push_token) {
        const notificationTitle = status === 'accepted' ? "Pedido Aceito! ✨" : "Pedido Recusado";
        const notificationBody = status === 'accepted' 
          ? `Sua participação no evento "${eventTitle}" foi confirmada!` 
          : `Infelizmente seu pedido para "${eventTitle}" não foi aceito desta vez.`;
        
        await sendPushNotification(matchDetails.guest.push_token, notificationTitle, notificationBody);
      }

      const localMsg = status === 'accepted' ? `Pedido de ${guestName} aceito` : `Pedido de ${guestName} recusado`;
      await showLocalNotification("AquiTemShabes", localMsg);

      setMatchDetails(prev => ({ ...prev, status: status }));
      toast({
        type: "success",
        title: status === "accepted" ? "Convidado aceito!" : "Pedido recusado.",
      });
    } catch (error) {
      toast({ type: "error", title: "Erro na ação" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!matchDetails) return;
    const isUserHost = user?.id === event.host_id;
    const targetPhone = isUserHost ? matchDetails.guest?.phone : event.host?.phone;
    if (!targetPhone) {
      toast({ type: "error", title: "Telefone não encontrado" });
      return;
    }
    const url = `whatsapp://send?phone=${targetPhone}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
    });
  };

  if (loading) {
    return <SafeAreaView style={styles.loadingContainer}><LoadingSpinner size="large" /></SafeAreaView>;
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Evento não encontrado.</Text>
        <Button onPress={() => navigation.goBack()}>Voltar</Button>
      </SafeAreaView>
    );
  }

  const isUserHost = user?.id === event.host_id;
  const hostAgeGroup = event.host ? calculateAgeGroup(event.host.birth_date) : null;
  const showInterestButton = !isUserHost && origin !== "home";
  const showMatchDetails = origin === "home" && matchDetails;
  const isMatchAccepted = showMatchDetails && matchDetails.status === 'accepted';
  const showWhatsAppButton = isUserHost || isMatchAccepted;
  const addressToShow = isMatchAccepted || isUserHost ? event.full_address : event.approximate_address;
  const showHostActions = isUserHost && showMatchDetails && matchDetails.status === 'pending';
  const showHostIdentity = isUserHost || isMatchAccepted;
  const hostDisplayName = showHostIdentity ? (event.host?.full_name || "Desconhecido") : "Anfitrião da Comunidade";
  const isDeadlinePassed = event.deadline_datetime && new Date() > new Date(event.deadline_datetime);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-left" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detalhes do Evento</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentWrapper}>
            <Card style={{ width: "100%" }}>
              <CardHeader>
                <CardTitle style={styles.eventTitle}>{event.title}</CardTitle>
                <View style={styles.hostInfoContainer}>
                  <CardDescription>Criado por: </CardDescription>
                  {showHostIdentity ? (
                    <>
                      <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: event.host?.id })}>
                        <Text style={styles.hostNameLink}>{hostDisplayName}</Text>
                      </TouchableOpacity>
                      <VerifiedBadge role={event.host?.role} size={14} style={{ marginLeft: 4 }} />
                    </>
                  ) : (
                    <Text style={styles.hostNameText}>{hostDisplayName}</Text>
                  )}
                </View>
              </CardHeader>
              <CardContent>
                <Text style={styles.description}>{event.description}</Text>
                
                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}><Icon name="calendar-month-outline" color="#4F46E5" size={20} /><Text>{formatShabbatDate(new Date(event.date))}</Text></View>
                  {event.meal_type && (
                    <View style={styles.detailItem}>
                      <Icon name="silverware-fork-knife" color="#F59E0B" size={20} />
                      <Text>{getLabel(event.meal_type, mealTypeLabels)}</Text>
                    </View>
                  )}
                  {event.deadline_datetime && (
                    <View style={styles.detailItem}>
                      <Icon name="clock-alert-outline" color="#DC2626" size={20} />
                      <Text style={{color: isDeadlinePassed ? '#DC2626' : '#374151'}}>
                        Prazo: {new Date(event.deadline_datetime).toLocaleString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailItem}>
                    <Icon name="map-marker-outline" color="#EC4899" size={20} />
                    <Text style={{ flex: 1 }}>{addressToShow}</Text> 
                  </View>
                  <View style={styles.detailItem}>
                    <Icon name="account-group-outline" color="#10B981" size={20} />
                    <Text>{event.max_guests === 0 ? "Sem limites" : `Até ${event.max_guests} convidados`}</Text>
                  </View>
                </View>
                
                <View style={styles.tagsContainer}>
                  {hostAgeGroup && (<Badge variant="outline">Anfitriões: {hostAgeGroup}</Badge>)}
                  {event.target_audience && (<Badge variant="outline">Público: {getLabel(event.target_audience, targetAudienceLabels)}</Badge>)}
                  {event.languages?.map((lang) => (<Badge key={lang} variant="outline">{lang}</Badge>))}
                </View>

                {isUserHost && (
                  <Button 
                    variant="outline" 
                    onPress={handleExportAttendanceList} 
                    disabled={isExporting}
                    style={styles.exportButton}
                  >
                    {isExporting ? <ActivityIndicator size="small" color="#4F46E5" /> : (
                      <>
                        <Icon name="file-pdf-box" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
                        <Text style={{ color: '#4F46E5', fontWeight: 'bold' }}>Exportar Lista (Carômetro)</Text>
                      </>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>

             {showMatchDetails && (
              <Card style={{ width: "100%" }}>
                <CardHeader>
                    <CardTitle>Detalhes do Pedido</CardTitle>
                    {!showHostActions && matchDetails.status !== 'pending' && (
                      <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                          <Badge variant={matchDetails.status === 'accepted' ? "success" : "destructive"}>
                            {matchDetails.status === 'accepted' ? "Pedido Aceito" : "Pedido Recusado"}
                          </Badge>
                      </View>
                    )}
                    <View style={styles.hostInfoContainer}>
                      <CardDescription>Feito por: </CardDescription>
                      <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: matchDetails.guest?.id })}>
                        <Text style={styles.hostNameLink}>{matchDetails.guest?.full_name || "Convidado"}</Text>
                      </TouchableOpacity>
                      <VerifiedBadge role={matchDetails.guest?.role} size={14} style={{ marginLeft: 4 }} />
                    </View>
                </CardHeader>
                <CardContent>
                    <Text style={styles.sectionTitle}>Mensagem Pessoal</Text>
                    <Text style={styles.messageText}>"{matchDetails.personal_message || 'Nenhuma mensagem.'}"</Text>

                    <Text style={styles.sectionTitle}>Participantes</Text>
                    <View style={styles.participantCard}>
                      <View style={{flex: 1}}>
                        <View style={{flexDirection: 'row', alignItems: 'center'}}>
                          <Icon name="account" size={20} color="#6B7280" style={{ marginRight: 8 }}/>
                          <Text>{matchDetails.guest?.full_name || 'Convidado'} (Principal)</Text>
                        </View>
                        {(isUserHost && matchDetails.guest?.dietary_restrictions) && (
                          <View style={styles.dietaryWarning}>
                            <Icon name="alert-circle" size={14} color="#B45309" />
                            <Text style={styles.dietaryWarningText}>Restrição: {matchDetails.guest.dietary_restrictions}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                    {attendingDependents.map((item) => <DependentDisplay key={item.id} dependent={item} />)}
                    
                    {showHostActions && (
                      <View style={styles.hostActionsContainer}>
                        <Text style={styles.actionLabel}>Responder solicitação:</Text>
                        <View style={styles.buttonsRow}>
                          <Button variant="destructive" style={{ flex: 1 }} onPress={() => handleMatchAction("declined")} disabled={actionLoading}>Recusar</Button>
                          <Button style={{ flex: 1, backgroundColor: "#22C55E" }} onPress={() => handleMatchAction("accepted")} disabled={actionLoading}>
                            {actionLoading ? <LoadingSpinner size="small" color="#FFF"/> : "Aceitar"}
                          </Button>
                        </View>
                      </View>
                    )}

                    {showWhatsAppButton && (
                        <TouchableOpacity style={styles.whatsappButton} onPress={handleOpenWhatsApp}>
                          <Icon name="whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                          <Text style={styles.whatsappButtonText}>{isUserHost ? 'Conversar com Convidado' : 'Conversar com Anfitrião'}</Text>
                        </TouchableOpacity>
                    )}
                </CardContent>
              </Card>
            )}

            {showInterestButton && (
              <>
                {isDeadlinePassed ? (
                    <Card style={{ width: "100%", borderColor: '#DC2626' }}>
                        <CardContent style={{ alignItems: 'center', padding: 24 }}>
                            <Icon name="clock-alert" size={48} color="#DC2626" />
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#DC2626', marginTop: 12 }}>Inscrições Encerradas</Text>
                            <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 8 }}>O prazo para se inscrever neste evento expirou.</Text>
                        </CardContent>
                    </Card>
                ) : showInterestForm ? (
                    <Card style={{ width: "100%" }}>
                    <CardHeader><CardTitle>Enviar Pedido de Participação</CardTitle></CardHeader>
                    <CardContent>
                        <Textarea 
                          placeholder="Escreva uma mensagem para o anfitrião..." 
                          value={personalMessage} 
                          onChangeText={setPersonalMessage} 
                          style={{ marginBottom: 16 }} 
                        />
                        {loadingDependents ? ( <ActivityIndicator style={{ marginVertical: 16 }} /> ) : dependents.length > 0 ? ( 
                          <View style={styles.dependentsSection}> 
                            <Text style={styles.dependentsTitle}>Quem irá com você?</Text> 
                            {dependents.map((dep) => ( 
                              <DependentSelector key={dep.id} dependent={dep} isSelected={selectedDependentIds.includes(dep.id)} onToggle={() => handleToggleDependent(dep.id)} /> 
                            ))} 
                          </View> 
                        ) : null}
                        <View style={styles.actionsContainer}>
                          <Button variant="outline" style={{ flex: 1 }} onPress={() => setShowInterestForm(false)}>Cancelar</Button>
                          <Button style={{ flex: 1 }} onPress={handleExpressInterest} disabled={isSubmitting}>{isSubmitting ? <LoadingSpinner size="small" color="#FFFFFF" /> : "Enviar"}</Button>
                        </View>
                    </CardContent>
                    </Card>
                ) : (
                    <LinearGradient colors={["#4F46E5", "#7C3AED"]} style={styles.ctaCard}>
                      <Text style={styles.ctaTitle}>Interessado?</Text>
                      <Text style={styles.ctaSubtitle}>Demonstre interesse e envie uma mensagem personalizada.</Text>
                      <Button variant="secondary" onPress={() => setShowInterestForm(true)}>Tenho Interesse</Button>
                    </LinearGradient>
                )}
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
    backgroundColor: "white", ...Platform.select({ ios: { paddingTop: 0, paddingBottom: 12 }, android: { paddingTop: 40, paddingBottom: 12 } }),
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  scrollContent: { padding: 16, paddingBottom: 40, alignItems: "center" },
  contentWrapper: { width: "100%", maxWidth: 700, gap: 24 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  eventTitle: { fontSize: 24, fontWeight: "bold" },
  hostInfoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap' },
  hostNameLink: { color: '#4F46E5', textDecorationLine: 'underline', fontSize: 14 },
  hostNameText: { color: '#374151', fontSize: 14, fontWeight: '500', marginTop: 6 },
  description: { fontSize: 16, color: "#6B7280", marginVertical: 16 },
  detailsGrid: { gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  ctaCard: { padding: 20, borderRadius: 12, alignItems: "center", gap: 12, width: '100%' },
  ctaTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  ctaSubtitle: { color: "rgba(229, 231, 235, 0.9)", textAlign: "center", marginBottom: 8 },
  actionsContainer: { flexDirection: "row", gap: 12, marginTop: 16 },
  dependentsSection: { marginVertical: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8, width: '100%' },
  dependentsTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#374151' },
  dependentSelectorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 4 },
  dependentSelectorText: { marginLeft: 12, fontSize: 15, color: '#374151' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#1F2937' },
  messageText: { fontStyle: 'italic', color: '#4B5563' },
  participantCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8 },
  whatsappButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', padding: 14, borderRadius: 12, marginTop: 20 },
  whatsappButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  hostActionsContainer: { marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#E5E7EB" },
  actionLabel: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 12 },
  buttonsRow: { flexDirection: "row", gap: 12 },
  dietaryWarning: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, backgroundColor: '#FFFBEB', padding: 8, borderRadius: 6, borderWidth: 1, borderColor: '#FEF3C7' },
  dietaryWarningText: { fontSize: 13, color: '#92400E', flex: 1 },
  validatorBadgeSmall: { backgroundColor: '#F3F4F6', paddingVertical: 2, paddingHorizontal: 8, borderRadius: 6, marginTop: 4, alignSelf: 'flex-start' },
  validatorTextSmall: { fontSize: 12, color: '#4B5563' },
  exportButton: { marginTop: 20, borderStyle: 'dashed', borderColor: '#4F46E5', width: '100%', height: 50, paddingVertical: 12 },
});