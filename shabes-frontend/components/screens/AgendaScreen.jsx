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
import { Calendar, LocaleConfig, WeekCalendar, CalendarProvider } from "react-native-calendars"; 
import { useFocusEffect } from "@react-navigation/native";

import { Card } from "../ui/Card";
import { useAuth } from "../../context/AuthContext";
import { getMatchesForGuest, getMatchesForHost, getEventsByHost } from "../../services/api"; 
import { toast } from "../../hooks/use-toast";
import Icon from "../ui/Icon"; 

import { HDate } from "@hebcal/core"; 

// Configuração de idioma pt-br
LocaleConfig.locales["pt-br"] = {
  monthNames: ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"],
  monthNamesShort: ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"],
  dayNames: ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"],
  dayNamesShort: ["D","S","T","Q","Q","S","S"],
  today: "Hoje"
};
LocaleConfig.defaultLocale = "pt-br";

const PESSACH_DAYS = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-07', '2026-04-08', '2026-04-09'];
const GOLD_COLOR = "#D4AF37";
const ROLE_COLORS = { host: '#7C3AED', guest: '#3B82F6', holiday: '#F59E0B' };

const toDateString = (date) => {
  const localDate = new Date(date);
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, "0");
  const day = String(localDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getJewishDay = (date) => {
  try { return new HDate(new Date(date)).getDate(); } catch { return ""; }
};

const getHebrewMonthLabel = (date) => {
  try {
    const d = new Date(date + 'T12:00:00');
    const startH = new HDate(new Date(d.getFullYear(), d.getMonth(), 1));
    const endH = new HDate(new Date(d.getFullYear(), d.getMonth(), 28));
    const m1 = startH.getMonthName();
    const m2 = endH.getMonthName();
    const translate = (m) => {
      const map = { 'Nisan': 'Nissan', 'Iyyar': 'Iyar', 'Sivan': 'Sivan', 'Tamuz': 'Tammuz', 'Av': 'Av', 'Elul': 'Elul', 'Tishrei': 'Tishrei', 'Cheshvan': 'Cheshvan', 'Kislev': 'Kislev', 'Tevet': 'Tevet', 'Shevat': 'Shevat', 'Adar': 'Adar', 'Adar I': 'Adar I', 'Adar II': 'Adar II' };
      return map[m] || m;
    };
    return m1 === m2 ? translate(m1) : `${translate(m1)} / ${translate(m2)}`;
  } catch { return ""; }
};

const jewishEvents = [
    { name: "Chagim", hebrewName: "Rosh Hashaná", date: "2025-09-22" },
    { name: "Chagim", hebrewName: "Yom Kipur", date: "2025-10-01" },
    { name: "Festa das Cabanas", hebrewName: "Sukkot", date: "2025-10-06" },
    { name: "Alegria da Torá", hebrewName: "Simchat Torá", date: "2025-10-13" },
    { name: "Festival das Luzes", hebrewName: "Chanukah", date: "2025-12-27" },
    { name: "Festa das Sortes", hebrewName: "Purim", date: "2026-03-03" },
    { name: "Chagim", hebrewName: "Pessach", date: "2026-04-01" },
    { name: "Chagim", hebrewName: "Pessach", date: "2026-04-02" },
    { name: "Chagim", hebrewName: "Pessach", date: "2026-04-03" },
    { name: "Chagim", hebrewName: "Pessach", date: "2026-04-07" },
    { name: "Chagim", hebrewName: "Pessach", date: "2026-04-08" },
    { name: "Chagim", hebrewName: "Pessach", date: "2026-04-09" },
];

export default function AgendaScreen({ navigation }) {
  const { user } = useAuth();
  const today = toDateString(new Date());

  const [selectedDate, setSelectedDate] = useState(today);
  const [confirmedEvents, setConfirmedEvents] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [calendarMode, setCalendarMode] = useState('month'); 

  const fetchAgendaEvents = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      setLoading(true);
      const [guestResp, hostMatchesResp, hostEventsResp] = await Promise.all([
        getMatchesForGuest(user.id), getMatchesForHost(user.id), getEventsByHost(user.id) 
      ]);
      const guestMatches = guestResp.data || [];
      const hostMatches = hostMatchesResp.data || [];
      const hostedEvents = hostEventsResp.data || [];

      const guestCommitments = guestMatches.filter(match => match.event && match.status?.toLowerCase() === "accepted").map(match => ({
          id: match.event.id, matchId: match.id, title: match.event.title, date: toDateString(match.event.date), fullDate: match.event.date, isJewishEvent: false, isPessachEvent: PESSACH_DAYS.includes(toDateString(match.event.date)), role: 'guest', peopleCount: 1 + (match.dependent_ids ? match.dependent_ids.length : 0), location: match.event.approximate_address || 'Local a definir'
      }));

      const hostCommitments = hostedEvents.filter(event => String(event.host_id) === String(user.id)).map(event => {
          const dateStr = toDateString(event.date);
          const eventMatches = hostMatches.filter(m => String(m.event_id) === String(event.id) && m.status?.toLowerCase() === 'accepted');
          const totalPeople = eventMatches.reduce((acc, m) => acc + 1 + (m.dependent_ids ? m.dependent_ids.length : 0), 0);
          return { id: event.id, title: event.title, date: dateStr, fullDate: event.date, isJewishEvent: false, isPessachEvent: PESSACH_DAYS.includes(dateStr), role: 'host', peopleCount: totalPeople, location: event.full_address || event.approximate_address || 'Sua Casa' };
      });

      const jewishCommitments = jewishEvents.map(ev => ({ id: ev.date + "-j-" + ev.hebrewName, hebrewTitle: ev.hebrewName, date: ev.date, fullDate: ev.date, isJewishEvent: true, role: 'holiday' }));
      const all = [...guestCommitments, ...hostCommitments, ...jewishCommitments];
      const unique = Array.from(new Map(all.map(item => [item.id, item])).values());
      setConfirmedEvents(unique);
      setUpcomingEvents(unique.filter(ev => !ev.isJewishEvent && new Date(ev.fullDate) >= new Date().setHours(0,0,0,0)).sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate)));
    } catch (error) { console.error(error); } finally { setLoading(false); }
  }, [user?.id]);

  useFocusEffect(useCallback(() => { fetchAgendaEvents(); }, [fetchAgendaEvents]));

  const groupedEvents = useMemo(() => confirmedEvents.reduce((acc, event) => { (acc[event.date] = acc[event.date] || []).push(event); return acc; }, {}), [confirmedEvents]);
  const displayEvents = groupedEvents[selectedDate] || [];

  const handleArrowPress = (direction) => {
    const current = new Date(selectedDate + 'T12:00:00');
    if (calendarMode === 'week') {
      current.setDate(current.getDate() + (direction === 'left' ? -7 : 7));
    } else {
      current.setMonth(current.getMonth() + (direction === 'left' ? -1 : 1));
    }
    setSelectedDate(toDateString(current));
  };

  const renderDay = ({ date, state }) => {
    const events = groupedEvents[date.dateString] || [];
    const isPessachDate = PESSACH_DAYS.includes(date.dateString);
    const isSelected = selectedDate === date.dateString;
    const isToday = date.dateString === today;

    const dateObj = new Date(date.dateString + 'T12:00:00');
    const dayOfWeek = dateObj.getDay(); 
    const isActiveDay = dayOfWeek === 5 || dayOfWeek === 6 || isPessachDate;

    const userEvents = events.filter(ev => !ev.isJewishEvent);
    const isHostOnDay = userEvents.some(ev => ev.role === 'host');
    const hasJewish = events.some(ev => ev.isJewishEvent);

    const circleColor = isToday ? '#7C3AED' : isSelected ? (isPessachDate ? GOLD_COLOR : '#3B82F6') : 'transparent';
    const dayTextColor = (isToday || isSelected) ? '#FFF' : isActiveDay ? '#111827' : '#D1D5DB';
    const jDayColor = (isToday || isSelected) ? '#FFF' : isActiveDay ? '#6B7280' : '#E5E7EB';

    // 👇 LÓGICA DA BORDA: DOURADO SE FOR PESSACH, ROXO/AZUL CASO CONTRÁRIO 👇
    const borderStyle = (userEvents.length > 0 && !isToday && !isSelected) ? {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: isPessachDate ? GOLD_COLOR : (isHostOnDay ? ROLE_COLORS.host : ROLE_COLORS.guest)
    } : {};

    return (
      <TouchableOpacity style={[styles.dayCircle, { backgroundColor: circleColor }, borderStyle]} onPress={() => setSelectedDate(date.dateString)}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: dayTextColor }}>{date.day}</Text>
        
        {/* TRACINHO PARA EVENTOS GERAIS/FERIADOS */}
        {hasJewish && <View style={styles.jewishDashIndicator} />}
        
        <Text style={{ fontSize: 10, color: jDayColor, marginTop: 2 }}>{getJewishDay(date.dateString)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardDismissMode="on-drag">
        
        {/*<View style={styles.toggleContainer}>
          <TouchableOpacity style={[styles.toggleBtn, calendarMode === 'month' && styles.toggleBtnActive]} onPress={() => setCalendarMode('month')}>
            <Text style={[styles.toggleText, calendarMode === 'month' && styles.toggleTextActive]}>Mês</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.toggleBtn, calendarMode === 'week' && styles.toggleBtnActive]} onPress={() => setCalendarMode('week')}>
            <Text style={[styles.toggleText, calendarMode === 'week' && styles.toggleTextActive]}>Semana</Text>
          </TouchableOpacity>
        </View>*/}

        <CalendarProvider date={selectedDate} onDateChanged={setSelectedDate}>
          <View style={styles.calendarWrapper}>
            <View style={styles.customNavHeader}>
              <TouchableOpacity onPress={() => handleArrowPress('left')}>
                <Icon name="chevron-left" size={24} color="#4F46E5" />
              </TouchableOpacity>
              <View style={styles.calendarHeaderContainer}>
                <Text style={styles.calendarTitleGrego}>
                  {LocaleConfig.locales["pt-br"].monthNames[new Date(selectedDate + 'T12:00:00').getMonth()]} {new Date(selectedDate).getFullYear()}
                </Text>
                <Text style={styles.calendarTitleHebreu}>{getHebrewMonthLabel(selectedDate)}</Text>
              </View>
              <TouchableOpacity onPress={() => handleArrowPress('right')}>
                <Icon name="chevron-right" size={24} color="#4F46E5" />
              </TouchableOpacity>
            </View>

            {calendarMode === 'month' ? (
              <Calendar
                current={selectedDate}
                key={`month-${selectedDate}`}
                hideArrows={true}
                renderHeader={() => null}
                enableSwipeMonths
                dayComponent={renderDay}
                theme={{ calendarBackground: 'white' }}
              />
            ) : (
              <WeekCalendar
                current={selectedDate}
                key={`week-${selectedDate}`}
                hideArrows={true}
                renderHeader={() => null}
                dayComponent={renderDay}
                style={styles.weekCalendarStyle}
              />
            )}
          </View>
        </CalendarProvider>

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Compromissos Do Dia</Text>
          {loading ? (
            <ActivityIndicator size="large" style={{ marginTop: 20 }} />
          ) : displayEvents.length > 0 ? (
            displayEvents.map((item) => {
              const isHoliday = item.isJewishEvent;
              const isPessach = item.isPessachEvent;
              const boxColor = isPessach ? GOLD_COLOR : (isHoliday ? ROLE_COLORS.holiday : ROLE_COLORS[item.role]);
              const titleColor = isPessach ? GOLD_COLOR : (isHoliday ? '#D97706' : '#1F2937');
              return (
                <TouchableOpacity key={item.id} disabled={isHoliday} onPress={() => navigation.navigate("EventDetail", { eventId: item.id, matchId: item.matchId, origin: 'agenda' })}>
                  <Card style={[styles.itemCard, { borderLeftWidth: 4, borderLeftColor: boxColor }, isPessach && { borderColor: GOLD_COLOR, borderWidth: 1 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={1}>{isHoliday ? item.hebrewTitle : item.title}</Text>
                        {!isHoliday && <Text style={{ color: '#6B7280', fontSize: 14 }}>{new Date(item.fullDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {item.location}</Text>}
                      </View>
                      <Icon name={isPessach ? "star" : (isHoliday ? "star" : (item.role === 'host' ? "home-account" : "calendar-check"))} size={24} color={isPessach ? GOLD_COLOR : (isHoliday ? "#D97706" : ROLE_COLORS[item.role])} />
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}><Text style={styles.emptyText}>Nenhum compromisso para este dia.</Text></View>
          )}

          <View style={styles.upcomingSection}>
            <Text style={styles.listHeader}>Próximos Compromissos</Text>
            {upcomingEvents.length > 0 ? upcomingEvents.map((item) => (
                <TouchableOpacity key={`upcoming-${item.id}`} onPress={() => navigation.navigate("EventDetail", { eventId: item.id, matchId: item.matchId, origin: 'agenda' })}>
                  <View style={[styles.upcomingCardNew, item.isPessachEvent && { borderColor: GOLD_COLOR, borderWidth: 1.5 }]}>
                    <View style={[styles.leftColumn, { backgroundColor: item.isPessachEvent ? GOLD_COLOR : ROLE_COLORS[item.role] }]}>
                      <Text style={styles.monthText}>{new Date(item.fullDate).toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase()}</Text>
                      <Text style={styles.dayText}>{new Date(item.fullDate).getDate()}</Text>
                    </View>
                    <View style={styles.rightColumn}>
                      <Text style={[styles.upcomingTitleNew, item.isPessachEvent && { color: GOLD_COLOR }]} numberOfLines={1}>{item.title}</Text>
                      <View style={styles.metaItemNew}><Icon name="map-marker-outline" size={14} color="#6B7280" /><Text style={styles.metaTextNew} numberOfLines={1}>{item.location}</Text></View>
                    </View>
                  </View>
                </TouchableOpacity>
            )) : !loading && <Text style={styles.emptyText}>Sem eventos agendados.</Text>}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', backgroundColor: 'white', ...Platform.select({ ios: { paddingBottom: 12 }, android: { paddingTop: 20, paddingBottom: 15 } }) },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  iconButton: { padding: 8, marginLeft: -8 },
  scrollContainer: { flexGrow: 1 },
  toggleContainer: { flexDirection: 'row', alignSelf: 'center', backgroundColor: '#E5E7EB', borderRadius: 20, padding: 4, marginTop: 15, marginBottom: 10 },
  toggleBtn: { paddingVertical: 6, paddingHorizontal: 20, borderRadius: 18 },
  toggleBtnActive: { backgroundColor: 'white', elevation: 2 },
  toggleText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  toggleTextActive: { color: '#4F46E5' },
  calendarWrapper: { backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', paddingBottom: 10 },
  customNavHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 2, paddingTop: 5, paddingBottom: 10 },
  calendarHeaderContainer: { alignItems: 'center' },
  calendarTitleGrego: { fontSize: 17, fontWeight: 'bold', color: '#111827' },
  calendarTitleHebreu: { fontSize: 12, color: '#6B7280', fontStyle: 'italic' },
  weekCalendarStyle: { paddingHorizontal: 10 },
  dayCircle: { width: 46, height: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 23, margin: 2 },
  jewishDashIndicator: { 
    width: 10, 
    height: 2, 
    backgroundColor: '#FBBF24', 
    borderRadius: 1,
    marginTop: -2,
    marginBottom: 1
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 24, color: '#1F2937' },
  itemCard: { padding: 16, marginBottom: 12, backgroundColor: 'white', borderRadius: 12 },
  itemTitle: { fontSize: 16, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 20 },
  emptyText: { color: '#6B7280', fontStyle: 'italic' },
  upcomingSection: { marginTop: 8 },
  upcomingCardNew: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 12, marginBottom: 12, overflow: 'hidden', elevation: 2 },
  leftColumn: { paddingVertical: 12, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', width: 70 },
  monthText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  dayText: { color: 'white', fontSize: 24, fontWeight: 'bold' },
  rightColumn: { flex: 1, padding: 12, justifyContent: 'center' },
  upcomingTitleNew: { fontSize: 15, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
  metaItemNew: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaTextNew: { fontSize: 13, color: '#6B7280' },
});