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
import { Badge } from "../ui/Badge";
import MatchCard from "../cards/MatchCard";
import Icon from "../ui/Icon";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/Tabs";
import { Card, CardContent } from "../ui/Card";
import LoadingSpinner from "../ui/LoadingSpinner";
import { mockEventMatches } from "../../lib/mock-data"; 

// Mock data original (mantido para a notificação)
const mockMatches = [ { id: 1, status: "PENDING", event: { title: "Shabat Familiar em Jardins", host: { name: "Família Cohen" }, date: "2025-08-01T19:00:00Z" }, guest: { name: "Ana" }, createdAt: "2025-07-31T11:00:00Z" } ];

// Funções de formatação de data
const formatShabbatDate = (date) => new Date(date).toLocaleDateString("pt-BR", { weekday: "long", month: "long", day: "numeric" });
const getNextShabbat = () => new Date();

// Componente StatCard do segundo arquivo
const StatCard = ({ count, label, iconName }) => (
  <Card style={styles.statCard}>
    <CardContent style={styles.statCardContent}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </CardContent>
  </Card>
);

export default function HomeScreen({ navigation }) {
  // Hooks de estado e contexto combinados
  const { signOut, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [userMatches, setUserMatches] = useState([]);
  const [hostMatches, setHostMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Variáveis da HomeScreen original
  const nextShabbat = getNextShabbat();
  const pendingMatches = mockMatches.filter((m) => m.status === "PENDING");

  // useEffect da HomeScreen original
  useEffect(() => {
    getMyProfile()
      .then(response => setProfile(response.data))
      .catch(error => console.error("Erro ao buscar perfil na HomeScreen:", error));
  }, []);

  // useEffect do segundo arquivo (agora na HomeScreen)
  useEffect(() => {
    // Simula a busca de dados
    const testUserId = "guilherme-felberg";

    // Matches onde o utilizador é o convidado
    setUserMatches(mockEventMatches.filter((m) => m.guest.id === testUserId));
    // Matches onde o utilizador é o anfitrião (lógica simplificada)
    setHostMatches(
      mockEventMatches.filter((m) => m.event.host.id === testUserId)
    );

    setLoading(false);
  }, [user]);

  // Cálculos de contagem do segundo arquivo
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
           <TouchableOpacity onPress={() => navigation.navigate('Agenda')}>
            <LinearGradient colors={["#4F46E5", "#7C3AED"]} style={styles.shabbatCard}>
              <View>
                <Text style={styles.shabbatTitle}>Próximo Shabat</Text>
                <Text style={styles.shabbatDate}>{formatShabbatDate(nextShabbat)}</Text>
              </View>
              <Icon name="calendar-month-outline" size={32} color="rgba(255,255,255,0.5)" />
            </LinearGradient>
          </TouchableOpacity>

          {/* Conteúdo de abas integrado */}
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

              {/* Conteúdo da Aba "Convidado" */}
              <TabsContent value="guest">
                <View style={styles.statsGrid}>
                  <StatCard count={guestCounts.pending} label="Pendentes" />
                  <StatCard count={guestCounts.accepted} label="Aceitos" />
                </View>
                {userMatches.map((match) => (
                  <TouchableOpacity
                    key={match.id}
                    onPress={() => navigation.navigate("MatchDetail", { matchId: match.id })}
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
                    onPress={() => navigation.navigate("MatchDetail", { matchId: match.id })}
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

// Estilos combinados
const styles = StyleSheet.create({
  // Estilos originais da HomeScreen
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  scrollContainer: { paddingVertical: 16 },
  contentWrapper: { paddingHorizontal: 16, width: "100%", gap: 24 },
  shabbatCard: { padding: 20, borderRadius: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shabbatTitle: { fontSize: 18, fontWeight: "600", color: "white" },
  shabbatDate: { color: "rgba(255,255,255,0.8)" },
  section: { gap: 16, width: "100%" },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#1F2937" },

  // Estilos adicionados do segundo arquivo
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 12,
    marginBottom: 16,
  },
  statCard: { flex: 1 },
  statCardContent: { paddingTop: 16, paddingHorizontal: 8, paddingBottom: 16, alignItems: "center", gap: 4 },
  statCount: { fontSize: 24, fontWeight: "bold" },
  statLabel: { fontSize: 12, color: "#6B7280" },
});