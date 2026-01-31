import React, { useState, useEffect } from "react";
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
  Keyboard,
  TextInput // Importado para permitir a digitação no stepper
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

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
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

// Hooks, API & Utils
import { toast } from "../../hooks/use-toast";
import { createEvent, getMatchesForGuest } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
// Importação do serviço de notificações para o gatilho local
import { showLocalNotification } from "../../services/notificationService";

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
  "Higienópolis/Santa Cecilia",
  "Pacaembú",
  "Perdizes",
  "Bom Retiro",
  "Jardins",
  "Jardim das Perdizes",
  "Jardim Paulista",
  "Jardim Europa",
  "Vila Nova Conceição",
  "Vila Madalena",
  "Itaim Bibi",
  "Pompeia",
];

export default function CreateEventScreen({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [guestDates, setGuestDates] = useState([]); 
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  useEffect(() => {
    const fetchGuestStatus = async () => {
      try {
        if (!user?.id) return;
        const response = await getMatchesForGuest(user.id);
        const confirmedDates = response.data
          .filter(m => m.status === 'accepted' || m.status === 'ACCEPTED')
          .map(m => new Date(m.event.date).toISOString().split('T')[0]);
        setGuestDates(confirmedDates);
      } catch (error) {
        console.error("Erro ao procurar agenda de convidado:", error);
      }
    };
    fetchGuestStatus();
  }, [user?.id]);

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
    return day === 6 ? 'almoço' : 'jantar'; 
  };

  const initialDate = getInitialValidDate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: initialDate,
    deadline: new Date(initialDate.getTime() - 24 * 60 * 60 * 1000), 
    maxGuests: 0, 
    targetAudience: [], 
    languages: ["Português"],
    mealType: getMealTypeForDate(initialDate), 
    neighborhood: "", 
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Função para lidar com a digitação direta do número de convidados
  const handleGuestsTextChange = (text) => {
    // Remove qualquer caractere que não seja número
    const numericValue = text.replace(/[^0-9]/g, '');
    const finalValue = numericValue === '' ? 0 : parseInt(numericValue, 10);
    handleInputChange("maxGuests", finalValue);
  };

  const incrementGuests = () => {
    setFormData(prev => ({ ...prev, maxGuests: prev.maxGuests + 1 }));
  };

  const decrementGuests = () => {
    setFormData(prev => ({ 
      ...prev, 
      maxGuests: prev.maxGuests > 0 ? prev.maxGuests - 1 : 0 
    }));
  };

  const handleNeighborhoodSelect = (neighborhood) => {
    setFormData(prev => ({ ...prev, neighborhood }));
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
        mealType: day === 6 ? 'almoço' : 'jantar',
        deadline: new Date(selectedDate.getTime() - 24 * 60 * 60 * 1000)
      }));
    }
  };

  const onDeadlineChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDeadlinePicker(false);
    if (selectedDate) handleInputChange("deadline", selectedDate);
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

  const handleSubmit = async () => {
    const selectedDateString = formData.date.toISOString().split('T')[0];
    if (guestDates.includes(selectedDateString)) {
      return toast({ 
        type: "error", 
        title: "Conflito de Agenda", 
        description: "Você já tem um evento confirmado como convidado para este dia." 
      });
    }

    if (!formData.title.trim() || !formData.neighborhood) {
      return toast({ type: "error", title: "Campos obrigatórios", description: "Preencha o título e selecione um bairro." });
    }

    if (formData.targetAudience.length === 0) {
      return toast({ type: "error", title: "Público Alvo", description: "Selecione pelo menos um público alvo." });
    }
    
    if (formData.languages.length === 0) {
      return toast({ type: "error", title: "Idiomas", description: "Selecione pelo menos um idioma." });
    }

    const eventDate = new Date(formData.date);
    eventDate.setHours(0,0,0,0);
    const deadlineDate = new Date(formData.deadline);
    deadlineDate.setHours(0,0,0,0);

    if (deadlineDate >= eventDate) {
      return toast({ type: "error", title: "Prazo inválido", description: "O prazo de inscrição deve ser ANTES do dia do evento." });
    }

    setIsLoading(true);
    try {
      const eventPayload = {
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        deadline_datetime: formData.deadline.toISOString(),
        full_address: `${formData.neighborhood}, São Paulo - SP`,
        approximate_address: formData.neighborhood, 
        max_guests: formData.maxGuests,
        target_audience: formData.targetAudience,
        languages: formData.languages,
        meal_type: formData.mealType,
        host_id: user.id,
      };

      await createEvent(eventPayload);

      // Notificação push local de sucesso
      await showLocalNotification("AquiTemShabes", `Evento ${formData.title} criado`);

      toast({ type: "success", title: "Evento criado com sucesso!" });
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({ type: "error", title: "Erro ao criar evento", description: "Ocorreu um problema ao salvar." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={styles.container} 
          keyboardShouldPersistTaps="handled" 
          keyboardDismissMode="on-drag"
        >
          <View style={styles.contentWrapper}>
            <Card style={{ width: "100%", marginBottom: 20 }}>
              <CardHeader>
                <CardTitle>Informações do Evento</CardTitle>
                <CardDescription>Detalhes principais, data e público.</CardDescription>
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

                <View style={styles.formSection}>
                  <Label>Data do Evento</Label>
                  {Platform.OS === "android" ? (
                    <>
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                        <Icon name="calendar-month" size={24} color="#374151" />
                        <Text style={styles.dateButtonText}>{formData.date.toLocaleDateString("pt-BR")}</Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
                      )}
                    </>
                  ) : (
                    <View style={styles.iosPickerContainer}>
                      <Icon name="calendar-month" size={24} color="#374151" />
                      <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} locale="pt-BR" />
                    </View>
                  )}
                  <View style={styles.autoMealContainer}>
                    <Icon name={formData.mealType === 'jantar' ? "weather-night" : "weather-sunny"} size={16} color="#4F46E5" />
                    <Text style={styles.autoMealText}>{formData.date.getDay() === 5 ? "Sexta-feira | Jantar" : "Sábado | Almoço"}</Text>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Label>Data Limite para Inscrições</Label>
                  {Platform.OS === "android" ? (
                    <>
                      <TouchableOpacity onPress={() => setShowDeadlinePicker(true)} style={[styles.dateButton, { borderColor: '#FFFBEB', backgroundColor: '#FFFBEB' }]}>
                        <Icon name="clock-outline" size={24} color="#D97706" />
                        <Text style={[styles.dateButtonText, { color: '#D97706', fontWeight: '600' }]}>{formData.deadline.toLocaleDateString("pt-BR")}</Text>
                      </TouchableOpacity>
                      {showDeadlinePicker && (
                        <DateTimePicker value={formData.deadline} mode="date" display="default" onChange={onDeadlineChange} minimumDate={new Date()} />
                      )}
                    </>
                  ) : (
                    <View style={[styles.iosPickerContainer, { borderColor: '#0d00ff00', backgroundColor: '#b6b2fa00' }]}>
                      <Icon name="clock-outline" size={24} color="#374151" />
                      <DateTimePicker value={formData.deadline} mode="date" display="default" onChange={onDeadlineChange} minimumDate={new Date()} locale="pt-BR" />
                    </View>
                  )}
                </View>

                {/* Seletor Numérico (Stepper) para Convidados com Digitação Direta */}
                <View style={styles.formSection}>
                  <Label>Nº Limite para Convidados</Label>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity 
                      style={[styles.stepperButton, formData.maxGuests === 0 && styles.stepperButtonDisabled]} 
                      onPress={decrementGuests}
                      disabled={formData.maxGuests === 0}
                    >
                      <Icon name="minus" size={24} color={formData.maxGuests === 0 ? "#9CA3AF" : "#4F46E5"} />
                    </TouchableOpacity>
                    
                    <View style={styles.stepperValueBox}>
                      <TextInput
                        style={styles.stepperInput}
                        keyboardType="numeric"
                        value={formData.maxGuests === 0 ? "" : String(formData.maxGuests)}
                        onChangeText={handleGuestsTextChange}
                        placeholder="Sem Limite"
                        placeholderTextColor="#9CA3AF"
                        maxLength={3} // Limite razoável de convidados
                      />
                    </View>

                    <TouchableOpacity 
                      style={styles.stepperButton} 
                      onPress={incrementGuests}
                    >
                      <Icon name="plus" size={24} color="#4F46E5" />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.helperText}>0 ou vazio para ilimitado.</Text>
                </View>

                <View style={styles.formSection}>
                  <Label>Público Alvo</Label>
                  <View style={styles.chipsContainer}>
                    {AUDIENCE_OPTIONS.map((option) => {
                      const isSelected = formData.targetAudience.includes(option.id);
                      return (
                        <TouchableOpacity key={option.id} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => toggleTargetAudience(option.id)}>
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{option.label}</Text>
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
                        <TouchableOpacity key={lang} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => toggleLanguage(lang)}>
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{lang}</Text>
                          {isSelected && <Icon name="check" size={14} color="#FFF" style={{marginLeft: 4}} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card style={{ width: "100%" }}>
              <CardHeader>
                <CardTitle>Endereço</CardTitle>
                <CardDescription>Selecione o bairro onde ocorrerá o evento.</CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.formSection}>
                  <Label>Bairro</Label>
                  <View style={styles.chipsContainer}>
                    {saoPauloNeighborhoods.map((bairro) => {
                      const isSelected = formData.neighborhood === bairro;
                      return (
                        <TouchableOpacity key={bairro} style={[styles.chip, isSelected && styles.chipSelected]} onPress={() => handleNeighborhoodSelect(bairro)}>
                          <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>{bairro}</Text>
                          {isSelected && <Icon name="check" size={14} color="#FFF" style={{marginLeft: 4}} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </CardContent>
            </Card>

            <View style={{ width: "100%", marginTop: 20 }}>
              <Button onPress={handleSubmit} disabled={isLoading} variant="host" style={styles.submitButton}>
                {isLoading ? <LoadingSpinner size="small" color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Criar Evento</Text>}
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
  formSection: { gap: 8, marginBottom: 16, width: '100%' },
  helperText: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  dateButton: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#F9FAFB", borderRadius: 8, backgroundColor: "white", gap: 8 },
  dateButtonText: { fontSize: 16, color: "#374151" },
  iosPickerContainer: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderColor: "#F9FAFB", borderRadius: 8, borderWidth: 1, backgroundColor: "white" },
  autoMealContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, backgroundColor: '#EEF2FF', padding: 8, borderRadius: 6, alignSelf: 'flex-start' },
  autoMealText: { color: '#4F46E5', fontSize: 13, fontWeight: '600' },
  stepperContainer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4, width: '100%' },
  stepperButton: { width: 44, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', elevation: 1 },
  stepperButtonDisabled: { backgroundColor: '#F3F4F6', borderColor: '#F3F4F6' },
  stepperValueBox: { flex: 1, height: 44, backgroundColor: 'white', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  stepperInput: { fontSize: 18, fontWeight: 'bold', color: '#1F2937', textAlign: 'center', width: '100%', height: '100%' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1, borderColor: '#D1D5DB', backgroundColor: '#F9FAFB' },
  chipSelected: { borderColor: '#4F46E5', backgroundColor: '#4F46E5' },
  chipText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  chipTextSelected: { color: '#FFFFFF' },
  submitButton: { width: "100%", alignItems: "center", justifyContent: "center", flexDirection: "row", height: 50 },
  submitButtonText: { color: "#FFFFFF", fontWeight: "bold", fontSize: 16 }
});