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
  TextInput
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
import { createEvent, getMatchesForGuest, saveInternalNotification } from "../../services/api"; 
import { useAuth } from "../../context/AuthContext";
import { showLocalNotification } from "../../services/notificationService";

// 👇 CONFIGURAÇÃO PESSACH 2026 👇
const PESSACH_CONFIG = {
  '2026-04-01': { label: 'Pessach (Seder I)', meals: ['jantar'] },
  '2026-04-02': { label: 'Pessach (Seder II)', meals: ['almoço', 'jantar'] },
  '2026-04-03': { label: 'Pessach', meals: ['almoço'] },
  '2026-04-07': { label: 'Pessach (Final)', meals: ['jantar'] },
  '2026-04-08': { label: 'Pessach (Final)', meals: ['almoço', 'jantar'] },
  '2026-04-09': { label: 'Pessach (Encerramento)', meals: ['almoço'] },
};

const AUDIENCE_OPTIONS = [
  { id: "any", label: "Qualquer pessoa" },
  { id: "families", label: "Famílias" },
  { id: "young-adults", label: "Jovens" },
  { id: "seniors", label: "Seniores" },
];

const LANGUAGE_OPTIONS = [
  "Português", "Inglês", "Hebraico", "Espanhol", "Iídiche", "Francês", "Outros"
];

const saoPauloNeighborhoods = [
  "Higienópolis/Santa Cecilia", "Pacaembú", "Perdizes", "Bom Retiro", "Jardins",
  "Jardim das Perdizes", "Jardim Paulista", "Jardim Europa", "Vila Nova Conceição",
  "Vila Madalena", "Itaim Bibi", "Pompeia",
];

export default function CreateEventScreen({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [guestDates, setGuestDates] = useState([]); 
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);

  const getInitialValidDate = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); 
    d.setDate(d.getDate() + 1); 
    while (d.getDay() !== 5 && d.getDay() !== 6) {
      d.setDate(d.getDate() + 1);
    }
    d.setHours(19, 0, 0, 0); 
    return d;
  };

  const getMealTypeForDate = (date) => {
    const dateKey = date.toISOString().split('T')[0];
    if (PESSACH_CONFIG[dateKey]) {
      return PESSACH_CONFIG[dateKey].meals[0]; 
    }
    const day = date.getDay();
    return day === 6 ? 'almoço' : 'jantar'; 
  };

  const getInitialFormData = () => {
    const initialDate = getInitialValidDate();
    const initialDeadline = new Date(initialDate);
    initialDeadline.setDate(initialDeadline.getDate() - 1);
    initialDeadline.setHours(12, 0, 0, 0); 

    return {
      title: "",
      description: "",
      date: initialDate,
      deadline: initialDeadline, 
      maxGuests: 0, 
      targetAudience: [], 
      languages: ["Português"],
      mealType: getMealTypeForDate(initialDate), 
      neighborhood: "", 
    };
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const currentPessach = PESSACH_CONFIG[formData.date.toISOString().split('T')[0]];

  useEffect(() => {
    const fetchGuestStatus = async () => {
      try {
        if (!user?.id) return;
        const response = await getMatchesForGuest(user.id);
        const confirmedDates = (response.data || [])
          .filter(m => m.status?.toLowerCase() === 'accepted')
          .map(m => new Date(m.event.date).toISOString().split('T')[0]);
        setGuestDates(confirmedDates);
      } catch (error) {
        console.error("Erro ao procurar agenda de convidado:", error);
      }
    };
    fetchGuestStatus();
  }, [user?.id]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGuestsTextChange = (text) => {
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
      const dateKey = selectedDate.toISOString().split('T')[0];
      const pessachInfo = PESSACH_CONFIG[dateKey];
      const day = selectedDate.getDay();

      if (!pessachInfo && day !== 5 && day !== 6) {
        Alert.alert("Data Inválida", "Escolha Sexta, Sábado ou uma data de Pessach.");
        return;
      }

      selectedDate.setHours(19, 0, 0, 0);
      const newDeadline = new Date(selectedDate);
      newDeadline.setDate(newDeadline.getDate() - 1);
      newDeadline.setHours(12, 0, 0, 0);

      let autoMeal = pessachInfo ? pessachInfo.meals[0] : (day === 6 ? 'almoço' : 'jantar');

      setFormData(prev => ({
        ...prev,
        date: selectedDate,
        mealType: autoMeal,
        deadline: newDeadline
      }));
    }
  };

  const onDeadlineChange = (event, selectedDate) => {
    if (Platform.OS === "android") setShowDeadlinePicker(false);
    
    if (selectedDate) {
      selectedDate.setHours(12, 0, 0, 0);
      const eventDate = new Date(formData.date);
      eventDate.setHours(0, 0, 0, 0);
      const chosenDeadline = new Date(selectedDate);
      chosenDeadline.setHours(0, 0, 0, 0);

      if (chosenDeadline >= eventDate) {
        Alert.alert("Prazo Inválido", "O prazo deve ser antes do evento.");
        return;
      }
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

  const handleSubmit = async () => {
    const dateKey = formData.date.toISOString().split('T')[0];
    const isPessachDate = !!PESSACH_CONFIG[dateKey];
    const dayOfWeek = formData.date.getDay();

    if (!isPessachDate && dayOfWeek !== 5 && dayOfWeek !== 6) {
      return toast({ type: "error", title: "Data Inválida", description: "Escolha um dia de Pessach ou final de semana." });
    }

    const selectedDateString = formData.date.toISOString().split('T')[0];
    if (guestDates.includes(selectedDateString)) {
      return toast({ type: "error", title: "Conflito", description: "Você já tem compromisso confirmado neste dia." });
    }

    if (!formData.title.trim() || !formData.neighborhood) {
      return toast({ type: "error", title: "Campos obrigatórios", description: "Preencha o título e o bairro." });
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

      const response = await createEvent(eventPayload);
      const newEventId = response?.data?.id || (Array.isArray(response?.data) ? response?.data[0]?.id : null);

      const notiTitle = isPessachDate ? "Celebração de Pessach! 🍷" : "Evento Criado! 🕯️";
      const notiMsg = isPessachDate 
        ? `Sua mesa de Pessach "${formData.title}" foi publicada.` 
        : `Seu Shabat "${formData.title}" foi publicado com sucesso.`;

      await saveInternalNotification(user.id, notiTitle, notiMsg, "event_created", newEventId);
      
      setFormData(getInitialFormData());

      await showLocalNotification(
        "AquiTemShabes", 
        `Evento ${formData.title} criado`, 
        { eventId: newEventId }
      );

      toast({ type: "success", title: "Evento criado com sucesso!" });
      navigation.goBack();
    } catch (error) {
      console.error("Erro ao criar evento:", error);
      toast({ type: "error", title: "Erro ao criar evento" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.contentWrapper}>
            <Card style={[
                { width: "100%", marginBottom: 20 },
                currentPessach && { borderColor: "#D4AF37", borderWidth: 2 } 
            ]}>
              <CardHeader>
                <CardTitle>{currentPessach ? "Pessach 2026" : "Informações do Evento"}</CardTitle>
                <CardDescription>
                  {currentPessach ? `Organize seu seder de Pessach` : "Detalhes principais e data."}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <View style={styles.formSection}>
                  <Label>Título do Evento</Label>
                  <Input value={formData.title} onChangeText={(v) => handleInputChange("title", v)} placeholder="Ex: Seder de Pessach" />
                </View>

                <View style={styles.formSection}>
                  <Label>Descrição</Label>
                  <Textarea value={formData.description} onChangeText={(v) => handleInputChange("description", v)} placeholder="Conte sobre seu evento..." />
                </View>

                <View style={styles.formSection}>
                  <Label>Data</Label>
                  <View style={styles.relativeContainer}>
                    <View style={[styles.dateButton, currentPessach && { backgroundColor: '#FFFDF0', borderColor: '#D4AF37' }]}>
                      {/* 👇 ÍCONE ALTERADO PARA estrela de davi 👇 */}
                      <Icon name={currentPessach ? "star-david" : "calendar-month"} size={24} color={currentPessach ? "#D4AF37" : "#374151"} />
                      <Text style={[styles.dateButtonText, currentPessach && { color: '#D4AF37', fontWeight: 'bold' }]}>
                        {formData.date.toLocaleDateString("pt-BR")}
                      </Text>
                    </View>
                    {Platform.OS === "ios" ? (
                      <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} locale="pt-BR" style={styles.iosPickerNative} />
                    ) : (
                      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={StyleSheet.absoluteFill} />
                    )}
                    {Platform.OS === "android" && showDatePicker && (
                       <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} minimumDate={new Date()} />
                    )}
                  </View>
                  
                  <View style={[styles.autoMealContainer, currentPessach && { backgroundColor: '#FFFDF0' }]}>
                    <Icon 
                      name={formData.mealType === 'jantar' ? "weather-night" : "weather-sunny"} 
                      size={16} 
                      color={currentPessach ? "#D4AF37" : "#4F46E5"} 
                    />
                    <Text style={[styles.autoMealText, currentPessach && { color: '#D4AF37' }]}>
                      {currentPessach ? currentPessach.label : (formData.date.getDay() === 5 ? "Sexta-feira | Jantar" : "Sábado | Almoço")}
                    </Text>
                  </View>
                </View>

                {currentPessach && currentPessach.meals.length > 1 && (
                  <View style={styles.formSection}>
                    <Label>Escolha o Turno</Label>
                    <View style={styles.chipsContainer}>
                      {currentPessach.meals.map((m) => (
                        <TouchableOpacity 
                          key={m} 
                          style={[styles.chip, formData.mealType === m && { backgroundColor: '#D4AF37', borderColor: '#D4AF37' }]} 
                          onPress={() => handleInputChange("mealType", m)}
                        >
                          <Text style={[styles.chipText, formData.mealType === m && { color: '#FFF' }]}>
                            {m === 'almoço' ? "Almoço (Dia)" : "Jantar (Noite)"}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.formSection}>
                  <Label>Data Limite para Inscrições</Label>
                  <View style={styles.relativeContainer}>
                    <View style={[styles.dateButton, { borderColor: '#FFFBEB', backgroundColor: '#FFFBEB' }]}>
                      <Icon name="clock-outline" size={24} color="#D97706" />
                      <Text style={[styles.dateButtonText, { color: '#D97706', fontWeight: '600' }]}>{formData.deadline.toLocaleDateString("pt-BR")}</Text>
                    </View>
                    {Platform.OS === "ios" ? (
                      <DateTimePicker value={formData.deadline} mode="date" display="default" onChange={onDeadlineChange} minimumDate={new Date()} maximumDate={new Date(formData.date.getTime() - 24 * 60 * 60 * 1000)} locale="pt-BR" style={styles.iosPickerNative} />
                    ) : (
                      <TouchableOpacity onPress={() => setShowDeadlinePicker(true)} style={StyleSheet.absoluteFill} />
                    )}
                    {Platform.OS === "android" && showDeadlinePicker && (
                       <DateTimePicker value={formData.deadline} mode="date" display="default" onChange={onDeadlineChange} minimumDate={new Date()} />
                    )}
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Label>Nº Limite para Convidados</Label>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity style={[styles.stepperButton, formData.maxGuests === 0 && styles.stepperButtonDisabled]} onPress={decrementGuests} disabled={formData.maxGuests === 0}>
                      <Icon name="minus" size={24} color={formData.maxGuests === 0 ? "#9CA3AF" : "#4F46E5"} />
                    </TouchableOpacity>
                    <View style={styles.stepperValueBox}>
                      <TextInput style={styles.stepperInput} keyboardType="numeric" value={formData.maxGuests === 0 ? "" : String(formData.maxGuests)} onChangeText={handleGuestsTextChange} placeholder="Sem Limite" placeholderTextColor="#9CA3AF" maxLength={3} />
                    </View>
                    <TouchableOpacity style={styles.stepperButton} onPress={incrementGuests}><Icon name="plus" size={24} color="#4F46E5" /></TouchableOpacity>
                  </View>
                </View>

                <View style={styles.formSection}>
                  <Label>Público Alvo</Label>
                  <View style={styles.chipsContainer}>
                    {AUDIENCE_OPTIONS.map((option) => (
                      <TouchableOpacity key={option.id} style={[styles.chip, formData.targetAudience.includes(option.id) && styles.chipSelected]} onPress={() => toggleTargetAudience(option.id)}>
                        <Text style={[styles.chipText, formData.targetAudience.includes(option.id) && styles.chipTextSelected]}>{option.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={[styles.formSection, { marginTop: 8 }]}>
                  <Label>Idiomas Falados</Label>
                  <View style={styles.chipsContainer}>
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <TouchableOpacity 
                        key={lang} 
                        style={[styles.chip, formData.languages.includes(lang) && styles.chipSelected]} 
                        onPress={() => toggleLanguage(lang)}
                      >
                        <Text style={[styles.chipText, formData.languages.includes(lang) && styles.chipTextSelected]}>{lang}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </CardContent>
            </Card>

            <Card style={{ width: "100%" }}>
              <CardHeader><CardTitle>Endereço</CardTitle></CardHeader>
              <CardContent>
                <View style={styles.formSection}>
                  <Label>Bairro</Label>
                  <View style={styles.chipsContainer}>
                    {saoPauloNeighborhoods.map((bairro) => (
                      <TouchableOpacity key={bairro} style={[styles.chip, formData.neighborhood === bairro && styles.chipSelected]} onPress={() => handleNeighborhoodSelect(bairro)}>
                        <Text style={[styles.chipText, formData.neighborhood === bairro && styles.chipTextSelected]}>{bairro}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </CardContent>
            </Card>

            <View style={{ width: "100%", marginTop: 20 }}>
              <Button onPress={handleSubmit} disabled={isLoading} variant="host" style={[styles.submitButton, currentPessach && { backgroundColor: '#D4AF37' }]}>
                {isLoading ? <LoadingSpinner size="small" color="#FFFFFF" /> : <Text style={styles.submitButtonText}>Criar {currentPessach ? "Seder de Pessach" : "Evento"}</Text>}
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
  relativeContainer: { position: 'relative', width: '100%', height: 50, justifyContent: 'center', borderRadius: 8 },
  dateButton: { flexDirection: "row", alignItems: "center", padding: 12, borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 8, backgroundColor: "white", gap: 8, height: '100%', width: '100%' },
  dateButtonText: { fontSize: 16, color: "#374151" },
  iosPickerNative: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999, opacity: 0.025 },
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