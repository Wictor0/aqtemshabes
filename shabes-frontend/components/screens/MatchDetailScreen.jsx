import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import LoadingSpinner from "../ui/LoadingSpinner";
import { toast } from "../../hooks/use-toast";
import Icon from "../ui/Icon";
// MODIFICAÇÃO: Importa as funções reais da API
import { getMatchById, updateMatchStatus } from "../../services/api";

const MatchStatus = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  DECLINED: "declined",
};

export default function MatchDetailScreen({ route, navigation }) {
  const { user } = useAuth();
  const { matchId } = route.params;
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);

  // MODIFICAÇÃO: Lógica de busca de dados foi reestruturada para usar a API
  useFocusEffect(
    useCallback(() => {
      const fetchMatchDetails = async () => {
        try {
          setLoading(true);
          const response = await getMatchById(matchId);
          setMatch(response.data);
        } catch (error) {
          console.error("Erro ao buscar detalhes do match:", error);
          toast({ type: "error", title: "Não foi possível carregar os detalhes." });
          navigation.goBack();
        } finally {
          setLoading(false);
        }
      };

      fetchMatchDetails();
    }, [matchId, navigation])
  );

  // MODIFICAÇÃO: Lógica para aceitar/recusar, agora ligada à API
  const handleMatchAction = async (action) => {
    try {
      const newStatus = action === "accept" ? "accepted" : "declined";
      await updateMatchStatus(match.id, newStatus);
      setMatch((prev) => ({ ...prev, status: newStatus }));
      toast({
        type: "success",
        title: `Pedido ${action === "accept" ? "aceite" : "recusado"}!`,
      });
    } catch (error) {
      console.error("Erro ao atualizar o match:", error);
      toast({ type: "error", title: "Ocorreu um erro ao processar a sua ação." });
    }
  };

  const handleWhatsAppChat = () => {
    const isUserHost = user?.id === match.event?.host?.id;
    const otherUser = isUserHost ? match.guest : match.event?.host;
    
    if (otherUser?.phone) {
        const phoneNumber = otherUser.phone.replace(/\D/g, '');
        const whatsappUrl = `https://wa.me/55${phoneNumber}`; // Assumindo código do Brasil
        Linking.openURL(whatsappUrl).catch(() => {
            toast({ type: "error", title: "Não foi possível abrir o WhatsApp." });
        });
    } else {
        toast({ type: "error", title: "Telefone não disponível." });
    }
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

  const isHost = user?.id === match.event?.host?.id;
  const otherUser = isHost ? match.guest : match.event?.host;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Match</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Event Details */}
        <Card style={{ width: "100%" }}>
          <CardHeader>
            <CardTitle>Evento: {match.event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Text style={styles.infoText}>
              Anfitrião: {match.event.host.full_name}
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
              {isHost ? "Convidado" : "Anfitrião"}: {otherUser.full_name}
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

        {/* Confirmed Status */}
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
  infoText: { fontSize: 16, marginBottom: 4 },
  actionsContainer: { flexDirection: "row", gap: 12, paddingTop: 16 },
  statusContent: { paddingTop: 24, alignItems: "center", gap: 12 },
  statusText: { fontSize: 18, fontWeight: "bold", color: "#065F46" },
});

