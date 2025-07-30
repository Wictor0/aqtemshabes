import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Textarea } from "../ui/Textarea";
import LoadingSpinner from "../ui/LoadingSpinner";
import { toast } from "../../hooks/use-toast";
import { mockEvents } from "../../lib/mock-data";
import Icon from "../ui/Icon";

const feedbackTags = [
  { id: "friendly", label: "Caloroso" },
  { id: "punctual", label: "Pontual" },
  { id: "great-host", label: "Ótimo Anfitrião" },
  { id: "delicious-food", label: "Comida Deliciosa" },
  { id: "welcoming-home", label: "Casa Acolhedora" },
  { id: "good-conversation", label: "Boa Conversa" },
];

export default function FeedbackScreen({ route, navigation }) {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    rating: 0,
    comment: "",
    tags: [],
  });

  useEffect(() => {
    const eventData = mockEvents.find((e) => e.id === eventId);
    setEvent(eventData);
    setLoading(false);
  }, [eventId]);

  const handleRatingClick = (rating) => {
    setFeedbackData((prev) => ({ ...prev, rating }));
  };

  const handleTagToggle = (tagId) => {
    setFeedbackData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((t) => t !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  const handleSubmit = async () => {
    if (feedbackData.rating === 0) {
      return toast({
        type: "error",
        title: "Por favor, dê uma avaliação de 1 a 5 estrelas",
      });
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast({
      type: "success",
      title: "Feedback enviado com sucesso!",
      description: "Obrigado por ajudar a nossa comunidade.",
    });
    setIsSubmitting(false);
    navigation.goBack();
  };

  if (loading || !event) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </SafeAreaView>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-left" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Avaliar Experiência</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.contentWrapper}>
            <LinearGradient
              colors={["#4F46E5", "#7C3AED"]}
              style={styles.eventSummaryCard}
            >
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventSubtitle}>Por {event.host?.name}</Text>
            </LinearGradient>

            <Card style={{ width: "100%" }}>
              <CardHeader>
                <CardTitle>Sua Avaliação</CardTitle>
              </CardHeader>
              <CardContent>
                <Text style={styles.label}>
                  Como você avalia essa experiência?
                </Text>
                <View style={styles.starsContainer}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() => handleRatingClick(star)}
                    >
                      <Icon
                        name={
                          star <= feedbackData.rating ? "star" : "star-outline"
                        }
                        size={32}
                        color="#F59E0B"
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>O que mais gostou? (Opcional)</Text>
                <View style={styles.tagsContainer}>
                  {feedbackTags.map((tag) => {
                    const isSelected = feedbackData.tags.includes(tag.id);
                    return (
                      <TouchableOpacity
                        key={tag.id}
                        onPress={() => handleTagToggle(tag.id)}
                        style={[styles.tag, isSelected && styles.selectedTag]}
                      >
                        <Text
                          style={[
                            styles.tagText,
                            isSelected && styles.selectedTagText,
                          ]}
                        >
                          {tag.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={styles.label}>Comentário (Opcional)</Text>
                <Textarea
                  value={feedbackData.comment}
                  onChangeText={(text) =>
                    setFeedbackData((prev) => ({ ...prev, comment: text }))
                  }
                  placeholder="Compartilhe mais detalhes..."
                />

                <Button
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={{ marginTop: 20 }}
                >
                  {isSubmitting ? (
                    <LoadingSpinner size="small" color="#FFFFFF" />
                  ) : (
                    "Enviar Avaliação"
                  )}
                </Button>
              </CardContent>
            </Card>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  eventSummaryCard: { padding: 20, borderRadius: 12, alignItems: "center" },
  eventTitle: { fontSize: 20, fontWeight: "bold", color: "white" },
  eventSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.9)" },
  label: { fontSize: 16, fontWeight: "500", marginBottom: 12, marginTop: 16 },
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 16,
  },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 999,
  },
  selectedTag: { backgroundColor: "#E0E7FF", borderColor: "#4F46E5" },
  tagText: { color: "#374151" },
  selectedTagText: { color: "#4F46E5", fontWeight: "500" },
});
