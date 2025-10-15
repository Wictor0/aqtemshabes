import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Animated,
  Platform,
  Alert,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";

// UI Components
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import EventCard from "../cards/EventCard";
import Icon from "@expo/vector-icons/Feather";
import Slider from "@react-native-community/slider";

// API functions and Hooks
import { getEvents } from "../../services/api";
import { toast } from "../../hooks/use-toast";

const ageGroupOptions = [
  { label: "Qualquer Faixa Etária", value: "" },
  { label: "Jovens", value: "young-adults" },
  { label: "Adultos", value: "adults" },
  { label: "Seniores", value: "seniors" },
];

// Lista de bairros de São Paulo
const saoPauloNeighborhoods = [
  "Higienopolis",
  "Santa Cecilia",
  "Jardim Paulista",
  "Jardim Europa",
  "Vila Nova Conceição",
  "Perdizes",
  "Vila Madalena",
  "Itaim Bibi",
  "Pompeia",
];

const SelectedLanguages = ({ selected, onRemove }) => {
  if (!selected || selected.length === 0) return <Text style={styles.placeholderText}>Nenhum idioma selecionado</Text>;
  return (
    <View style={styles.languageContainer}>
      {selected.map((lang) => (
        <View key={lang} style={styles.languageChipSelected}>
          <Text style={styles.languageChipTextSelected}>{lang}</Text>
          <TouchableOpacity onPress={() => onRemove(lang)} style={{ marginLeft: 8 }}>
            <Icon name="x-circle" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

// Componente para exibir bairros selecionados (reutiliza estilos de idiomas)
const SelectedNeighborhoods = ({ selected, onRemove }) => {
  if (!selected || selected.length === 0) {
    return <Text style={styles.placeholderText}>Nenhum bairro selecionado</Text>;
  }
  return (
    <View style={styles.languageContainer}>
      {selected.map((neighborhood) => (
        <View key={neighborhood} style={styles.languageChipSelected}>
          <Text style={styles.languageChipTextSelected}>{neighborhood}</Text>
          <TouchableOpacity onPress={() => onRemove(neighborhood)} style={{ marginLeft: 8 }}>
            <Icon name="x-circle" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};


export default function DiscoverEventsScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [filters, setFilters] = useState({
    date: new Date(),
    region: [], // Alterado para array
    guestCount: 0, // Alterado para 0 (Qualquer)
    ageGroup: "",
    languages: [],
  });

  const [filtersOpen, setFiltersOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  const [contentHeight, setContentHeight] = useState(0);

  const toggleFilters = () => {
    const toValue = filtersOpen ? 0 : 1;
    setFiltersOpen(!filtersOpen);

    Animated.timing(animatedHeight, {
      toValue,
      duration: 350, 
      useNativeDriver: false,
    }).start();

    Animated.timing(iconRotation, {
      toValue,
      duration: 350,
      useNativeDriver: true,
    }).start();
  };

  const heightInterpolate = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, contentHeight],
  });

  const rotateInterpolate = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const handleFilterChange = (key, value) => setFilters(prev => ({ ...prev, [key]: value }));
  
  // Funções para idiomas
  const handleLanguageRemove = lang => handleFilterChange("languages", filters.languages.filter(l => l !== lang));
  const addLanguage = lang => { if (!filters.languages.includes(lang)) handleFilterChange("languages", [...filters.languages, lang]); };

  const openLanguageModal = () => {
    Alert.alert(
      "Adicionar Idioma", "Selecione um idioma para adicionar ao filtro.",
      [
        { text: "Português", onPress: () => addLanguage("Português") },
        { text: "Inglês", onPress: () => addLanguage("Inglês") },
        { text: "Hebraico", onPress: () => addLanguage("Hebraico") },
        { text: "Iídiche", onPress: () => addLanguage("Iídiche") },
        { text: "Espanhol", onPress: () => addLanguage("Espanhol") },
        { text: "Outros", onPress: () => addLanguage("Outros") },
        { text: "Cancelar", style: "cancel" },
      ],
      { cancelable: true }
    );
  };

  // Funções para bairros
  const removeNeighborhood = (neighborhood) => {
    handleFilterChange("region", filters.region.filter((n) => n !== neighborhood));
  };
  const addNeighborhood = (neighborhood) => {
    if (!filters.region.includes(neighborhood)) {
      handleFilterChange("region", [...filters.region, neighborhood]);
    }
  };
  const openNeighborhoodModal = () => {
    Alert.alert("Selecionar Bairro", "Escolha um bairro de São Paulo.", [
      ...saoPauloNeighborhoods.map((n) => ({
        text: n,
        onPress: () => addNeighborhood(n),
      })),
      { text: "Cancelar", style: "cancel" },
    ]);
  };


  const applyFilters = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = {
        region: filters.region.join(","),
        ageGroup: filters.ageGroup,
        // Só envia guestCount se for maior que 0
        guestCount: filters.guestCount > 0 ? filters.guestCount : undefined,
        date: filters.date.toISOString().split("T")[0],
        languages: filters.languages.join(","),
      };
      // Limpa chaves vazias ou indefinidas
      Object.keys(queryParams).forEach(key => { if (!queryParams[key] || queryParams[key].length === 0) delete queryParams[key]; });
      
      const response = await getEvents(queryParams);
      setEvents(response.data || []);
    } catch {
      toast({ type: "error", title: "Erro", description: "Não foi possível buscar os eventos." });
    } finally { setIsLoading(false); }
  }, [filters]);

  useFocusEffect(
    useCallback(() => {
      const fetchEvents = async () => {
        setIsLoading(true);
        try { const res = await getEvents(); setEvents(res.data || []); }
        catch { /* Opcional: tratar erro inicial */ }
        finally { setIsLoading(false); }
      };
      fetchEvents();
    }, [])
  );

  const clearFilters = () => {
    setFilters({ date: new Date(), region: [], guestCount: 0, ageGroup: "", languages: [] });
  };

  const renderEvent = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate("EventDetail", { eventId: item.id })} style={{ marginBottom: 16 }}>
      <EventCard event={item} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <Card style={styles.filterCard}>
          <TouchableOpacity onPress={toggleFilters} style={styles.filterHeader}>
            <Text style={styles.filterHeaderText}>Filtrar resultados</Text>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Icon name="chevron-down" size={24} color="#374151" />
            </Animated.View>
          </TouchableOpacity>
          
          <Animated.View style={{ height: heightInterpolate, overflow: 'hidden', backgroundColor: 'white' }}>
            <View 
              style={styles.filtersContent}
              onLayout={e => {
                const measuredHeight = e.nativeEvent.layout.height;
                if (measuredHeight > 0 && contentHeight !== measuredHeight) {
                  setContentHeight(measuredHeight);
                }
              }}
            >
              <Label>Data do Evento</Label>
              {Platform.OS === "android" && (
                <>
                  <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                    <Icon name="calendar" size={20} color="#374151" />
                    <Text style={styles.dateButtonText}>{filters.date.toLocaleDateString("pt-BR")}</Text>
                  </TouchableOpacity>
                  {showDatePicker && <DateTimePicker value={filters.date} mode="date" display="default" onChange={(e, date) => { setShowDatePicker(false); date && handleFilterChange("date", date); }} />}
                </>
              )}
              {Platform.OS === "ios" && (
                <View style={styles.iosPickerContainer}>
                  <Icon name="calendar" size={20} color="#374151" />
                  <DateTimePicker value={filters.date} mode="date" display="default" onChange={(e, date) => date && handleFilterChange("date", date)} />
                </View>
              )}

              {/* Filtro de Região por Tags */}
              <Label>Região (Bairros)</Label>
              <SelectedNeighborhoods selected={filters.region} onRemove={removeNeighborhood} />
              <Button variant="outline" onPress={openNeighborhoodModal} style={styles.languageButton}>
                <Icon name="plus" size={16} color="#374151" style={{ marginRight: 8 }} />
                <Text>Adicionar Bairro</Text>
              </Button>

              {/* Filtro de Quantidade de Pessoas */}
              <Label>Quantidade de Pessoas: {filters.guestCount === 0 ? 'Qualquer' : filters.guestCount}</Label>
              <Slider style={{ width: "100%", height: 40 }} minimumValue={0} maximumValue={20} step={1} value={filters.guestCount} onValueChange={v => handleFilterChange("guestCount", v)} />
              
              <Label>Faixa Etária</Label>
              <Select options={ageGroupOptions} selectedValue={filters.ageGroup} onValueChange={v => handleFilterChange("ageGroup", v)} />

              <Label>Idiomas Falados</Label>
              <SelectedLanguages selected={filters.languages} onRemove={handleLanguageRemove} />
              <Button variant="outline" onPress={openLanguageModal} style={styles.languageButton}>
                <Icon name="plus" size={16} color="#374151" style={{ marginRight: 8 }} />
                <Text>Adicionar Idioma</Text>
              </Button>
              
              <View style={styles.buttonContainer}>
                <Button variant="outline" onPress={clearFilters} style={{ flex: 1 }}><Text>Limpar</Text></Button>
                <Button onPress={applyFilters} style={{ flex: 1 }} disabled={isLoading}>
                  {isLoading ? <ActivityIndicator color="white" /> : <Text style={{ color: "white" }}>Buscar Eventos</Text>}
                </Button>
              </View>
            </View>
          </Animated.View>
        </Card>

        <Text style={styles.resultsTitle}>Resultados ({events.length})</Text>
        {isLoading 
          ? <ActivityIndicator size="large" style={{ marginTop: 32 }} /> 
          : <FlatList 
              data={events} 
              keyExtractor={item => item.id.toString()} 
              scrollEnabled={false} 
              renderItem={renderEvent} 
              ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum evento encontrado.</Text></View>} 
            />
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // --- Layout Principal ---
  safeArea: { 
    flex: 1, 
    backgroundColor: "#F9FAFB" 
  },
  container: { 
    padding: 16, 
    flexGrow: 1 
  },

  // --- Card de Filtros ---
  filterCard: { 
    marginBottom: 24 
  },
  filterHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 12, 
    backgroundColor: "white", 
    borderRadius: 8,
    zIndex: 1,
  },
  filterHeaderText: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: "#374151" 
  },
  filtersContent: { 
    paddingHorizontal: 12, 
    paddingTop: 16,
    paddingBottom: 12, 
    flexDirection: "column", 
    gap: 12,
  },

  // --- Controles de Formulário ---
  dateButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12, 
    borderColor: "#E5E7EB", 
    borderRadius: 8, 
    backgroundColor: "white", 
    gap: 8 
  },
  dateButtonText: { 
    fontSize: 16, 
    color: "#374151" 
  },
  iosPickerContainer: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    paddingLeft: 10, 
    backgroundColor: "white",
  },
  buttonContainer: { 
    flexDirection: "row", 
    gap: 12, 
    marginTop: 12 
  },

  // --- Idiomas, Bairros (Tags/Chips) ---
  placeholderText: { 
    color: "#6B7280", 
    fontStyle: "italic",
    paddingVertical: 8,
  },
  languageContainer: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    gap: 8 
  },
  languageChipSelected: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 8, 
    paddingHorizontal: 12, 
    borderRadius: 20, 
    backgroundColor: "#4F46E5" 
  },
  languageChipTextSelected: { 
    color: "white", 
    fontWeight: "bold" 
  },
  languageButton: {
    marginVertical: 8, 
    flexDirection: "row", 
    alignItems: "center"
  },

  // --- Lista de Resultados ---
  resultsTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "#1F2937", 
    marginBottom: 16 
  },
  emptyContainer: { 
    alignItems: "center", 
    padding: 32 
  },
  emptyText: { 
    fontSize: 16, 
    color: "#6B7280", 
    textAlign: "center" 
  },
});

