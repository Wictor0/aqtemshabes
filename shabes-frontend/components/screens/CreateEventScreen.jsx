import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator, 
  Keyboard
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import Slider from "@react-native-community/slider"; 

// UI Components
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/Card";
import { Select } from "../ui/Select";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

// Hooks, API & Utils
import { toast } from "../../hooks/use-toast";
import { createEvent } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

// Listas de Opções
const AUDIENCE_OPTIONS = [
  { id: "any", label: "Qualquer pessoa" },
  { id: "families", label: "Famílias" },
  { id: "young-adults", label: "Jovens" },
  { id: "seniors", label: "Seniores" },
];

const LANGUAGE_OPTIONS = [
  "Português",
  "Inglês",
  "Hebraico",
  "Espanhol",
  "Iídiche",
  "Francês",
  "Outros"
];

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

// Componente para exibir idiomas (Múltipla escolha)
const SelectedLanguages = ({ selected, onRemove }) => {
  if (selected.length === 0) {
    return <Text style={styles.placeholderText}>Nenhum idioma selecionado</Text>;
  }
  return (
    <View style={styles.languageContainer}>
      {selected.map((lang) => (
        <View key={lang} style={styles.languageChipSelected}>
          <Text style={styles.languageChipTextSelected}>{lang}</Text>
          <TouchableOpacity
            onPress={() => onRemove(lang)}
            style={{ marginLeft: 8 }}
          >
            <Icon name="close-circle" size={16} color="white" />
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default function CreateEventScreen({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Controles de data
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  // Lógica de Data Inicial
  const getInitialValidDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1); 
    while (d.getDay() !== 5 && d.getDay() !== 6) {
      d.setDate(d.getDate() + 1);
    }
    return d;
  };

  const getMealTypeForDate = (date) => {
    const day = date.getDay();
    if (day === 5) return 'jantar'; 
    if (day === 6) return 'almoço'; 
    return 'jantar'; 
  };

  const initialDate = getInitialValidDate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: initialDate,
    deadline: new Date(initialDate.getTime() - 24 * 60 * 60 * 1000), // Padrão: 1 dia antes
    maxGuests: 0, 
    targetAudience: [], 
    languages: ["Português"],
    mealType: getMealTypeForDate(initialDate), 
    
    // Endereço Simplificado (Apenas Bairro)
    neighborhood: "", 
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Handler para seleção de bairro único
  const handleNeighborhoodSelect = (neighborhood) => {
      setFormData(prev => ({
          ...prev,
          neighborhood: neighborhood
      }));
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDatePicker(false);
    
    if (selectedDate) {
      const day = selectedDate.getDay();
      
      if (day !== 5 && day !== 6) {
        Alert.alert("Data Inválida", "Eventos de Shabat só podem ser criados às Sextas-feiras ou Sábados.");
        return;
      }

      setFormData(prev => ({
        ...prev,
        date: selectedDate,
        mealType: day === 5 ? 'jantar' : 'almoço',
        // Ajusta o prazo sugerido para 1 dia antes da nova data
        deadline: new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000)
      }));
    }
  };

  const onDeadlineChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDeadlinePicker(false);
    if (selectedDate) {
      handleInputChange("deadline", selectedDate);
    }
  };

  const toggleLanguage = (language) => {
    setFormData((prev) => {
      const current = prev.languages;
      if (current.includes(language)) {
        return { ...prev, languages: current.filter((l) => l !== language) };
      } else {
        return { ...prev, languages: [...current, language] };
      }
    });
  };

  const toggleTargetAudience = (audienceId) => {
    setFormData((prev) => {
      const current = prev.targetAudience;
      if (current.includes(audienceId)) {
        return { ...prev, targetAudience: current.filter((id) => id !== audienceId) };
      } else {
        return { ...prev, targetAudience: [...current, audienceId] };
      }
    });
  };

  const addLanguage = (language) => {
    if (!formData.languages.includes(language)) {
      handleInputChange("languages", [...formData.languages, language]);
    }
  };

  const removeLanguage = (language) => {
    handleInputChange(
      "languages",
      formData.languages.filter((l) => l !== language)
    );
  };

  const openLanguageModal = () => {
    Alert.alert("Adicionar Idioma", "Selecione um idioma.", [
      { text: "Português", onPress: () => addLanguage("Português") },
      { text: "Inglês", onPress: () => addLanguage("Inglês") },
      { text: "Hebraico", onPress: () => addLanguage("Hebraico") },
      { text: "Iídiche", onPress: () => addLanguage("Iídiche") },
      { text: "Espanhol", onPress: () => addLanguage("Espanhol") },
      { text: "Outros", onPress: () => addLanguage("Outros") },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    // Validação
    if (
      !formData.title.trim() ||
      !formData.neighborhood // Valida se um bairro foi selecionado
    ) {
      return toast({ type: "error", title: "Campos obrigatórios", description: "Preencha o título e selecione um bairro." });
    }

    if (formData.targetAudience.length === 0) {
        return toast({ type: "error", title: "Público Alvo", description: "Selecione pelo menos um público alvo." });
    }
    
    if (formData.languages.length === 0) {
        return toast({ type: "error", title: "Idiomas", description: "Selecione pelo menos um idioma." });
    }

    // Validação de Prazo
    const eventDate = new Date(formData.date);
    eventDate.setHours(0,0,0,0);
    const deadlineDate = new Date(formData.deadline);
    deadlineDate.setHours(0,0,0,0);
    const today = new Date();
    today.setHours(0,0,0,0);

    if (deadlineDate >= eventDate) {
        return toast({ type: "error", title: "Prazo inválido", description: "O prazo de inscrição deve ser ANTES do dia do evento." });
    }

    if (deadlineDate < today) {
         return toast({ type: "error", title: "Prazo no passado", description: "O prazo de inscrição não pode ser uma data passada." });
    }

    setIsLoading(true);
    try {
      // Como removemos o endereço privado, usamos o Bairro como endereço completo
      const full_address = `${formData.neighborhood}, São Paulo - SP`;
      const approximate_address = formData.neighborhood; 

      const eventPayload = {
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        deadline_datetime: formData.deadline.toISOString(),
        full_address: full_address,
        approximate_address: approximate_address, 
        max_guests: formData.maxGuests,
        target_audience: formData.targetAudience,
        languages: formData.languages,
        meal_type: formData.mealType,
        host_id: user.id,
      };

      await createEvent(eventPayload);

      toast({ type: "success", title: "Evento criado com sucesso!" });
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({ type: "error", title: "Erro ao criar evento", description: "Ocorreu um problema ao salvar. Tente novamente." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled" 
            keyboardDismissMode="on-drag"
        >
            <View style={styles.contentWrapper}>
              
              {/* CARD 1: INFORMAÇÕES DO EVENTO */}
              <Card style={{ width: "100%", marginBottom: 20 }}>
                <CardHeader>
                  <CardTitle>Informações do Evento</CardTitle>
                  <CardDescription>
                    Detalhes principais, data e público.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  
                  <View style={styles.formSection}>
                    <Label>Título do Evento</Label>
                    <Input
                      value={formData.title}
                      onChangeText={(v) => handleInputChange("title", v)}
                      placeholder="Ex: Shabat Familiar em Jardins"
                    />
                  </View>

                  <View style={styles.formSection}>
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChangeText={(v) => handleInputChange("description", v)}
                      placeholder="Conte um pouco sobre o seu evento..."
                    />
                  </View>

                  {/* DATA DO EVENTO */}
                  <View style={styles.formSection}>
                    <Label>Data do Evento</Label>
                    {Platform.OS === "android" && (
                      <>
                        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                          {/* CORREÇÃO: "calendar" -> "calendar-month" */}
                          <Icon name="calendar-month" size={24} color="#374151" />
                          <Text style={styles.dateButtonText}>
                            {formData.date.toLocaleDateString("pt-BR")}
                          </Text>
                        </TouchableOpacity>
                        {showDatePicker && (
                          <DateTimePicker
                            value={formData.date}
                            mode="date" 
                            display="default"
                            onChange={onDateChange}
                            minimumDate={new Date()}
                          />
                        )}
                      </>
                    )}
                    {Platform.OS === "ios" && (
                      <View style={styles.iosPickerContainer}>
                        {/* CORREÇÃO: "calendar" -> "calendar-month" */}
                        <Icon name="calendar-month" size={24} color="#374151" />
                        <DateTimePicker
                          value={formData.date}
                          mode="date"
                          display="default"
                          onChange={onDateChange}
                          minimumDate={new Date()}
                          locale="pt-BR"
                        />
                      </View>
                    )}
                    {/* Feedback Turno */}
                    <View style={styles.autoMealContainer}>
                        {/* 👇 CORREÇÃO DOS ÍCONES SOL/LUA 👇 */}
                        <Icon 
                            name={formData.mealType === 'jantar' ? "weather-night" : "weather-sunny"} 
                            size={16} 
                            color="#4F46E5" 
                        />
                        <Text style={styles.autoMealText}>
                            {formData.date.getDay() === 5 
                                ? "Sexta-feira | Jantar" 
                                : "Sábado | Almoço"}
                        </Text>
                    </View>
                  </View>

                  {/* PRAZO LIMITE */}
                  <View style={styles.formSection}>
                    <Label>Data Limite para Inscrições</Label>
                    <Text style={styles.helperText}>Até qual dia aceita pedidos?</Text>
                    {Platform.OS === "android" && (
                      <>
                        <TouchableOpacity onPress={() => setShowDeadlinePicker(true)} style={[styles.dateButton, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}>
                          {/* CORREÇÃO: "clock" -> "clock-outline" */}
                          <Icon name="clock-outline" size={24} color="#D97706" />
                          <Text style={[styles.dateButtonText, { color: '#D97706', fontWeight: '600' }]}>
                            {formData.deadline.toLocaleDateString("pt-BR")}
                          </Text>
                        </TouchableOpacity>
                        {showDeadlinePicker && (
                          <DateTimePicker
                            value={formData.deadline}
                            mode="date"
                            display="default"
                            onChange={onDeadlineChange}
                            minimumDate={new Date()}
                          />
                        )}
                      </>
                    )}
                    {Platform.OS === "ios" && (
                      <View style={[styles.iosPickerContainer, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]}>
                        {/* CORREÇÃO: "clock" -> "clock-outline" */}
                        <Icon name="clock-outline" size={24} color="#D97706" />
                        <DateTimePicker
                          value={formData.deadline}
                          mode="date"
                          display="default"
                          onChange={onDeadlineChange}
                          minimumDate={new Date()}
                          locale="pt-BR"
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.formSection}>
                    <Label>Nº de Convidados</Label>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#4F46E5' }}>
                        {formData.maxGuests === 0 ? "Qualquer" : formData.maxGuests}
                      </Text>
                    </View>
                    <Slider
                      style={{ width: "100%", height: 40 }}
                      minimumValue={0}
                      maximumValue={100}
                      step={1}
                      value={formData.maxGuests}
                      onValueChange={(v) => handleInputChange("maxGuests", v)}
                      minimumTrackTintColor="#4F46E5"
                      maximumTrackTintColor="#E5E7EB"
                      thumbTintColor="#4F46E5"
                    />
                    <Text style={styles.helperText}>0 para ilimitado.</Text>
                  </View>

                  <View style={styles.formSection}>
                    <Label>Público Alvo</Label>
                    <View style={styles.chipsContainer}>
                      {AUDIENCE_OPTIONS.map((option) => {
                        const isSelected = formData.targetAudience.includes(option.id);
                        return (
                          <TouchableOpacity
                            key={option.id}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => toggleTargetAudience(option.id)}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {option.label}
                            </Text>
                            {isSelected && <Icon name="check" size={14} color="#FFF" style={{marginLeft: 4}} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formSection}>
                    <Label>Idiomas</Label>
                    <View style={styles.chipsContainer}>
                      {LANGUAGE_OPTIONS.map((lang) => {
                        const isSelected = formData.languages.includes(lang);
                        return (
                          <TouchableOpacity
                            key={lang}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => toggleLanguage(lang)}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {lang}
                            </Text>
                            {isSelected && <Icon name="check" size={14} color="#FFF" style={{marginLeft: 4}} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                </CardContent>
              </Card>

              {/* CARD 2: ENDEREÇO (Apenas Bairros de SP) */}
              <Card style={{ width: "100%" }}>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                  <CardDescription>
                    Selecione o bairro onde ocorrerá o evento.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <View style={styles.formSection}>
                    <Label>Bairro</Label>
                    <View style={styles.chipsContainer}>
                      {saoPauloNeighborhoods.map((bairro) => {
                        const isSelected = formData.neighborhood === bairro;
                        return (
                          <TouchableOpacity
                            key={bairro}
                            style={[styles.chip, isSelected && styles.chipSelected]}
                            onPress={() => handleNeighborhoodSelect(bairro)}
                          >
                            <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                              {bairro}
                            </Text>
                            {isSelected && <Icon name="check" size={14} color="#FFF" style={{marginLeft: 4}} />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                    <Text style={styles.helperText}>
                       Este bairro será exibido publicamente para os interessados.
                    </Text>
                  </View>
                </CardContent>
              </Card>

              {/* Botão Criar */}
              <View style={{ width: "100%", marginTop: 20 }}>
                <Button
                  onPress={handleSubmit}
                  disabled={isLoading}
                  variant="host"
                  style={{ 
                    width: "100%", 
                    alignItems: "center", 
                    justifyContent: "center",
                    flexDirection: "row" 
                  }}
                >
                  {isLoading ? (
                    <LoadingSpinner size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold", textAlign: "center" }}>
                      Criar Evento
                    </Text>
                  )}
                </Button>
              </View>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, flexGrow: 1 },
  contentWrapper: { width: "100%", maxWidth: 700, alignItems: 'center' },
  formSection: { gap: 8, marginBottom: 16 },
  helperText: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "white",
    gap: 8,
  },
  dateButtonText: { fontSize: 16, color: "#374151" },
  iosPickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    paddingLeft: 4,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: "white",
  },
  placeholderText: { color: "#6B7280", fontStyle: "italic" },
  
  languageContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  languageChipSelected: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#4F46E5",
  },
  languageChipTextSelected: { color: "white", fontWeight: "500" },
  
  mealTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  mealTypeTag: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#D1D5DB', 
    backgroundColor: '#FFFFFF',
  },
  mealTypeTagSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  mealTypeTagText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  mealTypeTagTextSelected: {
    color: '#FFFFFF',
  },

  autoMealContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      backgroundColor: '#EEF2FF',
      padding: 8,
      borderRadius: 6,
      alignSelf: 'flex-start'
  },
  autoMealText: {
      color: '#4F46E5',
      fontSize: 13,
      fontWeight: '600'
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  chipSelected: {
    borderColor: '#4F46E5',
    backgroundColor: '#4F46E5',
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
});