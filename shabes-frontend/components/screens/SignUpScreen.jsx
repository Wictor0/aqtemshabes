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
  const [avatar, setAvatar] = useState(null);

  // 👇 Estados adicionados de volta
  const [dietaryRestrictions, setDietaryRestrictions] = useState("");

  // Estado para a Organização Validadora (Padrão: Qualquer)
  const [validatorOrganization, setValidatorOrganization] = useState("Qualquer");
  
  // Estados para Animação do Accordion de Validação
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
    outputRange: [0, 220], // Altura aproximada das 4 opções
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
        quality: 0.7,
        base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
        setAvatar(result.assets[0]);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !fullName || !phoneNumber) {
      Alert.alert('Campos Obrigatórios', 'Por favor, preencha todos os campos.');
      return;
    }
    
    setIsLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const fullPhone = `${selectedCountry.code}${cleanPhone}`;

      const response = await signUp({
        email,
        password,
        name: fullName,
        phone: fullPhone,
        interests: [], 
        birth_date: birthDate.toISOString().split('T')[0],
        inviteCode: inviteCode,
        validatorOrganization: validatorOrganization,
        dietary: dietaryRestrictions // 👈 Enviando as restrições alimentares
      });

      const { session, user } = response.data;

      if (session && session.access_token) {
        const { error } = await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
        if (error) throw error;

        if (avatar && user) {
            try {
                const fileExt = avatar.uri.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`;
                
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, decode(avatar.base64), { 
                        contentType: `image/${fileExt}` 
                    });
                
                if (!uploadError) {
                    const { data: { publicUrl } } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);
                    
                    await supabase.from('profiles')
                        .update({ avatar_url: publicUrl })
                        .eq('id', user.id);
                }
            } catch (avatarError) {
                console.log("Falha ao enviar avatar (não crítico):", avatarError);
            }
        }
      } else {
        Alert.alert(
          'Cadastro Realizado',
          'Verifique seu e-mail para confirmar a conta.',
          [{ text: 'OK', onPress: () => navigation.navigate('Welcome') }]
        );
      }
    } catch (error) {
      console.error("Erro no cadastro:", error);
      const errorMessage = error.response?.data?.error || error.message || 'Erro ao criar conta.';
      Alert.alert('Erro', errorMessage);
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
            
            <View style={styles.avatarContainer}>
                <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarButton}>
                    {avatar ? (
                        <Image source={{ uri: avatar.uri }} style={styles.avatarImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Icon name="camera" size={32} color="#9CA3AF" />
                        </View>
                    )}
                    <View style={styles.editIconBadge}>
                        <Icon name="edit-2" size={12} color="white" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.avatarHint}>Foto de Perfil</Text>
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
                        Data de Nascimento: {birthDate.toLocaleDateString('pt-BR')}
                    </Text>
                </View>
            </TouchableOpacity>

            {Platform.OS === 'ios' && (
              <SlidingModal visible={showDatePicker} onClose={() => setShowDatePicker(false)}>
                  <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                            <Text style={{color: '#EF4444', fontSize: 16}}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={confirmIOSDate}>
                            <Text style={{color: '#4F46E5', fontSize: 16, fontWeight: 'bold'}}>Confirmar</Text>
                        </TouchableOpacity>
                    </View>
                    <DateTimePicker
                        value={birthDate}
                        mode="date"
                        display="spinner"
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        locale="pt-BR"
                        textColor="black" 
                    />
                   </View>
              </SlidingModal>
            )}

            {Platform.OS === 'android' && showDatePicker && (
                <DateTimePicker
                    value={birthDate}
                    mode="date"
                    display="spinner" 
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                />
            )}

            {/* 👇 CAMPO DE RESTRIÇÕES ALIMENTARES (BIO) 👇 */}
            <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Restrições Alimentares (Bio)</Text>
                <TextInput 
                    style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
                    placeholder="Você tem alguma restrição alimentar? (Ex: Vegano, Alérgico a glúten, Kosher...)" 
                    placeholderTextColor="#9CA3AF"
                    value={dietaryRestrictions} 
                    onChangeText={setDietaryRestrictions} 
                    multiline
                />
            </View>
            {/* 👆 FIM CAMPO BIO 👆 */}

            {/* CONTAINER DE VALIDAÇÃO (ESTILO ACORDEÃO) */}
            <View style={styles.validatorContainer}>
                <TouchableOpacity onPress={toggleValidator} style={styles.validatorHeader}>
                    <View>
                        <Text style={styles.validatorLabel}>Por qual organização você quer ser validado?</Text>
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
                                style={[
                                    styles.validatorOption, 
                                    validatorOrganization === org && styles.validatorOptionSelected
                                ]}
                                onPress={() => {
                                    setValidatorOrganization(org);
                                    toggleValidator(); // Fecha após selecionar
                                }}
                            >
                                <Text style={[
                                    styles.validatorOptionText,
                                    validatorOrganization === org && styles.validatorOptionTextSelected
                                ]}>
                                    {org}
                                </Text>
                                {validatorOrganization === org && (
                                    <Icon name="check" size={18} color="#4F46E5" />
                                )}
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
              contentContainerStyle={{ paddingBottom: 20 }}
            />
         </View>
      </SlidingModal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F9FAFB' },
  container: { flexGrow: 1, padding: 24 },
  headerContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarHint: {
    marginTop: 8,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },

  input: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: '#1F2937'
  },
  // 👇 Estilo para Label
  inputLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 0,
  },
  inputContainer: {
    marginBottom: 8,
  },

  phoneContainer: { flexDirection: 'row', marginBottom: 16, gap: 12 },
  countrySelector: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    paddingHorizontal: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB',
    width: 100, justifyContent: 'space-between',
  },
  selectedFlag: { fontSize: 20 },
  selectedCode: { fontSize: 16, color: '#374151', fontWeight: '500' },
  phoneInput: {
    flex: 1, backgroundColor: 'white', paddingVertical: 16, paddingHorizontal: 16,
    borderRadius: 12, fontSize: 16, borderWidth: 1, borderColor: '#E5E7EB', color: '#1F2937'
  },

  datePickerButton: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  datePickerText: { fontSize: 16, color: '#374151' },
  
  // Estilos para o Accordion de Validação
  validatorContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    overflow: 'hidden',
  },
  validatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'white',
  },
  validatorLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  validatorValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  validatorList: {
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  validatorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  validatorOptionSelected: {
    backgroundColor: '#EEF2FF',
  },
  validatorOptionText: {
    fontSize: 15,
    color: '#374151',
  },
  validatorOptionTextSelected: {
    color: '#4F46E5',
    fontWeight: '600',
  },

  button: { backgroundColor: '#4F46E5', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },

  modalOverlayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  modalContentWrapper: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.5,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  countryItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  countryFlag: { fontSize: 24, marginRight: 12 },
  countryName: { fontSize: 16, color: '#374151', flex: 1 },
  countryCode: { fontSize: 16, color: '#6B7280', fontWeight: 'bold' },
});