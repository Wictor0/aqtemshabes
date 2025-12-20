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
  Alert
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Checkbox from 'expo-checkbox';

// UI Components
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Textarea } from "../ui/Textarea";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";
// 👇 Importação do Selo
import VerifiedBadge from "../ui/VerifiedBadge";

// Hooks, API & Utils
import { useAuth } from "../../context/AuthContext";
import { getEventById, createMatch, getDependents, getMatchById, updateMatchStatus } from "../../services/api"; 
import { toast } from "../../hooks/use-toast";
import { formatShabbatDate } from "../../lib/utils";

// Mapas de Tradução
const targetAudienceLabels = {
  any: "Qualquer pessoa",
  families: "Famílias",
  "young-adults": "Jovens",
  seniors: "Seniores",
};
const mealTypeLabels = {
  almoço: "Almoço",
  jantar: "Jantar",
};

const getLabel = (value, labels) => labels[value] || value;

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
  const [matchDetails, setMatchDetails] = useState(null); 
  const [attendingDependents, setAttendingDependents] = useState([]); 
  const [dependents, setDependents] = useState([]); 
  const [selectedDependentIds, setSelectedDependentIds] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [loadingDependents, setLoadingDependents] = useState(false);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estado para loading dos botões de ação
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        const { data: eventData } = await getEventById(eventId);
        setEvent(eventData);

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
  }, [eventId, matchId, origin]);

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

  const handleExpressInterest = async () => {
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
      await createMatch(matchData);
      toast({ type: "success", title: "Interesse enviado!", description: "O anfitrião foi notificado." });
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao enviar interesse:", error);
      if (error.response?.status === 409) {
        toast({
          type: "error",
          title: "Pedido já enviado",
          description: "Você já demonstrou interesse neste evento.",
        });
      } else if (error.response?.status === 403) {
        toast({
          type: "error",
          title: "Ação não permitida",
          description: "Você não pode se inscrever no seu próprio evento.",
        });
      } else {
        toast({
          type: "error",
          title: "Erro ao enviar pedido",
          description: "Tente novamente mais tarde.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lógica para Aceitar ou Recusar o match
  const handleMatchAction = async (status) => {
    if (!matchId) return;
    setActionLoading(true);
    try {
      await updateMatchStatus(matchId, status);
      
      // Atualiza o estado local para refletir a mudança imediatamente na tela
      setMatchDetails(prev => ({ ...prev, status: status }));
      
      toast({
        type: "success",
        title: status === "accepted" ? "Convidado aceito!" : "Pedido recusado.",
        description: status === "accepted" 
          ? "O convidado será notificado." 
          : "O status foi atualizado.",
      });
    } catch (error) {
      console.error(`Erro ao atualizar match para ${status}:`, error);
      toast({
        type: "error",
        title: "Erro na ação",
        description: "Não foi possível atualizar o status. Tente novamente.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!matchDetails) return;
    const isUserHost = user?.id === event.host_id;
    const targetPhone = isUserHost ? matchDetails.guest?.phone : event.host?.phone;
    
    if (!targetPhone) {
      toast({ type: "error", title: "Telefone não encontrado", description: "Este utilizador não registou um número de telefone." });
      return;
    }
    
    const url = `whatsapp://send?phone=${targetPhone}`;
    
    Linking.openURL(url).catch(() => {
      Alert.alert('Erro', 'Não foi possível abrir o WhatsApp. Verifique se a aplicação está instalada.');
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

  const addressToShow = isMatchAccepted ? event.full_address : event.approximate_address;
  const showHostActions = isUserHost && showMatchDetails && matchDetails.status === 'pending';

  // 👇 Lógica de Blind: Mostra identidade se for o dono ou se foi aceito
  const showHostIdentity = isUserHost || isMatchAccepted;
  const hostDisplayName = showHostIdentity ? (event.host?.full_name || "Desconhecido") : "Anfitrião da Comunidade";

  // 👇 VERIFICAÇÃO DE PRAZO 👇
  const isDeadlinePassed = event.deadline_datetime && new Date() > new Date(event.deadline_datetime);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentWrapper}>
          <Card style={{ width: "100%" }}>
            <CardHeader>
              <CardTitle style={styles.eventTitle}>{event.title}</CardTitle>
              <View style={styles.hostInfoContainer}>
                <CardDescription>Criado por: </CardDescription>
                
                {/* 👇 CONDICIONAL DE EXIBIÇÃO DO ANFITRIÃO 👇 */}
                {showHostIdentity ? (
                    <>
                        <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: event.host?.id })}>
                            <Text style={styles.hostNameLink}>{hostDisplayName}</Text>
                        </TouchableOpacity>
                        <VerifiedBadge role={event.host?.role} size={14} style={{ marginLeft: 4 }} />
                    </>
                ) : (
                    // Se não for o dono e não foi aceito, mostra texto simples sem link
                    <Text style={styles.hostNameText}>{hostDisplayName}</Text>
                )}
                {/* 👆 FIM DA ALTERAÇÃO 👆 */}

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
                
                {/* 👇 EXIBIÇÃO DO PRAZO 👇 */}
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
                    {isMatchAccepted && (
                        <Badge variant="success" style={{ marginLeft: 8 }}>Endereço Privado</Badge>
                    )}
                </View>

                <View style={styles.detailItem}><Icon name="account-group-outline" color="#10B981" size={20} /><Text>Até {event.max_guests} convidados</Text></View>
              </View>
              
              <View style={styles.tagsContainer}>
                {hostAgeGroup && (<Badge variant="outline">Anfitriões: {hostAgeGroup}</Badge>)}
                {event.target_audience && (<Badge variant="outline">Público: {getLabel(event.target_audience, targetAudienceLabels)}</Badge>)}
                {event.languages?.map((lang) => (<Badge key={lang} variant="outline">{lang}</Badge>))}
              </View>
            </CardContent>
          </Card>

          {/* Bloco 1: Detalhes do Pedido (Aparece se veio da Home/Agenda) */}
           {showMatchDetails && (
            <Card style={{ width: "100%" }}>
              <CardHeader>
                  <CardTitle>Detalhes do Pedido</CardTitle>
                  
                  {/* Se já foi respondido (e não é pendente), mostra badge do status */}
                  {!showHostActions && matchDetails.status !== 'pending' && (
                    <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>
                        {matchDetails.status === 'accepted' ? (
                          <Badge variant="success">Pedido Aceito</Badge>
                        ) : (
                          <Badge variant="destructive">Pedido Recusado</Badge>
                        )}
                    </View>
                  )}

                  <View style={styles.hostInfoContainer}>
                    <CardDescription>Feito por: </CardDescription>
                    <TouchableOpacity onPress={() => navigation.navigate('PublicProfile', { userId: matchDetails.guest?.id })}>
                      <Text style={styles.hostNameLink}>{matchDetails.guest?.full_name || "Convidado"}</Text>
                    </TouchableOpacity>
                    {/* 👇 SELO DO CONVIDADO (AUTOR DO PEDIDO) 👇 */}
                    <VerifiedBadge role={matchDetails.guest?.role} size={14} style={{ marginLeft: 4 }} />
                  </View>
                  {/* 👇 VALIDAÇÃO DO CONVIDADO (AUTOR DO PEDIDO) ADICIONADA ABAIXO 👇 */}
                   {isUserHost && matchDetails.guest?.validator_organization && (
                      <View style={styles.validatorBadgeSmall}>
                         <Text style={styles.validatorTextSmall}>
                            Validado por: <Text style={{fontWeight: 'bold'}}>{matchDetails.guest.validator_organization}</Text>
                         </Text>
                      </View>
                  )}
                  {/* 👆 FIM DA ADIÇÃO 👆 */}
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

                          {/* 👇 EXIBIÇÃO DA RESTRIÇÃO ALIMENTAR NO DETALHE DO PEDIDO 👇 */}
                          {(isUserHost && matchDetails.guest?.dietary_restrictions) && (
                              <View style={styles.dietaryWarning}>
                                  <Icon name="alert-circle" size={14} color="#B45309" />
                                  <Text style={styles.dietaryWarningText}>Restrição: {matchDetails.guest.dietary_restrictions}</Text>
                              </View>
                          )}
                          {/* 👆 FIM DA ADIÇÃO 👆 */}
                      </View>
                  </View>

                  {attendingDependents.length > 0 && (
                      <FlatList
                          data={attendingDependents}
                          keyExtractor={(item) => item.id}
                          renderItem={({ item }) => <DependentDisplay dependent={item} />}
                          scrollEnabled={false}
                          style={{ marginTop: 8 }}
                      />
                  )}
                  
                  {/* BOTÕES DE ACEITAR/RECUSAR (Apenas se for Host e Pendente) */}
                  {showHostActions && (
                    <View style={styles.hostActionsContainer}>
                      <Text style={styles.actionLabel}>Responder solicitação:</Text>
                      <View style={styles.buttonsRow}>
                        <Button 
                          variant="destructive" 
                          style={{ flex: 1 }} 
                          onPress={() => handleMatchAction("declined")}
                          disabled={actionLoading}
                        >
                          Recusar
                        </Button>
                        <Button 
                          style={{ flex: 1, backgroundColor: "#22C55E" }} 
                          onPress={() => handleMatchAction("accepted")}
                          disabled={actionLoading}
                        >
                          {actionLoading ? <LoadingSpinner size="small" color="#FFF"/> : "Aceitar"}
                        </Button>
                      </View>
                    </View>
                  )}

                  {/* Botão de WhatsApp */}
                  {showWhatsAppButton && (
                      <TouchableOpacity
                        style={styles.whatsappButton}
                        onPress={handleOpenWhatsApp}
                      >
                        <Icon name="whatsapp" size={20} color="#FFFFFF" style={{ marginRight: 10 }} />
                        <Text style={styles.whatsappButtonText}>
                          {isUserHost ? 'Conversar com Convidado' : 'Conversar com Anfitrião'}
                        </Text>
                      </TouchableOpacity>
                  )}
              </CardContent>
            </Card>
          )}

          {/* Bloco 2: Formulário de Interesse (Para convidados) */}
          {showInterestButton && (
            <>
              {/* 👇 SE O PRAZO EXPIROU, MOSTRA AVISO E BLOQUEIA FORMULÁRIO 👇 */}
              {isDeadlinePassed ? (
                  <Card style={{ width: "100%", borderColor: '#DC2626' }}>
                      <CardContent style={{ alignItems: 'center', padding: 24 }}>
                          <Icon name="clock-alert" size={48} color="#DC2626" />
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#DC2626', marginTop: 12 }}>
                              Inscrições Encerradas
                          </Text>
                          <Text style={{ textAlign: 'center', color: '#6B7280', marginTop: 8 }}>
                              O prazo para se inscrever neste evento expirou em {new Date(event.deadline_datetime).toLocaleDateString('pt-BR')}.
                          </Text>
                      </CardContent>
                  </Card>
              ) : (
                  // Se não expirou, mostra o formulário ou botão normal
                  <>
                    {showInterestForm ? (
                        <Card style={{ width: "100%" }}>
                        <CardHeader>
                            <CardTitle>Enviar Pedido de Participação</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Textarea placeholder="Escreva uma mensagem para o anfitrião..." value={personalMessage} onChangeText={setPersonalMessage} style={{ marginBottom: 16 }} />
                            {loadingDependents ? ( <ActivityIndicator style={{ marginVertical: 16 }} /> ) : dependents.length > 0 ? ( <View style={styles.dependentsSection}> <Text style={styles.dependentsTitle}>Quem irá com você?</Text> {dependents.map((dep) => ( <DependentSelector key={dep.id} dependent={dep} isSelected={selectedDependentIds.includes(dep.id)} onToggle={() => handleToggleDependent(dep.id)} /> ))} </View> ) : null}
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
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
    backgroundColor: "white", ...Platform.select({
      ios: { paddingTop: 0, paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 12 },
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  container: { padding: 16, alignItems: "center" },
  contentWrapper: { width: "100%", maxWidth: 700, gap: 24 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  eventTitle: { fontSize: 24, fontWeight: "bold" },
  hostInfoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  hostNameLink: { color: '#4F46E5', textDecorationLine: 'underline', fontSize: 14 },
  hostNameText: { color: '#374151', fontSize: 14, fontWeight: '500' }, // Estilo para nome sem link
  description: { fontSize: 16, color: "#6B7280", marginVertical: 16 },
  detailsGrid: { gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  ctaCard: { padding: 20, borderRadius: 12, alignItems: "center", gap: 12 },
  ctaTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  ctaSubtitle: { color: "rgba(229, 231, 235, 0.9)", textAlign: "center", marginBottom: 8 },
  actionsContainer: { flexDirection: "row", gap: 12, marginTop: 16 },
  dependentsSection: {
    marginVertical: 16, padding: 12, backgroundColor: '#F3F4F6', borderRadius: 8,
  },
  dependentsTitle: {
    fontSize: 16, fontWeight: 'bold', marginBottom: 12, color: '#374151',
  },
  dependentSelectorRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingVertical: 4,
  },
  dependentSelectorText: { marginLeft: 12, fontSize: 15, color: '#374151' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#1F2937' },
  messageText: { fontStyle: 'italic', color: '#4B5563' },
  participantCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB',
    padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB',
    marginBottom: 8,
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366', 
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  whatsappButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  hostActionsContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 12,
  },

  // 👇 Estilo para o aviso de restrição alimentar
  dietaryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginLeft: 28, 
    backgroundColor: '#FFFBEB',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FEF3C7'
  },
  dietaryWarningText: {
    fontSize: 13,
    color: '#92400E',
    flex: 1, 
  },
  
  // 👇 Novos estilos para o badge de validação pequeno
  validatorBadgeSmall: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginTop: 4,
    marginLeft: 28, // Alinha com o texto, abaixo do nome
    alignSelf: 'flex-start',
  },
  validatorTextSmall: {
    fontSize: 12,
    color: '#4B5563',
  },
});