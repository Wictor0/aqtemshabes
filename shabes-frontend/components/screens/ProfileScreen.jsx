import React, { useState, useEffect } from "react";
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

  const handleInputChange = (field, value) => {
    setProfileData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
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
          <Card style={{ width: "100%" }}>
            <CardHeader style={styles.cardHeader}>
              <View style={styles.cardTitleContainer}>
                <Icon name="account-circle-outline" size={22} color="#4F46E5" />
                <CardTitle>Informações Pessoais</CardTitle>
              </View>
              <Button onPress={() => (isEditing ? handleSave() : setIsEditing(true))} disabled={isSaving} variant={isEditing ? "default" : "outline"} size="sm">
                {isSaving ? <LoadingSpinner size="small" /> : isEditing ? "Salvar" : "Editar"}
              </Button>
            </CardHeader>
            <CardContent>
              <View style={styles.formSection}>
                <Label>Nome Completo</Label>
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
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ESTE É O BLOCO DE ESTILOS COMPLETO E CORRIGIDO
const styles = StyleSheet.create({
  spinner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
    justifyContent: 'center', // <-- ADICIONE ESTA LINHA
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
    padding: 24,
    paddingBottom: 16,
  },
  cardTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formSection: { gap: 8, marginBottom: 16 },
  cardTitle: { fontSize: 20, fontWeight: '600' }, // Adicionado
  cardContent: { paddingHorizontal: 24, paddingBottom: 24 }, // Adicionado
});