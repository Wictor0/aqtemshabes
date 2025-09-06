import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

// UI Components
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import { Select } from "../ui/Select";
import { Label } from "../ui/Label";
import { Input } from "../ui/Input";
import EventCard from "../cards/EventCard";
import Icon from "../ui/Icon";
import Slider from "@react-native-community/slider";

// API functions and Hooks
import { getEvents } from "../../services/api";
import { toast } from "../../hooks/use-toast";

// Options and helper components
const ageGroupOptions = [
  { label: "Qualquer Faixa Etária", value: "" },
  { label: "Famílias", value: "families" },
  { label: "Jovens", value: "young-adults" },
  { label: "Seniores", value: "seniors" },
  { label: "Misto", value: "mixed" },
];

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
    // Initial search on component mount
    applyFilters();
  }, []);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };
  
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
      // In a real app, you would pass the filters to the API call
      // const response = await getEvents(filters);
      const response = await getEvents(); // Using mock for now
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
                {/* Date Filter */}
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
                
                {/* Other Filters */}
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
  );
}

const styles = StyleSheet.create({
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
