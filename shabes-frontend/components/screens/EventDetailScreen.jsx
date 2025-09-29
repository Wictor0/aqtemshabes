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
import { LinearGradient } from "expo-linear-gradient";

// UI Components
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { Textarea } from "../ui/Textarea";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

// Hooks, API & Utils
import { useAuth } from "../../context/AuthContext";
import { getEventById, createMatch } from "../../services/api";
import { toast } from "../../hooks/use-toast";
import { formatShabbatDate } from "../../lib/utils";

// Mapas de Tradução
const hostAgeGroupLabels = {
  families: "Família",
  "young-adults": "Jovens (20-35)",
  adults: "Adultos (35+)",
  seniors: "Seniores (60+)",
};

const targetAudienceLabels = {
  any: "Qualquer pessoa",
  families: "Apenas Famílias",
  "young-adults": "Apenas Jovens",
  seniors: "Apenas Seniores",
};

const getLabel = (value, labels) => labels[value] || value;

export default function EventDetailScreen({ route, navigation }) {
  const { eventId, origin } = route.params;
  const { user } = useAuth();

  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInterestForm, setShowInterestForm] = useState(false);
  const [personalMessage, setPersonalMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const response = await getEventById(eventId);

        // ✅ Normaliza para garantir que usamos o objeto certo
        const normalizedEvent =
          response.data?.data && typeof response.data.data === "object"
            ? response.data.data
            : response.data;

        console.log("📌 EVENTO RECEBIDO:", normalizedEvent);
        setEvent(normalizedEvent);
      } catch (error) {
        console.error("Erro ao buscar detalhes do evento:", error);
        toast({ type: "error", title: "Não foi possível carregar o evento." });
      } finally {
        setLoading(false);
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleExpressInterest = async () => {
    if (!personalMessage.trim()) {
      return toast({
        type: "error",
        title: "Por favor, escreva uma mensagem pessoal",
      });
    }

    setIsSubmitting(true);
    try {
      const matchData = {
        event_id: eventId,
        personal_message: personalMessage,
      };
      await createMatch(matchData);
      toast({
        type: "success",
        title: "Interesse enviado com sucesso!",
        description: "O anfitrião foi notificado.",
      });
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao enviar interesse:", error);
      if (error.response?.status === 409) {
        toast({
          type: "error",
          title: "Pedido já enviado",
          description: "Você já demonstrou interesse neste evento.",
        });
      } else if (error.response?.status === 403) {
        toast({
          type: "error",
          title: "Ação não permitida",
          description: "Você não pode se inscrever no seu próprio evento.",
        });
      } else {
        toast({
          type: "error",
          title: "Erro ao enviar pedido",
          description: "Tente novamente mais tarde.",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Evento não encontrado.</Text>
        <Button onPress={() => navigation.goBack()}>Voltar</Button>
      </SafeAreaView>
    );
  }

  // ✅ Verifica se usuário logado é o anfitrião
  const isUserHost = user?.id === event.host_id;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes do Evento</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentWrapper}>
          <Card style={{ width: "100%" }}>
            <CardHeader>
              <CardTitle style={styles.eventTitle}>{event.title}</CardTitle>
              <CardDescription>
                Anfitrião / Criador: {event.host_name || "Desconhecido"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Text style={styles.description}>{event.description}</Text>
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Icon
                    name="calendar-month-outline"
                    color="#4F46E5"
                    size={20}
                  />
                  <Text>{formatShabbatDate(new Date(event.date))}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Icon
                    name="map-marker-outline"
                    color="#EC4899"
                    size={20}
                  />
                  <Text>{event.approximate_address}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Icon
                    name="account-group-outline"
                    color="#10B981"
                    size={20}
                  />
                  <Text>Até {event.max_guests} convidados</Text>
                </View>
              </View>
              <View style={styles.tagsContainer}>
                {event.host_age_group && (
                  <Badge variant="outline">
                    Anfitriões:{" "}
                    {getLabel(event.host_age_group, hostAgeGroupLabels)}
                  </Badge>
                )}
                {event.target_audience && (
                  <Badge variant="outline">
                    Público:{" "}
                    {getLabel(event.target_audience, targetAudienceLabels)}
                  </Badge>
                )}
                {event.languages?.map((lang) => (
                  <Badge key={lang} variant="outline">
                    {lang}
                  </Badge>
                ))}
              </View>
            </CardContent>
          </Card>

          {!isUserHost && origin !== "home" && (
            <>
              {showInterestForm ? (
                <Card style={{ width: "100%" }}>
                  <CardHeader>
                    <CardTitle>Enviar Mensagem Pessoal</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Escreva uma mensagem para o anfitrião..."
                      value={personalMessage}
                      onChangeText={setPersonalMessage}
                    />
                    <View style={styles.actionsContainer}>
                      <Button
                        variant="outline"
                        style={{ flex: 1 }}
                        onPress={() => setShowInterestForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        style={{ flex: 1 }}
                        onPress={handleExpressInterest}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <LoadingSpinner size="small" color="#FFFFFF" />
                        ) : (
                          "Enviar"
                        )}
                      </Button>
                    </View>
                  </CardContent>
                </Card>
              ) : (
                <LinearGradient
                  colors={["#4F46E5", "#7C3AED"]}
                  style={styles.ctaCard}
                >
                  <Text style={styles.ctaTitle}>Interessado?</Text>
                  <Text style={styles.ctaSubtitle}>
                    Demonstre interesse e envie uma mensagem personalizada.
                  </Text>
                  <Button
                    variant="secondary"
                    onPress={() => setShowInterestForm(true)}
                  >
                    Tenho Interesse
                  </Button>
                </LinearGradient>
              )}
            </>
          )}
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
      ios: { paddingTop: 0, paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 12 },
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
  eventTitle: { fontSize: 24, fontWeight: "bold" },
  description: { fontSize: 16, color: "#6B7280", marginVertical: 16 },
  detailsGrid: { gap: 12 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  ctaCard: { padding: 20, borderRadius: 12, alignItems: "center", gap: 12 },
  ctaTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  ctaSubtitle: {
    color: "rgba(229, 231, 235, 0.9)",
    textAlign: "center",
    marginBottom: 8,
  },
  actionsContainer: { flexDirection: "row", gap: 12, marginTop: 16 },
});
