import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { signUp } from '../../services/api';
import Icon from '@expo/vector-icons/Feather';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// --- CONFIGURAÇÃO DOS PAÍSES ---
const countries = [
  { name: 'Brasil', code: '+55', flag: '🇧🇷', mask: '(99) 99999-9999' },
  { name: 'Israel', code: '+972', flag: '🇮🇱', mask: '999 999-9999' },
  { name: 'EUA', code: '+1', flag: '🇺🇸', mask: '(999) 999-9999' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹', mask: '999 999 999' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷', mask: '99 9999-9999' },
  { name: 'Reino Unido', code: '+44', flag: '🇬🇧', mask: '9999 999999' },
];

const validatorOptions = [
  "Makom",
  "Espaço K",
  "AquiTemShabes",
  "Qualquer"
];

// --- COMPONENTE DE MODAL ANIMADO ---
const SlidingModal = ({ visible, onClose, children }) => {
  const [showModal, setShowModal] = useState(visible);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
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

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose}>
      <View style={styles.modalOverlayContainer}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.modalBackdrop, { opacity: animValue.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }) }]} />
        </TouchableWithoutFeedback>
        <Animated.View style={[styles.modalContentWrapper, { transform: [{ translateY: animValue.interpolate({ inputRange: [0, 1], outputRange: [SCREEN_HEIGHT, 0] }) }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
};

export default function SignUpScreen({ navigation, route }) {
  const { inviteCode } = route.params || {};

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(countries[0]); 
  const [phoneNumber, setPhoneNumber] = useState(''); 
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [birthDate, setBirthDate] = useState(new Date(2000, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS DE IMAGEM ---
  const [avatar, setAvatar] = useState(null);      // Foto de perfil
  const [facePhoto, setFacePhoto] = useState(null); // Foto de rosto

  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  
  // --- NOVOS ESTADOS PARA VALIDAÇÃO DUPLA ---
  const [validator1, setValidator1] = useState("Makom");
  const [validator2, setValidator2] = useState("AquiTemShabes");

  const handlePhoneChange = (text) => {
    const rawValue = text.replace(/\D/g, '');
    if (selectedCountry.code === '+55') {
      let formatted = rawValue;
      if (rawValue.length > 2) formatted = `(${rawValue.substring(0, 2)}) ${rawValue.substring(2)}`;
      if (rawValue.length > 7) formatted = `(${rawValue.substring(0, 2)}) ${rawValue.substring(2, 7)}-${rawValue.substring(7, 11)}`;
      setPhoneNumber(formatted);
    } else {
      setPhoneNumber(rawValue);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão Necessária', 'Precisamos de acesso à galeria.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled) setAvatar(result.assets[0]);
  };

  const handleTakeFacePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Câmara', 'Precisamos de acesso à câmara para validação.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.4,
      base64: true,
    });
    if (!result.canceled) setFacePhoto(result.assets[0]);
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !phoneNumber) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }
    if (!facePhoto) {
      Alert.alert('Foto Obrigatória', 'Tire uma foto do seu rosto para validar sua conta.');
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${selectedCountry.code}${cleanPhone}`;

      const avatarBase64 = avatar ? `data:image/png;base64,${avatar.base64}` : null;
      const facePhotoBase64 = `data:image/png;base64,${facePhoto.base64}`;

      await signUp({
        email,
        password,
        name: fullName,
        phone: fullPhone,
        birth_date: birthDate.toISOString().split('T')[0],
        inviteCode,
        // ENVIANDO AS DUAS ORGANIZAÇÕES ESCOLHIDAS
        validator_organization_1: validator1,
        validator_organization_2: validator2,
        dietaryRestrictions,
        avatar_url: avatarBase64,
        face_photo_url: facePhotoBase64
      });

      Alert.alert(
        'Sucesso',
        'Conta criada! Verifique seu e-mail para confirmar o cadastro.',
        [{ text: 'OK', onPress: () => navigation.navigate('Welcome') }]
      );
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.error || 'Ocorreu um erro ao criar a conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity style={styles.countryItem} onPress={() => { setSelectedCountry(item); setShowCountryModal(false); setPhoneNumber(''); }}>
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  // --- SUB-COMPONENTE PARA OS CHIPS DE SELEÇÃO ---
  const ValidatorSelector = ({ selectedValue, onSelect, label }) => (
    <View style={styles.validatorChipSection}>
      <Text style={styles.inputLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {validatorOptions.map((option) => (
          <TouchableOpacity 
            key={option} 
            onPress={() => onSelect(option)}
            style={[styles.chip, selectedValue === option && styles.chipSelected]}
          >
            <Text style={[styles.chipText, selectedValue === option && styles.chipTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerContainer}>
             <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#374151" /></TouchableOpacity>
             <Text style={styles.title}>Criar Conta</Text>
             <View style={{width: 24}} />
          </View>
          
          <View style={styles.formContainer}>
            {/* SEÇÃO DE FOTOS (DUAL) */}
            <View style={styles.photoRow}>
               <View style={styles.photoBox}>
                  <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarButton}>
                    {avatar ? <Image source={{ uri: avatar.uri }} style={styles.avatarImage} /> : <Icon name="user" size={30} color="#9CA3AF" />}
                    <View style={styles.editIconBadge}><Icon name="plus" size={12} color="#FFF" /></View>
                  </TouchableOpacity>
                  <Text style={styles.photoLabel}>Foto Perfil</Text>
               </View>

               <View style={styles.photoBox}>
                  <TouchableOpacity onPress={handleTakeFacePhoto} style={[styles.avatarButton, !facePhoto && styles.requiredBorder]}>
                    {facePhoto ? <Image source={{ uri: facePhoto.uri }} style={styles.avatarImage} /> : <Icon name="camera" size={30} color={facePhoto ? "#9CA3AF" : "#4F46E5"} />}
                    <View style={[styles.editIconBadge, { backgroundColor: facePhoto ? '#10B981' : '#4F46E5' }]}><Icon name={facePhoto ? "check" : "camera"} size={12} color="#FFF" /></View>
                  </TouchableOpacity>
                  <Text style={[styles.photoLabel, { color: facePhoto ? '#10B981' : '#4F46E5', fontWeight: 'bold' }]}>Selfie Identidade *</Text>
               </View>
            </View>

            <TextInput style={styles.input} placeholder="Nome Completo" value={fullName} onChangeText={setFullName} />
            <TextInput style={styles.input} placeholder="E-mail" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Senha" value={password} onChangeText={setPassword} secureTextEntry />
            
            <View style={styles.phoneContainer}>
                <TouchableOpacity style={styles.countrySelector} onPress={() => setShowCountryModal(true)}>
                  <Text style={styles.selectedFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.selectedCode}>{selectedCountry.code}</Text>
                  <Icon name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>
                <TextInput style={styles.phoneInput} placeholder="DDD + Número" value={phoneNumber} onChangeText={handlePhoneChange} keyboardType="phone-pad" />
            </View>
            
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <View style={styles.datePickerButton}>
                    <Icon name="calendar" size={20} color="#6B7280" />
                    <Text style={styles.datePickerText}>Nascimento: {birthDate.toLocaleDateString('pt-BR')}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Restrições Alimentares (Bio)</Text>
                <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Vegano, Alérgico a glúten..." value={dietaryRestrictions} onChangeText={setDietaryRestrictions} multiline />
            </View>

            {/* SELEÇÃO DUPLA DE ORGANIZAÇÕES (REPLICA O ANTIGO DROPDOWN) */}
            <View style={styles.validatorsWrapper}>
              <ValidatorSelector 
                label="Organização de Validação 1" 
                selectedValue={validator1} 
                onSelect={setValidator1} 
              />
              <ValidatorSelector 
                label="Organização de Validação 2" 
                selectedValue={validator2} 
                onSelect={setValidator2} 
              />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SlidingModal visible={showCountryModal} onClose={() => setShowCountryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}><Text style={styles.modalTitle}>País</Text><TouchableOpacity onPress={() => setShowCountryModal(false)}><Icon name="x" size={24} color="#374151" /></TouchableOpacity></View>
            <FlatList data={countries} keyExtractor={(it) => it.code} renderItem={renderCountryItem} />
          </View>
      </SlidingModal>

      {showDatePicker && (
        <DateTimePicker value={birthDate} mode="date" display={Platform.OS === 'ios' ? "spinner" : "default"} onChange={(e, d) => { if (Platform.OS === 'android') setShowDatePicker(false); if (d) setBirthDate(d); }} maximumDate={new Date()} locale="pt-BR" />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flexGrow: 1, padding: 24 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  photoRow: { flexDirection: 'row', justifyContent: 'center', gap: 40, marginBottom: 24 },
  photoBox: { alignItems: 'center' },
  photoLabel: { marginTop: 8, fontSize: 12, color: '#6B7280' },
  avatarButton: { width: 85, height: 85, borderRadius: 43, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF', elevation: 3, shadowColor: "#000", shadowOpacity: 0.1 },
  requiredBorder: { borderColor: '#4F46E5', borderWidth: 2 },
  avatarImage: { width: 85, height: 85, borderRadius: 43 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4F46E5', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  formContainer: { gap: 12 },
  input: { backgroundColor: 'white', padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937' },
  inputLabel: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 4 },
  inputContainer: { marginBottom: 4 },
  phoneContainer: { flexDirection: 'row', gap: 10 },
  countrySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 95, justifyContent: 'space-between' },
  selectedFlag: { fontSize: 18 },
  selectedCode: { fontSize: 14, color: '#374151', fontWeight: '500' },
  phoneInput: { flex: 1, backgroundColor: 'white', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePickerText: { fontSize: 16, color: '#374151' },
  
  // Estilos para os Seletores de Organização (Chips)
  validatorsWrapper: { gap: 16, marginVertical: 8 },
  validatorChipSection: { gap: 8 },
  chipScroll: { flexDirection: 'row' },
  chip: { 
    paddingHorizontal: 16, 
    paddingVertical: 10, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#E5E7EB', 
    backgroundColor: 'white', 
    marginRight: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 }
  },
  chipSelected: { 
    backgroundColor: '#4F46E5', 
    borderColor: '#4F46E5' 
  },
  chipText: { 
    fontSize: 14, 
    color: '#6B7280' 
  },
  chipTextSelected: { 
    color: 'white', 
    fontWeight: 'bold' 
  },

  button: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlayContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  modalContentWrapper: { width: '100%' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: SCREEN_HEIGHT * 0.45, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryName: { fontSize: 16, flex: 1 },
  countryCode: { fontSize: 14, color: '#6B7280', fontWeight: 'bold' },
});