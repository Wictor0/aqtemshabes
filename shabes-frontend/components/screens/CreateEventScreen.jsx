import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
} from "react-native";
import DateTimePicker from '@react-native-community/datetimepicker';

// UI Components
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/Card";
import { Select } from "../ui/Select";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

// Hooks & Utils
import { toast } from "../../hooks/use-toast";

// Options for Select components
const hostAgeGroupOptions = [
  { label: "Família", value: "families" },
  { label: "Jovens (20-35)", value: "young-adults" },
  { label: "Adultos (35+)", value: "adults" },
  { label: "Seniores (60+)", value: "seniors" },
];

const targetAudienceOptions = [
  { label: "Qualquer pessoa", value: "any" },
  { label: "Apenas Famílias", value: "families" },
  { label: "Apenas Jovens", value: "young-adults" },
  { label: "Apenas Seniores", value: "seniors" },
];

// Component to display selected languages
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

export default function CreateEventScreen({ navigation }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date(),
    fullAddress: "",
    approximateAddress: "", // Bairro/Cidade
    maxGuests: 4,
    hostAgeGroup: "families",
    targetAudience: "any",
    languages: ["Português"],
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange('date', selectedDate);
    }
  };

  const addLanguage = (language) => {
    if (!formData.languages.includes(language)) {
      handleInputChange("languages", [...formData.languages, language]);
    }
  };

  const removeLanguage = (language) => {
    handleInputChange("languages", formData.languages.filter(l => l !== language));
  };

  const openLanguageModal = () => {
    Alert.alert( "Adicionar Idioma", "Selecione um idioma para o seu evento.",
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

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.fullAddress.trim() || !formData.approximateAddress.trim()) {
      return toast({ type: "error", title: "Campos obrigatórios", description: "Por favor, preencha o título e os dois campos de endereço." });
    }
    
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast({ type: "success", title: "Evento criado com sucesso!" });
    setIsLoading(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            <View style={styles.contentWrapper}>
              <Card style={{ width: "100%" }}>
                <CardHeader>
                  <CardTitle>Criar um Novo Evento</CardTitle>
                  <CardDescription>Preencha os detalhes para o seu Shabat.</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Title and Description */}
                  <View style={styles.formSection}>
                    <Label>Título do Evento</Label>
                    <Input value={formData.title} onChangeText={(v) => handleInputChange("title", v)} placeholder="Ex: Shabat Familiar em Jardins" />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Descrição</Label>
                    <Textarea value={formData.description} onChangeText={(v) => handleInputChange("description", v)} placeholder="Conte um pouco sobre o seu evento..." />
                  </View>
                  
                  {/* Date */}
                  <View style={styles.formSection}>
                    <Label>Data do Evento</Label>
                    {Platform.OS === 'android' && (
                        <>
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateButton}>
                                <Icon name="calendar" size={24} color="#374151" />
                                <Text style={styles.dateButtonText}>{formData.date.toLocaleDateString('pt-BR')}</Text>
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} />
                            )}
                        </>
                    )}
                    {Platform.OS === 'ios' && (
                        <View style={styles.iosPickerContainer}>
                            <Icon name="calendar" size={24} color="#374151" />
                            <DateTimePicker value={formData.date} mode="date" display="default" onChange={onDateChange} />
                        </View>
                    )}
                  </View>

                  {/* Address */}
                  <View style={styles.formSection}>
                    <Label>Endereço Completo (Privado)</Label>
                    <Input value={formData.fullAddress} onChangeText={(v) => handleInputChange("fullAddress", v)} placeholder="Rua, número, apto, CEP" />
                    <Text style={styles.helperText}>Este endereço só será partilhado com convidados confirmados.</Text>
                  </View>
                  <View style={styles.formSection}>
                    <Label>Região (Público)</Label>
                    <Input value={formData.approximateAddress} onChangeText={(v) => handleInputChange("approximateAddress", v)} placeholder="Bairro, Cidade" />
                    <Text style={styles.helperText}>Esta é a localização que aparecerá publicamente.</Text>
                  </View>
                  
                  {/* Event Details */}
                  <View style={styles.formSection}>
                    <Label>Nº de Convidados</Label>
                    <Input value={String(formData.maxGuests)} onChangeText={(v) => handleInputChange("maxGuests", Number(v))} keyboardType="numeric" />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Faixa Etária dos Anfitriões</Label>
                    <Select options={hostAgeGroupOptions} selectedValue={formData.hostAgeGroup} onValueChange={(v) => handleInputChange("hostAgeGroup", v)} />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Público Alvo do Evento</Label>
                    <Select options={targetAudienceOptions} selectedValue={formData.targetAudience} onValueChange={(v) => handleInputChange("targetAudience", v)} />
                  </View>

                  {/* Languages */}
                  <View style={styles.formSection}>
                    <Label>Idiomas Falados no Evento</Label>
                    <SelectedLanguages selected={formData.languages} onRemove={removeLanguage} />
                    <Button variant="outline" onPress={openLanguageModal} style={{ marginTop: 8 }}>
                      <Icon name="plus" size={16} color="#374151" style={{ marginRight: 8 }}/>
                      <Text>Adicionar Idioma</Text>
                    </Button>
                  </View>

                  {/* Consent Agreement */}
                  <View style={styles.consentSection}>
                    <Switch
                      trackColor={{ false: "#E5E7EB", true: "#81b0ff" }}
                      thumbColor={agreedToTerms ? "#4F46E5" : "#f4f3f4"}
                      ios_backgroundColor="#E5E7EB"
                      onValueChange={setAgreedToTerms}
                      value={agreedToTerms}
                    />
                    <Text style={styles.consentText}>Eu li e concordo com os termos de segurança e responsabilidade da comunidade.</Text>
                  </View>

                  {/* Submit Button */}
                  <Button onPress={handleSubmit} disabled={isLoading || !agreedToTerms} style={{ marginTop: 20 }} variant="host">
                    {isLoading ? <LoadingSpinner size="small" color="#FFFFFF" /> : "Criar Evento"}
                  </Button>
                </CardContent>
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: { padding: 16, alignItems: "center", flexGrow: 1 },
  contentWrapper: { width: "100%", maxWidth: 700 },
  formSection: { gap: 8, marginBottom: 16 },
  helperText: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  dateButton: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, backgroundColor: 'white', gap: 8 },
  dateButtonText: { fontSize: 16, color: '#374151' },
  iosPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8, 
    paddingTop: 8,
    paddingLeft: 4,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  placeholderText: { color: '#6B7280', fontStyle: 'italic' },
  languageContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  languageChipSelected: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: "#4F46E5" },
  languageChipTextSelected: { color: "white", fontWeight: "500" },
  consentSection: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 12 },
  consentText: { flex: 1, color: '#374151', fontSize: 14 },
});
