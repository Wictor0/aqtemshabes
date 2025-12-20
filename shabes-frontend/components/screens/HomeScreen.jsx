import React, { useState, useCallback, useEffect } from "react";
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
import { getMatchesForGuest, getMatchesForHost, updateMatchStatus } from "../../services/api";
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
  
  // 👇 LÓGICA DE PERMISSÃO: Verifica se é creator, host ou admin
  const hasHostAccess = user?.role === 'creator' || user?.role === 'host' || user?.role === 'admin';

  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Se tem acesso de host, começa na aba 'host' (ou guest, conforme preferencia). 
  // Se NÃO tem acesso (role='user'), forçamos começar em 'guest'.
  const [activeTab, setActiveTab] = useState(hasHostAccess ? 'host' : 'guest');

  const nextShabbat = getNextShabbatDate();

  // 👇 EFEITO DE SEGURANÇA: Se o usuário mudar (ex: login) e não for creator, força a aba Guest
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
      // Sempre busca dados de convidado
      const promises = [getMatchesForGuest(user.id)];
      
      // 👇 Só busca dados de anfitrião se tiver permissão
      if (hasHostAccess) {
          promises.push(getMatchesForHost(user.id));
      }

      const results = await Promise.all(promises);
      const guestResponse = results[0];
      const hostResponse = hasHostAccess ? results[1] : null;

      setUserMatches(guestResponse?.data?.filter(match => match.event) || []);
      
      if (hostResponse) {
          setHostMatches(hostResponse.data?.filter(match => match.event) || []);
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

  const handleUpdateMatch = async (matchId, status) => {
    try {
      await updateMatchStatus(matchId, status);
      await fetchMatches();
      toast({
        type: "success",
        title: `Pedido ${status === "accepted" ? "aceite" : "recusado"} com sucesso!`,
      });
    } catch (error) {
      console.error(`Erro ao ${status} o match:`, error);
      toast({ type: "error", title: "Ocorreu um erro. Tente novamente." });
    }
  };

  const guestCounts = {
    pending: userMatches.filter((m) => m.status === "pending").length,
    accepted: userMatches.filter((m) => m.status === "accepted").length,
  };

  const hostCounts = {
    pending: hostMatches.filter((m) => m.status === "pending").length,
    accepted: hostMatches.filter((m) => m.status === "accepted").length,
  };

  const findNextAcceptedEvent = () => {
    const acceptedGuestMatches = userMatches.filter(m => m.status === 'accepted' && m.event);
    const acceptedHostMatches = hostMatches.filter(m => m.status === 'accepted' && m.event);
    const allAcceptedMatches = [...acceptedGuestMatches, ...acceptedHostMatches];

    const today = new Date();
    const upcomingAcceptedMatches = allAcceptedMatches.filter(m => new Date(m.event.date) >= today);

    if (upcomingAcceptedMatches.length === 0) {
      return null;
    }

    upcomingAcceptedMatches.sort((a, b) => new Date(a.event.date) - new Date(b.event.date));

    return new Date(upcomingAcceptedMatches[0].event.date);
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
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={styles.shabbatCard}
            >
              <View>
                <Text style={styles.shabbatTitle}>Agenda</Text>
                <Text style={styles.shabbatDate}>
                  {formatShabbatDate(nextShabbat)}
                </Text>
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
              {/* --- BOTÕES TIPO CARD --- */}
              <View style={styles.customTabContainer}>
                
                {/* BOTÃO CONVIDADO - Sempre Visível */}
                <TouchableOpacity
                  onPress={() => setActiveTab("guest")}
                  style={[
                    styles.tabButton,
                    activeTab === "guest" ? styles.guestButtonActive : styles.buttonInactive
                  ]}
                  activeOpacity={0.9}
                >
                  <View style={styles.iconCircle}>
                    <IconGuest 
                      width={24} 
                      height={24} 
                      color="#3B82F6" 
                    />
                  </View>
                  
                  <View style={styles.tabContentContainer}>
                    <Text style={[
                      styles.tabTitle,
                      activeTab === "guest" ? styles.textActive : styles.textInactive
                    ]}>
                      Convidado
                    </Text>
                    <Text style={[
                      styles.tabStats,
                      activeTab === "guest" ? styles.textActive : styles.textInactive
                    ]}>
                      {guestCounts.pending} Pendentes / {guestCounts.accepted} Aceitos
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 👇 BOTÃO ANFITRIÃO - RENDERIZAÇÃO CONDICIONAL baseada em hasHostAccess */}
                {hasHostAccess && (
                    <TouchableOpacity
                    onPress={() => setActiveTab("host")}
                    style={[
                        styles.tabButton,
                        activeTab === "host" ? styles.hostButtonActive : styles.buttonInactive
                    ]}
                    activeOpacity={0.9}
                    >
                    <View style={styles.iconCircle}>
                        <IconHost 
                        width={24} 
                        height={24} 
                        color="#7C3AED"
                        />
                    </View>

                    <View style={styles.tabContentContainer}>
                        <Text style={[
                        styles.tabTitle,
                        activeTab === "host" ? styles.textActive : styles.textInactive
                        ]}>
                        Anfitrião
                        </Text>
                        <Text style={[
                        styles.tabStats,
                        activeTab === "host" ? styles.textActive : styles.textInactive
                        ]}>
                        {hostCounts.pending} Pendentes / {hostCounts.accepted} Aceitos
                        </Text>
                    </View>
                    </TouchableOpacity>
                )}
              </View>

              {/* LISTA DE CONTEÚDO */}
              <View style={styles.listContainer}>
                {activeTab === "guest" ? (
                  userMatches.length > 0 ? (
                    userMatches.map((match) => (
                      match.event && match.event.id && (
                        <TouchableOpacity
                          key={match.id}
                          onPress={() =>
                            navigation.navigate("EventDetail", {
                              eventId: match.event.id,
                              matchId: match.id,
                              origin: "home",
                            })
                          }
                        >
                          <MatchCard match={match} isHost={false} />
                        </TouchableOpacity>
                      )
                    ))
                  ) : (
                    <EmptyStateWithButton
                      message="Você ainda não enviou nenhum pedido de participação."
                      buttonLabel="Descobrir novos eventos"
                      onPress={() => navigation.navigate("DiscoverEvents")}
                    />
                  )
                ) : (
                  // Conteúdo da aba ANFITRIÃO (só renderiza se estiver ativa E permitida)
                  // Nota: A lógica de estado acima já impede activeTab='host' se !hasHostAccess
                  hostMatches.length > 0 ? (
                    hostMatches.map((match) => (
                      match.event && match.event.id && (
                        <TouchableOpacity
                          key={match.id}
                          onPress={() =>
                            navigation.navigate("EventDetail", {
                              eventId: match.event.id,
                              matchId: match.id,
                              origin: "home",
                            })
                          }
                        >
                          <MatchCard
                            match={match}
                            isHost={true}
                            onAccept={() => handleUpdateMatch(match.id, "accepted")}
                            onDecline={() => handleUpdateMatch(match.id, "declined")}
                          />
                        </TouchableOpacity>
                      )
                    ))
                  ) : (
                    <EmptyStateWithButton
                      message="Você ainda não recebeu nenhum pedido de participação."
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
  contentWrapper: {
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 700,
    alignSelf: 'center',
    gap: 24,
  },
  shabbatCard: {
    padding: 20,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shabbatTitle: { fontSize: 18, fontWeight: "600", color: "white" },
  shabbatDate: { color: "rgba(255,255,255,0.8)" },
  nextEventDate: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  
  // --- ESTILOS DOS BOTÕES ---
  customTabContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    padding: 16,
    height: 150, 
    borderRadius: 16,
    borderWidth: 1,
    
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  guestButtonActive: {
    backgroundColor: '#3B82F6', // Azul
    borderColor: '#3B82F6',
  },
  hostButtonActive: {
    backgroundColor: '#7C3AED', // Roxo
    borderColor: '#7C3AED',
  },
  buttonInactive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },

  tabContentContainer: {
    alignItems: 'flex-start',
    gap: 4,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  tabStats: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.9,
  },
  
  textActive: {
    color: '#FFFFFF',
  },
  textInactive: {
    color: '#1F2937', 
  },

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4B5563",
    textAlign: "center",
    marginTop: 16,
  },
  ctaButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  ctaButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  listContainer: {}
});