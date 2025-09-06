import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Badge } from "../ui/Badge";
import LoadingSpinner from "../ui/LoadingSpinner";
import { mockEventMatches, MatchStatus } from "../../lib/mock-data";
import { toast } from "../../hooks/use-toast";
import Icon from "../ui/Icon"; // 1. Importe o componente de Ícone

export default function MatchDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const matchData = mockEventMatches.find((m) => m.id === matchId);
    setMatch(matchData);
    setLoading(false);
  }, [matchId]);

  const handleMatchAction = (action) => {
    let newStatus = match.status;
    if (action === "accept") newStatus = MatchStatus.ACCEPTED;
    if (action === "decline") newStatus = MatchStatus.DECLINED;

    setMatch((prev) => ({ ...prev, status: newStatus }));
    toast({
      type: "success",
      title: `Match ${action === "accept" ? "aceite" : "recusado"}!`,
    });
  };

  const handleWhatsAppChat = () => {
    Linking.openURL("https://wa.me/5511999999999"); // Número de exemplo
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  if (!match) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Match não encontrado.</Text>
        <Button onPress={() => navigation.goBack()}>Voltar</Button>
      </SafeAreaView>
    );
  }

  const isHost = user?.id === match.event?.host.id;
  const otherUser = isHost ? match.guest : match.event?.host;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          {/* 2. Ícone de "voltar" atualizado */}
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Match</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Match Score */}
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          style={styles.scoreCard}
        >
          <View>
            <Text style={styles.scoreTitle}>Compatibilidade</Text>
            <Text style={styles.scoreSubtitle}>Baseada em preferências</Text>
          </View>
          <Text style={styles.scorePercentage}>
            {(match.matchScore * 100).toFixed(0)}%
          </Text>
        </LinearGradient>

        {/* Event Details */}
        <Card style={{ width: "100%" }}>
          <CardHeader>
            <CardTitle>Evento: {match.event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.infoText}>
              Anfitrião: {match.event.host.name}
            </Text>
            <Text style={styles.infoText}>
              Data: {new Date(match.event.date).toLocaleDateString("pt-BR")}
            </Text>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card style={{ width: "100%" }}>
          <CardHeader>
            <CardTitle>
              {isHost ? "Convidado" : "Anfitrião"}: {otherUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.infoText}>Email: {otherUser.email}</Text>
          </CardContent>
        </Card>

        {/* Actions for Host */}
        {isHost && match.status === MatchStatus.PENDING && (
          <Card style={{ width: "100%" }}>
            <CardHeader>
              <CardTitle>Ações do Anfitrião</CardTitle>
            </CardHeader>
            <CardContent style={styles.actionsContainer}>
              <Button
                onPress={() => handleMatchAction("accept")}
                style={{ flex: 1, backgroundColor: "#22C55E" }}
              >
                Aceitar
              </Button>
              <Button
                onPress={() => handleMatchAction("decline")}
                variant="destructive"
                style={{ flex: 1 }}
              >
                Recusar
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Confirmed/Declined Status */}
        {match.status === MatchStatus.ACCEPTED && (
          <Card style={{ width: "100%", backgroundColor: "#D1FAE5" }}>
            <CardContent style={styles.statusContent}>
              <Text style={styles.statusText}>Participação Confirmada!</Text>
              <Button onPress={handleWhatsAppChat}>
                Conversar no WhatsApp
              </Button>
              <Button
                variant="outline"
                onPress={() =>
                  navigation.navigate("Feedback", { eventId: match.event.id })
                }
              >
                Avaliar Experiência
              </Button>
            </CardContent>
          </Card>
        )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  container: { padding: 16, gap: 24 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  scoreCard: {
    padding: 20,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  scoreTitle: { fontSize: 18, fontWeight: "600", color: "white" },
  scoreSubtitle: { color: "rgba(255,255,255,0.8)" },
  scorePercentage: { fontSize: 32, fontWeight: "bold", color: "white" },
  infoText: { fontSize: 16, marginBottom: 4 },
  actionsContainer: { flexDirection: "row", gap: 12 },
  statusContent: { paddingTop: 16, alignItems: "center", gap: 12 },
  statusText: { fontSize: 18, fontWeight: "bold", color: "#065F46" },
});
