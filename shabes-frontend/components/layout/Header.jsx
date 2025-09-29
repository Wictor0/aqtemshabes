import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
// MODIFICAÇÃO: Importa a função explícita para o anfitrião
import { getMatchesForHost } from "../../services/api";
import { Badge } from "../ui/Badge";
import Icon from "../ui/Icon";

export default function Header() {
  const navigation = useNavigation();
  // 1. Obtemos a função signOut do nosso hook de autenticação
  const { user, signOut } = useAuth();
  const [pendingCount, setPendingCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const fetchPendingCount = async () => {
        if (user?.id) {
          try {
            // Usa a função explícita para buscar apenas os matches do anfitrião
            const response = await getMatchesForHost(user.id);
            const hostMatches = response.data || [];
            
            // Filtra para contar apenas os pendentes
            const pending = hostMatches.filter(m => m.status === 'pending').length;
            setPendingCount(pending);
          } catch (error) {
            console.error("Erro ao buscar contagem de pendentes para o Header:", error);
          }
        }
      };
      fetchPendingCount();
    }, [user])
  );

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
        />
        <View>
           <Text style={styles.headerTitle}>Aquitemshabes</Text>
           <Text style={styles.headerSubtitle}>
             Shalom, {user?.user_metadata?.full_name?.split(" ")[0]}! 👋
           </Text>
        </View>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => navigation.navigate("Notifications")}
        >
          <Icon name="bell-outline" size={24} color="#374151" />
          {pendingCount > 0 && (
            <Badge style={styles.notificationBadge}>
              <Text style={styles.notificationText}>{pendingCount}</Text>
            </Badge>
          )}
        </TouchableOpacity>
        {/* 2. O botão agora chama a função signOut e o ícone foi atualizado */}
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={signOut}
        >
          <Icon name="logout" size={24} color="#EF4444" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "white",
    ...Platform.select({
      ios: { paddingTop: 60, paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 12 },
    }),
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logo: { width: 40, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: "bold" },
  headerSubtitle: { fontSize: 12, color: "#6B7280" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconButton: { padding: 4 },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -4,
    Width: 10,
    height: 18,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    padding: 0,
  },
  notificationText: { color: "white", fontSize: 6, fontWeight: "regular" },
});

