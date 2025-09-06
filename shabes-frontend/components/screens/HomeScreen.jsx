import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../../context/AuthContext";
import { getMyProfile } from "../../services/api";
import { Card, CardContent } from "../ui/Card";
import MatchCard from "../cards/MatchCard";
import Icon from "../ui/Icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import LoadingSpinner from "../ui/LoadingSpinner";
import { mockEventMatches } from "../../lib/mock-data";

// Funções de formatação de data
const formatShabbatDate = (date) =>
  new Date(date).toLocaleDateString("pt-BR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
const getNextShabbat = () => new Date();

// Componente StatCard
const StatCard = ({ count, label }) => (
  <Card style={styles.statCard}>
    <CardContent style={styles.statCardContent}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </CardContent>
  </Card>
);

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const nextShabbat = getNextShabbat();

  useEffect(() => {
    getMyProfile()
      .then((response) => setProfile(response.data))
      .catch((error) =>
        console.error("Erro ao buscar perfil na HomeScreen:", error)
      );
  }, []);

  useEffect(() => {
    // Simula a busca de dados
    const testUserId = "guilherme-felberg";

    setUserMatches(mockEventMatches.filter((m) => m.guest.id === testUserId));
    setHostMatches(
      mockEventMatches.filter((m) => m.event.host.id === testUserId)
    );

    setLoading(false);
  }, [user]);

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
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
          {/* Card "Próximo Shabat" */}
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

          {/* Conteúdo de abas */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <LoadingSpinner size="large" />
            </View>
          ) : (
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
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Estilos combinados de ambas as versões
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: { paddingVertical: 16, backgroundColor: "#F9FAFB" },
  contentWrapper: {
    paddingHorizontal: 16,
    width: "100%",
    maxWidth: 700, // Adicionado para telas maiores
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
  section: { gap: 16, width: "100%" },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#1F2937" },
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
});
