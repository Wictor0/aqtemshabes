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
import VerifiedBadge from "../ui/VerifiedBadge";

/**
 * Mapas Completos para tradução
 */
const hostAgeGroupLabels = {
  // Variações de Jovens
  "young-adults": "Jovens (18-35)",
  "young_adults": "Jovens (18-35)", 
  "Young Adults": "Jovens (18-35)",
  
  // Variações de Adultos
  "adults": "Adultos (35+)",
  "Adults": "Adultos (35+)",
  
  // Variações de Seniores
  "seniors": "Seniores (60+)",
  "Seniors": "Seniores (60+)",
  
  // Outros
  "mixed": "Misto",
  "Mixed": "Misto",
};

const targetAudienceLabels = {
  // Variações de Qualquer pessoa
  "any": "Qualquer pessoa",
  "Any": "Qualquer pessoa",

  // Variações de Famílias
  "families": "Famílias",
  "Families": "Famílias",

  // Variações de Jovens
  "young-adults": "Jovens",
  "young_adults": "Jovens",
  "Young Adults": "Jovens",

  // Variações de Adultos
  "adults": "Adultos",
  "Adults": "Adultos",

  // Variações de Seniores
  "seniors": "Seniores",
  "Seniors": "Seniores",
};

const WEEKDAYS_PT = [
  "Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado",
];
const MONTHS_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
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

export default function EventCard({
  event,
  onInterest,
  matchScore,
}) {
  const [isInterested, setIsInterested] = useState(false);
  
  if (!event) return null;

  const handleInterest = () => {
    setIsInterested(true);
    onInterest?.(event.id);
  };


  const getLabel = (value, map) => {
    if (!value) return null;

    let key = value;

    if (Array.isArray(value)) {
        key = value[0];
    }

    if (typeof key === 'string') {
        key = key.replace(/[\[\]"']/g, "").trim();
    }

    return map[key] || map[key.toLowerCase()] || key;
  };

  const spotsLeft =
    typeof event.max_guests === "number"
      ? (typeof event.current_guests === "number"
          ? event.max_guests - event.current_guests
          : event.max_guests)
      : 0;

  const ageLabel = getLabel(event.host_age_group, hostAgeGroupLabels);
  const audienceLabel = getLabel(event.target_audience, targetAudienceLabels);

  const hostDisplayName = "Anfitrião da Comunidade";
  const hostRole = null; 

  return (
    <Card style={[styles.card, { borderLeftColor: "#3B82F6" }]}>
      <CardHeader style={{ paddingBottom: 8 }}>
        <View style={styles.headerContainer}>
          <View style={{ flex: 1, paddingRight: 8 }}> 
            <CardTitle style={styles.cardTitle} numberOfLines={2}>{event.title}</CardTitle>
            
            <View style={styles.hostRow}>
                <View style={styles.hostNameContainer}>
                    <CardDescription numberOfLines={1}>
                        Por {hostDisplayName}
                    </CardDescription>
                </View>
            </View>
            
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
          {event.date && (
            <View style={styles.infoRow}>
              <Icon name="calendar-month-outline" size={16} color="#6B7280" />
              <Text style={styles.infoText}>
                {formatDateLongPT(event.date)}
              </Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <Icon name="map-marker-outline" size={16} color="#6B7280" />
            <Text style={styles.infoText}>
              {event.approximate_address || "Local não informado"}
            </Text>
          </View>

          {typeof event.max_guests === "number" && (
            <View style={styles.infoRow}>
              <Icon name="account-group-outline" size={16} />
              <Text style={styles.infoText}>
                {event.max_guests > 0 
                  ? `Até ${event.max_guests} convidados` 
                  : "Sem limites de convidados"}
              </Text>
              {spotsLeft > 0 && (
                <Badge variant="outline">
                  {spotsLeft} vaga{spotsLeft !== 1 ? "s" : ""}
                </Badge>
              )}
            </View>
          )}
        </View>

        {event.description && (
          <Text style={styles.descriptionText} numberOfLines={2}>
            {event.description}
          </Text>
        )}

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
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hostNameContainer: {
    flexShrink: 1,
  },
  matchScoreBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    gap: 4,
    marginLeft: 8,
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