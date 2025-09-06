import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../../services/api";
import { toast } from "../../hooks/use-toast";

// Importe seus componentes de UI
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [profileData, setProfileData] = useState(null); // Inicia como nulo
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        setProfileData(response.data);
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        toast({ type: 'error', title: 'Erro ao carregar o perfil' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);
=======
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Keyboard, // Manteve-se a importação, caso seja necessária no futuro
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Clipboard from "expo-clipboard";

import { useAuth } from "../../context/AuthContext";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Select } from "../ui/Select";
import { toast } from "../../hooks/use-toast";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

const dietaryOptions = [
  { label: "Kosher", value: "kosher" },
  { label: "Tradicional", value: "traditional" },
  { label: "Vegetariano", value: "vegetarian" },
  { label: "Qualquer", value: "any" },
];

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    maxDistance: 15,
    address: "",
    dietary: "kosher",
    notes: "",
  });
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
<<<<<<< HEAD
    try {
      const { full_name, phone } = profileData; // Adicione outros campos se necessário
      await updateMyProfile({ full_name, phone });
      toast({ type: "success", title: "Perfil atualizado com sucesso!" });
      setIsEditing(false);
    } catch (error) {
      toast({ type: "error", title: "Erro ao salvar", description: "Não foi possível atualizar seu perfil." });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.spinner} />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.contentWrapper}>
=======
    // Simulação de chamada de API
    await new Promise((resolve) => setTimeout(resolve, 1000));
    toast({ type: "success", title: "Perfil atualizado com sucesso!" });
    setIsSaving(false);
    setIsEditing(false);
  };

  const handleCopyInvite = async (code) => {
    await Clipboard.setStringAsync(code);
    toast({ type: "success", title: "Código copiado!" });
  };

  return (
    // O wrapper TouchableWithoutFeedback foi removido daqui
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity style={styles.iconButton} onPress={signOut}>
          <Icon name="logout" color="#EF4444" size={22} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={true}
        persistentScrollbar={true}
        alwaysBounceVertical={true}
      >
        <View style={styles.contentWrapper}>
          {/* Profile Card */}
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
          <Card style={{ width: "100%" }}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Icon name="account-circle-outline" size={22} color="#4F46E5" />
                <CardTitle>Informações Pessoais</CardTitle>
              </View>
<<<<<<< HEAD
              <Button onPress={() => (isEditing ? handleSave() : setIsEditing(true))} disabled={isSaving} variant={isEditing ? "default" : "outline"} size="sm">
                {isSaving ? <LoadingSpinner size="small" /> : isEditing ? "Salvar" : "Editar"}
=======
              <Button
                onPress={() => (isEditing ? handleSave() : setIsEditing(true))}
                disabled={isSaving}
                variant={isEditing ? "default" : "outline"}
                size="sm"
              >
                {isSaving ? (
                  <LoadingSpinner size="small" />
                ) : isEditing ? (
                  "Salvar"
                ) : (
                  "Editar"
                )}
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
              </Button>
            </CardHeader>
            <CardContent>
              <View style={styles.formSection}>
                <Label>Nome Completo</Label>
<<<<<<< HEAD
                <Input value={profileData?.full_name || ''} onChangeText={(v) => handleInputChange("full_name", v)} editable={isEditing} />
              </View>
              <View style={styles.formSection}>
                <Label>Email</Label>
                <Input value={user?.email || ''} editable={false} />
              </View>
              <View style={styles.formSection}>
                <Label>Telefone</Label>
                <Input value={profileData?.phone || ''} onChangeText={(v) => handleInputChange("phone", v)} editable={isEditing} keyboardType="phone-pad" />
              </View>
            </CardContent>
          </Card>
          {/* Adicione seus outros cards aqui se precisar */}
=======
                <Input
                  value={profileData.name}
                  onChangeText={(v) => handleInputChange("name", v)}
                  editable={isEditing}
                />
              </View>
              <View style={styles.formSection}>
                <Label>Email</Label>
                <Input
                  value={profileData.email}
                  onChangeText={(v) => handleInputChange("email", v)}
                  editable={isEditing}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.formSection}>
                <Label>Telefone</Label>
                <Input
                  value={profileData.phone}
                  onChangeText={(v) => handleInputChange("phone", v)}
                  editable={isEditing}
                  keyboardType="phone-pad"
                />
              </View>
            </CardContent>
          </Card>

          {/* Preferences Card */}
          <Card style={{ width: "100%" }}>
            <CardHeader>
              <View style={styles.cardTitleContainer}>
                <Icon name="map-marker-outline" size={22} color="#10B981" />
                <CardTitle>Preferências de Matchmaking</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <View style={styles.formSection}>
                <Label>Endereço/Região</Label>
                <Input
                  value={profileData.address}
                  onChangeText={(v) => handleInputChange("address", v)}
                  placeholder="Bairro, cidade - estado"
                />
              </View>
              <View style={styles.formSection}>
                <Label>Distância Máxima: {profileData.maxDistance}km</Label>
                <Slider
                  style={{ width: "100%", height: 40 }}
                  minimumValue={1}
                  maximumValue={50}
                  step={1}
                  value={profileData.maxDistance}
                  onValueChange={(v) => handleInputChange("maxDistance", v)}
                  minimumTrackTintColor="#4F46E5"
                  maximumTrackTintColor="#D1D5DB"
                />
              </View>
              <View style={styles.formSection}>
                <Label>Preferência Alimentar</Label>
                <Select
                  options={dietaryOptions}
                  selectedValue={profileData.dietary}
                  onValueChange={(v) => handleInputChange("dietary", v)}
                />
              </View>
              <View style={styles.formSection}>
                <Label>Observações</Label>
                <Textarea
                  value={profileData.notes}
                  onChangeText={(v) => handleInputChange("notes", v)}
                  placeholder="Conte um pouco sobre você..."
                />
              </View>
            </CardContent>
          </Card>

          {/* Invite Codes Card */}
          <Card style={{ width: "100%" }}>
            <CardHeader>
              <View style={styles.cardTitleContainer}>
                <Icon name="share-variant-outline" size={22} color="#7C3AED" />
                <CardTitle>Convites da Comunidade</CardTitle>
              </View>
            </CardHeader>
            <CardContent>
              <Button
                variant="host"
                style={{ width: "100%" }}
                onPress={() => handleCopyInvite("SHALOM2025")}
              >
                Gerar e Copiar Código
              </Button>
            </CardContent>
          </Card>
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

<<<<<<< HEAD
// ESTE É O BLOCO DE ESTILOS COMPLETO E CORRIGIDO
const styles = StyleSheet.create({
  spinner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
=======
const styles = StyleSheet.create({
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
    ...Platform.select({
      ios: { paddingTop: 12, paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 15 },
      default: { paddingVertical: 12 },
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  iconButton: { padding: 8 },
  container: {
    flexGrow: 1,
    padding: 16,
    alignItems: "center",
<<<<<<< HEAD
    justifyContent: 'center', // <-- ADICIONE ESTA LINHA
=======
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 700,
    gap: 24,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
<<<<<<< HEAD
    padding: 24,
    paddingBottom: 16,
=======
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formSection: { gap: 8, marginBottom: 16 },
<<<<<<< HEAD
  cardTitle: { fontSize: 20, fontWeight: '600' }, // Adicionado
  cardContent: { paddingHorizontal: 24, paddingBottom: 24 }, // Adicionado
});
=======
});
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
