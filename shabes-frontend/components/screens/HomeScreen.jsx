import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { getMatchesForGuest, getMatchesForHost, updateMatchStatus, getEventsByHost } from "../../services/api";
import { toast } from "../../hooks/use-toast";
import MatchCard from "../cards/MatchCard";
import Icon from "../ui/Icon";
import LoadingSpinner from "../ui/LoadingSpinner";
import { formatShabbatDate } from "../../lib/utils";

import CalendarIcon from "../../assets/icons/CalendarIcon";
import IconGuest from "../../assets/icons/IconGuest";
import IconHost from "../../assets/icons/IconHost";

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

const getNextShabbatDate = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const FRIDAY = 5;
  const daysUntilFriday = (FRIDAY - currentDay + 7) % 7;
  const nextShabbatDate = new Date();
  nextShabbatDate.setDate(today.getDate() + daysUntilFriday);
  return nextShabbatDate;
};

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  
  const hasHostAccess = user?.role === 'creator' || user?.role === 'host' || user?.role === 'admin';

  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState(hasHostAccess ? 'host' : 'guest');

  const nextShabbat = getNextShabbatDate();

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
      const promises = [getMatchesForGuest(user.id)];
      if (hasHostAccess) {
          promises.push(getMatchesForHost(user.id));
          promises.push(getEventsByHost(user.id));
      }

      const results = await Promise.all(promises);
      const guestResponse = results[0];
      const hostMatchesRes = hasHostAccess ? results[1] : null;
      const hostEventsRes = hasHostAccess ? results[2] : null;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Processamento Convidado
      const filteredGuestMatches = (guestResponse?.data || []).filter(match => {
        if (!match.event || !match.event.date) return false;
        return new Date(match.event.date) >= today;
      });
      setUserMatches(filteredGuestMatches);
      
      // 2. Processamento Anfitrião
      if (hasHostAccess && hostEventsRes) {
          const allEvents = hostEventsRes.data || [];
          const allMatches = hostMatchesRes?.data || [];

          const myCreatedEvents = allEvents.filter(event => {
            if (!event.host_id || !user.id) return false;
            const isOwner = String(event.host_id) === String(user.id);
            const isUpcoming = new Date(event.date) >= today;
            return isOwner && isUpcoming;
          });

          const hostDisplayItems = myCreatedEvents.map(event => {
              const eventMatches = allMatches.filter(m => String(m.event_id) === String(event.id));
              const pendingCount = eventMatches.filter(m => m.status === 'pending').length;
              
              return {
                  id: `event-group-${event.id}`,
                  event: event,
                  status: pendingCount > 0 ? "pending" : "accepted", 
                  isEventContainer: true,
                  pendingCount,
                  totalMatches: eventMatches.length,
                  hostPhoto: user?.avatar_url,
                  ...(eventMatches[0] || { user: null }) 
              };
          });

          setHostMatches(hostDisplayItems);
      } else {
          setHostMatches([]);
      }

    } catch (error) {
      console.error("Erro ao buscar matches na HomeScreen:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, hasHostAccess]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchMatches();
    }, [fetchMatches])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  // 👇 LÓGICA DE ORDENAÇÃO ATUALIZADA 👇
  const sortMatches = (matches) => {
    return [...matches].sort((a, b) => {
        // Verifica se é pendente (vale para match individual ou container de evento)
        const aIsPending = a.status === 'pending' || (a.pendingCount && a.pendingCount > 0);
        const bIsPending = b.status === 'pending' || (b.pendingCount && b.pendingCount > 0);

        // Se 'a' é pendente e 'b' não é, 'a' sobe (-1)
        if (aIsPending && !bIsPending) return -1;
        // Se 'b' é pendente e 'a' não é, 'b' sobe (1)
        if (!aIsPending && bIsPending) return 1;

        // Se ambos são iguais no status, ordena pela data (mais próxima primeiro)
        const dateA = new Date(a.event?.date || 0);
        const dateB = new Date(b.event?.date || 0);
        return dateA - dateB;
    });
  };

  const sortedUserMatches = useMemo(() => sortMatches(userMatches), [userMatches]);
  const sortedHostMatches = useMemo(() => sortMatches(hostMatches), [hostMatches]);

  const guestCounts = {
    pending: userMatches.filter((m) => m.status === "pending").length,
    accepted: userMatches.filter((m) => m.status === "accepted").length,
  };

  const hostCounts = {
    pending: hostMatches.filter((m) => m.pendingCount > 0).length,
    totalEvents: hostMatches.length,
  };

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.contentWrapper}>
          <TouchableOpacity onPress={() => navigation.navigate("Agenda")}>
            <LinearGradient colors={["#4F46E5", "#7C3AED"]} style={styles.shabbatCard}>
              <View>
                <Text style={styles.shabbatTitle}>Agenda</Text>
                <Text style={styles.shabbatDate}>{formatShabbatDate(nextShabbat)}</Text>
                {nextEventDate && (
                  <Text style={styles.nextEventDate}>
                    Próximo evento: {formatShabbatDate(nextEventDate)}
                  </Text>
                )}
              </View>
              <CalendarIcon size={32} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>

          {loading && !refreshing ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
            </View>
          ) : (
            <View>
              <View style={styles.customTabContainer}>
                <TouchableOpacity
                  onPress={() => setActiveTab("guest")}
                  style={[styles.tabButton, activeTab === "guest" ? styles.guestButtonActive : styles.buttonInactive]}
                  activeOpacity={0.9}
                >
                  <View style={styles.iconCircle}>
                    <IconGuest width={24} height={24} color="#3B82F6" />
                  </View>
                  <View style={styles.tabContentContainer}>
                    <Text style={[styles.tabTitle, activeTab === "guest" ? styles.textActive : styles.textInactive]}>Convidado</Text>
                    <Text style={[styles.tabStats, activeTab === "guest" ? styles.textActive : styles.textInactive]}>
                      {guestCounts.pending} Pendentes / {guestCounts.accepted} Aceitos
                    </Text>
                  </View>
                </TouchableOpacity>

                {hasHostAccess && (
                    <TouchableOpacity
                      onPress={() => setActiveTab("host")}
                      style={[styles.tabButton, activeTab === "host" ? styles.hostButtonActive : styles.buttonInactive]}
                      activeOpacity={0.9}
                    >
                    <View style={styles.iconCircle}>
                        <IconHost width={24} height={24} color="#7C3AED" />
                    </View>
                    <View style={styles.tabContentContainer}>
                        <Text style={[styles.tabTitle, activeTab === "host" ? styles.textActive : styles.textInactive]}>Anfitrião</Text>
                        <Text style={[styles.tabStats, activeTab === "host" ? styles.textActive : styles.textInactive]}>
                           {hostCounts.totalEvents} Eventos / {hostCounts.pending} com Pedidos
                        </Text>
                    </View>
                    </TouchableOpacity>
                )}
              </View>

              <View style={styles.listContainer}>
                {activeTab === "guest" ? (
                  sortedUserMatches.length > 0 ? (
                    sortedUserMatches.map((match) => (
                      match.event?.id && (
                        <TouchableOpacity
                          key={match.id}
                          onPress={() => navigation.navigate("EventDetail", { eventId: match.event.id, matchId: match.id, origin: "home" })}
                        >
                          <MatchCard match={match} isHost={false} />
                        </TouchableOpacity>
                      )
                    ))
                  ) : (
                    <EmptyStateWithButton
                      message="Você ainda não enviou nenhum pedido para eventos futuros."
                      buttonLabel="Descobrir novos eventos"
                      onPress={() => navigation.navigate("DiscoverEvents")}
                    />
                  )
                ) : (
                  sortedHostMatches.length > 0 ? (
                    sortedHostMatches.map((item) => (
                      item.event?.id && (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => navigation.navigate("EventDetail", { 
                              eventId: item.event.id, 
                              origin: "home",
                              hasRequests: item.totalMatches > 0 
                          })}
                        >
                          <MatchCard
                            match={item}
                            isHost={true}
                            showBadge={item.pendingCount > 0}
                            badgeCount={item.pendingCount}
                          />
                        </TouchableOpacity>
                      )
                    ))
                  ) : (
                    <EmptyStateWithButton
                      message="Você ainda não criou eventos para o futuro."
                      buttonLabel="Criar um novo evento"
                      onPress={() => navigation.navigate("CreateEvent")}
                    />
                  )
                )}
              </View>
            </View>
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
  shabbatDate: { color: "rgba(255,255,255,0.8)" },
  nextEventDate: { color: "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: '600', marginTop: 4, fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  customTabContainer: { flexDirection: 'row', gap: 12, marginBottom: 16 },
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
  emptyContainer: { alignItems: "center", justifyContent: "center", padding: 32, marginTop: 20 },
  emptyText: { fontSize: 16, fontWeight: "600", color: "#4B5563", textAlign: "center", marginTop: 16 },
  ctaButton: { backgroundColor: "#4F46E5", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12 },
  ctaButtonText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  listContainer: {}
});