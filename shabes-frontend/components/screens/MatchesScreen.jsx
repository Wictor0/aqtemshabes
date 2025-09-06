import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { Card, CardContent } from "../ui/Card";
import MatchCard from "../cards/MatchCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import { mockEventMatches } from "../../lib/mock-data";
import Icon from "../ui/Icon";

// Componente para os cartões de estatísticas
const StatCard = ({ count, label, iconName }) => (
  <Card style={styles.statCard}>
    <CardContent style={styles.statCardContent}>
      <Icon name={iconName} size={20} color="#6B7280" />
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </CardContent>
  </Card>
);

export default function MatchesScreen({ navigation }) {
  const { user } = useAuth();
  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simula a busca de dados
    // CORREÇÃO: Usamos um ID fixo dos dados mock para garantir que os matches apareçam
    const testUserId = "guilherme-felberg";

    // Matches onde o utilizador é o convidado
    setUserMatches(mockEventMatches.filter((m) => m.guest.id === testUserId));
    // Matches onde o utilizador é o anfitrião (lógica simplificada)
    setHostMatches(
      mockEventMatches.filter((m) => m.event.host.id === testUserId)
    );

    setLoading(false);
  }, [user]); // Mantemos a dependência para que isto seja re-executado no futuro

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  const guestCounts = {
    pending: userMatches.filter((m) => m.status === "PENDING").length,
    accepted: userMatches.filter((m) => m.status === "ACCEPTED").length,
  };

  const hostCounts = {
    pending: hostMatches.filter((m) => m.status === "PENDING").length,
    accepted: hostMatches.filter((m) => m.status === "ACCEPTED").length,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
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

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentWrapper}>
          <Tabs defaultValue="guest">
            <TabsList>
              <TabsTrigger value="guest">Como Convidado</TabsTrigger>
              <TabsTrigger value="host">Como Anfitrião</TabsTrigger>
            </TabsList>

            {/* Conteúdo da Aba "Convidado" */}
            <TabsContent value="guest">
              <View style={styles.statsGrid}>
                <StatCard count={guestCounts.pending} label="Pendentes" />
                <StatCard count={guestCounts.accepted} label="Aceitos" />
              </View>
              {userMatches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  onPress={() =>
                    navigation.navigate("MatchDetail", { matchId: match.id })
                  }
                >
                  <MatchCard match={match} isHost={false} />
                </TouchableOpacity>
              ))}
            </TabsContent>

            {/* Conteúdo da Aba "Anfitrião" */}
            <TabsContent value="host">
              <View style={styles.statsGrid}>
                <StatCard count={hostCounts.pending} label="Pendentes" />
                <StatCard count={hostCounts.accepted} label="Aceitos" />
              </View>
              {hostMatches.map((match) => (
                <TouchableOpacity
                  key={match.id}
                  onPress={() =>
                    navigation.navigate("MatchDetail", { matchId: match.id })
                  }
                >
                  <MatchCard match={match} isHost={true} />
                </TouchableOpacity>
              ))}
            </TabsContent>
          </Tabs>
        </View>
      </ScrollView>
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
      default: { paddingVertical: 12 },
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  container: {
    padding: 16,
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 700,
    gap: 24,
  },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    marginBottom: 16,
  },
  statCard: { flex: 1 },
  statCardContent: { paddingTop: 0, alignItems: "center", gap: 4 },
  statCount: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#6B7280" },
});
