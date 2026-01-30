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
import { decode } from 'base64-arraybuffer';
import { signUp } from '../../services/api';
import { supabase } from '../../services/supabase';
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

  const backdropOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.5],
  });

  const contentTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  return (
    <Modal transparent visible={showModal} onRequestClose={onClose}>
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
  const [avatar, setAvatar] = useState(null);      // Foto de perfil (galeria)
  const [facePhoto, setFacePhoto] = useState(null); // Foto de rosto (câmera)

  // Estados adicionais
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");
  const [validatorOrganization, setValidatorOrganization] = useState("Qualquer");
  
  const [validatorOpen, setValidatorOpen] = useState(false);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const iconRotation = useRef(new Animated.Value(0)).current;

  const toggleValidator = () => {
    const toValue = validatorOpen ? 0 : 1;
    setValidatorOpen(!validatorOpen);
    
    Animated.timing(animatedHeight, {
      toValue,
      duration: 300,
      useNativeDriver: false, 
    }).start();

    Animated.timing(iconRotation, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const heightInterpolate = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 220],
  });

  const rotateInterpolate = iconRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

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

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
        setShowDatePicker(false);
        if (selectedDate) setBirthDate(selectedDate);
    } else {
        if (selectedDate) setBirthDate(selectedDate);
    }
  };

  const confirmIOSDate = () => {
      setShowDatePicker(false);
  };

  // --- FUNÇÕES DE CAPTURA DE IMAGEM ---
  
  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos da sua permissão para acessar a galeria.');
        return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
    });
    if (!result.canceled && result.assets) setAvatar(result.assets[0]);
  };

  const handleTakeFacePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
        Alert.alert('Permissão Necessária', 'Precisamos de acesso à câmera para validar sua identidade.');
        return;
    }
    const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.5,
        base64: true,
    });
    if (!result.canceled && result.assets) setFacePhoto(result.assets[0]);
  };

  // Helper para upload de arquivos
  const uploadImageToSupabase = async (imageAsset, folderName, userId) => {
    if (!imageAsset) return null;
    const fileExt = imageAsset.uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${folderName}/${fileName}`;

    const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, decode(imageAsset.base64), { 
            contentType: `image/${fileExt}` 
        });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !phoneNumber) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }

    if (!facePhoto) {
      Alert.alert('Identificação Necessária', 'Por favor, tire uma foto do seu rosto para validar sua conta.');
      return;
    }

    if (password.length < 6) {
        Alert.alert('Senha Fraca', 'A senha deve ter pelo menos 6 caracteres.');
        return;
    }
    
    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${selectedCountry.code}${cleanPhone}`;

      // 1. SignUp inicial enviando os dados básicos e metadados
      const response = await signUp({
        email,
        password,
        name: fullName,
        phone: fullPhone,
        birth_date: birthDate.toISOString().split('T')[0],
        inviteCode: inviteCode,
        validatorOrganization: validatorOrganization,
        dietaryRestrictions: dietaryRestrictions,
        face_photo_url: "pending_upload" // Marcador para o backend saber que a foto virá
      });

      const { session, user } = response.data;

      if (user) {
        let avatarUrl = null;
        let faceUrl = null;

        // 2. Upload das imagens (Avatar e Selfie)
        try {
            if (avatar) avatarUrl = await uploadImageToSupabase(avatar, 'profile', user.id);
            if (facePhoto) faceUrl = await uploadImageToSupabase(facePhoto, 'verification', user.id);

            // 3. Atualiza o perfil com as URLs finais
            await supabase.from('profiles').update({ 
                avatar_url: avatarUrl,
                face_photo_url: faceUrl 
            }).eq('id', user.id);

            // Envia novamente para o backend apenas para atualizar a URL do email (opcional se o backend pegar do banco)
            // No seu caso, o SignUp já enviou o sinal, o upload garante que o link funcione no banco.

        } catch (imgErr) {
            console.log("Erro no upload de imagens:", imgErr);
        }

        if (session && session.access_token) {
            await supabase.auth.setSession({
              access_token: session.access_token,
              refresh_token: session.refresh_token,
            });
        } else {
            Alert.alert(
              'Cadastro Realizado',
              'Verifique seu e-mail para confirmar a conta.',
              [{ text: 'OK', onPress: () => navigation.navigate('Welcome') }]
            );
        }
      }
    } catch (error) {
      console.error("Erro no cadastro:", error.response?.data || error.message);
      const backendError = error.response?.data?.error || error.message;
      Alert.alert('Erro', backendError.includes("already registered") ? "Este e-mail já está cadastrado." : backendError);
    } finally {
      setIsLoading(false);
    }
  };

  const renderCountryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.countryItem} 
      onPress={() => {
        setSelectedCountry(item);
        setShowCountryModal(false);
        setPhoneNumber(''); 
      }}
    >
      <Text style={styles.countryFlag}>{item.flag}</Text>
      <Text style={styles.countryName}>{item.name}</Text>
      <Text style={styles.countryCode}>{item.code}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.headerContainer}>
             <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Icon name="arrow-left" size={24} color="#374151" />
             </TouchableOpacity>
             <Text style={styles.title}>Criar Conta</Text>
             <View style={{width: 24}} />
          </View>
          
          <View style={styles.formContainer}>
            
            {/* SEÇÃO DE FOTOS (DUAL) */}
            <View style={styles.photoRow}>
               <View style={styles.photoBox}>
                  <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarButton}>
                    {avatar ? (
                      <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
                    ) : (
                      <Icon name="user" size={30} color="#9CA3AF" />
                    )}
                    <View style={styles.editIconBadge}>
                       <Icon name="plus" size={12} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.photoLabel}>Foto Perfil</Text>
               </View>

               <View style={styles.photoBox}>
                  <TouchableOpacity 
                    onPress={handleTakeFacePhoto} 
                    style={[styles.avatarButton, !facePhoto && styles.requiredBorder]}
                  >
                    {facePhoto ? (
                      <Image source={{ uri: facePhoto.uri }} style={styles.avatarImage} />
                    ) : (
                      <Icon name="camera" size={30} color={facePhoto ? "#9CA3AF" : "#4F46E5"} />
                    )}
                    <View style={[styles.editIconBadge, { backgroundColor: facePhoto ? '#10B981' : '#4F46E5' }]}>
                       <Icon name={facePhoto ? "check" : "camera"} size={12} color="#FFF" />
                    </View>
                  </TouchableOpacity>
                  <Text style={[styles.photoLabel, { color: facePhoto ? '#10B981' : '#4F46E5', fontWeight: 'bold' }]}>
                    Selfie Identidade *
                  </Text>
               </View>
            </View>

            <TextInput 
                style={styles.input} 
                placeholder="Nome Completo" 
                placeholderTextColor="#9CA3AF"
                value={fullName} 
                onChangeText={setFullName} 
            />
            <TextInput 
                style={styles.input} 
                placeholder="E-mail" 
                placeholderTextColor="#9CA3AF"
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
            />
            <TextInput 
                style={styles.input} 
                placeholder="Senha" 
                placeholderTextColor="#9CA3AF"
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
            />
            
            <View style={styles.phoneContainer}>
                <TouchableOpacity 
                  style={styles.countrySelector} 
                  onPress={() => setShowCountryModal(true)}
                >
                  <Text style={styles.selectedFlag}>{selectedCountry.flag}</Text>
                  <Text style={styles.selectedCode}>{selectedCountry.code}</Text>
                  <Icon name="chevron-down" size={16} color="#6B7280" />
                </TouchableOpacity>

                <TextInput 
                    style={styles.phoneInput} 
                    placeholder="DDD + Número" 
                    placeholderTextColor="#9CA3AF"
                    value={phoneNumber} 
                    onChangeText={handlePhoneChange} 
                    keyboardType="phone-pad" 
                    maxLength={selectedCountry.code === '+55' ? 15 : 20} 
                />
            </View>
            
            <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                <View style={styles.datePickerButton}>
                    <Icon name="calendar" size={20} color="#6B7280" />
                    <Text style={styles.datePickerText}>
                        Nascimento: {birthDate.toLocaleDateString('pt-BR')}
                    </Text>
                </View>
            </TouchableOpacity>

            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Restrições Alimentares (Bio)</Text>
                <TextInput 
                    style={[styles.input, { height: 70, textAlignVertical: 'top' }]} 
                    placeholder="Vegano, Alérgico a glúten..." 
                    placeholderTextColor="#9CA3AF"
                    value={dietaryRestrictions} 
                    onChangeText={setDietaryRestrictions} 
                    multiline
                />
            </View>

            <View style={styles.validatorContainer}>
                <TouchableOpacity onPress={toggleValidator} style={styles.validatorHeader}>
                    <View>
                        <Text style={styles.validatorLabel}>Validar por:</Text>
                        <Text style={styles.validatorValue}>{validatorOrganization}</Text>
                    </View>
                    <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
                        <Icon name="chevron-down" size={24} color="#6B7280" />
                    </Animated.View>
                </TouchableOpacity>

                <Animated.View style={{ height: heightInterpolate, overflow: 'hidden' }}>
                    <View style={styles.validatorList}>
                        {validatorOptions.map((org) => (
                            <TouchableOpacity 
                                key={org} 
                                style={[styles.validatorOption, validatorOrganization === org && styles.validatorOptionSelected]}
                                onPress={() => { setValidatorOrganization(org); toggleValidator(); }}
                            >
                                <Text style={[styles.validatorOptionText, validatorOrganization === org && styles.validatorOptionTextSelected]}>{org}</Text>
                                {validatorOrganization === org && <Icon name="check" size={18} color="#4F46E5" />}
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>
            </View>

            <TouchableOpacity style={styles.button} onPress={handleSignUp} disabled={isLoading}>
              {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" />
              ) : (
                  <Text style={styles.buttonText}>Cadastrar</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <SlidingModal visible={showCountryModal} onClose={() => setShowCountryModal(false)}>
         <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecione o País</Text>
              <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                <Icon name="x" size={24} color="#374151" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={countries}
              keyExtractor={(item) => item.code}
              renderItem={renderCountryItem}
            />
         </View>
      </SlidingModal>

      {showDatePicker && (
        <DateTimePicker
            value={birthDate}
            mode="date"
            display={Platform.OS === 'ios' ? "spinner" : "default"}
            onChange={handleDateChange}
            maximumDate={new Date()}
            locale="pt-BR"
        />
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
  avatarButton: {
    width: 85,
    height: 85,
    borderRadius: 43,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
  requiredBorder: { borderColor: '#4F46E5', borderWidth: 2 },
  avatarImage: { width: 85, height: 85, borderRadius: 43 },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },

  formContainer: { gap: 12 },
  input: {
    backgroundColor: 'white',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937'
  },
  inputLabel: { fontSize: 13, color: '#374151', fontWeight: '600', marginBottom: 4 },
  inputContainer: { marginBottom: 4 },

  phoneContainer: { flexDirection: 'row', gap: 10 },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    minWidth: 95, justifyContent: 'space-between',
  },
  selectedFlag: { fontSize: 18 },
  selectedCode: { fontSize: 14, color: '#374151', fontWeight: '500' },
  phoneInput: { flex: 1, backgroundColor: 'white', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },

  datePickerButton: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePickerText: { fontSize: 16, color: '#374151' },
  
  validatorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  validatorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  validatorLabel: { fontSize: 11, color: '#6B7280' },
  validatorValue: { fontSize: 15, color: '#1F2937', fontWeight: '500' },
  validatorList: { padding: 8, backgroundColor: '#F9FAFB', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  validatorOption: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 8 },
  validatorOptionSelected: { backgroundColor: '#EEF2FF' },
  validatorOptionText: { fontSize: 14, color: '#374151' },
  validatorOptionTextSelected: { color: '#4F46E5', fontWeight: '600' },

  button: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  modalOverlayContainer: { flex: 1, justifyContent: 'flex-end' },
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'black' },
  modalContentWrapper: { width: '100%' },
  modalContent: {
    backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.45, padding: 20
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  countryItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  countryFlag: { fontSize: 22, marginRight: 12 },
  countryName: { fontSize: 16, flex: 1 },
  countryCode: { fontSize: 14, color: '#6B7280', fontWeight: 'bold' },
});