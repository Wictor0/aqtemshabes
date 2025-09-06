import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from "react-native";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/Card";
import { Select } from "../ui/Select";
import { Textarea } from "../ui/Textarea";
import { toast } from "../../hooks/use-toast";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

// Options for Select components
const distanceOptions = [
  { label: "5 km", value: "5" },
  { label: "10 km", value: "10" },
  { label: "15 km", value: "15" },
  { label: "20 km", value: "20" },
  { label: "30 km", value: "30" },
];
const timeOptions = [
  { label: "18:00", value: "18:00" },
  { label: "18:30", value: "18:30" },
  { label: "19:00", value: "19:00" },
  { label: "19:30", value: "19:30" },
  { label: "20:00", value: "20:00" },
  { label: "21:00", value: "21:00" },
];
const dietaryOptions = [
  { label: "Kosher", value: "kosher" },
  { label: "Tradicional", value: "traditional" },
  { label: "Vegetariano", value: "vegetarian" },
  { label: "Qualquer", value: "any" },
];

export default function SignUpForm({ onSubmit, isLoading, onBack }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    maxDistance: "15",
    address: "",
    preferredStartTime: "19:00",
    preferredEndTime: "22:00",
    dietary: "kosher",
    notes: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleStep1Submit = () => {
    const { name, email, password, confirmPassword } = formData;
    if (!name.trim())
      return toast({ type: "error", title: "Nome é obrigatório" });
    if (!email.trim() || !email.includes("@"))
      return toast({ type: "error", title: "Email inválido" });
    if (password.length < 6)
      return toast({
        type: "error",
        title: "Senha deve ter pelo menos 6 caracteres",
      });
    if (password !== confirmPassword)
      return toast({ type: "error", title: "Senhas não coincidem" });
    setStep(2);
  };

  const handleFinalSubmit = () => {
    // Calls the real submit function from SignUpScreen
    onSubmit({
      email: formData.email,
      password: formData.password,
      metadata: {
        full_name: formData.name,
        phone: formData.phone,
        address: formData.address,
        max_distance: formData.maxDistance,
        preferred_start_time: formData.preferredStartTime,
        preferred_end_time: formData.preferredEndTime,
        dietary_preference: formData.dietary,
        notes: formData.notes,
      },
    });
  };

  return (
    <Card style={{ width: "100%" }}>
      <CardHeader>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            onPress={step === 1 ? onBack : () => setStep(1)}
            style={styles.backButton}
          >
            <Icon name="chevron-left" size={28} />
          </TouchableOpacity>
          <View>
            <CardTitle>{step === 1 ? "Criar Conta" : "Preferências"}</CardTitle>
            <CardDescription>
              {step === 1
                ? "Preencha seus dados pessoais"
                : "Configure suas preferências"}
            </CardDescription>
          </View>
        </View>
      </CardHeader>
      <CardContent>
        {step === 1 ? (
          <View style={styles.formContainer}>
            <View style={styles.formSection}>
              <Label>Nome Completo</Label>
              <Input
                value={formData.name}
                onChangeText={(v) => handleInputChange("name", v)}
              />
            </View>
            <View style={styles.formSection}>
              <Label>Email</Label>
              <Input
                value={formData.email}
                onChangeText={(v) => handleInputChange("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.formSection}>
              <Label>Telefone</Label>
              <Input
                value={formData.phone}
                onChangeText={(v) => handleInputChange("phone", v)}
                keyboardType="phone-pad"
              />
            </View>
            <View style={styles.formSection}>
              <Label>Senha</Label>
              <Input
                value={formData.password}
                onChangeText={(v) => handleInputChange("password", v)}
                secureTextEntry
              />
            </View>
            <View style={styles.formSection}>
              <Label>Confirmar Senha</Label>
              <Input
                value={formData.confirmPassword}
                onChangeText={(v) => handleInputChange("confirmPassword", v)}
                secureTextEntry
              />
            </View>
            <Button onPress={handleStep1Submit} style={{ marginTop: 16 }}>
              Continuar
            </Button>
          </View>
        ) : (
          <ScrollView>
            <View style={styles.formSection}>
              <Label>Endereço (Bairro, Cidade)</Label>
              <Input
                value={formData.address}
                onChangeText={(v) => handleInputChange("address", v)}
              />
            </View>
            <View style={styles.formSection}>
              <Label>Distância Máxima</Label>
              <Select
                options={distanceOptions}
                selectedValue={formData.maxDistance}
                onValueChange={(v) => handleInputChange("maxDistance", v)}
              />
            </View>
            <View style={styles.formSection}>
              <Label>Início Preferido</Label>
              <Select
                options={timeOptions}
                selectedValue={formData.preferredStartTime}
                onValueChange={(v) =>
                  handleInputChange("preferredStartTime", v)
                }
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
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChangeText={(v) => handleInputChange("notes", v)}
              />
            </View>
            <Button
              onPress={handleFinalSubmit}
              disabled={isLoading}
              style={{ marginTop: 16 }}
            >
              {isLoading ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                "Criar Conta"
              )}
            </Button>
          </ScrollView>
        )}
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { padding: 8 },
  formContainer: { gap: 12 },
  formSection: { gap: 6, marginBottom: 8 },
});
