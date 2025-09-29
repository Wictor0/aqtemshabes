import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';

import { Card } from '../ui/Card';
import Icon from '../ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { getMatchesForGuest, getMatchesForHost } from '../../services/api';
import { toast } from '../../hooks/use-toast';

// Configuração de idioma para o calendário
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  today: "Hoje"
};
LocaleConfig.defaultLocale = 'pt-br';

// --- FUNÇÕES DE FORMATAÇÃO CORRIGIDAS ---
// Esta função agora converte a data de forma segura, evitando problemas de fuso horário.
const toDateString = (date) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatTime = (dateString) => new Date(dateString).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

export default function AgendaScreen({ navigation }) {
  const { user } = useAuth();
  const today = toDateString(new Date());
  
  const [selectedDate, setSelectedDate] = useState(today);
  const [confirmedEvents, setConfirmedEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAgendaEvents = useCallback(async () => {
    if (!user?.id) {
        setLoading(false);
        return;
    };
    try {
      setLoading(true);
      const [guestResponse, hostResponse] = await Promise.all([
          getMatchesForGuest(user.id),
          getMatchesForHost(user.id)
      ]);
      const guestMatches = guestResponse.data || [];
      const hostMatches = hostResponse.data || [];

      const guestCommitments = guestMatches
        .filter(match => match.status === 'accepted' && match.event)
        .map(match => ({
            id: match.event.id,
            title: match.event.title,
            date: toDateString(match.event.date),
            time: formatTime(match.event.date),
            location: match.event.approximate_address || "Local não informado",
        }));

      const hostCommitments = hostMatches
        .filter(match => match.event)
        .map(match => ({
            id: match.event.id,
            title: match.event.title,
            date: toDateString(match.event.date),
            time: formatTime(match.event.date),
            location: match.event.approximate_address || "Local não informado",
        }));
        
      const allCommitments = [...guestCommitments, ...hostCommitments];
      const uniqueCommitments = Array.from(new Map(allCommitments.map(item => [item['id'], item])).values());

      setConfirmedEvents(uniqueCommitments);
    } catch (error) {
      console.error("Erro ao buscar a agenda:", error);
      toast({ type: 'error', title: 'Não foi possível carregar a sua agenda.' });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      fetchAgendaEvents();
    }, [fetchAgendaEvents])
  );

  const groupedEvents = useMemo(() => {
    return confirmedEvents.reduce((acc, event) => {
      (acc[event.date] = acc[event.date] || []).push(event);
      return acc;
    }, {});
  }, [confirmedEvents]);

  const markedDates = useMemo(() => {
    return Object.keys(groupedEvents).reduce((acc, date) => {
      acc[date] = { marked: true, dotColor: '#4F46E5' };
      return acc;
    }, {});
  }, [groupedEvents]);

  const finalMarkedDates = {
    ...markedDates,
    [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#7C3AED' }
  };

  const eventsForSelectedDay = groupedEvents[selectedDate] || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <View style={{ width: 40 }} />
      </View>

      <Calendar
        current={today}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={finalMarkedDates}
        theme={{
            arrowColor: '#4F46E5',
            todayTextColor: '#7C3AED',
        }}
      />

      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Compromissos do dia</Text>
        {loading ? (
          <ActivityIndicator size="large" style={{ marginTop: 40 }}/>
        ) : (
          <FlatList
            data={eventsForSelectedDay}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Card style={styles.itemCard}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                {item.location && (
                  <View style={styles.itemDetailRow}>
                    <Icon name="map-marker-outline" size={16} color="#6B7280" />
                    <Text style={styles.itemText}>{item.location}</Text>
                  </View>
                )}
              </Card>
            )}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum compromisso para este dia.</Text>
              </View>
            )}
          />
        )}
      </View>
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
      ios: { paddingBottom: 12 }, 
      android: { paddingTop: 20, paddingBottom: 15 }
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 8, marginLeft: -8 },
  listContainer: { flex: 1, marginTop: 16, paddingHorizontal: 16 },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1F2937' },
  itemCard: { padding: 16, marginBottom: 12, backgroundColor: 'white' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  itemDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  itemText: { fontSize: 14, color: '#374151' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280', fontSize: 15 },
});

