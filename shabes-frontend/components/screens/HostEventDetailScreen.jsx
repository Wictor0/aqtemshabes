import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Image
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

import { useAuth } from "../../context/AuthContext";
import { getEventById, getMatchesForHost } from "../../services/api";
import { toast } from "../../hooks/use-toast";
import { formatShabbatDate } from "../../lib/utils";

// Mapas de Tradução (Reutilizados)
const mealTypeLabels = {
  almoço: "Almoço",
  jantar: "Jantar",
};
const getLabel = (value, labels) => labels[value] || value;

const MatchStatusBadge = ({ status }) => {
    switch (status) {
        case 'accepted': return <Badge variant="success" style={{paddingVertical: 2}}>Confirmado</Badge>;
        case 'pending': return <Badge variant="secondary" style={{paddingVertical: 2}}>Pendente</Badge>;
        case 'declined': return <Badge variant="destructive" style={{paddingVertical: 2}}>Recusado</Badge>;
        default: return null;
    }
};

export default function HostEventDetailScreen({ route, navigation }) {
  const { eventId } = route.params;
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Busca detalhes do evento
      const { data: eventData } = await getEventById(eventId);
      setEvent(eventData);

      // 2. Busca todos os matches do anfitrião e filtra por este evento
      const { data: allMatches } = await getMatchesForHost(user.id);
      const eventMatches = allMatches.filter(m => m.event_id === eventId);
      
      // Ordena: Pendentes primeiro, depois confirmados
      eventMatches.sort((a, b) => {
          if (a.status === 'pending' && b.status !== 'pending') return -1;
          if (a.status !== 'pending' && b.status === 'pending') return 1;
          return 0;
      });

      setRequests(eventMatches);
    } catch (error) {
      console.error("Erro ao buscar dados do evento:", error);
      toast({ type: "error", title: "Não foi possível carregar os dados." });
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [fetchData])
  );

  if (loading) {
    return <SafeAreaView style={styles.loadingContainer}><LoadingSpinner size="large" /></SafeAreaView>;
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.centered}>
          <Text>Evento não encontrado.</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{marginTop: 16}}>
              <Text style={{color: '#4F46E5'}}>Voltar</Text>
          </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gerenciar Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        
        {/* --- PARTE 1: DETALHES DO EVENTO --- */}
        <Card style={{ width: "100%", marginBottom: 24 }}>
            <CardHeader>
              <CardTitle style={styles.eventTitle}>{event.title}</CardTitle>
              {/* Removido CardDescription daqui para evitar duplicação da data */}
            </CardHeader>
            <CardContent>
              <View style={styles.detailsGrid}>
                
                {/* 👇 DATA COM ÍCONE ADICIONADA AQUI 👇 */}
                <View style={styles.detailItem}>
                  <Icon name="calendar-month-outline" color="#4F46E5" size={20} />
                  <Text>{formatShabbatDate(new Date(event.date))}</Text>
                </View>
                {/* 👆 FIM DA ADIÇÃO 👆 */}

                {event.meal_type && (
                  <View style={styles.detailItem}>
                    <Icon name="silverware-fork-knife" color="#F59E0B" size={20} />
                    <Text>{getLabel(event.meal_type, mealTypeLabels)}</Text>
                  </View>
                )}
                <View style={styles.detailItem}>
                    <Icon name="map-marker-outline" color="#EC4899" size={20} />
                    <Text style={{ flex: 1 }}>{event.full_address || event.approximate_address}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Icon name="account-group-outline" color="#10B981" size={20} />
                    <Text>Capacidade: {event.max_guests} convidados</Text>
                </View>
              </View>
            </CardContent>
        </Card>

        {/* --- PARTE 2: LISTA DE PEDIDOS (GUESTS) --- */}
        <View style={styles.requestsSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Pedidos ({requests.length})</Text>
            </View>

            {requests.length > 0 ? (
                requests.map((req) => (
                    <TouchableOpacity 
                        key={req.id} 
                        style={styles.requestCard}
                        onPress={() => navigation.navigate('MatchDetail', { matchId: req.id })}
                    >
                        <View style={styles.requestHeader}>
                            <View style={styles.userInfo}>
                                <Image 
                                    source={{ uri: req.guest?.avatar_url || `https://ui-avatars.com/api/?name=${req.guest?.full_name?.replace(' ', '+')}&background=random` }} 
                                    style={styles.avatar}
                                />
                                <View>
                                    <Text style={styles.guestName}>{req.guest?.username || 'Convidado'}</Text>
                                    <Text style={styles.guestUserName}>{req.guest?.full_name || 'Nome não disponível'}</Text>
                                </View>
                            </View>
                            <MatchStatusBadge status={req.status} />
                        </View>

                        <View style={styles.requestDetails}>
                             {/* Informação de Dependentes */}
                             {req.dependent_ids && req.dependent_ids.length > 0 && (
                                <View style={styles.metaTag}>
                                    <Icon name="account-multiple-plus" size={14} color="#6B7280" />
                                    <Text style={styles.metaText}>+{req.dependent_ids.length} dep.</Text>
                                </View>
                             )}
                             
                             {/* Se tiver mensagem, mostra ícone indicativo */}
                             {req.personal_message ? (
                                 <View style={styles.metaTag}>
                                    <Icon name="message-text-outline" size={14} color="#6B7280" />
                                    <Text style={styles.metaText}>Ver mensagem</Text>
                                 </View>
                             ) : null}
                        </View>
                    </TouchableOpacity>
                ))
            ) : (
                <View style={styles.emptyState}>
                    <Icon name="account-off-outline" size={48} color="#D1D5DB" />
                    <Text style={styles.emptyText}>Nenhum pedido recebido ainda.</Text>
                </View>
            )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB",
    backgroundColor: "white", ...Platform.select({
      ios: { paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 12 },
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  
  container: { padding: 16 },
  eventTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 4 },
  detailsGrid: { gap: 12, marginTop: 8 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  
  requestsSection: { marginTop: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
  
  requestCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
  },
  guestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  guestUserName: { // Corrigido nome da classe para camelCase e menor destaque
    fontSize: 12,
    color: '#6B7280',
  },
  requestDetails: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
    marginLeft: 52, // Alinha com o texto do nome
  },
  metaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500'
  },
  
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyText: {
    marginTop: 12,
    color: '#9CA3AF',
    fontSize: 16,
  }
});