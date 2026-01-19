import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, Switch, Image } from "react-native";
import * as ImagePicker from 'expo-image-picker'; 
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
import { signUp } from "../../services/api";

// Opções para os componentes Select
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

export default function SignUpForm({ inviteCode, onBack, onSignUpComplete }) {
  const [step, setStep] = useState(1);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
    image: null, 
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Função para selecionar a imagem da galeria com crop quadrado
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      return toast({ type: "error", title: "Permissão negada", description: "Precisamos de acesso às fotos." });
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4, // Qualidade reduzida para não exceder limites do Supabase
    });

    if (!result.canceled) {
      handleInputChange('image', result.assets[0].uri);
    }
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

  const handleFinalSubmit = async () => {
    setIsLoading(true);
    try {
      // Chamada real para o serviço de API que lida com conversão Base64 e usernames
      await signUp({
        ...formData,
        inviteCode,
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

      setIsLoading(false);
      toast({ 
        type: "success", 
        title: "Cadastro solicitado!", 
        description: "Verifique o seu e-mail para confirmar a conta." 
      });
      
      if (onSignUpComplete) onSignUpComplete();
    } catch (error) {
      setIsLoading(false);
      console.error("[SIGNUP] Erro no envio:", error.response?.data || error.message);
      toast({ 
        type: "error", 
        title: "Erro no cadastro", 
        description: error.response?.data?.error || "Tente novamente mais tarde." 
      });
    }
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
            
            {/* UI de seleção de imagem */}
            <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
              {formData.image ? (
                <Image source={{ uri: formData.image }} style={styles.avatar} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera-plus-outline" size={32} color="#9CA3AF" />
                  <Text style={styles.imageText}>Foto de Perfil</Text>
                </View>
              )}
            </TouchableOpacity>

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
          <ScrollView showsVerticalScrollIndicator={false}>
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
              <Label>Observações</Label>
              <Textarea
                value={formData.notes}
                onChangeText={(v) => handleInputChange("notes", v)}
              />
            </View>
            <View style={styles.termsRow}>
              <Switch
                trackColor={{ false: "#E5E7EB", true: "#81b0ff" }}
                thumbColor={agreedToTerms ? "#4F46E5" : "#f4f3f4"}
                ios_backgroundColor="#E5E7EB"
                onValueChange={setAgreedToTerms}
                value={agreedToTerms}
              />
              <Text style={styles.consentText}>
                Eu li e concordo com os termos de segurança e responsabilidade da comunidade.
              </Text>
            </View>
            <Button
              onPress={handleFinalSubmit}
              disabled={isLoading || !agreedToTerms}
              style={{ marginTop: 16 }}
              variant="shabbat"
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
  imagePicker: { alignSelf: 'center', marginBottom: 15 },
  imagePlaceholder: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'dashed' },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  imageText: { fontSize: 10, color: '#9CA3AF', marginTop: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 15 },
  consentText: { flex: 1, fontSize: 12, color: "#6B7280" }
});