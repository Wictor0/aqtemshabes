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
import Icon from "../ui/Icon";

/**
 * Mapas para exibir labels amigáveis em português
 */
const hostAgeGroupLabels = {
  "young-adults": "Jovens (18-35)",
  adults: "Adultos (35+)",
  seniors: "Seniores (60+)",
  mixed: "Misto",
};

const targetAudienceLabels = {
  any: "Qualquer pessoa",
  families: "Famílias",
  "young-adults": "Jovens",
  seniors: "Seniores",
};

/**
 * Formatação manual em pt-BR (não usa Intl para evitar engines que não respeitam locale)
 */
const WEEKDAYS_PT = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];
const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function formatDateLongPT(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const wd = WEEKDAYS_PT[d.getDay()];
  const day = String(d.getDate()).padStart(2, "0");
  const month = MONTHS_PT[d.getMonth()];
  return `${wd}, ${day} de ${month}`;
}

function formatTimePT(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

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

  // spotsLeft — compatível com nomes do banco
  const spotsLeft =
    typeof event.max_guests === "number"
      ? (typeof event.current_guests === "number"
          ? event.max_guests - event.current_guests
          : event.max_guests)
      : 0;

  const ageLabel = hostAgeGroupLabels[event.host_age_group] ?? event.host_age_group;
  const audienceLabel = targetAudienceLabels[event.target_audience] ?? event.target_audience;

  return (
    <Card style={[styles.card, { borderLeftColor: "#3B82F6" }]}>
      <CardHeader style={{ paddingBottom: 8 }}>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1 }}>
            <CardTitle style={styles.cardTitle}>{event.title}</CardTitle>
            {event.host?.full_name ? (
              <CardDescription>Por {event.host.full_name}</CardDescription>
            ) : (
              <CardDescription>Por Desconhecido</CardDescription>
            )}
          </View>

          {typeof matchScore === "number" && (
            <View style={styles.matchScoreBadge}>
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
          {/* Data + Hora (formatadas em pt-BR manualmente) */}
          {event.date && (
            <View style={styles.infoRow}>
              <Icon name="calendar-month-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {formatDateLongPT(event.date)}
                {event.date ? ` • ${formatTimePT(event.date)}` : ""}
              </Text>
            </View>
          )}

          {/* Localização */}
          <View style={styles.infoRow}>
            <Icon name="map-marker-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {event.approximate_address || "Local não informado"}
            </Text>
          </View>

          {/* Capacidade */}
          {typeof event.max_guests === "number" && (
            <View style={styles.infoRow}>
              <Icon name="account-group-outline" size={16} />
              <Text style={styles.infoText}>
                Até {event.max_guests} convidados
              </Text>
              {spotsLeft > 0 && (
                <Badge variant="outline">
                  {spotsLeft} vaga{spotsLeft !== 1 ? "s" : ""}
                </Badge>
              )}
            </View>
          )}
        </View>

        {/* Descrição curta */}
        {event.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {event.description}
          </Text>
        )}

        {/* Tags: mostrar Label legível para faixa etária / público e os idiomas */}
        <View style={styles.tagsContainer}>
          {ageLabel && <Badge variant="outline">{ageLabel}</Badge>}
          {audienceLabel && <Badge variant="outline">{audienceLabel}</Badge>}
          {Array.isArray(event.languages) &&
            event.languages.map((lang) => (
              <Badge key={lang} variant="outline">
                {lang}
              </Badge>
            ))}
        </View>

        {/* Botão de interesse */}
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
