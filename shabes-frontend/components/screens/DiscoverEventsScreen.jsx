import React, { useState, useRef, useCallback, useEffect } from "react";
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
  RefreshControl,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useFocusEffect } from "@react-navigation/native";

// UI Components
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Label } from "../ui/Label";
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

const saoPauloNeighborhoods = [
  "Higienopolis","Santa Cecilia","Jardim Paulista","Jardim Europa",
  "Vila Nova Conceição","Perdizes","Vila Madalena","Itaim Bibi","Pompeia",
];

// --- Componentes Auxiliares ---
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

const SelectedNeighborhoods = ({ selected, onRemove }) => {
  if (!selected || selected.length === 0) return <Text style={styles.placeholderText}>Nenhum bairro selecionado</Text>;
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

// --- Lógica de Filtros ---

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  // Comparação usando dia/mês/ano local para evitar problemas de fuso horário
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

const isEventMatch = (event, filters) => {
  // 1. Filtro de Data
  if (filters.date) { 
    if (!isSameDay(event.date, filters.date)) return false; 
  }
  // 2. Filtro de Região (Bairros)
  if (filters.region && filters.region.length > 0) {
    const eventMatchesRegion = filters.region.some(r => event.approximate_address && event.approximate_address.includes(r));
    if (!eventMatchesRegion) return false;
  }
  // 3. Filtro de Quantidade
  if (filters.guestCount > 0) {
    if (event.max_guests < filters.guestCount) return false;
  }
  // 4. Filtro de Faixa Etária
  if (filters.ageGroup && filters.ageGroup !== "") {
    if (event.target_audience !== filters.ageGroup) return false;
  }
  // 5. Filtro de Idiomas
  if (filters.languages && filters.languages.length > 0) {
    // .every() = precisa ter TODOS os idiomas selecionados
    // .some() = precisa ter PELO MENOS UM (geralmente melhor para UX)
    const eventHasLanguages = filters.languages.every(lang => event.languages && event.languages.includes(lang));
    if (!eventHasLanguages) return false;
  }
  return true;
};

export default function DiscoverEventsScreen({ navigation }) {
  const [allEvents, setAllEvents] = useState([]);
  const [results, setResults] = useState({ matches: [], others: [] });
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [filterInputs, setFilterInputs] = useState({
    date: null, 
    region: [],
    guestCount: 0,
    ageGroup: "",
    languages: [],
  });
  
  const [activeFilters, setActiveFilters] = useState(null);

  // Animação do Accordion de Filtros
  const [filtersOpen, setFiltersOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;
  const [contentHeight, setContentHeight] = useState(0);

  const toggleFilters = () => { 
    const toValue = filtersOpen ? 0 : 1;
    setFiltersOpen(!filtersOpen);
    Animated.timing(animatedHeight, { toValue, duration: 350, useNativeDriver: false }).start();
    Animated.timing(iconRotation, { toValue, duration: 350, useNativeDriver: true }).start();
  };
  
  const heightInterpolate = animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight] });
  const rotateInterpolate = iconRotation.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });

  // Handlers de Filtros
  const handleFilterChange = (key, value) => setFilterInputs(prev => ({ ...prev, [key]: value }));
  const handleLanguageRemove = lang => handleFilterChange("languages", filterInputs.languages.filter(l => l !== lang));
  const addLanguage = lang => { if (!filterInputs.languages.includes(lang)) handleFilterChange("languages", [...filterInputs.languages, lang]); };
  const removeNeighborhood = (neighborhood) => handleFilterChange("region", filterInputs.region.filter((n) => n !== neighborhood));
  const addNeighborhood = (neighborhood) => { if (!filterInputs.region.includes(neighborhood)) handleFilterChange("region", [...filterInputs.region, neighborhood]); };
  
  const openLanguageModal = () => { Alert.alert( "Adicionar Idioma", "Selecione um idioma para adicionar ao filtro.", [ { text: "Português", onPress: () => addLanguage("Português") }, { text: "Inglês", onPress: () => addLanguage("Inglês") }, { text: "Hebraico", onPress: () => addLanguage("Hebraico") }, { text: "Iídiche", onPress: () => addLanguage("Iídiche") }, { text: "Espanhol", onPress: () => addLanguage("Espanhol") }, { text: "Outros", onPress: () => addLanguage("Outros") }, { text: "Cancelar", style: "cancel" } ], { cancelable: true } ); };
  const openNeighborhoodModal = () => { Alert.alert("Selecionar Bairro", "Escolha um bairro de São Paulo.", [ ...saoPauloNeighborhoods.map((n) => ({ text: n, onPress: () => addNeighborhood(n) })), { text: "Cancelar", style: "cancel" } ]); };

  // --- Lógica Principal de Filtragem e Ordenação ---
  useEffect(() => {
    // 1. Sem dados? Limpa tudo.
    if (!allEvents || allEvents.length === 0) {
        setResults({ matches: [], others: [] });
        return;
    }

    // 2. Sem filtros ativos? Mostra tudo na lista principal.
    if (!activeFilters) {
      setResults({ matches: allEvents, others: [] });
      return;
    }
    
    setIsFiltering(true);
    
    const matchingEvents = [];
    const nonMatchingEvents = [];

    allEvents.forEach(event => {
      if (isEventMatch(event, activeFilters)) {
        matchingEvents.push(event);
      } else {
        nonMatchingEvents.push(event);
      }
    });

    setResults({ matches: matchingEvents, others: nonMatchingEvents });
    setIsFiltering(false); 

  }, [allEvents, activeFilters]);


  const applyFilters = useCallback(async () => {
    setActiveFilters({ ...filterInputs });
    if (filtersOpen) toggleFilters(); 
  }, [filterInputs, filtersOpen]);


  const fetchEvents = async () => {
    if (!refreshing) setIsLoading(true);
    try { 
      const res = await getEvents(); 
      if (res.data) {
          setAllEvents(res.data);
      } else {
          setAllEvents([]);
      }
    }
    catch (error) { 
       console.error("Erro ao buscar eventos:", error);
       toast({ type: "error", title: "Erro", description: "Não foi possível carregar os eventos." });
    }
    finally { 
        setIsLoading(false);
        setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchEvents();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchEvents();
  };

  const clearFilters = () => {
    setFilterInputs({ date: null, region: [], guestCount: 0, ageGroup: "", languages: [] });
    setActiveFilters(null); 
  };

  const renderEvent = ({ item }) => {
    if (!item?.id) return null;
    return (
        <TouchableOpacity onPress={() => navigation.navigate("EventDetail", { eventId: item.id })} style={{ marginBottom: 16 }}>
            <EventCard event={item} />
        </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#4F46E5"]} />
        }
      >
        
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
                    <Text style={styles.dateButtonText}>
                      {filterInputs.date ? filterInputs.date.toLocaleDateString("pt-BR") : 'Qualquer Data'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && <DateTimePicker value={filterInputs.date || new Date()} mode="date" display="default" onChange={(e, date) => { setShowDatePicker(false); date && handleFilterChange("date", date); }} />}
                </>
              )}
              {Platform.OS === "ios" && (
                <View style={styles.iosPickerContainer}>
                  <Icon name="calendar" size={20} color="#374151" />
                  <DateTimePicker value={filterInputs.date || new Date()} mode="date" display="default" onChange={(e, date) => date && handleFilterChange("date", date)} />
                </View>
              )}
              {filterInputs.date && (
                <Button variant="link" onPress={() => handleFilterChange('date', null)} style={{ alignSelf: 'flex-start' }}>
                  <Text style={{color: '#4F46E5'}}>Limpar Data</Text>
                </Button>
              )}

              <Label>Região (Bairros)</Label>
              <SelectedNeighborhoods selected={filterInputs.region} onRemove={removeNeighborhood} />
              <Button variant="outline" onPress={openNeighborhoodModal} style={styles.languageButton}>
                <Icon name="plus" size={16} color="#374151" style={{ marginRight: 8 }} />
                <Text>Adicionar Bairro</Text>
              </Button>

              <Label>Quantidade de Pessoas: {filterInputs.guestCount === 0 ? 'Qualquer' : filterInputs.guestCount}</Label>
              <Slider style={{ width: "100%", height: 40 }} minimumValue={0} maximumValue={20} step={1} value={filterInputs.guestCount} onValueChange={v => handleFilterChange("guestCount", v)} />
              
              <Label>Faixa Etária</Label>
              <Select options={ageGroupOptions} selectedValue={filterInputs.ageGroup} onValueChange={v => handleFilterChange("ageGroup", v)} />

              <Label>Idiomas Falados</Label>
              <SelectedLanguages selected={filterInputs.languages} onRemove={handleLanguageRemove} />
              <Button variant="outline" onPress={openLanguageModal} style={styles.languageButton}>
                <Icon name="plus" size={16} color="#374151" style={{ marginRight: 8 }} />
                <Text>Adicionar Idioma</Text>
              </Button>
              
              <View style={styles.buttonContainer}>
                <Button variant="outline" onPress={clearFilters} style={{ flex: 1 }}><Text>Limpar</Text></Button>
                <Button onPress={applyFilters} style={{ flex: 1 }} disabled={isFiltering}>
                  {isFiltering ? <ActivityIndicator color="white" /> : <Text style={{ color: "white" }}>Buscar Eventos</Text>}
                </Button>
              </View>
            </View>
          </Animated.View>
        </Card>

        {/* Título da Lista Principal (Matches) */}
        <Text style={styles.resultsTitle}>
            {activeFilters ? `Resultados (${results.matches.length})` : `Todos os Eventos (${results.matches.length})`}
        </Text>
        
        {/* Lista de Eventos (Matches) */}
        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" style={{ marginTop: 32 }} />
        ) : (
          <FlatList 
            data={results.matches} 
            keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)} 
            scrollEnabled={false} 
            renderItem={renderEvent} 
            ListEmptyComponent={
                results.others.length === 0 ? (
                    <View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum evento encontrado.</Text></View>
                ) : (
                    <View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum evento corresponde exatamente ao seu filtro.</Text></View>
                )
            } 
          />
        )}

        {/* Seção "Outros" (Eventos que não bateram com o filtro) */}
        {!isLoading && activeFilters && results.others.length > 0 && (
            <View style={styles.othersSection}>
                <View style={styles.divider} />
                <Text style={styles.resultsTitle}>Outros ({results.others.length})</Text>
                <Text style={styles.subtitleText}>Eventos que podem te interessar:</Text>
                
                <FlatList 
                    data={results.others} 
                    keyExtractor={(item, index) => item?.id ? String(item.id) : String(index)} 
                    scrollEnabled={false} 
                    renderItem={renderEvent} 
                />
            </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: "#F9FAFB" 
  },
  container: { 
    padding: 16, 
    flexGrow: 1 
  },
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
  resultsTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "#1F2937", 
    marginBottom: 16 
  },
  subtitleText: {
    fontSize: 14,
    color: "#6B7280", 
    marginBottom: 16, 
    marginTop: -8,
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
  othersSection: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: "#E5E7EB",
    marginVertical: 24,
  }
});