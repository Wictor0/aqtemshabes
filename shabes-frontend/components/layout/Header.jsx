import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from "react-native";
import { useNavigation } from '@react-navigation/native'; // Hook para obter a navegação
import { useAuth } from "../../context/AuthContext";
import { getMyProfile } from "../../services/api";
import Icon from "../ui/Icon";
import { Badge } from "../ui/Badge";

// Mantenha os seus dados mock por agora
const mockMatches = [ { id: 1, status: "PENDING" } ];

export default function Header() {
  const navigation = useNavigation();
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const pendingMatches = mockMatches.filter((m) => m.status === "PENDING");

  useEffect(() => {
    // A lógica para buscar o perfil agora vive aqui
    getMyProfile()
      .then(response => setProfile(response.data))
      .catch(error => console.error("Erro ao buscar perfil no Header:", error));
  }, []);

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image source={require("../../assets/images/icon.png")} style={styles.headerLogo} />
        <View>
          <Text style={styles.headerTitle}>Aquitemshabes</Text>
          <Text style={styles.headerSubtitle}>
            Shalom, {profile?.full_name?.split(" ")[0] || 'Usuário'}! 👋
          </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Icon name="bell-outline" size={22} color="#374151" />
          {pendingMatches.length > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{pendingMatches.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={signOut}>
          <Icon name="logout" size={22} color="#374151" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Coloque os estilos específicos do Header aqui
const styles = StyleSheet.create({
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E5E7EB", backgroundColor: "white",
    ...Platform.select({
      ios: { paddingTop: 65, paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 15 },
    }),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerLogo: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontWeight: "bold", fontSize: 18 },
  headerSubtitle: { fontSize: 12, color: "#6B7280" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { padding: 8, justifyContent: 'center', alignItems: 'center' },
  notificationBadge: {
    position: 'absolute', top: 4, right: 4, backgroundColor: '#444fefff', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: '#FFFFFF',
  },
  notificationText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
});