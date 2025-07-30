import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Image,
  Platform, // 1. Importe a API Platform
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Badge } from "../ui/Badge";
import EventCard from "../cards/EventCard";
import MatchCard from "../cards/MatchCard";
import Icon from "../ui/Icon";

// Mock data (dados de mentira)
const mockMatches = [
  {
    id: 1,
    status: "PENDING",
    event: {
      title: "Shabat Familiar em Jardins",
      host: { name: "Família Cohen" },
      date: "2025-08-01T19:00:00Z",
      startTime: "19:00:00",
      endTime: "22:30:00",
      approximateAddress: "Jardins, São Paulo",
    },
    guest: { name: "Ana" },
    personalMessage:
      "Shalom! Estou muito interessado em participar deste Shabat familiar. Adoro tradições sefarditas e seria uma honra conhecer sua família.",
    createdAt: "2025-07-31T11:00:00Z",
  },
];
const mockEvents = [
  {
    id: "event-1", // Use um ID consistente
    title: "Shabat Familiar em Jardins",
    host: { name: "David Levy" },
    date: "2025-08-01T19:00:00Z",
    startTime: "19:00:00",
    endTime: "22:30:00",
    approximateAddress: "Jardins, São Paulo",
    currentGuests: 2,
    maxGuests: 6,
    dietary: "Kosher",
    ageGroup: "Famílias",
    language: "Português",
    description: "Um shabat caloroso com tradições ...",
  },
];

const formatShabbatDate = (date) =>
  new Date(date).toLocaleDateString("pt-BR", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
const getNextShabbat = () => new Date("2025-08-01T19:00:00Z");

export default function HomeScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("home");
  const nextShabbat = getNextShabbat();
  const pendingMatches = mockMatches.filter((m) => m.status === "PENDING");

  const handleSignOut = () => {
    signOut();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <LinearGradient
            colors={["transparent", "transparent"]}
            style={styles.headerLogo}
          >
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
            />
          </LinearGradient>
          <View>
            <Text style={styles.headerTitle}>Aquitemshabes</Text>
            <Text style={styles.headerSubtitle}>
              Shalom, {user?.name?.split(" ")[0]}! 👋
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="bell-outline" size={22} color="#374151" />
            {pendingMatches.length > 0 && (
              <Badge style={styles.notificationBadge}>
                <Text style={styles.notificationText}>
                  {pendingMatches.length > 9 ? "9+" : pendingMatches.length}
                </Text>
              </Badge>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleSignOut}>
            <Icon name="logout" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.contentWrapper}>
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
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recomendados para Você</Text>
            {mockEvents.map((event) => (
              <TouchableOpacity
                key={event.id}
                onPress={() =>
                  navigation.navigate("EventDetail", { eventId: event.id })
                }
              >
                <EventCard
                  event={event}
                  showDistance={true}
                  distance="~2km"
                  matchScore={0.85}
                />
              </TouchableOpacity>
            ))}
          </View>
          {pendingMatches.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Aguardando Resposta</Text>
              {pendingMatches.map((match) => (
                <MatchCard key={match.id} match={match} isHost={true} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setActiveTab("home")}
        >
          <Icon
            name="home-variant-outline"
            size={24}
            color={activeTab === "home" ? "#4F46E5" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "home" && styles.activeNavText,
            ]}
          >
            Início
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("DiscoverEvents")}
        >
          <Icon
            name="magnify"
            size={24}
            color={activeTab === "discover" ? "#4F46E5" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "discover" && styles.activeNavText,
            ]}
          >
            Descobrir
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("CreateEvent")}
        >
          <Icon
            name="plus-circle-outline"
            size={24}
            color={activeTab === "create" ? "#4F46E5" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "create" && styles.activeNavText,
            ]}
          >
            Criar
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Matches")}
        >
          <Icon
            name="account-multiple-outline"
            size={24}
            color={activeTab === "matches" ? "#4F46E5" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "matches" && styles.activeNavText,
            ]}
          >
            Matches
          </Text>
          {pendingMatches.length > 0 && (
            <Badge style={styles.navBadge} textStyle={styles.navBadgeText}>
              {pendingMatches.length}
            </Badge>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => navigation.navigate("Profile")}
        >
          <Icon
            name="account-circle-outline"
            size={24}
            color={activeTab === "profile" ? "#4F46E5" : "#6B7280"}
          />
          <Text
            style={[
              styles.navText,
              activeTab === "profile" && styles.activeNavText,
            ]}
          >
            Perfil
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
    // 2. Utilize o Platform.select para definir o padding
    ...Platform.select({
      ios: {
        paddingTop: 12,
        paddingBottom: 12,
      },
      android: {
        paddingTop: 40,
        paddingBottom: 15,
      },
      default: {
        paddingVertical: 12,
      },
    }),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  headerTitle: { fontWeight: "bold", fontSize: 18 },
  headerSubtitle: { fontSize: 12, color: "#6B7280" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { padding: 8 },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 9999,
    paddingHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  notificationText: {
    color: "white",
    fontSize: 8,
    lineHeight: 10,
    textAlign: "center",
    fontWeight: "bold",
  },

  scrollContainer: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 700,
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
  section: { gap: 12, width: "100%" },
  sectionTitle: { fontSize: 20, fontWeight: "600", color: "#1F2937" },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingVertical: 8,
    backgroundColor: "white",
  },
  navButton: { alignItems: "center", gap: 4, flex: 1 },
  navText: { fontSize: 12, color: "#6B7280" },
  activeNavText: { color: "#4F46E5" },
  navBadge: {
    position: "absolute",
    top: -2,
    right: 15,
    height: 16,
    width: 16,
    borderRadius: 9999,
    paddingHorizontal: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  navBadgeText: {
    color: "white",
    fontSize: 8,
    lineHeight: 10,
    textAlign: "center",
    fontWeight: "bold",
  },
});
