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

const validatorOptions = ["Makom", "Espaço K", "AquiTemShabes", "Qualquer"];

// --- COMPONENTE DE MODAL ANIMADO ---
const SlidingModal = ({ visible, onClose, children }) => {
  const [showModal, setShowModal] = useState(visible);
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setShowModal(true);
      Animated.timing(animValue, { toValue: 1, duration: 300, useNativeDriver: true }).start();
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
    <Modal transparent visible={showModal} onRequestClose={onClose} animationType="none">
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
  const [avatar, setAvatar] = useState(null);
  const [facePhoto, setFacePhoto] = useState(null);

  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  
  // --- ESTADOS PARA VALIDAÇÃO DUPLA ---
  const [validator1, setValidator1] = useState("Makom");
  const [validator2, setValidator2] = useState("AquiTemShabes");

  // Funções de manipulação de input
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
      Alert.alert('Permissão necessária', 'Precisamos de acesso às suas fotos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
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
      Alert.alert('Câmera bloqueada', 'Autorize o acesso à câmera nas definições.');
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

  /**
   * Função para calcular idade a partir da data de nascimento
   */
  const calculateAge = (birthday) => {
    const ageDifMs = Date.now() - birthday.getTime();
    const ageDate = new Date(ageDifMs);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const handleSignUp = async () => {
    // 1. Validação de campos obrigatórios (Selfie adicionada como obrigatória)
    if (!email || !password || !fullName || !phoneNumber || !facePhoto) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos e tire a selfie de validação.');
      return;
    }

    // 2. Validação de idade (+16 anos)
    const userAge = calculateAge(birthDate);
    if (userAge < 16) {
      Alert.alert(
        'Idade mínima', 
        'Desculpe, deve ter pelo menos 16 anos para utilizar o AquiTemShabes.'
      );
      return;
    }

    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${selectedCountry.code}${cleanPhone}`;

      await signUp({
        email,
        password,
        name: fullName,
        phone: fullPhone,
        birth_date: birthDate.toISOString().split('T')[0],
        inviteCode,
        validator_organization_1: validator1,
        validator_organization_2: validator2,
        dietaryRestrictions,
        avatar_url: avatar ? `data:image/png;base64,${avatar.base64}` : null,
        face_photo_url: facePhoto ? `data:image/png;base64,${facePhoto.base64}` : null
      });

      Alert.alert('Sucesso', 'Conta criada! Verifique o seu e-mail.', [{ text: 'OK', onPress: () => navigation.navigate('Welcome') }]);
    } catch (error) {
      Alert.alert('Erro', error.response?.data?.error || 'Falha ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  const ValidatorSelector = ({ selectedValue, onSelect, label }) => (
    <View style={styles.validatorChipSection}>
      <Text style={styles.inputLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {validatorOptions.map((option) => (
          <TouchableOpacity 
            key={option} 
            style={[styles.chip, selectedValue === option && styles.chipSelected]}
            onPress={() => onSelect(option)}
            keyboardDismissMode="on-drag"
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
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.headerContainer}>
             <TouchableOpacity onPress={() => navigation.goBack()}><Icon name="arrow-left" size={24} color="#374151" /></TouchableOpacity>
             <Text style={styles.title}>Criar Conta</Text>
             <View style={{width: 24}} />
          </View>
          
          <View style={styles.formContainer}>
            {/* FOTOS */}
            <View style={styles.photoRow}>
               <View style={styles.photoBox}>
                  <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarButton}>
                    {avatar ? <Image source={{ uri: avatar.uri }} style={styles.avatarImage} /> : <Icon name="user" size={30} color="#9CA3AF" />}
                    <View style={styles.editIconBadge}><Icon name="plus" size={12} color="#FFF" /></View>
                  </TouchableOpacity>
                  <Text style={styles.photoLabel}>Perfil</Text>
               </View>

               <View style={styles.photoBox}>
                  <TouchableOpacity onPress={handleTakeFacePhoto} style={styles.avatarButton}>
                    {facePhoto ? <Image source={{ uri: facePhoto.uri }} style={styles.avatarImage} /> : <Icon name="camera" size={30} color="#4F46E5" />}
                    <View style={[styles.editIconBadge, { backgroundColor: facePhoto ? '#10B981' : '#4F46E5' }]}><Icon name={facePhoto ? "check" : "camera"} size={12} color="#FFF" /></View>
                  </TouchableOpacity>
                  <Text style={[styles.photoLabel, { color: facePhoto ? '#10B981' : '#6B7280' }]}>Selfie de Validação</Text>
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
                    <Text style={styles.datePickerText}>Nascimento: {birthDate.toLocaleDateString('pt-PT')}</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Bio / Restrições</Text>
                <TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} placeholder="Vegano, Alérgico..." value={dietaryRestrictions} onChangeText={setDietaryRestrictions} multiline />
            </View>

            <View style={styles.validatorsWrapper}>
              <ValidatorSelector label="Validador 1" selectedValue={validator1} onSelect={setValidator1} />
              <ValidatorSelector label="Validador 2" selectedValue={validator2} onSelect={setValidator2} />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
              {isLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Finalizar</Text>}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SlidingModal visible={showCountryModal} onClose={() => setShowCountryModal(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Escolha o País</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}><Icon name="x" size={24} color="#374151" /></TouchableOpacity>
            </View>
            <FlatList data={countries} keyExtractor={(it) => it.code} renderItem={({ item }) => (
              <TouchableOpacity style={styles.countryItem} onPress={() => { setSelectedCountry(item); setShowCountryModal(false); setPhoneNumber(''); }}>
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryCode}>{item.code}</Text>
              </TouchableOpacity>
            )} />
          </View>
      </SlidingModal>

      {/* MODAL DE DATA CORRIGIDO PARA IOS */}
      {Platform.OS === 'ios' ? (
        <SlidingModal visible={showDatePicker} onClose={() => setShowDatePicker(false)}>
          <View style={styles.dateModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Data de Nascimento</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="x" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <View style={styles.datePickerWrapper}>
              <DateTimePicker 
                value={birthDate} 
                mode="date" 
                display="spinner" 
                onChange={(e, d) => { if (d) setBirthDate(d); }} 
                maximumDate={new Date()} 
                locale="pt-PT"
                textColor="#000000"
              />
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.confirmButtonText}>Confirmar Data</Text>
            </TouchableOpacity>
          </View>
        </SlidingModal>
      ) : (
        showDatePicker && (
          <DateTimePicker 
            value={birthDate} 
            mode="date" 
            display="default" 
            onChange={(e, d) => { 
              setShowDatePicker(false); 
              if (d) setBirthDate(d); 
            }} 
            maximumDate={new Date()} 
            locale="pt-PT" 
          />
        )
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
  avatarButton: { width: 85, height: 85, borderRadius: 43, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  avatarImage: { width: 85, height: 85, borderRadius: 43 },
  editIconBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#4F46E5', width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#FFFFFF' },
  formContainer: { gap: 12 },
  input: { backgroundColor: 'white', padding: 14, borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  inputLabel: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 4 },
  inputContainer: { marginBottom: 4 },
  phoneContainer: { flexDirection: 'row', gap: 10 },
  countrySelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'white', paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', minWidth: 95, justifyContent: 'space-between' },
  selectedFlag: { fontSize: 18 },
  selectedCode: { fontSize: 14, color: '#374151', fontWeight: '500' },
  phoneInput: { flex: 1, backgroundColor: 'white', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePickerText: { fontSize: 16, color: '#374151' },
  validatorsWrapper: { gap: 16, marginVertical: 8 },
  validatorChipSection: { gap: 8 },
  chipScroll: { flexDirection: 'row' },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white', marginRight: 10 },
  chipSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  chipText: { fontSize: 14, color: '#6B7280' },
  chipTextSelected: { color: 'white', fontWeight: 'bold' },
  button: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  modalOverlayContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  modalContentWrapper: { width: '100%' },
  modalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, height: SCREEN_HEIGHT * 0.5 },
  dateModalContent: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  datePickerWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, marginVertical: 10, width: '100%', alignItems: 'center', overflow: 'hidden' },
  confirmButton: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  confirmButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryName: { fontSize: 16, flex: 1 },
  countryCode: { fontSize: 14, color: '#6B7280', fontWeight: 'bold' },
});