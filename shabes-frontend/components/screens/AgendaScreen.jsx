import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { useFocusEffect } from "@react-navigation/native";

import { Card } from "../ui/Card";
import { useAuth } from "../../context/AuthContext";
import { getMatchesForGuest, getMatchesForHost } from "../../services/api";
import { toast } from "../../hooks/use-toast";
import Icon from "../ui/Icon"; 

import { HDate } from "@hebcal/core";

// Configuração de idioma pt-br
LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
    "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
  ],
  dayNames: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  dayNamesShort: ["D","S","T","Q","Q","S","S"],
  today: "Hoje"
};
LocaleConfig.defaultLocale = "pt-br";

// --- CORES DE IDENTIDADE ---
const ROLE_COLORS = {
    host: '#7C3AED', // Roxo para Anfitrião
    guest: '#3B82F6', // Azul para Convidado
    holiday: '#F59E0B' // Dourado para Feriados
};

// --- FUNÇÕES DE FORMATAÇÃO ---
const toDateString = (date) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getJewishDay = (date) => {
  try {
    return new HDate(new Date(date)).getDate();
  } catch {
    return "";
  }
};

// Datas judaicas fixas
const jewishEvents = [
    { name: "Ano Novo Judaico", hebrewName: "Rosh Hashaná", date: "2025-09-22" },
    { name: "Dia do Perdão", hebrewName: "Yom Kipur", date: "2025-10-01" },
    { name: "Festa das Cabanas", hebrewName: "Sukkot", date: "2025-10-06" },
    { name: "Alegria da Torá", hebrewName: "Simchat Torá", date: "2025-10-13" },
    { name: "Festival das Luzes", hebrewName: "Chanukah", date: "2025-12-27" },
    { name: "Festa das Sortes", hebrewName: "Purim", date: "2025-03-14" },
    { name: "Festa das Colheitas", hebrewName: "Shavuot", date: "2025-06-04" },
    { name: "Dia de Luto", hebrewName: "Tish'a B'Av", date: "2025-07-14" },
];

export default function AgendaScreen({ navigation }) {
  const { user } = useAuth();
  const today = toDateString(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [confirmedEvents, setConfirmedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]); 
  const [loading, setLoading] = useState(true);

  const fetchAgendaEvents = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [guestResp, hostResp] = await Promise.all([
        getMatchesForGuest(user.id),
        getMatchesForHost(user.id)
      ]);

      const guestMatches = guestResp.data || [];
      const hostMatches = hostResp.data || [];

      // Processa eventos onde sou CONVIDADO
      const guestCommitments = guestMatches
        .filter(match => match.status === "accepted" && match.event)
        .map(match => ({
          id: match.event.id,
          matchId: match.id, 
          title: match.event.title,
          hebrewTitle: match.event.hebrew_title || "",
          transliteration: match.event.transliteration || "",
          date: toDateString(match.event.date),
          fullDate: match.event.date,
          isJewishEvent: false,
          isShabbatEvent: true,
          role: 'guest',
          peopleCount: 1 + (match.dependent_ids ? match.dependent_ids.length : 0),
          location: match.event.approximate_address || 'Local a definir'
        }));

      // Processa eventos onde sou ANFITRIÃO
      const hostEventsMap = new Map();
      
      hostMatches.forEach(match => {
        if (!match.event) return;
        
        if (!hostEventsMap.has(match.event.id)) {
          hostEventsMap.set(match.event.id, {
            id: match.event.id,
            title: match.event.title,
            hebrewTitle: match.event.hebrew_title || "",
            transliteration: match.event.transliteration || "",
            date: toDateString(match.event.date),
            fullDate: match.event.date,
            isJewishEvent: false,
            isShabbatEvent: true,
            role: 'host',
            peopleCount: 0,
            location: match.event.full_address || match.event.approximate_address || 'Local a definir'
          });
        }
        
        if (match.status === 'accepted') {
           const current = hostEventsMap.get(match.event.id);
           current.peopleCount += 1 + (match.dependent_ids ? match.dependent_ids.length : 0);
        }
      });

      const hostCommitments = Array.from(hostEventsMap.values());

      // Processa Feriados Judaicos
      const jewishCommitments = jewishEvents.map(ev => ({
        id: ev.date + "-jewish",
        title: ev.name,
        hebrewTitle: ev.hebrewName,
        transliteration: "",
        date: ev.date,
        fullDate: ev.date,
        isJewishEvent: true,
        isShabbatEvent: false,
        peopleCount: 0,
        location: ''
      }));

      const allCommitments = [
        ...guestCommitments,
        ...hostCommitments,
        ...jewishCommitments
      ];

      // Remove duplicatas se houver
      const uniqueCommitments = Array.from(
        new Map(allCommitments.map(item => [item.id, item])).values()
      );

      setConfirmedEvents(uniqueCommitments);

      // --- LÓGICA PARA PRÓXIMOS COMPROMISSOS ---
      const todayDateObj = new Date();
      todayDateObj.setHours(0, 0, 0, 0);

      const upcoming = uniqueCommitments
        .filter(ev => !ev.isJewishEvent && new Date(ev.fullDate) >= todayDateObj)
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
      
      setUpcomingEvents(upcoming);

    } catch (error) {
      console.error(error);
      toast({ type: "error", title: "Não foi possível carregar a agenda." });
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

  const eventsForSelectedDay = groupedEvents[selectedDate] || [];
  
  // 👇 MODIFICADO: Agora mostramos TODOS os eventos do dia, não apenas os judaicos
  const displayEventsForSelectedDay = eventsForSelectedDay;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Calendar
          current={today}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          theme={{
            arrowColor: "#4F46E5",
            todayTextColor: "#7C3AED"
          }}
          dayComponent={({ date, state }) => {
            const gDay = date.day;
            const jDay = getJewishDay(date.dateString);
            const events = groupedEvents[date.dateString] || [];
            
            const hasJewish = events.some(ev => ev.isJewishEvent);
            const hasShabbat = events.some(ev => ev.isShabbatEvent); // Cobre Host e Guest
            
            const isSelected = selectedDate === date.dateString;
            const isToday = date.dateString === today;

            const circleColor = isToday ? '#7C3AED' : isSelected ? '#3B82F6' : 'transparent';
            const gDayColor = isToday || isSelected ? '#FFF' : state==='disabled'?'#D1D5DB':'#111827';
            const jDayColor = isToday || isSelected ? '#FFF' : state==='disabled'?'#D1D5DB':'#6B7280';

            return (
              <TouchableOpacity
                style={{
                  width:48, height:48, alignItems:'center', justifyContent:'center',
                  borderRadius:24, backgroundColor:circleColor, margin:2
                }}
                onPress={()=>setSelectedDate(date.dateString)}
                disabled={state === 'disabled'}
              >
                <Text style={{fontSize:16, fontWeight:'600', color:gDayColor}}>{gDay}</Text>
                <Text style={{fontSize:10, color:jDayColor, marginTop:2}}>{jDay}</Text>
                
                {(hasJewish || hasShabbat) && (
                  <View style={{
                    position: 'absolute',
                    bottom: 5,
                    flexDirection: 'row',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    {hasJewish && (
                      <View style={{ width: 10, height: 2, backgroundColor: '#FBBF24', borderRadius: 1 }} />
                    )}
                    {hasShabbat && (
                      <View style={{ width: 10, height: 2, backgroundColor: '#3B82F6', borderRadius: 1 }} />
                    )}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.listContainer}>
          {/* --- SEÇÃO 1: COMPROMISSOS DO DIA (TODOS) --- */}
          <Text style={styles.listHeader}>Compromissos Do Dia</Text>
          
          {loading ? (
            <ActivityIndicator size="large" style={{marginTop:20}}/>
          ) : displayEventsForSelectedDay.length > 0 ? (
            displayEventsForSelectedDay.map((item) => {
                // Lógica de cores e conteúdo para o card do dia
                const isHoliday = item.isJewishEvent;
                const boxColor = isHoliday ? ROLE_COLORS.holiday : (item.role === 'host' ? ROLE_COLORS.host : ROLE_COLORS.guest);
                const titleColor = isHoliday ? '#D97706' : '#1F2937';
                
                // Texto principal e secundário variam se for feriado ou evento
                const mainTitle = isHoliday ? item.hebrewTitle : item.title;
                const subTitle = isHoliday ? item.title : (new Date(item.fullDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + item.location);
                const iconName = isHoliday ? "star" : (item.role === 'host' ? "home-account" : "calendar-check");
                const iconColor = isHoliday ? "#D97706" : (item.role === 'host' ? "#7C3AED" : "#3B82F6");

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    activeOpacity={isHoliday ? 1 : 0.8}
                    disabled={isHoliday} // Feriados não clicáveis, Eventos clicáveis
                    onPress={() => {
                        if (!isHoliday) {
                            if (item.role === 'host') {
                                navigation.navigate("HostEventDetail", { eventId: item.id });
                            } else {
                                navigation.navigate("EventDetail", { 
                                    eventId: item.id, 
                                    matchId: item.matchId, 
                                    origin: 'home' 
                                });
                            }
                        }
                    }}
                  >
                    <Card style={[
                        styles.itemCard, 
                        { borderLeftWidth: 4, borderLeftColor: boxColor }
                    ]}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View style={{flex: 1, paddingRight: 8}}>
                                <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={1}>
                                  {mainTitle}
                                </Text>
                                <Text style={{ color: '#6B7280', fontSize: 14 }}>
                                  {subTitle}
                                </Text>
                                {!isHoliday && (
                                    <Text style={{ fontSize: 10, color: boxColor, marginTop: 4, fontWeight: 'bold' }}>
                                        {item.role === 'host' ? 'ANFITRIÃO' : 'CONVIDADO'}
                                    </Text>
                                )}
                            </View>
                            <Icon name={iconName} size={24} color={iconColor} />
                        </View>
                    </Card>
                  </TouchableOpacity>
                );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhum compromisso para este dia.</Text>
            </View>
          )}

          {/* --- SEÇÃO 2: PRÓXIMOS COMPROMISSOS --- */}
          <View style={styles.upcomingSection}>
            <Text style={styles.listHeader}>Próximos Compromissos</Text>
            
            {loading ? (
                <ActivityIndicator size="small" />
            ) : upcomingEvents.length > 0 ? (
                upcomingEvents.map((item) => {
                    const dateObj = new Date(item.fullDate);
                    const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                    const day = dateObj.getDate();
                    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                    const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                    const time = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

                    const coincidingHoliday = jewishEvents.find(je => je.date === item.date);
                    const dateBoxColor = item.role === 'host' ? ROLE_COLORS.host : ROLE_COLORS.guest;

                    return (
                    <TouchableOpacity 
                        key={`upcoming-${item.id}`} 
                        activeOpacity={0.8}
                        onPress={() => {
                            if (item.role === 'host') {
                                navigation.navigate("HostEventDetail", { eventId: item.id });
                            } else {
                                navigation.navigate("EventDetail", { 
                                  eventId: item.id, 
                                  matchId: item.matchId, 
                                  origin: 'home' 
                                });
                            }
                        }}
                    >
                        <View style={styles.upcomingCardNew}>
                            {/* Coluna da Esquerda */}
                            <View style={[styles.leftColumn, { backgroundColor: dateBoxColor }]}> 
                                <Text style={styles.monthText}>{month}</Text>
                                <Text style={styles.dayText}>{day}</Text>
                                <View style={styles.separator} />
                                <Text style={styles.weekdayText}>{formattedWeekday}</Text>
                                <Text style={styles.timeText}>{time}</Text>
                            </View>

                            {/* Coluna da Direita */}
                            <View style={styles.rightColumn}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <Text style={styles.upcomingTitleNew} numberOfLines={1}>{item.title}</Text>
                                    <Text style={{ fontSize: 10, color: dateBoxColor, fontWeight: 'bold' }}>
                                        {item.role === 'host' ? 'ANFITRIÃO' : 'CONVIDADO'}
                                    </Text>
                                </View>

                                <View style={styles.eventMetaRowNew}>
                                    <View style={styles.metaItemNew}>
                                        <Icon name="map-marker-outline" size={14} color="#6B7280" />
                                        <Text style={styles.metaTextNew} numberOfLines={1}>{item.location}</Text>
                                    </View>
                                </View>
                                {item.peopleCount > 0 && (
                                    <View style={styles.eventMetaRowNew}>
                                        <View style={styles.metaItemNew}>
                                            <Icon name="account-group-outline" size={14} color="#6B7280" />
                                            <Text style={styles.metaTextNew}>{item.peopleCount} pessoas confirmadas</Text>
                                        </View>
                                    </View>
                                )}
                                
                                {coincidingHoliday && (
                                    <View style={[styles.eventMetaRowNew, { marginTop: 4 }]}>
                                        <View style={styles.metaItemNew}>
                                            <Icon name="star" size={14} color="#D97706" />
                                            <Text style={[styles.metaTextNew, { color: '#D97706', fontWeight: '600' }]}>
                                                {coincidingHoliday.hebrewName}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                            </View>
                        </View>
                    </TouchableOpacity>
                )})
            ) : (
                <Text style={styles.emptyText}>Você não tem eventos futuros agendados.</Text>
            )}
          </View>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    backgroundColor: 'white', ...Platform.select({
      ios: { paddingBottom: 12 },
      android: { paddingTop: 20, paddingBottom: 15 }
    }),
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 8, marginLeft: -8 },
  
  scrollContainer: { flexGrow: 1 },
  listContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 24, color: '#1F2937' },
  
  itemCard: { padding: 16, marginBottom: 12, backgroundColor: 'white' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  
  emptyContainer: { alignItems: 'center', marginTop: 10, padding: 20, backgroundColor: '#F3F4F6', borderRadius: 8 },
  emptyText: { color: '#6B7280', fontSize: 15, fontStyle: 'italic' },

  eventMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 13, color: '#6B7280' },

  upcomingSection: { marginTop: 8 },
  upcomingCardNew: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftColumn: {
    paddingVertical: 10, 
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 80, 
  },
  monthText: {
    color: 'white',
    fontSize: 11, 
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayText: {
    color: 'white',
    fontSize: 24, 
    fontWeight: 'bold',
    marginVertical: 2, 
  },
  separator: {
    height: 1,
    width: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginVertical: 4, 
  },
  weekdayText: {
    color: 'white',
    fontSize: 12, 
    fontWeight: '500',
  },
  timeText: {
    color: 'white',
    fontSize: 12, 
    fontWeight: '500',
    marginTop: 1, 
  },
  rightColumn: {
    flex: 1,
    padding: 12, 
    justifyContent: 'center',
  },
  upcomingTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    flex: 1,
  },
  eventMetaRowNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2, 
  },
  metaItemNew: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  metaTextNew: {
    fontSize: 14,
    color: '#6B7280',
  },
});