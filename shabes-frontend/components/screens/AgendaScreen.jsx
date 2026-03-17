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
import { getMatchesForGuest, getMatchesForHost, getEventsByHost } from "../../services/api"; 
import { toast } from "../../hooks/use-toast";
import Icon from "../ui/Icon"; 

import { HDate, months } from "@hebcal/core"; // 👈 Importado months para tradução

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

// 👇 CONFIGURAÇÃO PESSACH 2026 👇
const PESSACH_DAYS = ['2026-04-01', '2026-04-02', '2026-04-03', '2026-04-07', '2026-04-08', '2026-04-09'];
const GOLD_COLOR = "#D4AF37";

const ROLE_COLORS = {
    host: '#7C3AED', 
    guest: '#3B82F6', 
    holiday: '#F59E0B' 
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

// 👇 NOVA FUNÇÃO: BUSCAR MÊS HEBRAICO DO CABEÇALHO 👇
const getHebrewMonthLabel = (date) => {
  try {
    const d = new Date(date);
    // Pegamos o dia 1 e o dia 28 do mês gregoriano para ver se o mês hebraico muda
    const startH = new HDate(new Date(d.getFullYear(), d.getMonth(), 1));
    const endH = new HDate(new Date(d.getFullYear(), d.getMonth(), 28));
    
    const m1 = startH.getMonthName();
    const m2 = endH.getMonthName();

    const translate = (m) => {
      const map = {
        'Nisan': 'Nissan', 'Iyyar': 'Iyar', 'Sivan': 'Sivan', 'Tamuz': 'Tammuz',
        'Av': 'Av', 'Elul': 'Elul', 'Tishrei': 'Tishrei', 'Cheshvan': 'Cheshvan',
        'Kislev': 'Kislev', 'Tevet': 'Tevet', 'Shevat': 'Shevat', 'Adar': 'Adar',
        'Adar I': 'Adar I', 'Adar II': 'Adar II'
      };
      return map[m] || m;
    };

    return m1 === m2 ? translate(m1) : `${translate(m1)} / ${translate(m2)}`;
  } catch {
    return "";
  }
};

const jewishEvents = [
    { name: "Chagim", hebrewName: "Rosh Hashaná", date: "2025-09-22" },
    { name: "Chagim", hebrewName: "Yom Kipur", date: "2025-10-01" },
    { name: "Festa das Cabanas", hebrewName: "Sukkot", date: "2025-10-06" },
    { name: "Alegria da Torá", hebrewName: "Simchat Torá", date: "2025-10-13" },
    { name: "Festival das Luzes", hebrewName: "Chanukah", date: "2025-12-27" },
    { name: "Festa das Sortes", hebrewName: "Purim", date: "2026-03-03" },
    { name: "Chagim", hebrewName: "Pessach", date: "2026-04-02" },
    { name: "Dia da Independência", hebrewName: "Yom HaAtzma'ut", date: "2026-04-22" },
    { name: "Festa das Colheitas", hebrewName: "Shavuot", date: "2026-05-22" },
    { name: "Dia de Luto", hebrewName: "Tish'a B'Av", date: "2026-07-23" },
    { name: "Ano Novo Judaico", hebrewName: "Rosh Hashaná", date: "2026-09-12" },
    { name: "Dia do Perdão", hebrewName: "Yom Kipur", date: "2026-09-21" },
    { name: "Festa das Cabanas", hebrewName: "Sukkot", date: "2026-09-26" },
    { name: "Alegria da Torá", hebrewName: "Simchat Torá", date: "2026-10-04" },
    { name: "Festival das Luzes", hebrewName: "Chanukah", date: "2026-12-05" },
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
      const [guestResp, hostMatchesResp, hostEventsResp] = await Promise.all([
        getMatchesForGuest(user.id),
        getMatchesForHost(user.id),
        getEventsByHost(user.id) 
      ]);

      const guestMatches = guestResp.data || [];
      const hostMatches = hostMatchesResp.data || [];
      const hostedEvents = hostEventsResp.data || [];

      const guestCommitments = guestMatches
        .filter(match => match.event && match.status?.toLowerCase() === "accepted")
        .map(match => {
          const dateStr = toDateString(match.event.date);
          return {
            id: match.event.id,
            matchId: match.id, 
            title: match.event.title,
            hebrewTitle: match.event.hebrew_title || "",
            transliteration: match.event.transliteration || "",
            date: dateStr,
            fullDate: match.event.date,
            isJewishEvent: false,
            isShabbatEvent: !PESSACH_DAYS.includes(dateStr),
            isPessachEvent: PESSACH_DAYS.includes(dateStr),
            role: 'guest',
            peopleCount: 1 + (match.dependent_ids ? match.dependent_ids.length : 0),
            location: match.event.approximate_address || 'Local a definir'
          };
        });

      const hostCommitments = hostedEvents
        .filter(event => String(event.host_id) === String(user.id))
        .map(event => {
          const dateStr = toDateString(event.date);
          const eventMatches = hostMatches.filter(m => 
              String(m.event_id) === String(event.id) && 
              m.status?.toLowerCase() === 'accepted'
          );
          
          const totalPeople = eventMatches.reduce((acc, m) => {
              return acc + 1 + (m.dependent_ids ? m.dependent_ids.length : 0);
          }, 0);

          return {
              id: event.id,
              matchId: null,
              title: event.title,
              hebrewTitle: event.hebrew_title || "",
              transliteration: event.transliteration || "",
              date: dateStr,
              fullDate: event.date,
              isJewishEvent: false,
              isShabbatEvent: !PESSACH_DAYS.includes(dateStr),
              isPessachEvent: PESSACH_DAYS.includes(dateStr),
              role: 'host',
              peopleCount: totalPeople,
              location: event.full_address || event.approximate_address || 'Sua Casa'
          };
        });

      const jewishCommitments = jewishEvents.map(ev => ({
        id: ev.date + "-jewish-" + ev.hebrewName,
        hebrewTitle: ev.hebrewName,
        transliteration: "",
        date: ev.date,
        fullDate: ev.date,
        isJewishEvent: true,
        isShabbatEvent: false,
        isPessachEvent: false,
        role: 'holiday',
        peopleCount: 0,
        location: ''
      }));

      const allCommitments = [
        ...guestCommitments,
        ...hostCommitments,
        ...jewishCommitments
      ];

      const uniqueCommitments = Array.from(
        new Map(allCommitments.map(item => [item.id, item])).values()
      );

      setConfirmedEvents(uniqueCommitments);

      const todayDateObj = new Date();
      todayDateObj.setHours(0, 0, 0, 0);

      const upcoming = uniqueCommitments
        .filter(ev => !ev.isJewishEvent && new Date(ev.fullDate) >= todayDateObj)
        .sort((a, b) => new Date(a.fullDate) - new Date(b.fullDate));
      
      setUpcomingEvents(upcoming);

    } catch (error) {
      console.error("Erro AgendaScreen:", error);
      toast({ type: "error", title: "Erro ao carregar agenda." });
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

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

  const displayEventsForSelectedDay = groupedEvents[selectedDate] || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={28} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Agenda</Text>
        <View style={{width:40}}/>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardDismissMode="on-drag">
        <Calendar
          current={today}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          enableSwipeMonths={true}
          // 👇 NOVO: CABEÇALHO PERSONALIZADO COM MÊS HEBRAICO 👇
          renderHeader={(date) => {
            const headerDate = new Date(date);
            const monthGrego = LocaleConfig.locales["pt-br"].monthNames[headerDate.getMonth()];
            const year = headerDate.getFullYear();
            const monthHebreu = getHebrewMonthLabel(headerDate);
            return (
              <View style={styles.calendarHeaderContainer}>
                <Text style={styles.calendarTitleGrego}>{`${monthGrego} ${year}`}</Text>
                <Text style={styles.calendarTitleHebreu}>{monthHebreu}</Text>
              </View>
            );
          }}
          theme={{
            arrowColor: "#4F46E5",
            todayTextColor: "#7C3AED",
            calendarBackground: 'white',
            textMonthFontWeight: 'bold', // Estilo base
          }}
          dayComponent={({ date, state }) => {
            const events = groupedEvents[date.dateString] || [];
            const hasJewish = events.some(ev => ev.isJewishEvent);
            const hasConfirmed = events.some(ev => !ev.isJewishEvent);
            const isPessachDate = PESSACH_DAYS.includes(date.dateString);
            
            const isSelected = selectedDate === date.dateString;
            const isToday = date.dateString === today;

            const dayOfWeek = new Date(date.dateString + 'T00:00:00').getDay();
            const isNormalDay = isPessachDate || dayOfWeek === 5 || dayOfWeek === 6;

            const circleColor = isToday ? '#7C3AED' : isSelected ? (isPessachDate ? GOLD_COLOR : '#3B82F6') : 'transparent';
            
            const dayTextColor = (isToday || isSelected) 
              ? '#FFF' 
              : (state === 'disabled' || !isNormalDay) 
                ? '#D1D5DB' 
                : '#111827';

            const jDayColor = (isToday || isSelected) 
              ? '#FFF' 
              : (state === 'disabled' || !isNormalDay) 
                ? '#E5E7EB' 
                : '#6B7280';

            return (
              <TouchableOpacity
                style={{
                  width:48, height:48, alignItems:'center', justifyContent:'center',
                  borderRadius:24, backgroundColor:circleColor, margin:2
                }}
                onPress={()=>setSelectedDate(date.dateString)}
                disabled={state === 'disabled'}
              >
                <Text style={{fontSize:16, fontWeight:'600', color:dayTextColor}}>{date.day}</Text>
                <Text style={{fontSize:10, color: jDayColor, marginTop:2}}>{getJewishDay(date.dateString)}</Text>
                
                {(hasJewish || hasConfirmed) && (
                  <View style={{ position: 'absolute', bottom: 5, flexDirection: 'row', gap: 4 }}>
                    {hasJewish && <View style={{ width: 10, height: 2, backgroundColor: '#FBBF24', borderRadius: 1 }} />}
                    {hasConfirmed && <View style={{ width: 10, height: 2, backgroundColor: isPessachDate ? GOLD_COLOR : (circleColor === 'transparent' ? '#3B82F6' : '#FFF'), borderRadius: 1 }} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.listContainer}>
          <Text style={styles.listHeader}>Compromissos Do Dia</Text>
          
          {loading ? (
            <ActivityIndicator size="large" style={{marginTop:20}}/>
          ) : displayEventsForSelectedDay.length > 0 ? (
            displayEventsForSelectedDay.map((item) => {
                const isHoliday = item.isJewishEvent;
                const isPessach = item.isPessachEvent;
                const boxColor = isPessach ? GOLD_COLOR : (isHoliday ? ROLE_COLORS.holiday : (item.role === 'host' ? ROLE_COLORS.host : ROLE_COLORS.guest));
                
                const titleColor = isPessach ? GOLD_COLOR : (isHoliday ? '#D97706' : '#1F2937');
                const mainTitle = isHoliday ? item.hebrewTitle : item.title;
                const subTitle = isHoliday ? null : (new Date(item.fullDate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + item.location);
                
                const iconName = isPessach ? "star" : (isHoliday ? "star" : (item.role === 'host' ? "home-account" : "calendar-check"));
                const iconColor = isPessach ? GOLD_COLOR : (isHoliday ? "#D97706" : (item.role === 'host' ? "#7C3AED" : "#3B82F6"));

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    activeOpacity={isHoliday ? 1 : 0.8}
                    disabled={isHoliday} 
                    onPress={() => !isHoliday && navigation.navigate("EventDetail", { eventId: item.id, matchId: item.matchId, origin: 'agenda' })}
                  >
                    <Card style={[
                        styles.itemCard, 
                        { borderLeftWidth: 4, borderLeftColor: boxColor },
                        isPessach && { borderColor: GOLD_COLOR, borderWidth: 1 }
                    ]}>
                        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <View style={{flex: 1, paddingRight: 8}}>
                                <Text style={[styles.itemTitle, { color: titleColor }]} numberOfLines={1}>
                                  {mainTitle}
                                </Text>
                                {subTitle && <Text style={{ color: '#6B7280', fontSize: 14 }}>{subTitle}</Text>}
                                {!isHoliday && (
                                    <Text style={{ fontSize: 10, color: boxColor, marginTop: 4, fontWeight: 'bold' }}>
                                        {isPessach ? "PESSACH " : ""}{item.role === 'host' ? 'ANFITRIÃO' : 'CONVIDADO'}
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

          <View style={styles.upcomingSection}>
            <Text style={styles.listHeader}>Próximos Compromissos</Text>
            
            {upcomingEvents.length > 0 ? (
                upcomingEvents.map((item) => {
                    const isPessach = item.isPessachEvent;
                    const dateObj = new Date(item.fullDate);
                    const month = dateObj.toLocaleDateString('pt-BR', { month: 'short' }).toUpperCase().replace('.', '');
                    const weekday = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
                    const formattedWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
                    const mealLabel = dateObj.getDay() === 5 ? "Jantar" : dateObj.getDay() === 6 ? "Almoço" : "";

                    const dateBoxColor = isPessach ? GOLD_COLOR : (item.role === 'host' ? ROLE_COLORS.host : ROLE_COLORS.guest);

                    return (
                    <TouchableOpacity 
                        key={`upcoming-${item.id}`} 
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate("EventDetail", { eventId: item.id, matchId: item.matchId, origin: 'agenda' })}
                    >
                        <View style={[styles.upcomingCardNew, isPessach && { borderColor: GOLD_COLOR, borderWidth: 1 }]}>
                            <View style={[styles.leftColumn, { backgroundColor: dateBoxColor }]}> 
                                <Text style={styles.monthText}>{month}</Text>
                                <Text style={styles.dayText}>{dateObj.getDate()}</Text>
                                <View style={styles.separator} />
                                <Text style={styles.weekdayText}>{formattedWeekday}</Text>
                                <Text style={styles.timeText}>{mealLabel}</Text>
                            </View>

                            <View style={styles.rightColumn}>
                                <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                    <Text style={[styles.upcomingTitleNew, isPessach && { color: GOLD_COLOR }]} numberOfLines={1}>{item.title}</Text>
                                    <Text style={{ fontSize: 10, color: dateBoxColor, fontWeight: 'bold' }}>
                                        {isPessach ? "PESSACH " : ""}{item.role === 'host' ? 'ANFITRIÃO' : 'CONVIDADO'}
                                    </Text>
                                </View>

                                <View style={styles.eventMetaRowNew}>
                                    <View style={styles.metaItemNew}>
                                        <Icon name="map-marker-outline" size={14} color="#6B7280" />
                                        <Text style={styles.metaTextNew} numberOfLines={1}>{item.location}</Text>
                                    </View>
                                </View>
                                
                                <View style={styles.eventMetaRowNew}>
                                    <View style={styles.metaItemNew}>
                                        <Icon name={isPessach ? "star" : "account-group-outline"} size={14} color={isPessach ? GOLD_COLOR : "#6B7280"} />
                                        <Text style={[styles.metaTextNew, isPessach && { color: GOLD_COLOR, fontWeight: '600' }]}>
                                            {item.peopleCount} {item.peopleCount === 1 ? 'pessoa confirmada' : 'pessoas confirmadas'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </TouchableOpacity>
                )})
            ) : (
                !loading && <Text style={styles.emptyText}>Você não tem eventos futuros agendados.</Text>
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
  // 👇 ESTILOS DO NOVO CABEÇALHO 👇
  calendarHeaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calendarTitleGrego: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  calendarTitleHebreu: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    fontStyle: 'italic',
  },
  listContainer: { paddingHorizontal: 16, paddingBottom: 32 },
  listHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 24, color: '#1F2937' },
  itemCard: { padding: 16, marginBottom: 12, backgroundColor: 'white' },
  itemTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 4 },
  emptyContainer: { alignItems: 'center', marginTop: 10, padding: 20, backgroundColor: '#F3F4F6', borderRadius: 8 },
  emptyText: { color: '#6B7280', fontSize: 15, fontStyle: 'italic' },
  upcomingSection: { marginTop: 8 },
  upcomingCardNew: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 12, 
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  leftColumn: {
    paddingVertical: 12, 
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 90, 
  },
  monthText: { color: 'white', fontSize: 11, fontWeight: '600', textTransform: 'uppercase' },
  dayText: { color: 'white', fontSize: 28, fontWeight: 'bold', marginVertical: 0 },
  separator: { height: 1, width: '60%', backgroundColor: 'rgba(255, 255, 255, 0.4)', marginVertical: 4 },
  weekdayText: { color: 'white', fontSize: 12, fontWeight: '500' },
  timeText: { color: 'white', fontSize: 12, fontWeight: '500', marginTop: 1 },
  rightColumn: { flex: 1, padding: 12, justifyContent: 'center' },
  upcomingTitleNew: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginBottom: 4, flex: 1 },
  eventMetaRowNew: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  metaItemNew: { flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 },
  metaTextNew: { fontSize: 14, color: '#6B7280' },
});