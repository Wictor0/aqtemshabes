import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Platform, FlatList, ActivityIndicator, Linking, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import { getMatchById, getDependents, updateMatchStatus } from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import Icon from '../ui/Icon';
import { Button } from "../ui/Button"; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { formatShabbatDate } from "../../lib/utils";
import { toast } from "../../hooks/use-toast";
// 👇 Importação do componente de selo
import VerifiedBadge from '../ui/VerifiedBadge';

const mealTypeLabels = {
  almoço: "Almoço",
  jantar: "Jantar",
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

export default function MatchDetailScreen({ route, navigation }) {
    const { matchId } = route.params;
    const { user } = useAuth();
    const [match, setMatch] = useState(null);
    const [dependentsDetails, setDependentsDetails] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            const fetchMatchDetails = async () => {
                if (!user?.id) return;
                setLoading(true);
                try {
                    const { data: matchData } = await getMatchById(matchId);
                    setMatch(matchData);

                    if (matchData?.dependent_ids && matchData.dependent_ids.length > 0) {
                        const { data: allDependents } = await getDependents(); 
                        
                        if (allDependents) {
                            const attendingDependents = allDependents.filter(dep =>
                                matchData.dependent_ids.includes(dep.id)
                            );
                            setDependentsDetails(attendingDependents);
                        }
                    }
                } catch (error) {
                    console.error("Erro ao buscar detalhes do match:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchMatchDetails();
        }, [matchId, user?.id])
    );

    const handleMatchAction = async (status) => {
        if (!matchId) return;
        setActionLoading(true);
        try {
            await updateMatchStatus(matchId, status);
            setMatch(prev => ({ ...prev, status: status }));
            toast({
                type: "success",
                title: status === "accepted" ? "Pedido Aceito!" : "Pedido Recusado",
                description: status === "accepted" ? "O convidado foi notificado." : "O pedido foi atualizado.",
            });
        } catch (error) {
            console.error(`Erro ao atualizar match para ${status}:`, error);
            toast({
                type: "error",
                title: "Erro na ação",
                description: "Não foi possível atualizar o status.",
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleOpenWhatsApp = () => {
        if (!match) return;
        
        const isUserHost = user?.id === match.event?.host?.id;
        const targetPhone = isUserHost ? match.guest?.phone : match.event?.host?.phone;
        
        if (!targetPhone) {
            toast({ type: "error", title: "Sem telefone", description: "O usuário não cadastrou um número de contato." });
            return;
        }
        
        const url = `whatsapp://send?phone=${targetPhone}`;
        Linking.openURL(url).catch(() => {
            Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.');
        });
    };

    if (loading) {
        return <SafeAreaView style={styles.centered}><LoadingSpinner size="large" /></SafeAreaView>;
    }

    if (!match) {
        return <SafeAreaView style={styles.centered}><Text>Match não encontrado.</Text></SafeAreaView>;
    }

    const isUserHost = user?.id === match.event?.host?.id;
    const guestDisplayName = match.guest?.username || match.guest?.full_name || 'Convidado';
    const hostDisplayName = match.event?.host?.username || match.event?.host?.full_name || 'Anfitrião';
    const eventTitle = match.event?.title || 'Evento';
    const primaryParticipantName = isUserHost ? guestDisplayName : hostDisplayName;

    const isMatchAccepted = match.status === 'accepted';
    const isPending = match.status === 'pending';
    const showWhatsApp = isUserHost || isMatchAccepted;

    const addressToShow = isMatchAccepted
        ? match.event.full_address 
        : match.event.approximate_address; 
    
    // 👇 Pega o role para exibir o selo
    const primaryRole = isUserHost ? match.guest?.role : match.event?.host?.role;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
                    <Icon name="chevron-left" size={28} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Detalhes do Pedido</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.container}>
                <Card style={{ width: '100%', marginBottom: 16 }}>
                    <CardHeader>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{flex: 1}}>
                                <CardTitle>{isUserHost ? `Pedido de ${guestDisplayName}` : eventTitle}</CardTitle>
                                <CardDescription>{isUserHost ? `Para: ${eventTitle}` : `Anfitrião: ${hostDisplayName}`}</CardDescription>
                            </View>
                        </View>
                    </CardHeader>
                    <CardContent>
                        <Text style={styles.sectionTitle}>Detalhes do Evento</Text>
                        
                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Icon name="calendar-month-outline" color="#4F46E5" size={20} />
                                <Text>{formatShabbatDate(new Date(match.event.date))}</Text>
                            </View>
                            
                            {match.event.meal_type && (
                                <View style={styles.detailItem}>
                                    <Icon name="silverware-fork-knife" color="#F59E0B" size={20} />
                                    <Text>{mealTypeLabels[match.event.meal_type] || match.event.meal_type}</Text>
                                </View>
                            )}

                            <View style={styles.detailItem}>
                                <Icon name="map-marker-outline" color="#EC4899" size={20} />
                                <Text style={{ flex: 1 }}>{addressToShow}</Text>
                            </View>
                        </View>

                        {isMatchAccepted && (
                             <Text style={styles.addressHelper}>
                                (Endereço privado visível pois o pedido foi aceito)
                             </Text>
                        )}

                        <Text style={styles.sectionTitle}>Mensagem</Text>
                        <Text style={styles.messageText}>"{match.personal_message || 'Nenhuma mensagem enviada.'}"</Text>

                        <Text style={styles.sectionTitle}>Participantes</Text>
                        <View style={styles.participantCard}>
                            <View style={{flex: 1}}>
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Icon name="account" size={20} color="#6B7280" style={{ marginRight: 8 }}/>
                                    <Text>{primaryParticipantName} (Principal)</Text>
                                    {/* 👇 SELO ADICIONADO AQUI 👇 */}
                                    <VerifiedBadge role={primaryRole} size={16} />
                                </View>
                                
                                {/* 👇 EXIBIÇÃO DA RESTRIÇÃO ALIMENTAR (Apenas se eu for o Host vendo o Guest) 👇 */}
                                {(isUserHost && match.guest?.dietary_restrictions) && (
                                    <View style={styles.dietaryWarning}>
                                        <Icon name="alert-circle" size={14} color="#B45309" />
                                        <Text style={styles.dietaryWarningText}>
                                            Restrição Alimentar: {match.guest.dietary_restrictions}
                                        </Text>
                                    </View>
                                )}
                                {/* 👆 FIM DA ADIÇÃO 👆 */}
                            </View>
                        </View>

                        {dependentsDetails.length > 0 && (
                             <FlatList
                                 data={dependentsDetails}
                                 keyExtractor={(item) => item.id}
                                 renderItem={({ item }) => (
                                     <View style={[styles.participantCard, styles.dependentIndent]}>
                                          <Icon name="account-child" size={18} color="#6B7280" style={{ marginRight: 8 }}/>
                                         <Text>{item.name} ({calculateAge(item.birth_date)} anos) - {item.relationship}</Text>
                                     </View>
                                 )}
                                 scrollEnabled={false}
                             />
                        )}
                        {isUserHost && dependentsDetails.length === 0 && match.dependent_ids?.length > 0 && (
                            <View style={[styles.participantCard, styles.dependentIndent]}>
                                <Icon name="account-multiple" size={18} color="#6B7280" style={{ marginRight: 8 }}/>
                                <Text style={styles.infoText}>+ {match.dependent_ids.length} dependente(s)</Text>
                            </View>
                        )}

                        {isUserHost && isPending && (
                            <View style={styles.hostActionsContainer}>
                                <Text style={styles.actionLabel}>Deseja aceitar este pedido?</Text>
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

                        {showWhatsApp && (
                            <TouchableOpacity
                                style={styles.whatsappButton}
                                onPress={handleOpenWhatsApp}
                            >
                                <Icon name="whatsapp" size={20} color="#25D366" style={{ marginRight: 10 }} />
                                <Text style={styles.whatsappButtonText}>
                                    {isUserHost ? "Conversar com Convidado" : "Conversar com Anfitrião"}
                                </Text>
                            </TouchableOpacity>
                        )}

                    </CardContent>
                </Card>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
        paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
        backgroundColor: 'white', ...Platform.select({
            ios: { paddingTop: 0, paddingBottom: 12 },
            android: { paddingTop: 40, paddingBottom: 15 },
        }),
    },
    headerTitle: { fontSize: 18, fontWeight: '600' },
    iconButton: { padding: 8 },
    container: { padding: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#1F2937' },
    bold: { fontWeight: 'bold' },
    addressHelper: { fontSize: 12, color: '#16A34A', fontStyle: 'italic', marginTop: 2, marginBottom: 4 },
    messageText: { fontStyle: 'italic', color: '#4B5563' },
    participantCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    dependentIndent: {
        marginLeft: 20, 
        backgroundColor: '#F9FAFB',
    },
    infoText: { fontSize: 14, color: '#6B7280' },
    actionsContainer: { flexDirection: 'row', marginTop: 16, gap: 8 },

    detailsGrid: { 
        gap: 12, 
        marginTop: 8 
    },
    detailItem: { 
        flexDirection: "row", 
        alignItems: "center", 
        gap: 8, 
        flex: 1 
    },

    hostActionsContainer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 12,
        textAlign: 'center'
    },
    buttonsRow: {
        flexDirection: "row",
        gap: 12,
    },
    whatsappButton: {
        marginTop: 20,
        borderColor: "#25D366",
        borderWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 8,
    },
    whatsappButtonText: {
        color: '#25D366', // Cor do texto verde para combinar com a borda
        fontSize: 16,
        fontWeight: 'bold',
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
});