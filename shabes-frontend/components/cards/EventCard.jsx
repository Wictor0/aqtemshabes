import React, { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import Icon from "../ui/Icon"; // 1. Importe o componente de Ícone real

// Funções de formatação (copiadas/adaptadas do seu backend)
const formatTime = (timeStr) => (timeStr ? timeStr.substring(0, 5) : "");

export default function EventCard({
  event,
  onInterest,
  showDistance = false,
  distance,
  matchScore,
}) {
  const [isInterested, setIsInterested] = useState(false);

  if (!event) return null;

  const handleInterest = () => {
    setIsInterested(true);
    onInterest?.(event.id);
  };

  const spotsLeft = event.maxGuests - event.currentGuests;

  return (
    <Card style={[styles.card, { borderLeftColor: "#3B82F6" }]}>
      <CardHeader style={{ paddingBottom: 8 }}>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <CardTitle style={styles.cardTitle}>{event.title}</CardTitle>
            <CardDescription>Por {event.host?.name}</CardDescription>
          </View>
          {matchScore && (
            <View style={styles.matchScoreBadge}>
              {/* 2. Substitua os placeholders por ícones reais */}
              <Icon name="star" color="#D97706" size={12} />
              <Text style={styles.matchScoreText}>
                {Math.round(matchScore * 100)}%
              </Text>
            </View>
          )}
        </View>
      </CardHeader>

      <CardContent>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Icon name="calendar-month-outline" size={16} />
            <Text style={styles.infoText}>
              {new Date(event.date).toLocaleDateString("pt-BR")}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="clock-outline" size={16} />
            <Text style={styles.infoText}>
              {formatTime(event.startTime)} - {formatTime(event.endTime)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="map-marker-outline" size={16} />
            <Text style={styles.infoText}>{event.approximateAddress}</Text>
            {showDistance && distance && (
              <Badge variant="secondary">{distance}</Badge>
            )}
          </View>
          <View style={styles.infoRow}>
            <Icon name="account-group-outline" size={16} />
            <Text style={styles.infoText}>
              {event.currentGuests}/{event.maxGuests} pessoas
            </Text>
            {spotsLeft > 0 && (
              <Badge variant="outline">
                {spotsLeft} vaga{spotsLeft !== 1 ? "s" : ""}
              </Badge>
            )}
          </View>
        </View>

        {event.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        <View style={styles.tagsContainer}>
          <Badge variant="outline">{event.ageGroup}</Badge>
          <Badge variant="outline">{event.language}</Badge>
        </View>

        {onInterest && (
          <View style={styles.actionsContainer}>
            <Button
              onPress={handleInterest}
              disabled={isInterested || spotsLeft === 0}
              variant={isInterested ? "outline" : "default"}
              style={{ flex: 1 }}
            >
              {isInterested
                ? "Interesse Enviado"
                : spotsLeft === 0
                ? "Esgotado"
                : "Tenho Interesse"}
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4 },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardTitle: { fontSize: 18, lineHeight: 22 },
  matchScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
  },
  matchScoreText: { fontSize: 12, fontWeight: "500", color: "#92400E" },
  infoSection: { gap: 8, marginVertical: 12 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoText: { fontSize: 14, color: "#6B7280" },
  descriptionText: { fontSize: 14, color: "#6B7280", marginVertical: 8 },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginVertical: 8,
  },
  actionsContainer: { flexDirection: "row", paddingTop: 12 },
});
