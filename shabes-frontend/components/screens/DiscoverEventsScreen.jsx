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
  RefreshControl,
  TextInput 
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
import MaterialIcon from "@expo/vector-icons/MaterialCommunityIcons"; 

// API functions and Hooks
import { getEvents } from "../../services/api";
import { toast } from "../../hooks/use-toast";

// 👇 CONFIGURAÇÃO PESSACH 2026 👇
const PESSACH_DAYS = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-07', '2026-04-08', '2026-04-09'];
const GOLD_COLOR = "#D4AF37";

const ageGroupOptions = [
  { label: "Qualquer Faixa Etária", value: "" },
  { label: "Jovens", value: "young-adults" },
  { label: "Adultos", value: "adults" },
  { label: "Seniores", value: "seniores" },
];

const saoPauloNeighborhoods = [
  "Higienopolis/Santa Cecilia", "Pacaembú", "Perdizes",
  "Bom Retiro", "Jardins", "Jardim das Perdizes", "Jardim Paulista", "Jardim Europa", "Vila Nova Conceição", "Vila Madalena", "Itaim Bibi", "Pompeia",
];

const availableLanguages = [
  "Português", "Inglês", "Hebraico", "Iídiche", "Espanhol", "Outros"
];

const FilterChip = ({ label, selected, onPress }) => (
  <TouchableOpacity
    onPress={() => onPress(label)}
    style={[
      styles.chip,
      selected ? styles.chipSelected : styles.chipUnselected
    ]}
  >
    <Text style={[
      styles.chipText,
      selected ? styles.chipTextSelected : styles.chipTextUnselected
    ]}>{label}</Text>
  </TouchableOpacity>
);

const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  return (
    d1.getDate() === d2.getDate() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getFullYear() === d2.getFullYear()
  );
};

const isEventMatch = (event, filters) => {
  if (filters.date) { 
    if (!isSameDay(event.date, filters.date)) return false; 
  }
  if (filters.region && filters.region.length > 0) {
    const eventMatchesRegion = filters.region.some(r => event.approximate_address && event.approximate_address.includes(r));
    if (!eventMatchesRegion) return false;
  }
  if (filters.guestCount > 0) {
    if (event.max_guests !== 0 && event.max_guests < filters.guestCount) return false;
  }
  if (filters.ageGroup && filters.ageGroup !== "") {
    if (event.target_audience !== filters.ageGroup) return false;
  }
  if (filters.languages && filters.languages.length > 0) {
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

  // 👇 VERIFICA SE A DATA FILTRADA É PESSACH 👇
  const isFilterDatePessach = filterInputs.date && PESSACH_DAYS.includes(filterInputs.date.toISOString().split('T')[0]);

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

  const handleFilterChange = (key, value) => setFilterInputs(prev => ({ ...prev, [key]: value }));

  const handleGuestsTextChange = (text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    const finalValue = numericValue === '' ? 0 : parseInt(numericValue, 10);
    handleFilterChange("guestCount", finalValue);
  };

  const incrementGuests = () => {
    handleFilterChange("guestCount", filterInputs.guestCount + 1);
  };

  const decrementGuests = () => {
    handleFilterChange("guestCount", filterInputs.guestCount > 0 ? filterInputs.guestCount - 1 : 0);
  };

  const toggleNeighborhood = (neighborhood) => {
    setFilterInputs(prev => {
        const current = prev.region;
        const updated = current.includes(neighborhood)
            ? current.filter(n => n !== neighborhood)
            : [...current, neighborhood];
        return { ...prev, region: updated };
    });
  };

  const toggleLanguage = (lang) => {
    setFilterInputs(prev => {
        const current = prev.languages;
        const updated = current.includes(lang)
            ? current.filter(l => l !== lang)
            : [...current, lang];
        return { ...prev, languages: updated };
    });
  };

  useEffect(() => {
    if (!allEvents || allEvents.length === 0) {
        setResults({ matches: [], others: [] });
        return;
    }
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
      if (res.data) setAllEvents(res.data);
      else setAllEvents([]);
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
    
    // 👇 LOGICA DE IDENTIFICAÇÃO DE PESSACH NO CARD 👇
    const eventDateStr = item.date ? item.date.split('T')[0] : "";
    const isPessach = PESSACH_DAYS.includes(eventDateStr);

    return (
        <TouchableOpacity 
          onPress={() => navigation.navigate("EventDetail", { eventId: item.id })} 
          style={[
            { marginBottom: 16 },
            isPessach && { borderColor: GOLD_COLOR, borderWidth: 1.5, borderRadius: 14 } // 👇 BORDA DOURADA 👇
          ]}
        >
            <EventCard event={item} isPessach={isPessach} />
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
        keyboardDismissMode="on-drag"
      >
        <Card style={[styles.filterCard, activeFilters?.date && isFilterDatePessach && { borderColor: GOLD_COLOR }]}>
          <TouchableOpacity onPress={toggleFilters} style={styles.filterHeader}>
            <Text style={[styles.filterHeaderText, isFilterDatePessach && { color: GOLD_COLOR }]}>
              {isFilterDatePessach ? "Filtrar Pessach 🍷" : "Filtrar resultados"}
            </Text>
            <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
              <Icon name="chevron-down" size={24} color={isFilterDatePessach ? GOLD_COLOR : "#374151"} />
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
                  <TouchableOpacity 
                    onPress={() => setShowDatePicker(true)} 
                    style={[styles.dateButton, isFilterDatePessach && { borderColor: GOLD_COLOR, backgroundColor: '#FFFDF0' }]}
                  >
                    <Icon name={isFilterDatePessach ? "star" : "calendar"} size={20} color={isFilterDatePessach ? GOLD_COLOR : "#374151"} />
                    <Text style={[styles.dateButtonText, isFilterDatePessach && { color: GOLD_COLOR, fontWeight: 'bold' }]}>
                      {filterInputs.date ? filterInputs.date.toLocaleDateString("pt-BR") : 'Qualquer Data'}
                    </Text>
                  </TouchableOpacity>
                  {showDatePicker && <DateTimePicker value={filterInputs.date || new Date()} mode="date" display="default" onChange={(e, date) => { setShowDatePicker(false); date && handleFilterChange("date", date); }} />}
                </>
              )}
              {Platform.OS === "ios" && (
                <View style={[styles.iosPickerContainer, isFilterDatePessach && { backgroundColor: '#FFFDF0' }]}>
                  <Icon name={isFilterDatePessach ? "star" : "calendar"} size={20} color={isFilterDatePessach ? GOLD_COLOR : "#374151"} />
                  <DateTimePicker value={filterInputs.date || new Date()} mode="date" display="default" onChange={(e, date) => date && handleFilterChange("date", date)} />
                </View>
              )}
              {filterInputs.date && (
                <Button variant="link" onPress={() => handleFilterChange('date', null)} style={{ alignSelf: 'flex-start' }}>
                  <Text style={{color: isFilterDatePessach ? GOLD_COLOR : '#4F46E5'}}>Limpar Data</Text>
                </Button>
              )}

              <Label>Região (Bairros)</Label>
              <View style={styles.chipsContainer}>
                {saoPauloNeighborhoods.map((neighborhood) => (
                    <FilterChip 
                        key={neighborhood} 
                        label={neighborhood} 
                        selected={filterInputs.region.includes(neighborhood)}
                        onPress={toggleNeighborhood}
                    />
                ))}
              </View>

              <Label>Vagas Necessárias</Label>
              <View style={styles.stepperContainer}>
                <TouchableOpacity 
                  style={[styles.stepperButton, filterInputs.guestCount === 0 && styles.stepperButtonDisabled]} 
                  onPress={decrementGuests}
                  disabled={filterInputs.guestCount === 0}
                >
                  <MaterialIcon name="minus" size={24} color={filterInputs.guestCount === 0 ? "#9CA3AF" : "#4F46E5"} />
                </TouchableOpacity>
                
                <View style={styles.stepperValueBox}>
                  <TextInput
                    style={styles.stepperInput}
                    keyboardType="numeric"
                    value={filterInputs.guestCount === 0 ? "" : String(filterInputs.guestCount)}
                    onChangeText={handleGuestsTextChange}
                    placeholder="Mínimo"
                    placeholderTextColor="#9CA3AF"
                    maxLength={2}
                  />
                </View>

                <TouchableOpacity 
                  style={styles.stepperButton} 
                  onPress={incrementGuests}
                >
                  <MaterialIcon name="plus" size={24} color="#4F46E5" />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>Mostrar apenas eventos com esta capacidade.</Text>
              
              <Label>Idiomas Falados</Label>
              <View style={styles.chipsContainer}>
                {availableLanguages.map((lang) => (
                    <FilterChip 
                        key={lang} 
                        label={lang} 
                        selected={filterInputs.languages.includes(lang)}
                        onPress={toggleLanguage}
                    />
                ))}
              </View>
              
              <View style={styles.buttonContainer}>
                <Button variant="outline" onPress={clearFilters} style={{ flex: 1 }}><Text>Limpar</Text></Button>
                <Button 
                  onPress={applyFilters} 
                  style={[{ flex: 1 }, isFilterDatePessach && { backgroundColor: GOLD_COLOR }]} 
                  disabled={isFiltering}
                >
                  {isFiltering ? <ActivityIndicator color="white" /> : <Text style={{ color: "white" }}>Buscar {isFilterDatePessach ? "Pessach" : "Eventos"}</Text>}
                </Button>
              </View>
            </View>
          </Animated.View>
        </Card>

        <Text style={styles.resultsTitle}>
            {activeFilters ? `Resultados (${results.matches.length})` : `Todos os Eventos (${results.matches.length})`}
        </Text>
        
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
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, flexGrow: 1 },
  filterCard: { marginBottom: 24 },
  filterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "white", borderRadius: 8, zIndex: 1 },
  filterHeaderText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  filtersContent: { paddingHorizontal: 12, paddingTop: 16, paddingBottom: 12, flexDirection: "column", gap: 12 },
  dateButton: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, backgroundColor: "white", gap: 8 },
  dateButtonText: { fontSize: 16, color: "#374151" },
  iosPickerContainer: { flexDirection: "row", alignItems: "center", gap: 8, paddingLeft: 10, backgroundColor: "white", borderRadius: 8, paddingVertical: 4 },
  buttonContainer: { flexDirection: "row", gap: 12, marginTop: 12 },
  chipsContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, borderWidth: 1, marginBottom: 4 },
  chipSelected: { backgroundColor: "#4F46E5", borderColor: "#4F46E5" },
  chipUnselected: { backgroundColor: "#FFFFFF", borderColor: "#D1D5DB" },
  chipText: { fontSize: 14, fontWeight: "500" },
  chipTextSelected: { color: "#FFFFFF" },
  chipTextUnselected: { color: "#374151" },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, width: '100%' },
  stepperButton: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  stepperButtonDisabled: { backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
  stepperValueBox: { flex: 1, height: 44, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepperInput: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', width: '100%', height: '100%' },
  helperText: { fontSize: 12, color: "#6B7280", marginTop: -4, marginBottom: 4 },
  resultsTitle: { fontSize: 20, fontWeight: "600", color: "#1F2937", marginBottom: 16 },
  subtitleText: { fontSize: 14, color: "#6B7280", marginBottom: 16, marginTop: -8 },
  emptyContainer: { alignItems: "center", padding: 32 },
  emptyText: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  othersSection: { marginTop: 16 },
  divider: { height: 1, backgroundColor: "#E5E7EB", marginVertical: 24 }
});