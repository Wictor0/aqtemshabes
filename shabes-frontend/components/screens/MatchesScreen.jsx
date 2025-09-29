import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { Card, CardContent } from "../ui/Card";
import MatchCard from "../cards/MatchCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";
import { getMatchesForGuest, getMatchesForHost, updateMatchStatus } from "../../services/api";
import { toast } from "../../hooks/use-toast";

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

export default function MatchesScreen({ navigation }) {
  const { user } = useAuth();
  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMatches = useCallback(async () => {
    if (user?.id) {
      try {
        setLoading(true);
        const [guestResponse, hostResponse] = await Promise.all([
          getMatchesForGuest(user.id),
          getMatchesForHost(user.id)
        ]);
        setUserMatches(guestResponse.data || []);
        setHostMatches(hostResponse.data || []);
      } catch (error) {
        console.error("Erro ao buscar matches:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(fetchMatches);

  const handleUpdateMatch = async (matchId, status) => {
    try {
      await updateMatchStatus(matchId, status);
      fetchMatches();
      toast({
        type: "success",
        title: `Pedido ${status === 'accepted' ? 'aceite' : 'recusado'}!`,
      });
    } catch (error) {
      toast({ type: "error", title: "Ocorreu um erro." });
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
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meus Matches</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
          <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
          </View>
      ) : (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.contentWrapper}>
            <Tabs defaultValue="guest">
                <TabsList>
                <TabsTrigger value="guest">Como Convidado</TabsTrigger>
                <TabsTrigger value="host">Como Anfitrião</TabsTrigger>
                </TabsList>

                <TabsContent value="guest">
                <View style={styles.statsGrid}>
                    <StatCard count={guestCounts.pending} label="Pendentes" />
                    <StatCard count={guestCounts.accepted} label="Aceitos" />
                </View>
                {userMatches.length > 0 ? (
                    userMatches.map((match) => (
                        <TouchableOpacity
                        key={match.id}
                        onPress={() =>
                            navigation.navigate("EventDetail", {
                            eventId: match.event.id,
                            origin: "matches",
                            })
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
                    <StatCard count={hostCounts.accepted} label="Aceitos" />
                </View>
                {hostMatches.length > 0 ? (
                    hostMatches.map((match) => (
                        <TouchableOpacity
                        key={match.id}
                        onPress={() =>
                            navigation.navigate("EventDetail", {
                            eventId: match.event.id,
                            origin: "matches",
                            })
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
            </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
    ...Platform.select({
      ios: { paddingTop: 12, paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 15 },
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  container: { padding: 16, alignItems: "center", flexGrow: 1 },
  contentWrapper: { width: "100%", maxWidth: 700, gap: 24 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsGrid: { flexDirection: "row", justifyContent: "space-around", gap: 12, marginBottom: 16 },
  statCard: { flex: 1 },
  statCardContent: { paddingTop: 16, alignItems: "center", gap: 8, paddingBottom: 16 },
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
