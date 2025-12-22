import React, { useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Icon from '@expo/vector-icons/Feather';

import { supabase } from '../../services/supabase'; 
import { getHostHistory } from '../../services/api';
import { formatShabbatDate } from '../../lib/utils';
// 👇 Importação do componente de selo
import VerifiedBadge from '../ui/VerifiedBadge';

// --- COMPONENTES AUXILIARES ---

const InterestTagDisplay = ({ interest }) => (
  <View style={styles.tag}>
    <Text style={styles.tagText}>{interest}</Text>
  </View>
);

const DependentCard = ({ item }) => {
    const age = calculateAge(item.birth_date);
    return (
        <View style={styles.dependentCard}>
            <Text style={styles.dependentName}>{item.name} ({age} anos)</Text>
            <Text style={styles.dependentRelationship}>{item.relationship}</Text>
            {item.description && <Text style={styles.dependentDescription}>{item.description}</Text>}
        </View>
    );
};

const EventHistoryCard = ({ item }) => (
  <View style={styles.historyCard}>
    <View>
      <Text style={styles.historyTitle}>{item.title}</Text>
      <Text style={styles.historyDate}>{formatShabbatDate(new Date(item.date))}</Text>
    </View>
    <View style={styles.historyStats}>
      <View style={styles.historyStatItem}>
        <Icon name="users" size={16} color="#4B5563" />
        <Text style={styles.historyStatText}>
          {item.guestCount} Convidado{item.guestCount > 1 ? 's' : ''}
        </Text>
      </View>
      {item.dependentCount > 0 && (
        <View style={styles.historyStatItem}>
          <Icon name="user-plus" size={16} color="#4B5563" />
          <Text style={styles.historyStatText}>
            + {item.dependentCount} Dependente{item.dependentCount > 1 ? 's' : ''}
          </Text>
        </View>
      )}
    </View>
  </View>
);

// --- FUNÇÕES UTILITÁRIAS ---
const calculateAge = (birthDateString) => {
    if (!birthDateString) return '?';
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const calculateAgeGroup = (birthDateString) => {
  if (!birthDateString) return null;
  const age = calculateAge(birthDateString);
  if (age >= 18 && age <= 35) return 'Jovens';
  if (age > 35 && age < 60) return 'Adultos';
  if (age >= 60) return 'Seniores';
  return null;
};

// --- TELA PRINCIPAL ---

export default function PublicProfileScreen({ route, navigation }) {
  const { userId } = route.params;
  
  const [profile, setProfile] = useState(null);
  const [dependents, setDependents] = useState([]);
  const [eventHistory, setEventHistory] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(Date.now());

  const getAvatarUrl = () => {
    if (!profile?.avatar_url) {
        return `https://ui-avatars.com/api/?name=${(profile?.full_name || 'User').replace(' ', '+')}&background=random`;
    }
    const separator = profile.avatar_url.includes('?') ? '&' : '?';
    return `${profile.avatar_url}${separator}t=${lastUpdated}`;
  };

  const fetchData = async () => {
    if (!userId) return;
    
    try {
      const historyPromise = getHostHistory(userId);

      const profilePromise = supabase
        .from('profiles') 
        .select(`
            *,
            dependents (*) 
        `)
        .eq('id', userId)
        .single();

      const [historyRes, profileRes] = await Promise.all([historyPromise, profilePromise]);

      if (profileRes.data) {
        setProfile(profileRes.data);
        setDependents(profileRes.data.dependents || []); 
      }
      
      if (historyRes.data) {
        setEventHistory(historyRes.data);
      }
      
      setLastUpdated(Date.now());

    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [userId])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (isLoading) {
    return (
        <SafeAreaView style={styles.centered}>
            <ActivityIndicator size="large" color="#4F46E5" />
        </SafeAreaView>
    );
  }

  if (!profile) {
    return (
        <SafeAreaView style={styles.centered}>
            <Text>Perfil não encontrado.</Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
                <Text style={{ color: '#4F46E5' }}>Voltar</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
  }

  // 👇 CORREÇÃO: Usa o dado do banco se existir, senão calcula
  const ageGroup = profile.age_group || calculateAgeGroup(profile.birth_date);

  return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-left" size={24} color="#1F2937" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Perfil Público</Text>
            <View style={{ width: 40 }} />
        </View>

        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#4F46E5']} />
            }
        >
            <View style={styles.profileHeader}>
                <Image
                    key={lastUpdated} 
                    style={styles.avatar}
                    source={{ uri: getAvatarUrl() }}
                />
                
                {/* 👇 NOME E SELO DE VERIFICADO AQUI 👇 */}
                <View style={styles.nameContainer}>
                    <Text style={styles.fullName}>{profile.full_name}</Text>
                    <VerifiedBadge role={profile.role} size={24} />
                </View>

                {/* 👇 EXIBIÇÃO DA VALIDAÇÃO 👇 */}
                <View style={styles.validatorBadge}>
                    <Text style={styles.validatorText}>
                        Validação: <Text style={{fontWeight: 'bold'}}>{profile.validator_organization || 'Pendente'}</Text>
                    </Text>
                </View>

                {/* 👇 EXIBIÇÃO DE RESTRIÇÕES ALIMENTARES 👇 */}
                {profile.dietary_restrictions ? (
                    <View style={styles.dietaryContainer}>
                        <Icon name="alert-circle" size={16} color="#B45309" style={{marginTop: 2}} />
                        <Text style={styles.dietaryText}>
                            <Text style={{fontWeight: 'bold'}}>Restrições: </Text>
                            {profile.dietary_restrictions}
                        </Text>
                    </View>
                ) : null}

                {ageGroup && <Text style={styles.ageGroupText}>{ageGroup}</Text>}
                
            </View>

            {/* Seção de Contato Adicionada */}
            {profile.phone && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Informações de Contato</Text>
                    <View style={styles.infoBox}>
                        <View style={styles.infoRow}>
                            <Icon name="phone" size={20} color="#6B7280" style={styles.infoIcon} />
                            <Text style={styles.infoText}>{profile.phone}</Text>
                        </View>
                    </View>
                </View>
            )}

            {profile.interests && profile.interests.length > 0 && (
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Interesses</Text>
                <View style={styles.tagsContainer}>
                {profile.interests.map(interest => (
                    <InterestTagDisplay key={interest} interest={interest} />
                ))}
                </View>
            </View>
            )}

            {dependents.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Dependentes</Text>
                    <FlatList
                        data={dependents}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <DependentCard item={item} />}
                        scrollEnabled={false}
                    />
                </View>
            )}

            {/* 👇 SÓ EXIBE SE NÃO FOR USUÁRIO COMUM (ROLE !== USER) 👇 */}
            {profile.role !== 'user' && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Histórico de Eventos (Como Anfitrião)</Text>
                    {eventHistory.length > 0 ? (
                        <FlatList
                        data={eventHistory}
                        keyExtractor={(item) => String(item.id)}
                        renderItem={({ item }) => <EventHistoryCard item={item} />}
                        scrollEnabled={false}
                        />
                    ) : (
                        <Text style={styles.emptyText}>Este anfitrião ainda não completou nenhum evento.</Text>
                    )}
                </View>
            )}

        </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: 'white',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  container: { paddingVertical: 20, paddingHorizontal: 24 },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    backgroundColor: '#E5E7EB',
  },
  
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    justifyContent: 'center',
  },

  fullName: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  ageGroupText: { fontSize: 16, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  username: { fontSize: 16, color: '#6B7280', marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  
  infoBox: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  infoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 16,
  },
  infoIcon: { marginRight: 16 },
  infoText: { fontSize: 16, color: '#374151' },

  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tag: { backgroundColor: '#E0E7FF', paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16 },
  tagText: { color: '#4338CA', fontSize: 14, fontWeight: '500' },

  dependentCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  dependentName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  dependentRelationship: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
  dependentDescription: { fontSize: 14, color: '#374151', marginTop: 8 },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center'
  },

  historyCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  historyStats: {
    flexDirection: 'row',
    gap: 12, 
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    flexWrap: 'wrap',
  },
  historyStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  historyStatText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  
  validatorBadge: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 6,
    marginBottom: 2,
  },
  validatorText: {
    fontSize: 13,
    color: '#4B5563',
  },
  dietaryContainer: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFBEB',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
    maxWidth: '90%',
  },
  dietaryText: {
    fontSize: 14,
    color: '#92400E',
    flex: 1, 
  },
});