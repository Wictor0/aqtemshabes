import React, { useState, useCallback, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Platform, 
  Modal, 
  FlatList, 
  Dimensions,
  ActivityIndicator,
  Alert
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import { useAuth } from "../../context/AuthContext";
import { 
  getMatchesForHost, 
  getNotifications, 
  markAllNotificationsAsRead 
} from "../../services/api";
import { supabase } from "../../services/supabase";
import { Badge } from "../ui/Badge";
import Icon from "../ui/Icon";

const { width } = Dimensions.get('window');

export default function Header() {
  const navigation = useNavigation();
  const { user, signOut } = useAuth();
  
  const [pendingCount, setPendingCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [isNotiModalVisible, setIsNotiModalVisible] = useState(false);

  const fetchHeaderData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [matchesRes, notisRes] = await Promise.all([
        getMatchesForHost(user.id),
        getNotifications(user.id)
      ]);

      setPendingCount((matchesRes.data || []).filter(m => m.status === 'pending').length);

      const data = notisRes.data || [];
      const sorted = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      
      setNotifications(sorted);
    } catch (error) {
      console.error("Erro ao carregar dados do Header:", error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchHeaderData();

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        'postgres_changes',
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications', 
          filter: `user_id=eq.${user.id}` 
        },
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleOpenNotiModal = async () => {
    setIsNotiModalVisible(true);
    
    if (unreadCount > 0) {
      try {
        await markAllNotificationsAsRead(user.id);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      } catch (error) {
        console.error("Erro ao marcar notificações como lidas:", error);
      }
    }
  };

  // 👇 FUNÇÃO PARA LIMPAR NOTIFICAÇÕES 👇
  const handleClearNotifications = async () => {
    Alert.alert(
      "Limpar Notificações",
      "Deseja apagar todas as suas notificações permanentemente?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Limpar Tudo", 
          style: "destructive", 
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('user_id', user.id);
              
              if (error) throw error;
              setNotifications([]);
            } catch (error) {
              console.error("Erro ao limpar notificações:", error);
              Alert.alert("Erro", "Não foi possível limpar as notificações.");
            }
          }
        }
      ]
    );
  };

  const handleNotificationPress = (item) => {
    setIsNotiModalVisible(false);

    if (item.match_id) {
        navigation.navigate('EventDetail', { 
            matchId: item.match_id,
            origin: 'header_notification' 
        });
    } 
    else if (item.event_id) {
        navigation.navigate('EventDetail', { 
            eventId: item.event_id,
            origin: 'header_notification' 
        });
    } 
    else {
        console.log("Notificação informativa sem link direto.");
    }
  };

  const renderNotificationItem = ({ item }) => {
    let iconName = "bell-outline";
    let iconColor = "#4F46E5";

    if (item.type === 'match_request') iconName = "account-plus-outline";
    else if (item.type === 'match_accepted') iconName = "check-decagram-outline";
    else if (item.type === 'event_created') iconName = "calendar-check-outline";
    else if (item.type === 'event_cancelled') {
        iconName = "calendar-remove-outline";
        iconColor = "#EF4444";
    }

    return (
      <TouchableOpacity 
        style={[styles.notiItem, !item.read && styles.notiUnread]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.notiIconCircle, item.type === 'event_cancelled' && { backgroundColor: '#FEE2E2' }]}>
          <Icon name={iconName} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Text style={styles.notiTitle}>{item.title}</Text>
              {(item.event_id || item.match_id) && <Icon name="chevron-right" size={16} color="#D1D5DB" />}
          </View>
          <Text style={styles.notiMessage}>{item.message}</Text>
          <Text style={styles.notiTime}>
            {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Image source={require("../../assets/images/LOGO-REDUZIDA.png")} style={styles.logo} />
        <View>
           <Text style={styles.headerTitle}>AquiTemShabes</Text>
           <Text style={styles.headerSubtitle}>
             Shalom, {(user?.user_metadata?.full_name || user?.user_metadata?.name || "Visitante").split(" ")[0]}! 👋
           </Text>
        </View>
      </View>

      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={handleOpenNotiModal}
        >
          <Icon name="bell-outline" size={26} color="#374151" />
          {unreadCount > 0 && (
            <View style={styles.notiBadge}>
              <Text style={styles.notiBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconButton} onPress={signOut}>
          <Icon name="logout" size={24} color="#EF4444" /> 
        </TouchableOpacity>
      </View>

      <Modal 
        visible={isNotiModalVisible} 
        transparent 
        animationType="fade" 
        onRequestClose={() => setIsNotiModalVisible(false)}
      >
        <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1} 
            onPress={() => setIsNotiModalVisible(false)}
        >
          <View style={styles.notiModalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.notiModalHeader}>
              <Text style={styles.notiModalTitle}>Atividades Recentes</Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                {/* 👇 BOTÃO DE LIMPAR 👇 */}
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={handleClearNotifications}>
                    <Icon name="trash-can-outline" size={22} color="#EF4444" />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity onPress={() => setIsNotiModalVisible(false)}>
                  <Icon name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <FlatList
              data={notifications}
              keyExtractor={item => item.id.toString()}
              renderItem={renderNotificationItem}
              ListEmptyComponent={
                <View style={styles.emptyNoti}>
                  <Icon name="bell-off-outline" size={40} color="#D1D5DB" />
                  <Text style={styles.emptyNotiText}>Nenhuma notificação encontrada.</Text>
                </View>
              }
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  logo: { width: 29, height: 40, borderRadius: 20 },
  headerTitle: { fontSize: 16, fontWeight: "bold" },
  headerSubtitle: { fontSize: 12, color: "#6B7280" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 16 },
  iconButton: { padding: 4, position: 'relative' },
  notiBadge: { position: "absolute", top: 2, right: 0, backgroundColor: "#7921ec", width: 16, height: 16, borderRadius: 8, justifyContent: "center", alignItems: "center", borderWidth: 1.5, borderColor: "white" },
  notiBadgeText: { color: "white", fontSize: 9, fontWeight: "bold" },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  notiModalContent: { width: width * 0.88, maxHeight: '75%', backgroundColor: 'white', borderRadius: 24, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 10 },
  notiModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', paddingBottom: 12 },
  notiModalTitle: { fontSize: 18, fontWeight: '800', color: '#111827' },
  notiItem: { flexDirection: 'row', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', gap: 12, paddingHorizontal: 8 },
  notiUnread: { backgroundColor: '#F5F3FF', borderRadius: 12 },
  notiIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center' },
  notiTitle: { fontSize: 14, fontWeight: '700', color: '#1F2937' },
  notiMessage: { fontSize: 13, color: '#4B5563', marginTop: 2, lineHeight: 18 },
  notiTime: { fontSize: 11, color: '#9CA3AF', marginTop: 8 },
  emptyNoti: { alignItems: 'center', paddingVertical: 40 },
  emptyNotiText: { color: '#9CA3AF', marginTop: 10, fontSize: 14 },
});