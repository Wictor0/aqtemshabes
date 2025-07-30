import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  TouchableWithoutFeedback,
  Keyboard,
  Platform, // 1. Importe a API Platform
} from "react-native";
import Slider from "@react-native-community/slider";
import { useAuth } from "../../context/AuthContext";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Select } from "../ui/Select";
import { Label } from "../ui/Label";
import EventCard from "../cards/EventCard";
import LoadingSpinner from "../ui/LoadingSpinner";
import { mockEvents } from "../../lib/mock-data";
import Icon from "../ui/Icon";

const dietaryOptions = [
  { label: "Qualquer", value: "" },
  { label: "Kosher", value: "kosher" },
  { label: "Tradicional", value: "traditional" },
  { label: "Vegetariano", value: "vegetarian" },
];
const ageGroupOptions = [
  { label: "Qualquer", value: "" },
  { label: "Famílias", value: "families" },
  { label: "Jovens", value: "young-adults" },
  { label: "Seniores", value: "seniors" },
  { label: "Misto", value: "mixed" },
];

export default function DiscoverEventsScreen({ navigation }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    maxDistance: 15,
    dietary: "",
    ageGroup: "",
  });
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // Simula a filtragem e a ordenação
    setTimeout(() => {
      const filteredEvents = mockEvents.filter((event) => {
        if (filters.dietary && event.dietary.toLowerCase() !== filters.dietary)
          return false;
        if (
          filters.ageGroup &&
          event.ageGroup.toLowerCase() !== filters.ageGroup
        )
          return false;
        if (
          searchQuery &&
          !event.title.toLowerCase().includes(searchQuery.toLowerCase())
        )
          return false;
        return true;
      });
      setEvents(filteredEvents);
      setLoading(false);
    }, 500);
  }, [filters, searchQuery]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-left" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Descobrir Eventos</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.contentWrapper}>
          <FlatList
            contentContainerStyle={styles.container}
            data={events}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              <>
                {/* Search and Filters */}
                <View style={styles.searchContainer}>
                  <Input
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    placeholder="Buscar por título..."
                  />
                  <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilters(!showFilters)}
                  >
                    <Icon name="filter-variant" size={20} />
                  </TouchableOpacity>
                </View>

                {showFilters && (
                  <Card style={{ width: "100%", marginBottom: 16 }}>
                    <CardHeader>
                      <CardTitle>Filtros</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <View style={styles.formSection}>
                        <Label>Distância Máxima: {filters.maxDistance}km</Label>
                        <Slider
                          style={{ width: "100%", height: 40 }}
                          minimumValue={1}
                          maximumValue={50}
                          step={1}
                          value={filters.maxDistance}
                          onValueChange={(v) =>
                            handleFilterChange("maxDistance", v)
                          }
                        />
                      </View>
                      <View style={styles.formSection}>
                        <Label>Preferência Alimentar</Label>
                        <Select
                          options={dietaryOptions}
                          selectedValue={filters.dietary}
                          onValueChange={(v) =>
                            handleFilterChange("dietary", v)
                          }
                        />
                      </View>
                      <View style={styles.formSection}>
                        <Label>Faixa Etária</Label>
                        <Select
                          options={ageGroupOptions}
                          selectedValue={filters.ageGroup}
                          onValueChange={(v) =>
                            handleFilterChange("ageGroup", v)
                          }
                        />
                      </View>
                    </CardContent>
                  </Card>
                )}
                <Text style={styles.resultsTitle}>
                  Eventos Recomendados ({events.length})
                </Text>
              </>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ marginBottom: 16 }}
                onPress={() =>
                  navigation.navigate("EventDetail", { eventId: item.id })
                }
              >
                <EventCard
                  event={item}
                  showDistance={true}
                  distance="~5km" // Mock
                  matchScore={0.85} // Mock
                />
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text>Nenhum evento encontrado.</Text>
                <Button
                  variant="outline"
                  onPress={() => {
                    setSearchQuery("");
                    setFilters({ maxDistance: 15, dietary: "", ageGroup: "" });
                  }}
                >
                  Limpar Filtros
                </Button>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
    width: "100%",
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
  contentWrapper: {
    width: "100%",
    maxWidth: 700,
    flex: 1,
  },
  container: { padding: 16 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "white",
  },
  formSection: { gap: 8, marginBottom: 16 },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
});
