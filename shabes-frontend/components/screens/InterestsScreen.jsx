import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from '@expo/vector-icons/Feather';
// Supondo que você tem um serviço de API para buscar e atualizar o perfil
import { getProfile, updateProfile } from '../../services/api';

// Lista de interesses ligados ao Judaísmo
const jewishInterests = [
  'Culinária Judaica',
  'Música Klezmer',
  'Dança Israelense',
  'Estudo da Torá',
  'Cabala e Misticismo',
  'História Judaica',
  'Cinema Israelense',
  'Voluntariado Comunitário',
  'Língua Hebraica',
  'Língua Iídiche',
  'Festivais Judaicos',
  'Viagens para Israel',
  'Ativismo Judaico',
  'Literatura Judaica',
  'Esportes (Macabíadas)',
  'Debates sobre Israel',
  'Genealogia Judaica',
  'Arte Judaica',
];

const InterestTag = ({ interest, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.tag, isSelected ? styles.tagSelected : styles.tagNotSelected]}
    onPress={() => onPress(interest)}
  >
    <Text style={[styles.tagText, isSelected ? styles.tagTextSelected : styles.tagTextNotSelected]}>
      {interest}
    </Text>
  </TouchableOpacity>
);

export default function InterestsScreen({ navigation }) {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Busca os interesses já salvos quando a tela é carregada
  useEffect(() => {
    const fetchUserInterests = async () => {
      try {
        const { data: profile } = await getProfile();
        if (profile && profile.interests) {
          setSelectedInterests(profile.interests);
        }
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar seus interesses.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUserInterests();
  }, []);

  const handleToggleInterest = useCallback((interest) => {
    setSelectedInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((item) => item !== interest)
        : [...prev, interest]
    );
  }, []);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ interests: selectedInterests });
      Alert.alert('Sucesso!', 'Seus interesses foram salvos.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível salvar seus interesses. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.title}>Meus Interesses</Text>
          <View style={styles.placeholder} />
        </View>
        <Text style={styles.subtitle}>
          Selecione os tópicos que mais lhe interessam. Isto ajudará a conectar-se com pessoas e eventos.
        </Text>

        <View style={styles.tagsContainer}>
          {jewishInterests.map((interest) => (
            <InterestTag
              key={interest}
              interest={interest}
              isSelected={selectedInterests.includes(interest)}
              onPress={handleToggleInterest}
            />
          ))}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges} disabled={isSaving}>
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  container: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40, // Espaço para centralizar o título
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 32,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  tag: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagSelected: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  tagNotSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D1D5DB',
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagTextSelected: {
    color: '#FFFFFF',
  },
  tagTextNotSelected: {
    color: '#374151',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
