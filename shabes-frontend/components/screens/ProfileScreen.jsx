import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Clipboard from "expo-clipboard";

import { useAuth } from "../../context/AuthContext";
import { getMyProfile, updateMyProfile } from "../../services/api";
import { toast } from "../../hooks/use-toast";

// Import UI components
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Textarea } from "../ui/Textarea";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/Card";
import { Select } from "../ui/Select";
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
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: "",
    phone: "",
    address: "",
    max_distance: 15,
    dietary_preference: "kosher",
    notes: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getMyProfile();
        // Preenche o estado com os dados da API, usando valores padrão se algo vier nulo
        setProfileData({
          full_name: response.data.full_name || "",
          phone: response.data.phone || "",
          address: response.data.address || "",
          max_distance: response.data.max_distance || 15,
          dietary_preference: response.data.dietary_preference || "kosher",
          notes: response.data.notes || "",
        });
      } catch (error) {
        console.error("Erro ao buscar perfil:", error);
        toast({ type: "error", title: "Erro ao carregar o perfil" });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMyProfile(profileData);
      toast({ type: "success", title: "Perfil atualizado com sucesso!" });
      setIsEditing(false);
    } catch (error) {
      toast({
        type: "error",
        title: "Erro ao salvar",
        description: "Não foi possível atualizar seu perfil.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyInvite = async (code) => {
    await Clipboard.setStringAsync(code);
    toast({ type: "success", title: "Código copiado!" });
  };

  if (loading) {
    return (
      <View style={styles.spinnerContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.contentWrapper}>
          {/* Profile Card */}
          <Card style={{ width: "100%" }}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Icon name="account-circle-outline" size={22} color="#4F46E5" />
                <CardTitle>Informações Pessoais</CardTitle>
              </View>
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
              </Button>
            </CardHeader>
            <CardContent>
              <View style={styles.formSection}>
                <Label>Nome Completo</Label>
                <Input
                  value={profileData.full_name}
                  onChangeText={(v) => handleInputChange("full_name", v)}
                  editable={isEditing}
                />
              </View>
              <View style={styles.formSection}>
                <Label>Email</Label>
                <Input value={user?.email || ""} editable={false} />
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  safeArea: { flex: 1, backgroundColor: "#F9FAFB" },
  container: {
    flexGrow: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center", // Centraliza o conteúdo verticalmente
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
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formSection: { gap: 8, marginBottom: 16 },
});

