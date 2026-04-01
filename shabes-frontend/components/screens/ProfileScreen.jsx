import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  Modal, 
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
  Linking,
  Platform
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { decode } from 'base64-arraybuffer';
import { 
  getMyProfile, 
  updateMyProfile, 
  getDependents, 
  createDependent, 
  updateDependent, 
  deleteDependent,
  getMyMatches, 
  submitRating 
} from '../../services/api';
import { supabase } from '../../services/supabase';
import Icon from '@expo/vector-icons/Feather';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Slider from '@react-native-community/slider'; 
import { formatShabbatDate } from '../../lib/utils'; 
import { useAuth } from '../../context/AuthContext'; 
import VerifiedBadge from '../ui/VerifiedBadge';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- COMPONENTE DE MODAL ANIMADO ---
const SlidingModal = ({ visible, onClose, children }) => {
  const [showModal, setShowModal] = useState(visible);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      animValue.setValue(0);
      Animated.timing(animValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(animValue, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => setShowModal(false));
    }
  }, [visible]);

  if (!showModal) return null;

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const contentTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose} animationType="none">
      <View style={styles.modalOverlayContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.modalBackdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View 
          style={[
            styles.modalContentWrapper, 
            { transform: [{ translateY: contentTranslateY }] }
          ]}
        >
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

// --- COMPONENTES INTERNOS ---

const DependentCard = ({ item, onEdit }) => {
    const age = calculateAge(item.birth_date);
    return (
        <View style={styles.dependentCard}>
            <View style={{ flex: 1 }}>
                <Text style={styles.dependentName}>{item.name} ({age} anos)</Text>
                <Text style={styles.dependentRelationship}>{item.relationship}</Text>
                {item.description && <Text style={styles.dependentDescription}>{item.description}</Text>}
            </View>
            <TouchableOpacity onPress={onEdit} style={{ padding: 8 }}>
                <Icon name="edit-2" size={20} color="#6B7280" />
            </TouchableOpacity>
        </View>
    );
};

const DependentForm = ({ initialData, onSave, onCancel, onDelete, isNew = false }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [birthDate, setBirthDate] = useState(initialData?.birth_date ? new Date(initialData.birth_date) : new Date());
    const [relationship, setRelationship] = useState(initialData?.relationship || 'Filho(a)');
    const [description, setDescription] = useState(initialData?.description || '');
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Erro', 'O nome do dependente é obrigatório.');
            return;
        }
        setIsSaving(true);
        await onSave({ name, birth_date: birthDate.toISOString().split('T')[0], relationship, description });
        setIsSaving(false);
    };

    const handleDelete = () => {
        Alert.alert(
            'Confirmar Remoção',
            `Tem a certeza de que deseja remover ${name}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Remover', style: 'destructive', onPress: async () => {
                    setIsDeleting(true);
                    await onDelete();
                    setIsDeleting(false);
                }},
            ]
        );
    };

    return (
        <View style={styles.addDependentFormContainer}>
            <Text style={styles.sectionTitle}>{isNew ? 'Novo Dependente' : 'Editar Dependente'}</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Nome completo" />
            
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.datePickerText}>Data de Nascimento: {birthDate.toLocaleDateString('pt-BR')}</Text>
            </TouchableOpacity>

            {showDatePicker && (
                <View style={styles.datePickerWrapper}>
                    <DateTimePicker 
                        value={birthDate} 
                        mode="date" 
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'} 
                        locale="pt-BR"
                        onChange={(e, date) => { 
                            if(date) setBirthDate(date); 
                            if (Platform.OS === 'android' && (e.type === 'set' || e.type === 'dismissed')) {
                                setShowDatePicker(false);
                            }
                        }} 
                    />
                    {Platform.OS === 'ios' && (
                        <TouchableOpacity 
                            style={styles.confirmDatePickerButton} 
                            onPress={() => setShowDatePicker(false)}
                        >
                            <Text style={styles.confirmDatePickerButtonText}>Confirmar</Text>
                        </TouchableOpacity>
                    )}
                </View>
            )}

            <View style={styles.pickerContainer}>
                <Picker selectedValue={relationship} onValueChange={(itemValue) => setRelationship(itemValue)}>
                    <Picker.Item label="Cônjuge" value="Cônjuge" />
                    <Picker.Item label="Filho(a)" value="Filho(a)" />
                    <Picker.Item label="Amigo(a)" value="Amigo(a)" />
                    <Picker.Item label="Outros" value="Outros" />
                </Picker>
            </View>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder="Descrição (opcional)" multiline />

            <View style={styles.editActionsContainer}>
                {!isNew && (
                    <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDelete} disabled={isDeleting}>
                        {isDeleting ? <ActivityIndicator color="#FFFFFF" /> : <Icon name="trash-2" size={18} color="white" />}
                    </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={onCancel}>
                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave} disabled={isSaving}>
                    {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
                </TouchableOpacity>
            </View>
        </View>
    );
};


// --- FUNÇÕES DE AJUDA ---

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

// --- COMPONENTE PRINCIPAL ---

export default function ProfileScreen({ navigation }) {
  const { user } = useAuth(); 
  const [profile, setProfile] = useState(null);
  const [dependents, setDependents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDependentForm, setShowAddDependentForm] = useState(false);
  const [editingDependentId, setEditingDependentId] = useState(null);
  
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPhone, setNewPhone] = useState(''); 
  const [newDietary, setNewDietary] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isRatingModalVisible, setIsRatingModalVisible] = useState(false);
  const [matchesToRate, setMatchesToRate] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [rating, setRating] = useState(3); 
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);

  const fetchData = async () => {
    try {
      const [{ data: profileData }, { data: { user: authUser } }, { data: dependentsData }] = await Promise.all([
        getMyProfile(),
        supabase.auth.getUser(),
        getDependents(),
      ]);

      const combinedProfile = { ...profileData, email: authUser?.email };
      setProfile(combinedProfile);
      setDependents(dependentsData || []);
      
      setNewEmail(combinedProfile.email || '');
      setNewPhone(combinedProfile.phone || ''); 
      setNewDietary(combinedProfile.dietary_restrictions || '');
    } catch (error) {
      console.error("Erro ao buscar dados do perfil:", error);
      Alert.alert('Erro', 'Não foi possível carregar os seus dados.');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      fetchData();
    }, [])
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleSaveAccountInfo = async () => {
    setIsSaving(true);
    try {
      const profileUpdateData = {};
      
      // 👇 username removido da lógica de atualização
      if (newPhone.trim() && newPhone !== profile.phone) profileUpdateData.phone = newPhone;
      
      if (newDietary !== (profile.dietary_restrictions || '')) {
        profileUpdateData.dietary_restrictions = newDietary;
      }

      if (Object.keys(profileUpdateData).length > 0) await updateMyProfile(profileUpdateData);
      
      const authUpdateData = {};
      if (newEmail.trim() && newEmail !== profile.email) authUpdateData.email = newEmail;
      if (newPassword.trim()) authUpdateData.password = newPassword;

      if (Object.keys(authUpdateData).length > 0) {
        const { error } = await supabase.auth.updateUser(authUpdateData);
        if (error) throw error;
      }

      Alert.alert('Sucesso', 'Informações atualizadas!');
      setIsEditingAccount(false);
      setNewPassword('');
      await fetchData();
    } catch (error) {
      Alert.alert('Erro', error.message || 'Falha ao atualizar.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNewDependent = async (dependentData) => {
    try {
        await createDependent(dependentData);
        setShowAddDependentForm(false);
        await fetchData();
    } catch (error) {
        Alert.alert('Erro', 'Não foi possível salvar o dependente.');
    }
  };

  const handleUpdateDependent = async (id, dependentData) => {
    try {
        await updateDependent(id, dependentData);
        setEditingDependentId(null);
        await fetchData();
    } catch (error) {
        Alert.alert('Erro', 'Falha ao atualizar.');
    }
  };

  const handleDeleteDependent = async (id) => {
    try {
        await deleteDependent(id);
        setEditingDependentId(null);
        await fetchData();
    } catch (error) {
        Alert.alert('Erro', 'Falha ao remover.');
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, aspect: [1, 1], quality: 0.8, base64: true,
    });
    if (!result.canceled && result.assets && result.assets[0].base64) uploadAvatar(result.assets[0]);
  };

  const uploadAvatar = async (image) => {
    setIsUploading(true);
    try {
        const authUser = (await supabase.auth.getUser()).data.user;
        const fileExt = image.uri.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${authUser.id}/${fileName}`;
        await supabase.storage.from('avatars').upload(filePath, decode(image.base64), { contentType: `image/${fileExt}` });
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        await updateMyProfile({ avatar_url: publicUrl });
        await fetchData();
    } catch (error) {
        Alert.alert('Erro', 'Falha no upload da foto.');
    } finally {
        setIsUploading(false);
    }
  };

  const fetchMatchesToRate = async () => {
    setIsLoadingMatches(true);
    try {
      const { data: allMatches } = await getMyMatches();
      const filtered = allMatches.filter(m => m.guest_id === user.id && m.status === 'accepted' && new Date(m.event.date) < new Date());
      setMatchesToRate(filtered);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  const handleOpenRatingModal = () => {
    fetchMatchesToRate(); 
    setIsRatingModalVisible(true);
  };

  const handleCloseRatingModal = () => {
    setIsRatingModalVisible(false);
    setSelectedMatch(null);
  };

  const handleSubmitRating = async () => {
    if (!selectedMatch) return;
    setIsSubmittingRating(true);
    try {
      await submitRating(selectedMatch.id, rating, ratingComment);
      Alert.alert('Sucesso', 'Relato enviado!');
      setSelectedMatch(null);
      fetchMatchesToRate(); 
    } finally {
      setIsSubmittingRating(false);
    }
  };

  if (isLoading) return <SafeAreaView style={styles.centered}><ActivityIndicator size="large" color="#4F46E5" /></SafeAreaView>;

  const ageGroup = profile.age_group || calculateAgeGroup(profile.birth_date);
  const ratingLabels = ["Muito baixa", "Baixa", "Regular", "Alta", "Muito Alta"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        contentContainerStyle={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileHeader}>
          <TouchableOpacity onPress={handlePickAvatar} disabled={isUploading}>
            <Image style={styles.avatar} source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}` }} />
            {isUploading && <View style={styles.uploadingOverlay}><ActivityIndicator color="#FFFFFF" /></View>}
            <View style={styles.cameraIconContainer}><Icon name="camera" size={18} color="#FFFFFF" /></View>
          </TouchableOpacity>
          <View style={styles.nameContainer}>
             <Text style={styles.fullName}>{profile.username}</Text>
             <VerifiedBadge role={profile.role} size={24} />
          </View>
          <View style={styles.validatorBadge}>
             <Text style={styles.validatorText}>Validação: <Text style={{fontWeight: 'bold'}}>{profile.validator_organization || 'Pendente'}</Text></Text>
          </View>
        </View>

        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Informações da Conta</Text>
                {!isEditingAccount && <TouchableOpacity onPress={() => setIsEditingAccount(true)}><Icon name="edit-2" size={20} color="#6B7280" /></TouchableOpacity>}
            </View>
            <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                    <Icon name="user" size={20} color="#6B7280" style={styles.infoIcon} />
                    {/* 👇 Username agora é exibido como texto fixo, proibindo alteração 👇 */}
                    <Text style={[styles.infoText, isEditingAccount && { color: '#9CA3AF' }]}>
                        {profile.full_name}
                    </Text>
                </View>
                <View style={styles.infoRow}>
                    <Icon name="mail" size={20} color="#6B7280" style={styles.infoIcon} />
                    {isEditingAccount ? <TextInput style={styles.infoInput} value={newEmail} onChangeText={setNewEmail} keyboardType="email-address" autoCapitalize="none" /> : <Text style={styles.infoText}>{profile.email}</Text>}
                </View>
                <View style={styles.infoRow}>
                    <Icon name="phone" size={20} color="#6B7280" style={styles.infoIcon} />
                    {isEditingAccount ? <TextInput style={styles.infoInput} value={newPhone} onChangeText={setNewPhone} keyboardType="phone-pad" /> : <Text style={styles.infoText}>{profile.phone || 'Não definido'}</Text>}
                </View>
                
                <View style={styles.infoRow}>
                    <Icon name="alert-circle" size={20} color="#B45309" style={styles.infoIcon} />
                    {isEditingAccount ? (
                        <TextInput 
                          style={styles.infoInput} 
                          value={newDietary} 
                          onChangeText={setNewDietary} 
                          placeholder="Ex: Vegano, Alérgico a nozes..." 
                        />
                    ) : (
                        <Text style={[styles.infoText, !profile.dietary_restrictions && { fontStyle: 'italic', color: '#9CA3AF' }]}>
                          {profile.dietary_restrictions || 'Nenhuma restrição cadastrada'}
                        </Text>
                    )}
                </View>

                {isEditingAccount && <View style={[styles.infoRow, { borderBottomWidth: 0 }]}><Icon name="lock" size={20} color="#6B7280" style={styles.infoIcon} /><TextInput style={styles.infoInput} value={newPassword} onChangeText={setNewPassword} placeholder="Nova Senha" secureTextEntry /></View>}
            </View>
            {isEditingAccount && (
                <View style={styles.editActionsContainer}>
                    <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => { setIsEditingAccount(false); setNewDietary(profile.dietary_restrictions || ''); }}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSaveAccountInfo} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Salvar</Text>}
                    </TouchableOpacity>
                </View>
            )}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dependentes</Text>
            {dependents.map((item) => (
                editingDependentId === item.id ? (
                    <DependentForm key={item.id} initialData={item} onSave={(data) => handleUpdateDependent(item.id, data)} onCancel={() => setEditingDependentId(null)} onDelete={() => handleDeleteDependent(item.id)} />
                ) : (
                    <DependentCard key={item.id} item={item} onEdit={() => setEditingDependentId(item.id)} />
                )
            ))}
            {showAddDependentForm && <DependentForm onSave={handleSaveNewDependent} onCancel={() => setShowAddDependentForm(false)} isNew={true} />}
            {dependents.length === 0 && !showAddDependentForm && <Text style={styles.noDependentsText}>Você ainda não adicionou dependentes.</Text>}
        </View>

        {!showAddDependentForm && !editingDependentId && (
          <>
            <TouchableOpacity style={[styles.actionButton, styles.addDependentButton]} onPress={() => setShowAddDependentForm(true)}>
              <Icon name="plus" size={20} color="#4F46E5" style={{ marginRight: 8 }} />
              <Text style={styles.addDependentButtonText}>Adicionar Dependentes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.evaluateButton]} onPress={handleOpenRatingModal}>
              <Icon name="alert-circle" size={20} color="#B45309" style={{ marginRight: 8 }} />
              <Text style={styles.evaluateButtonText}>Reportar Ocorrido</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Icon name="log-out" size={20} color="#EF4444" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Sair</Text>
            </TouchableOpacity>
            
            {profile?.role === 'user' && (
                <View style={styles.hostAccessContainer}>
                    <View style={styles.hostAccessHeader}><Icon name="shield-off" size={24} color="#D97706" /><Text style={styles.hostAccessTitle}>Acesso de Anfitrião</Text></View>
                    <Text style={styles.hostAccessText}>Esse perfil ainda não está liberado para ser anfitrião.</Text>
                    <TouchableOpacity style={styles.contactSupportButton} onPress={() => Linking.openURL('mailto:aquitemagency@gmail.com')}>
                        <Icon name="mail" size={18} color="#FFF" style={{marginRight: 8}} />
                        <Text style={styles.contactSupportButtonText}>Falar com a equipe</Text>
                    </TouchableOpacity>
                </View>
            )}
          </>
        )}
      </ScrollView>

      <SlidingModal visible={isRatingModalVisible} onClose={handleCloseRatingModal}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>{selectedMatch ? "Seu Relato" : "Reportar Ocorrido"}</Text><TouchableOpacity onPress={handleCloseRatingModal} style={styles.modalCloseButton}><Icon name="x" size={24} color="#6B7280" /></TouchableOpacity></View>
            <View style={styles.modalContent}>
              {selectedMatch ? (
                <ScrollView>
                  <TouchableOpacity onPress={() => setSelectedMatch(null)} style={styles.backToListButton}><Icon name="arrow-left" size={16} color="#4F46E5" /><Text style={styles.backToListButtonText}>Voltar</Text></TouchableOpacity>
                  <Text style={styles.ratingEventTitle}>{selectedMatch.event.title}</Text>
                  <Slider minimumValue={0} maximumValue={4} step={1} value={rating} onValueChange={setRating} minimumTrackTintColor="#F59E0B" thumbTintColor="#F59E0B" />
                  <Text style={styles.ratingSliderLabel}>{ratingLabels[rating]}</Text>
                  <TextInput style={styles.ratingCommentInput} value={ratingComment} onChangeText={setRatingComment} multiline placeholder="Escreva aqui..." />
                  <TouchableOpacity style={[styles.button, styles.saveButton, { marginTop: 16 }]} onPress={handleSubmitRating} disabled={isSubmittingRating}>
                    {isSubmittingRating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Enviar Relato</Text>}
                  </TouchableOpacity>
                </ScrollView>
              ) : (
                <FlatList data={matchesToRate} keyExtractor={m => m.id} renderItem={({item}) => (
                    <TouchableOpacity style={styles.eventToRateCard} onPress={() => setSelectedMatch(item)}>
                        <View style={{flex: 1}}><Text style={styles.eventToRateTitle}>{item.event.title}</Text><Text style={styles.eventToRateDate}>{formatShabbatDate(new Date(item.event.date))}</Text></View>
                        <Icon name="chevron-right" size={20} color="#6B7280" />
                    </TouchableOpacity>
                )} />
              )}
            </View>
          </View>
      </SlidingModal>
    </SafeAreaView>
  );
}

// ... estilos mantidos iguais
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 24, paddingBottom: 48 },
  profileHeader: { alignItems: 'center', marginBottom: 32 },
  avatar: { width: 120, height: 120, borderRadius: 60, marginBottom: 16, borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#E5E7EB' },
  uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 60 },
  cameraIconContainer: { position: 'absolute', bottom: 20, right: 5, backgroundColor: '#4F46E5', borderRadius: 15, padding: 6, borderWidth: 2, borderColor: '#FFFFFF' },
  nameContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'center' },
  fullName: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', textAlign: 'center' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16 },
  infoBox: { backgroundColor: 'white', borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoIcon: { marginRight: 16 }, 
  infoText: { fontSize: 16, color: '#374151' },
  infoInput: { fontSize: 16, color: '#1F2937', flex: 1, paddingVertical: 4 },
  noDependentsText: { color: '#6B7280', fontStyle: 'italic', textAlign: 'center', paddingVertical: 16 },
  addDependentFormContainer: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', gap: 16 },
  input: { backgroundColor: '#F9FAFB', fontSize: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  datePickerText: { fontSize: 16, color: '#374151' },
  datePickerWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E5E7EB', marginTop: -10, marginBottom: 15, alignItems: 'center' },
  confirmDatePickerButton: { backgroundColor: '#4F46E5', paddingVertical: 12, paddingHorizontal: 20, borderRadius: 8, marginTop: 10, width: '100%', alignItems: 'center' },
  confirmDatePickerButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
  pickerContainer: { backgroundColor: '#F9FAFB', borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  dependentCard: { backgroundColor: 'white', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dependentName: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  dependentRelationship: { fontSize: 14, color: '#6B7280', fontStyle: 'italic' },
  dependentDescription: { fontSize: 14, color: '#374151', marginTop: 8 },
  editActionsContainer: { flexDirection: 'row', gap: 12, marginTop: 12 },
  button: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButton: { backgroundColor: '#4F46E5' },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#E5E7EB' },
  cancelButtonText: { color: '#374151', fontSize: 16, fontWeight: 'bold' },
  deleteButton: { backgroundColor: '#EF4444', flex: 0, paddingHorizontal: 16 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 16 },
  addDependentButton: { backgroundColor: '#E0E7FF' },
  addDependentButtonText: { color: '#4338CA', fontSize: 16, fontWeight: 'bold' },
  evaluateButton: { backgroundColor: '#FFFBEB' },
  evaluateButtonText: { color: '#B45309', fontSize: 16, fontWeight: 'bold' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, marginTop: 16, backgroundColor: '#FEE2E2' },
  logoutButtonText: { color: '#EF4444', fontSize: 16, fontWeight: 'bold' },
  modalOverlayContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContentWrapper: { width: '100%' },
  modalSheet: { backgroundColor: '#F9FAFB', height: '85%', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderBottomRightRadius: 24, borderBottomLeftRadius: 24, padding: 16, width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  modalCloseButton: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 20 },
  modalContent: { flex: 1, paddingTop: 16, paddingBottom: 30 },
  eventToRateCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 12 },
  eventToRateTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937' },
  eventToRateDate: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  backToListButton: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, padding: 8, alignSelf: 'flex-start' },
  backToListButtonText: { color: '#4F46E5', fontSize: 15, fontWeight: '500' },
  ratingEventTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 16, textAlign: 'center' },
  ratingSliderLabel: { fontSize: 18, fontWeight: '600', color: '#F59E0B', textAlign: 'center', marginTop: 8 },
  ratingCommentInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, height: 120, textAlignVertical: 'top', fontSize: 16, marginTop: 8 },
  validatorBadge: { backgroundColor: '#F3F4F6', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, marginTop: 6 },
  validatorText: { fontSize: 13, color: '#4B5563' },
  dietaryContainer: { flexDirection: 'row', gap: 6, backgroundColor: '#FFFBEB', padding: 10, borderRadius: 8, marginTop: 8, maxWidth: '90%' },
  dietaryText: { fontSize: 14, color: '#92400E', flex: 1 },
  hostAccessContainer: { backgroundColor: '#FFFBEB', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', marginVertical: 16 },
  hostAccessHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  hostAccessTitle: { fontSize: 16, fontWeight: 'bold', color: '#D97706' },
  hostAccessText: { fontSize: 14, color: '#B45309', fontWeight: '600', marginBottom: 4 },
  contactSupportButton: { backgroundColor: '#D97706', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8 },
  contactSupportButtonText: { color: 'white', fontWeight: 'bold', fontSize: 14 },
});