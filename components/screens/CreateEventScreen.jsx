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
  Platform, // 1. Importe a API Platform
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Select } from "../ui/Select";
import LoadingSpinner from "../ui/LoadingSpinner";
import { toast } from "../../hooks/use-toast";
import { getNextShabbat } from "../../lib/utils";
import Icon from "../ui/Icon";

const dietaryOptions = [
  { label: "Kosher", value: "kosher" },
  { label: "Tradicional", value: "traditional" },
  { label: "Vegetariano", value: "vegetarian" },
];
const ageGroupOptions = [
  { label: "Misto", value: "mixed" },
  { label: "Famílias", value: "families" },
  { label: "Jovens", value: "young-adults" },
  { label: "Seniores", value: "seniors" },
];
const languageOptions = [
  { label: "Português", value: "portuguese" },
  { label: "Inglês", value: "english" },
  { label: "Hebraico", value: "hebrew" },
  { label: "Misto", value: "mixed" },
];

export default function CreateEventScreen({ navigation }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: getNextShabbat().toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "22:30",
    maxGuests: 4,
    fullAddress: "",
    dietary: "kosher",
    ageGroup: "mixed",
    language: "portuguese",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.fullAddress.trim()) {
      return toast({
        type: "error",
        title: "Por favor, preencha todos os campos obrigatórios.",
      });
    }
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    toast({ type: "success", title: "Evento criado com sucesso!" });
    setIsLoading(false);
    navigation.goBack();
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="chevron-left" size={28} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Criar Evento</Text>
          <View style={{ width: 40 }} />
        </View>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.contentWrapper}>
              <Card style={{ width: "100%" }}>
                <CardHeader>
                  <CardTitle>Detalhes do Evento</CardTitle>
                </CardHeader>
                <CardContent>
                  <View style={styles.formSection}>
                    <Label>Título do Evento</Label>
                    <Input
                      value={formData.title}
                      onChangeText={(v) => handleInputChange("title", v)}
                      placeholder="Ex: Shabat Familiar"
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
                    <Label>Data</Label>
                    <Input
                      value={formData.date}
                      onChangeText={(v) => handleInputChange("date", v)}
                    />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Endereço Completo</Label>
                    <Input
                      value={formData.fullAddress}
                      onChangeText={(v) => handleInputChange("fullAddress", v)}
                      placeholder="Rua, número, bairro, cidade"
                    />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Nº de Convidados</Label>
                    <Input
                      value={String(formData.maxGuests)}
                      onChangeText={(v) =>
                        handleInputChange("maxGuests", Number(v))
                      }
                      keyboardType="numeric"
                    />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Preferência Alimentar</Label>
                    <Select
                      options={dietaryOptions}
                      selectedValue={formData.dietary}
                      onValueChange={(v) => handleInputChange("dietary", v)}
                    />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Faixa Etária</Label>
                    <Select
                      options={ageGroupOptions}
                      selectedValue={formData.ageGroup}
                      onValueChange={(v) => handleInputChange("ageGroup", v)}
                    />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Idioma</Label>
                    <Select
                      options={languageOptions}
                      selectedValue={formData.language}
                      onValueChange={(v) => handleInputChange("language", v)}
                    />
                  </View>

                  <Button
                    onPress={handleSubmit}
                    disabled={isLoading}
                    style={{ marginTop: 20 }}
                    variant="host"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="small" color="#FFFFFF" />
                    ) : (
                      "Criar Evento"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
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
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  container: {
    padding: 16,
    alignItems: "center",
    flexGrow: 1,
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 700,
  },
  formSection: { gap: 8, marginBottom: 16 },
});
