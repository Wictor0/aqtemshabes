import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage"; 

import { useAuth } from "../../context/AuthContext";
import { getMatchesForGuest, getMatchesForHost, updateMatchStatus, getEventsByHost } from "../../services/api";
import { supabase } from "../../services/supabase"; 
import { toast } from "../../hooks/use-toast";
import MatchCard from "../cards/MatchCard";
import Icon from "../ui/Icon";
import LoadingSpinner from "../ui/LoadingSpinner";
import { formatShabbatDate } from "../../lib/utils";

import CalendarIcon from "../../assets/icons/CalendarIcon";
import IconGuest from "../../assets/icons/IconGuest";

const EmptyStateWithButton = ({ message, buttonLabel, onPress }) => (
  <View style={{ alignItems: "center", gap: 12 }}>
    <EmptyListComponent message={message} />
    <TouchableOpacity style={styles.ctaButton} onPress={onPress}>
      <Text style={styles.ctaButtonText}>{buttonLabel}</Text>
    </TouchableOpacity>
  </View>
);

const EmptyListComponent = ({ message }) => (
  <View style={styles.emptyContainer}>
    <Icon name="inbox-outline" size={48} color="#9CA3AF" />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  
  const hasHostAccess = user?.role === 'creator' || user?.role === 'host' || user?.role === 'admin';

  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState(hasHostAccess ? 'host' : 'guest');
  const [hiddenMatchIds, setHiddenMatchIds] = useState([]);
  const [filterPriority, setFilterPriority] = useState('all'); 

  useEffect(() => {
    if (!hasHostAccess) {
        setActiveTab('guest');
    }
  }, [hasHostAccess]);

  const fetchMatches = useCallback(async () => {
    if (!user?.id) {
      setUserMatches([]);
      setHostMatches([]);
      setLoading(false);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(`hidden_matches_${user.id}`);
      const hiddenIds = stored ? JSON.parse(stored) : [];
      setHiddenMatchIds(hiddenIds);

      // 👇 BUSCA DIRETA PARA GARANTIR retry_count E retry_message 👇
      // Buscamos matches do convidado
      const { data: guestMatchesRaw, error: guestError } = await supabase
        .from('matches')
        .select('*, event:events(*)')
        .eq('guest_id', user.id);

      // Buscamos dados do anfitrião (se aplicável)
      let hostDisplayItems = [];
      if (hasHostAccess) {
        // Trazemos os eventos e os pedidos vinculados a eles
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('host_id', user.id);
        
        const { data: allHostMatches } = await supabase
          .from('matches')
          .select('*, guest:profiles(*)')
          .in('event_id', (events || []).map(e => e.id));

        const today = new Date();
        today.setHours(0,0,0,0);

        hostDisplayItems = (events || [])
          .filter(event => new Date(event.date) >= today)
          .map(event => {
            const eventMatches = (allHostMatches || []).filter(m => m.event_id === event.id);
            const pendingCount = eventMatches.filter(m => m.status === 'pending').length;
            const acceptedCount = eventMatches.filter(m => m.status === 'accepted').length;
            const declinedCount = eventMatches.filter(m => m.status === 'declined').length;
            
            // Verifica se algum pedido nesse evento é uma reconsideração (para sinalizar no container)
            const hasAppeal = eventMatches.some(m => m.retry_count >= 1);

            return {
                id: `event-group-${event.id}`,
                event: event,
                status: pendingCount > 0 ? "pending" : (acceptedCount > 0 ? "accepted" : "declined"), 
                isEventContainer: true,
                pendingCount,
                acceptedCount,
                declinedCount,
                retry_count: hasAppeal ? 1 : 0, // Indica se há apelos para o anfitrião ver
                totalMatches: eventMatches.length,
                hostPhoto: user?.avatar_url,
                ...(eventMatches[0] || { user: null }) 
            };
        });
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const filteredGuestMatches = (guestMatchesRaw || []).filter(match => {
        if (!match.event || !match.event.date) return false;
        const isFuture = new Date(match.event.date) >= today;
        const isNotHidden = !hiddenIds.includes(match.id);
        return isFuture && isNotHidden;
      });

      setUserMatches(filteredGuestMatches);
      setHostMatches(hostDisplayItems);

    } catch (error) {
      console.error("Erro HomeScreen:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, hasHostAccess]);

  useFocusEffect(useCallback(() => { fetchMatches(); }, [fetchMatches]));

  const handleRetryRequest = async (matchId, newMessage) => {
    try {
      const currentMatch = userMatches.find(m => m.id === matchId);
      
      if (currentMatch && Number(currentMatch.retry_count || 0) >= 1) {
        Alert.alert("Aviso", "Você já enviou um re-pedido para este evento.");
        return;
      }

      const newCount = Number(currentMatch?.retry_count || 0) + 1;

      const { error } = await supabase
        .from('matches')
        .update({ 
          status: 'pending', 
          retry_message: newMessage,
          retry_count: newCount,
          updated_at: new Date().toISOString() 
        })
        .eq('id', matchId);

      if (error) throw error;

      toast({ 
        type: "success", 
        title: "Re-pedido enviado!", 
        description: "O anfitrião recebeu sua nova mensagem." 
      });
      
      fetchMatches(); 
    } catch (error) {
      console.error("Erro ao reenviar:", error);
      toast({ type: "error", title: "Erro ao enviar", description: "Tente novamente." });
    }
  };

  const handleRemoveDeclinedMatch = (matchId) => {
    Alert.alert(
      "Ocultar Pedido",
      "Deseja remover este pedido recusado da sua tela inicial?",
      [
        { text: "Manter", style: "cancel" },
        { 
          text: "Remover", 
          style: "destructive", 
          onPress: async () => {
            try {
              const newHiddenList = [...hiddenMatchIds, matchId];
              await AsyncStorage.setItem(`hidden_matches_${user.id}`, JSON.stringify(newHiddenList));
              setHiddenMatchIds(newHiddenList);
              fetchMatches();
            } catch (error) {
              toast({ type: "error", title: "Erro ao ocultar card" });
            }
          }
        }
      ]
    );
  };

  const sortMatches = (matches) => {
    return [...matches].sort((a, b) => {
        if (filterPriority !== 'all') {
            const aIsPriority = a.status === filterPriority || (filterPriority === 'pending' && a.pendingCount > 0);
            const bIsPriority = b.status === filterPriority || (filterPriority === 'pending' && b.pendingCount > 0);
            if (aIsPriority && !bIsPriority) return -1;
            if (!aIsPriority && bIsPriority) return 1;
        } else {
            const aIsPending = a.status === 'pending' || (a.pendingCount && a.pendingCount > 0);
            const bIsPending = b.status === 'pending' || (b.pendingCount && b.pendingCount > 0);
            if (aIsPending && !bIsPending) return -1;
            if (!aIsPending && bIsPending) return 1;
        }
        return new Date(a.event?.date || 0) - new Date(b.event?.date || 0);
    });
  };

  const sortedUserMatches = useMemo(() => sortMatches(userMatches), [userMatches, filterPriority]);
  const sortedHostMatches = useMemo(() => sortMatches(hostMatches), [hostMatches, filterPriority]);

  const findNextAcceptedEvent = () => {
    const acceptedGuestMatches = userMatches.filter(m => m.status === 'accepted' && m.event);
    const hostEvents = hostMatches.map(m => m.event);
    const allEvents = [...acceptedGuestMatches.map(m => m.event), ...hostEvents];
    const today = new Date();
    today.setHours(0,0,0,0);
    const upcoming = allEvents.filter(e => e && new Date(e.date) >= today);
    if (upcoming.length === 0) return null;
    upcoming.sort((a, b) => new Date(a.date) - new Date(b.date));
    return new Date(upcoming[0].date);
  };

  const nextEventDate = findNextAcceptedEvent();

  const renderFilterPills = () => (
    <View style={styles.pillsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsContainer}>
            <TouchableOpacity style={[styles.pill, filterPriority === 'all' && styles.pillActiveAll]} onPress={() => setFilterPriority('all')}><Text style={[styles.pillText, filterPriority === 'all' && styles.pillTextActive]}>Todos</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, filterPriority === 'pending' && styles.pillActivePending]} onPress={() => setFilterPriority('pending')}><View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} /><Text style={[styles.pillText, filterPriority === 'pending' && styles.pillTextActive]}>Pendentes</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, filterPriority === 'accepted' && styles.pillActiveAccepted]} onPress={() => setFilterPriority('accepted')}><View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} /><Text style={[styles.pillText, filterPriority === 'accepted' && styles.pillTextActive]}>Aceitos</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.pill, filterPriority === 'declined' && styles.pillActiveDeclined]} onPress={() => setFilterPriority('declined')}><View style={[styles.statusDot, { backgroundColor: '#EF4444' }]} /><Text style={[styles.pillText, filterPriority === 'declined' && styles.pillTextActive]}>Recusados</Text></TouchableOpacity>
        </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchMatches} />}
        keyboardDismissMode="on-drag"
      >
        <View style={styles.contentWrapper}>
          <TouchableOpacity onPress={() => navigation.navigate("Agenda")}>
            <LinearGradient colors={["#4F46E5", "#7C3AED"]} style={styles.shabbatCard}>
              <View>
                <Text style={styles.shabbatTitle}>Próximo Evento</Text>
                {nextEventDate && <Text style={styles.nextEventDate}>{formatShabbatDate(nextEventDate)}</Text>}
              </View>
              <CalendarIcon size={32} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>

          {!loading || refreshing ? (
            <View>
              <View style={styles.customTabContainer}>
                <TouchableOpacity
                  onPress={() => { setActiveTab("guest"); setFilterPriority('all'); }}
                  style={[styles.tabButton, activeTab === "guest" ? styles.guestButtonActive : styles.buttonInactive]}
                >
                  <View style={styles.iconCircle}><IconGuest width={24} height={24} color="#3B82F6" /></View>
                  <View style={styles.tabContentContainer}>
                    <Text style={[styles.tabTitle, activeTab === "guest" ? styles.textActive : styles.textInactive]}>Convidado</Text>
                    <Text style={[styles.tabStats, activeTab === "guest" ? styles.textActive : styles.textInactive]}>
                      {userMatches.filter(m => m.status === "pending").length} Pendentes / {userMatches.filter(m => m.status === "accepted").length} Aceitos
                    </Text>
                  </View>
                </TouchableOpacity>

                {hasHostAccess && (
                  <TouchableOpacity
                    onPress={() => { setActiveTab("host"); setFilterPriority('all'); }}
                    style={[styles.tabButton, activeTab === "host" ? styles.hostButtonActive : styles.buttonInactive]}
                  >
                    <View style={styles.iconCircle}><Icon name="home-account" size={30} color="#7C3AED" /></View>
                    <View style={styles.tabContentContainer}>
                      <Text style={[styles.tabTitle, activeTab === "host" ? styles.textActive : styles.textInactive]}>Anfitrião</Text>
                      <Text style={[styles.tabStats, activeTab === "host" ? styles.textActive : styles.textInactive]}>
                        {hostMatches.length} Eventos / {hostMatches.filter(m => m.pendingCount > 0).length} com Pedidos
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {renderFilterPills()}

              <View style={styles.listContainer}>
                {(activeTab === "guest" ? sortedUserMatches : sortedHostMatches).map((item) => (
                  <View key={item.id} style={styles.cardWrapper}>
                    <TouchableOpacity
                      onPress={() => navigation.navigate("EventDetail", { 
                        eventId: item.event.id, 
                        matchId: activeTab === 'guest' ? item.id : null,
                        origin: "home" 
                      })}
                      style={{ flex: 1 }}
                    >
                      <MatchCard 
                        match={item} 
                        isHost={activeTab === 'host'} 
                        onRetry={handleRetryRequest} 
                      />
                    </TouchableOpacity>

                    {activeTab === 'guest' && item.status === 'declined' && (
                      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveDeclinedMatch(item.id)}>
                        <Icon name="close" size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
                {(activeTab === "guest" ? sortedUserMatches : sortedHostMatches).length === 0 && (
                  <EmptyStateWithButton 
                    message={activeTab === "guest" ? "Nenhum pedido enviado." : "Nenhum evento criado."} 
                    buttonLabel={activeTab === "guest" ? "Descobrir eventos" : "Criar evento"}
                    onPress={() => navigation.navigate(activeTab === "guest" ? "DiscoverEvents" : "CreateEvent")}
                  />
                )}
              </View>
            </View>
          ) : (
            <View style={styles.loadingContainer}><LoadingSpinner size="large" /></View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: { paddingVertical: 16, backgroundColor: "#F9FAFB", flexGrow: 1 },
  contentWrapper: { paddingHorizontal: 16, width: "100%", maxWidth: 700, alignSelf: 'center', gap: 24 },
  shabbatCard: { padding: 20, borderRadius: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shabbatTitle: { fontSize: 18, fontWeight: "600", color: "white" },
  nextEventDate: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: '600', marginTop: 4, fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  customTabContainer: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  tabButton: { flex: 1, padding: 16, height: 150, borderRadius: 16, borderWidth: 1, flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-start', elevation: 2 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  guestButtonActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  hostButtonActive: { backgroundColor: '#7C3AED', borderColor: '#7C3AED' },
  buttonInactive: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  tabContentContainer: { alignItems: 'flex-start', gap: 4 },
  tabTitle: { fontSize: 16, fontWeight: "700" },
  tabStats: { fontSize: 12, fontWeight: "500", opacity: 0.9 },
  textActive: { color: '#FFFFFF' },
  textInactive: { color: '#1F2937' },
  pillsWrapper: { marginBottom: 16, marginTop: 8 },
  pillsContainer: { gap: 8, paddingRight: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: 'white' },
  pillText: { fontSize: 13, fontWeight: '600', color: '#4B5563' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  pillActiveAll: { backgroundColor: '#111827', borderColor: '#111827' },
  pillActivePending: { backgroundColor: '#F59E0B', borderColor: '#F59E0B' },
  pillActiveAccepted: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  pillActiveDeclined: { backgroundColor: '#EF4444', borderColor: '#EF4444' },
  pillTextActive: { color: 'white' },
  emptyContainer: { alignItems: "center", justifyContent: "center", padding: 32, marginTop: 20 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#4B5563", textAlign: "center", marginTop: 16 },
  ctaButton: { backgroundColor: "#4F46E5", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  ctaButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  cardWrapper: { position: 'relative', marginBottom: 12 },
  removeButton: { position: 'absolute', top: 10, right: 10, backgroundColor: '#F3F4F6', borderRadius: 15, width: 28, height: 28, justifyContent: 'center', alignItems: 'center', zIndex: 99, elevation: 4 }
});