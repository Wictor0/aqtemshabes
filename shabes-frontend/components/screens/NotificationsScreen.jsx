import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '../ui/Icon';
import { getNotifications, markNotificationAsRead } from '../../services/api';
import { toast } from '../../hooks/use-toast';

// Função para formatar o tempo (ex: "5m atrás")
const timeAgo = (dateString) => {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `há ${Math.floor(interval)} anos`;
  interval = seconds / 2592000;
  if (interval > 1) return `há ${Math.floor(interval)} meses`;
  interval = seconds / 86400;
  if (interval > 1) return `há ${Math.floor(interval)} dias`;
  interval = seconds / 3600;
  if (interval > 1) return `há ${Math.floor(interval)} horas`;
  interval = seconds / 60;
  if (interval > 1) return `há ${Math.floor(interval)} min`;
  return "agora mesmo";
};

const NotificationItem = ({ item, onMarkAsRead }) => {
  const icon = {
    name: item.is_read ? 'bell-outline' : 'bell-ring',
    color: item.is_read ? '#6B7280' : '#4F46E5',
  };

  return (
    <TouchableOpacity onPress={() => !item.is_read && onMarkAsRead(item.id)}>
      <View style={[styles.itemContainer, !item.is_read && styles.unread]}>
        <Icon name={icon.name} size={24} color={icon.color} style={styles.itemIcon} />
        <View style={styles.itemTextContainer}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          <Text style={styles.itemDescription}>{item.message}</Text>
          <Text style={styles.itemTime}>{timeAgo(item.created_at)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Função para buscar as notificações da API
  const fetchNotifications = useCallback(async () => {
    try {
      const response = await getNotifications();
      setNotifications(response.data || []);
    } catch (error) {
      console.error("Erro ao buscar notificações:", error);
      toast({ type: 'error', title: 'Não foi possível carregar as notificações.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Busca as notificações sempre que o ecrã é focado
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchNotifications();
    }, [fetchNotifications])
  );

  const handleMarkAsRead = async (notificationId) => {
    // Atualiza o estado visualmente de forma otimista
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
    );
    try {
      // Envia o pedido para a API em segundo plano
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error("Erro ao marcar notificação como lida:", error);
      // Se der erro, reverte a alteração visual
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: false } : n)
      );
      toast({ type: 'error', title: 'Erro ao atualizar notificação.' });
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 44 }} />
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => <NotificationItem item={item} onMarkAsRead={handleMarkAsRead} />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
                <Icon name="bell-off-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>Você não tem nenhuma notificação.</Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
    ...Platform.select({
      ios: { paddingTop: 12, paddingBottom: 12 },
      android: { paddingTop: 40, paddingBottom: 15 },
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContainer: { paddingVertical: 16 },
  itemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: 'white',
  },
  unread: {
    backgroundColor: '#EFF6FF',
    borderLeftColor: '#3B82F6',
    borderLeftWidth: 4,
  },
  itemIcon: { marginRight: 16 },
  itemTextContainer: { flex: 1 },
  itemTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 2 },
  itemDescription: { color: '#4B5563', marginBottom: 4 },
  itemTime: { color: '#9CA3AF', fontSize: 12 },
  separator: { height: 1, backgroundColor: '#F3F4F6' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '50%',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    color: '#6B7280',
  },
});

