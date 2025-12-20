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

// Componente para exibir idiomas
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

// Componente para exibir bairros
const SelectedNeighborhoods = ({ selected, onRemove }) => {
  if (selected.length === 0) {
    return <Text style={styles.placeholderText}>Nenhum bairro selecionado</Text>;
  }
  return (
    <View style={styles.languageContainer}>
      {selected.map((neighborhood) => (
        <View key={neighborhood} style={styles.languageChipSelected}>
          <Text style={styles.languageChipTextSelected}>{neighborhood}</Text>
          <TouchableOpacity
            onPress={() => onRemove(neighborhood)}
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
  const [isCepLoading, setIsCepLoading] = useState(false);
  
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
    deadline: new Date(initialDate.getTime() - 24 * 60 * 60 * 1000), 
    approximateAddress: [], 
    maxGuests: 0, 
    targetAudience: [], 
    languages: ["Português"],
    mealType: getMealTypeForDate(initialDate), 
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  const dismissKeyboard = () => {
    try {
      if (Keyboard && typeof Keyboard.dismiss === 'function') {
        Keyboard.dismiss();
      }
    } catch (error) {
      console.log("Erro ao fechar teclado ignorado:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCepChange = (value) => {
    const cleaned = value.replace(/\D/g, ""); 
    if (cleaned.length > 8) return; 

    let formatted = cleaned;
    if (cleaned.length > 5) {
      formatted = `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
    }
    
    handleInputChange("cep", formatted);
  };

  const fetchAddressFromCEP = async (cep) => {
    const cleanedCep = cep.replace(/\D/g, ""); 
    if (cleanedCep.length !== 8) return; 

    setIsCepLoading(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({ type: "error", title: "CEP não encontrado" });
        setFormData(prev => ({
          ...prev,
          street: "",
          neighborhood: "",
          city: "",
          state: "",
          approximateAddress: [], 
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          street: data.logradouro || "",
          neighborhood: data.bairro || "",
          city: data.localidade || "",
          state: data.uf || "",
          // Se quiser auto-preencher a região pública com o bairro do CEP, descomente abaixo:
          // approximateAddress: data.bairro ? [data.bairro] : prev.approximateAddress, 
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);
      toast({ type: "error", title: "Erro ao buscar CEP" });
    } finally {
      setIsCepLoading(false);
    }
  };

  const handleCepBlur = () => {
    fetchAddressFromCEP(formData.cep);
  };

  const handleNeighborhoodChange = (text) => {
      setFormData(prev => ({ ...prev, neighborhood: text }));
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

  const addNeighborhood = (neighborhood) => {
    if (!formData.approximateAddress.includes(neighborhood)) {
      handleInputChange("approximateAddress", [...formData.approximateAddress, neighborhood]);
    }
  };

  const removeNeighborhood = (neighborhood) => {
    handleInputChange("approximateAddress", formData.approximateAddress.filter((n) => n !== neighborhood));
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

  const addLanguage = (language) => {
    if (!formData.languages.includes(language)) {
      handleInputChange("languages", [...formData.languages, language]);
    }
  };

  const handlePrivacyInfo = () => {
    Alert.alert("Endereço Privado", "Para sua segurança, o endereço completo do evento só será compartilhado com usuários confirmados.");
  };

  const handleSubmit = async () => {
    if (
      !formData.title.trim() ||
      !formData.cep.trim() ||
      !formData.street.trim() ||
      !formData.number.trim() ||
      !formData.neighborhood.trim() 
    ) {
      return toast({ type: "error", title: "Campos obrigatórios", description: "Preencha o título e o endereço completo." });
    }

    if (formData.targetAudience.length === 0) {
        return toast({ type: "error", title: "Público Alvo", description: "Selecione pelo menos um público alvo." });
    }
    
    if (formData.languages.length === 0) {
        return toast({ type: "error", title: "Idiomas", description: "Selecione pelo menos um idioma." });
    }

    if (formData.deadline >= formData.date) {
        return toast({ type: "error", title: "Prazo inválido", description: "O prazo de inscrição deve ser ANTES do dia do evento." });
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const deadlineCheck = new Date(formData.deadline);
    deadlineCheck.setHours(0,0,0,0);

    if (deadlineCheck < today) {
         return toast({ type: "error", title: "Prazo no passado", description: "O prazo de inscrição não pode ser uma data passada." });
    }

    setIsLoading(true);
    try {
      const full_address = `${formData.street}, ${formData.number}${
        formData.complement ? `, ${formData.complement}` : ""
      } - ${formData.neighborhood}, ${formData.city} - ${
        formData.state
      }, CEP: ${formData.cep}`;

      const eventPayload = {
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        deadline_datetime: formData.deadline.toISOString(),
        full_address: full_address,
        approximate_address: formData.approximateAddress.join(", "),
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
      toast({ type: "error", title: "Erro ao criar evento", description: "Ocorreu um problema ao salvar." });
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
              
              {/* CARD 1: INFORMAÇÕES DO EVENTO (Unificado) */}
              <Card style={{ width: "100%", marginBottom: 20 }}>
                <CardHeader>
                  <CardTitle>Informações do Evento</CardTitle>
                  <CardDescription>
                    Detalhes principais, data e público.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  
                  {/* Título */}
                  <View style={styles.formSection}>
                    <Label>Título do Evento</Label>
                    <Input
                      value={formData.title}
                      onChangeText={(v) => handleInputChange("title", v)}
                      placeholder="Ex: Shabat Familiar em Jardins"
                    />
                  </View>

                  {/* Descrição */}
                  <View style={styles.formSection}>
                    <Label>Descrição</Label>
                    <Textarea
                      value={formData.description}
                      onChangeText={(v) => handleInputChange("description", v)}
                      placeholder="Conte um pouco sobre o seu evento..."
                    />
                  </View>

                  
                  {/* Data do Evento */}
                  <View style={styles.formSection}>
                    <Label>Data do Evento</Label>
                    {Platform.OS === "android" && (
                      <>
                        <TouchableOpacity
                          onPress={() => setShowDatePicker(true)}
                          style={styles.dateButton}
                        >
                          <Icon name="calendar" size={24} color="#374151" />
                          <Text style={styles.dateButtonText}>
                            {formData.date.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                        <Icon name="calendar" size={24} color="#374151" />
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
                        <Icon 
                            name={formData.mealType === 'jantar' ? "moon" : "sun"} 
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

                  {/* Prazo Limite */}
                  <View style={styles.formSection}>
                    <Label>Prazo Limite para Inscrições</Label>
                    <Text style={styles.helperText}>Até quando aceita pedidos?</Text>
                    {Platform.OS === "android" && (
                      <>
                        <TouchableOpacity
                          onPress={() => setShowDeadlinePicker(true)}
                          style={[styles.dateButton, { borderColor: '#F59E0B', backgroundColor: '#FFFBEB' }]} 
                        >
                          <Icon name="clock" size={24} color="#D97706" />
                          <Text style={[styles.dateButtonText, { color: '#D97706', fontWeight: '600' }]}>
                            {formData.deadline.toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric' })}
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
                        <Icon name="clock" size={24} color="#D97706" />
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

                  {/* N° Convidados */}
                  <View style={styles.formSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Label>Nº de Convidados</Label>
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
                    <Text style={styles.helperText}>
                      0 para ilimitado.
                    </Text>
                  </View>

                  {/* Público Alvo */}
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

                  {/* Idiomas */}
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

              {/* CARD 2: ENDEREÇO */}
              <Card style={{ width: "100%" }}>
                <CardHeader>
                  <CardTitle>Endereço</CardTitle>
                  <CardDescription>
                    Defina a região pública e o endereço privado.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                
                  {/* Endereço Completo */}
                  <View style={styles.formSection}>
                    <View style={styles.labelWithInfoContainer}>
                      <Label>Endereço Completo (Privado)</Label>
                      <TouchableOpacity onPress={handlePrivacyInfo} style={styles.infoIconTouchable}>
                        <Icon name="info" size={16} color="#6B7280" />
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.cepContainer}>
                      <Input
                        value={formData.cep}
                        onChangeText={handleCepChange} 
                        onBlur={handleCepBlur} 
                        placeholder="CEP"
                        keyboardType="numeric"
                        maxLength={9} 
                        style={{ flex: 1 }}
                      />
                      {isCepLoading && <ActivityIndicator style={styles.cepLoading} size="small" />}
                    </View>

                    <Input
                      value={formData.street}
                      onChangeText={(v) => handleInputChange("street", v)}
                      placeholder="Rua"
                      style={{ backgroundColor: formData.street ? '#F3F4F6' : '#FFFFFF' }} 
                    />

                    <View style={styles.horizontalInputContainer}>
                      <Input
                        value={formData.number}
                        onChangeText={(v) => handleInputChange("number", v)}
                        placeholder="Nº"
                        keyboardType="numeric"
                        style={{ flex: 1 }} 
                      />
                      <Input
                        value={formData.complement}
                        onChangeText={(v) => handleInputChange("complement", v)}
                        placeholder="Comp."
                        style={{ flex: 2 }} 
                      />
                    </View>

                    <Input
                      value={formData.neighborhood}
                      onChangeText={handleNeighborhoodChange} 
                      placeholder="Bairro"
                      style={{ backgroundColor: formData.neighborhood ? '#F3F4F6' : '#FFFFFF' }}
                    />
                    
                    <View style={styles.horizontalInputContainer}>
                      <Input
                        value={formData.city}
                        onChangeText={(v) => handleInputChange("city", v)}
                        placeholder="Cidade"
                        style={{ flex: 3, backgroundColor: formData.city ? '#F3F4F6' : '#FFFFFF' }}
                      />
                      <Input
                        value={formData.state}
                        onChangeText={(v) => handleInputChange("state", v)}
                        placeholder="UF"
                        maxLength={2}
                        autoCapitalize="characters"
                        style={{ flex: 1, backgroundColor: formData.state ? '#F3F4F6' : '#FFFFFF' }}
                      />
                    </View>
                  </View>

                </CardContent>
              </Card>

              {/* Botão Criar */}
              <Button
                onPress={handleSubmit}
                disabled={isLoading}
                style={{ marginTop: 20 }}
                variant="host"
              >
                {isLoading ? <LoadingSpinner size="small" color="#FFFFFF" /> : "Criar Evento"}
              </Button>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, flexGrow: 1 },
  contentWrapper: { width: "100%", maxWidth: 700, alignItems: 'center' }, // Centraliza os cards
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

  cepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  cepLoading: {
    position: 'absolute',
    right: 12,
  },
  horizontalInputContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  labelWithInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconTouchable: {
    padding: 4,
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