import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
<<<<<<< HEAD
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import DateTimePicker from '@react-native-community/datetimepicker';

// Componentes da UI
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Select } from "../ui/Select";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import EventCard from "../cards/EventCard";
import Icon from "../ui/Icon";
import ISO6391 from 'iso-639-1'; // Restaurado

// Funções da API e Hooks
import { getEvents } from "../../services/api";
import { toast } from "../../hooks/use-toast";
import { mockEvents } from "../../lib/mock-data"; // Restaurado

// Opções e componentes auxiliares
const ageGroupOptions = [
  { label: "Qualquer Faixa Etária", value: "" },
=======
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
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  { label: "Famílias", value: "families" },
  { label: "Jovens", value: "young-adults" },
  { label: "Seniores", value: "seniors" },
  { label: "Misto", value: "mixed" },
];

<<<<<<< HEAD
const SelectedLanguages = ({ selected, onRemove }) => {
  if (selected.length === 0) {
    return <Text style={styles.placeholderText}>Nenhum idioma selecionado</Text>;
  }
  return (
    <View style={styles.languageContainer}>
      {selected.map((lang) => (
        <View key={lang} style={styles.languageChipSelected}>
          <Text style={styles.languageChipTextSelected}>{lang}</Text>
          <TouchableOpacity onPress={() => onRemove(lang)} style={{ marginLeft: 8 }}>
            <Icon name="close-circle" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default function DiscoverEventsScreen({ navigation }) {
  const [hasSearched, setHasSearched] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const initialFilters = {
    date: new Date(),
    region: "",
    guestCount: 2,
    ageGroup: "",
    languages: [],
  };

  const [filters, setFilters] = useState(initialFilters);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    applyFilters();
  }, []);
=======
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
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
<<<<<<< HEAD
  
  const handleLanguageRemove = (language) => {
    handleFilterChange("languages", filters.languages.filter((l) => l !== language));
  };
  
  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
    }
    if (selectedDate) {
      handleFilterChange('date', selectedDate);
    }
  };

  const addLanguage = (language) => {
    if (!filters.languages.includes(language)) {
        handleFilterChange("languages", [...filters.languages, language]);
    }
  };

  const openLanguageModal = () => {
    Alert.alert(
      "Adicionar Idioma",
      "Selecione um idioma para adicionar ao filtro.",
      [
        { text: 'Português', onPress: () => addLanguage('Português') },
        { text: 'Inglês', onPress: () => addLanguage('Inglês') },
        { text: 'Hebraico', onPress: () => addLanguage('Hebraico') },
        { text: 'Espanhol', onPress: () => addLanguage('Espanhol') },
        { text: 'Cancelar', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  const applyFilters = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const response = await getEvents();
      setEvents(response.data);
    } catch (error) {
      console.error("Erro ao buscar eventos:", error);
      toast({ type: 'error', title: 'Erro', description: 'Não foi possível buscar os eventos.' });
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setEvents([]);
    setHasSearched(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Card style={styles.filterCard}>
          <CardContent>
            {/* Filtro de Data */}
            <View style={styles.formSection}>
              <Label>Data do Evento</Label>
              {Platform.OS === 'android' && (
                <>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                    <Icon name="calendar" size={20} color="#374151" />
                    <Text style={styles.dateButtonText}>{filters.date.toLocaleDateString('pt-BR')}</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker value={filters.date} mode="date" display="default" onChange={onDateChange} />
                  )}
                </>
              )}
              {Platform.OS === 'ios' && (
                <View style={styles.iosPickerContainer}>
                  <Icon name="calendar" size={20} color="#374151" />
                  <DateTimePicker value={filters.date} mode="date" display="default" onChange={onDateChange} />
                </View>
              )}
            </View>
            
            {/* Outros filtros... */}
            <View style={styles.formSection}>
              <Label>Região (Bairro / Cidade)</Label>
              <Input
                placeholder="Ex: Jardins, São Paulo"
                value={filters.region}
                onChangeText={(v) => handleFilterChange("region", v)}
              />
            </View>
            <View style={styles.formSection}>
              <Label>Quantidade de Pessoas: {filters.guestCount}</Label>
              <Slider
                style={{ width: "100%", height: 40 }}
                minimumValue={1} maximumValue={20} step={1}
                value={filters.guestCount}
                onValueChange={(v) => handleFilterChange("guestCount", v)}
              />
            </View>
            <View style={styles.formSection}>
              <Label>Faixa Etária</Label>
              <Select
                options={ageGroupOptions}
                selectedValue={filters.ageGroup}
                onValueChange={(v) => handleFilterChange("ageGroup", v)}
              />
            </View>
            <View style={styles.formSection}>
                <Label>Idiomas Falados</Label>
                <SelectedLanguages selected={filters.languages} onRemove={handleLanguageRemove} />
                <Button variant="outline" onPress={openLanguageModal} style={{ marginTop: 8 }}>
                  <Icon name="plus" size={16} color="#374151" style={{ marginRight: 8 }}/>
                  <Text>Adicionar Idioma</Text>
                </Button>
            </View>

            <View style={styles.buttonContainer}>
              <Button variant="outline" onPress={clearFilters} style={{ flex: 1 }}>
                <Text>Limpar</Text>
              </Button>
              <Button onPress={applyFilters} style={{ flex: 1 }} disabled={isLoading}>
                {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white" }}>Buscar Eventos</Text>}
              </Button>
            </View>
          </CardContent>
        </Card>

        {hasSearched && (
            <View style={styles.resultsContainer}>
              <Text style={styles.resultsTitle}>Resultados ({events.length})</Text>
              {isLoading ? (
                <ActivityIndicator size="large" style={{marginTop: 32}} />
              ) : (
                <FlatList
                  data={events}
                  keyExtractor={(item) => item.id.toString()}
                  scrollEnabled={false}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={{ marginBottom: 16 }}
                      onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
                    >
                      <EventCard event={item} />
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>Nenhum evento encontrado.</Text>
                    </View>
                  }
                />
              )}
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
=======

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
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, flexGrow: 1 },
  filterCard: { width: "100%", marginBottom: 24 },
  formSection: { gap: 8, marginBottom: 20 },
  buttonContainer: { flexDirection: "row", gap: 12, marginTop: 8 },
  resultsContainer: { width: '100%' },
  resultsTitle: { fontSize: 20, fontWeight: "600", color: "#1F2937", marginBottom: 16 },
  emptyContainer: { alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },
  dateButton: {
    flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1,
    borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: 'white', gap: 8,
  },
  dateButtonText: { fontSize: 16, color: '#374151' },
  iosPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  placeholderText: { color: '#6B7280', fontStyle: 'italic' },
  languageContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  languageChipSelected: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
    paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#4F46E5",
  },
  languageChipTextSelected: { color: "white", fontWeight: "bold" },
});

=======
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
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
