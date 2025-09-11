import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
// MODIFICAÇÃO: Importa as duas funções explícitas
import { getMatchesForGuest, getMatchesForHost, updateMatchStatus } from "../../services/api"; 
import { toast } from "../../hooks/use-toast";
import { Card, CardContent } from "../ui/Card";
import MatchCard from "../cards/MatchCard";
import Icon from "../ui/Icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import LoadingSpinner from "../ui/LoadingSpinner";
import { formatShabbatDate } from "../../lib/utils";

const StatCard = ({ count, label }) => (
  <Card style={styles.statCard}>
    <CardContent style={styles.statCardContent}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </CardContent>
  </Card>
);

const EmptyListComponent = ({ message }) => (
  <View style={styles.emptyContainer}>
    <Icon name="inbox-outline" size={48} color="#9CA3AF" />
    <Text style={styles.emptyText}>{message}</Text>
  </View>
);

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const nextShabbat = new Date();

  // Esta função agora faz as duas chamadas separadas
  const fetchMatches = useCallback(async () => {
    if (user?.id) {
      try {
        setLoading(true);
        // Fazemos as duas chamadas em paralelo para mais eficiência
        const [guestResponse, hostResponse] = await Promise.all([
          getMatchesForGuest(user.id),
          getMatchesForHost(user.id)
        ]);

        setUserMatches(guestResponse.data || []);
        setHostMatches(hostResponse.data || []);
      } catch (error) {
        console.error("Erro ao buscar matches na HomeScreen:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
      setUserMatches([]);
      setHostMatches([]);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchMatches();
    }, [fetchMatches])
  );

  const handleUpdateMatch = async (matchId, status) => {
    try {
      await updateMatchStatus(matchId, status);
      fetchMatches(); // Recarrega os matches para ter a informação mais recente
      toast({
        type: "success",
        title: `Pedido ${status === 'accepted' ? 'aceite' : 'recusado'} com sucesso!`,
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          <TouchableOpacity onPress={() => navigation.navigate("Agenda")}>
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={styles.shabbatCard}
            >
              <View>
                <Text style={styles.shabbatTitle}>Próximo Shabat</Text>
                <Text style={styles.shabbatDate}>
                  {formatShabbatDate(nextShabbat)}
                </Text>
              </View>
              <Icon
                name="calendar-month-outline"
                size={32}
                color="rgba(255,255,255,0.5)"
              />
            </LinearGradient>
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
            </View>
          ) : (
            <Tabs defaultValue="host">
              <TabsList>
                <TabsTrigger value="guest">Como Convidado</TabsTrigger>
                <TabsTrigger value="host">Como Anfitrião</TabsTrigger>
              </TabsList>

              <TabsContent value="guest">
                <View style={styles.statsGrid}>
                  <StatCard count={guestCounts.pending} label="Pendentes" />
                  <StatCard count={guestCounts.accepted} label="Aceites" />
                </View>
                {userMatches.length > 0 ? (
                  userMatches.map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      onPress={() =>
                        navigation.navigate("MatchDetail", { matchId: match.id })
                      }
                    >
                      <MatchCard match={match} isHost={false} />
                    </TouchableOpacity>
                  ))
                ) : (
                  <EmptyListComponent message="Você ainda não enviou nenhum pedido de participação." />
                )}
              </TabsContent>

              <TabsContent value="host">
                <View style={styles.statsGrid}>
                  <StatCard count={hostCounts.pending} label="Pendentes" />
                  <StatCard count={hostCounts.accepted} label="Aceites" />
                </View>
                {hostMatches.length > 0 ? (
                  hostMatches.map((match) => (
                    <TouchableOpacity
                      key={match.id}
                      onPress={() =>
                        navigation.navigate("MatchDetail", { matchId: match.id })
                      }
                    >
                      <MatchCard 
                        match={match} 
                        isHost={true}
                        onAccept={() => handleUpdateMatch(match.id, 'accepted')}
                        onDecline={() => handleUpdateMatch(match.id, 'declined')}
                      />
                    </TouchableOpacity>
                  ))
                ) : (
                   <EmptyListComponent message="Você ainda não recebeu nenhum pedido de participação." />
                )}
              </TabsContent>
            </Tabs>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: { paddingVertical: 16, backgroundColor: "#F9FAFB" },
  contentWrapper: {
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 700,
    gap: 24,
  },
  shabbatCard: {
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shabbatTitle: { fontSize: 18, fontWeight: "600", color: "white" },
  shabbatDate: { color: "rgba(255,255,255,0.8)" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    marginBottom: 16,
  },
  statCard: { flex: 1 },
  statCardContent: {
    paddingTop: 16,
    paddingHorizontal: 8,
    paddingBottom: 16,
    alignItems: "center",
    gap: 4,
  },
  statCount: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#6B7280" },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 16,
  },
});

