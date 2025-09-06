import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, Platform } from 'react-native';
import Icon from '../ui/Icon';

const mockNotifications = [
  {
    id: '1',
    type: 'match_request',
    title: 'Novo pedido de match!',
    description: 'Ana quer participar do seu Shabat Familiar.',
    time: '5m atrás',
    read: false,
  },
  {
    id: '2',
    type: 'match_accepted',
    title: 'Match Aceito!',
    description: 'A Família Cohen aceitou seu pedido.',
    time: '2h atrás',
    read: false,
  },
  {
    id: '3',
    type: 'event_reminder',
    title: 'Lembrete de Evento',
    description: 'Seu Shabat com a Família Cohen é amanhã!',
    time: '1d atrás',
    read: true,
  },
];

const NotificationItem = ({ item }) => {
  const iconMap = {
    match_request: { name: 'account-plus-outline', color: '#4F46E5' },
    match_accepted: { name: 'check-circle-outline', color: '#10B981' },
    event_reminder: { name: 'calendar-clock', color: '#F59E0B' },
  };
  const icon = iconMap[item.type] || { name: 'bell-outline', color: '#6B7280' };

  return (
    <View style={[styles.itemContainer, !item.read && styles.unread]}>
      <Icon name={icon.name} size={24} color={icon.color} style={styles.itemIcon} />
      <View style={styles.itemTextContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDescription}>{item.description}</Text>
        <Text style={styles.itemTime}>{item.time}</Text>
      </View>
    </View>
  );
};

export default function NotificationsScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 44 }} />
      </View>
      <FlatList
        data={mockNotifications}
        renderItem={({ item }) => <NotificationItem item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
      }
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 8 },
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
});
