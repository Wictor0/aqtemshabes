import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
  FlatList, // Usaremos a lista nativa do React Native
} from 'react-native';
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { Card } from '../ui/Card';
import Icon from '../ui/Icon';

// Configuração de idioma para o calendário
LocaleConfig.locales['pt-br'] = {
  monthNames: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
  dayNames: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
  dayNamesShort: ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'],
  today: "Hoje"
};
LocaleConfig.defaultLocale = 'pt-br';

// Nossos dados de evento de exemplo
const mockEvents = [
  { id: '1', title: 'Jantar de Shabat na Família Cohen', time: '19:00 - 22:00', location: 'Jardins, São Paulo', date: '2025-09-05' },
  { id: '2', title: 'Almoço de Shabat Comunitário', time: '12:30 - 15:00', location: 'Sinagoga Beit Chabad', date: '2025-09-06' },
  { id: '3', title: 'Shabat com amigos', time: '19:30 - 22:30', location: 'Pinheiros, São Paulo', date: '2025-09-12' },
  { id: '4', title: 'Outro Jantar', time: '20:00 - 23:00', location: 'Casa da Família Levy', date: '2025-09-12' },
];

const toDateString = (date) => date.toISOString().split('T')[0];

export default function AgendaScreen({ navigation }) {
  const today = toDateString(new Date());
  // 1. Estado para guardar a data que o usuário selecionou no calendário
  const [selectedDate, setSelectedDate] = useState(today);

  // 2. Agrupamos os eventos por data uma única vez para performance
  const groupedEvents = useMemo(() => {
    return mockEvents.reduce((acc, event) => {
      (acc[event.date] = acc[event.date] || []).push(event);
      return acc;
    }, {});
  }, []);

  // 3. Criamos as marcações (bolinhas) para os dias que têm eventos
  const markedDates = useMemo(() => {
    return Object.keys(groupedEvents).reduce((acc, date) => {
      acc[date] = { marked: true, dotColor: '#4F46E5' };
      return acc;
    }, {});
  }, [groupedEvents]);

  // Adicionamos a marcação para o dia selecionado
  const finalMarkedDates = {
    ...markedDates,
    [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: '#7C3AED' }
  };

  // Itens para mostrar na lista de baixo, baseado na data selecionada
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

      {/* 4. O Calendário Simples (Parte de Cima) */}
      <Calendar
        current={today}
        onDayPress={(day) => setSelectedDate(day.dateString)}
        markedDates={finalMarkedDates}
        theme={{
            arrowColor: '#4F46E5',
            todayTextColor: '#7C3AED',
        }}
      />

      {/* 5. A Lista de Eventos (Parte de Baixo) */}
      <View style={styles.listContainer}>
        <Text style={styles.listHeader}>Compromissos do dia</Text>
        <FlatList
          data={eventsForSelectedDay}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card style={styles.itemCard}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <View style={styles.itemDetailRow}>
                <Icon name="clock-outline" size={16} color="#6B7280" />
                <Text style={styles.itemText}>{item.time}</Text>
              </View>
            </Card>
          )}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum compromisso para este dia.</Text>
            </View>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB', backgroundColor: 'white', ...Platform.select({ ios: { paddingBottom: 12 }, android: { paddingTop: 20, paddingBottom: 15 } }),
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 8, marginLeft: -8 },
  // Estilos da lista
  listContainer: { flex: 1, marginTop: 16, paddingHorizontal: 16 },
  listHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 8, color: '#1F2937' },
  itemCard: { padding: 16, marginBottom: 12, backgroundColor: 'white' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  itemDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemText: { fontSize: 14, color: '#374151' },
  emptyContainer: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#6B7280' },
});