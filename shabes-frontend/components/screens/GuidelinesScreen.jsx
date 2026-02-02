import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import Icon from "../ui/Icon"; // Usando seu componente de ícone existente

export default function GuidelinesScreen({ navigation, route }) {
  // Recebe o código de convite (se houver) para repassar ao SignUp
  const { inviteCode } = route.params || {};

  const handleAgree = () => {
    navigation.navigate("SignUp", { inviteCode });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* --- Cabeçalho --- */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Icon name="book-open" size={32} color="#4F46E5" />
          </View>
          <Text style={styles.title}>Bem-vindo à Comunidade</Text>
          <Text style={styles.subtitle}>
            Antes de criar sua conta, queremos te contar como o AquiTemShabes funciona.
          </Text>
        </View>

        {/* --- Seção 1: O Propósito --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🤝 Nosso Propósito</Text>
          <Text style={styles.text}>
            O AquiTemShabes existe para conectar anfitriões que abrem suas casas para o Shabat com convidados que buscam um lugar para celebrar. Queremos fortalecer laços e garantir que ninguém passe o Shabat sozinho.
          </Text>
        </View>

        {/* --- Seção 2: Como Funciona --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Como Funciona?</Text>
          <Card style={styles.card}>
            <CardContent style={styles.cardContent}>
              <View style={styles.row}>
                <Icon name="home" size={20} color="#6B7280" style={{marginTop: 2}} />
                <Text style={styles.rowText}>Anfitriões criam eventos e definem o perfil do público.</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.row}>
                <Icon name="user-plus" size={20} color="#6B7280" style={{marginTop: 2}} />
                <Text style={styles.rowText}>Convidados pedem para participar e se apresentam.</Text>
              </View>
              <View style={styles.separator} />
              <View style={styles.row}>
                <Icon name="map-pin" size={20} color="#6B7280" style={{marginTop: 2}} />
                <Text style={styles.rowText}>Após o aceite, o endereço completo e contato são revelados.</Text>
              </View>
            </CardContent>
          </Card>
        </View>

        {/* --- Seção 3: Regras de Ouro --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📜 Regras de Convivência</Text>
          
          <View style={styles.ruleBox}>
            <Text style={styles.ruleTitle}>Respeito e Tradição</Text>
            <Text style={styles.ruleText}>
              Respeite os costumes da casa do anfitrião (Kashrut, horários, uso de eletrônicos). Pergunte se tiver dúvidas.
            </Text>
          </View>

          <View style={styles.ruleBox}>
            <Text style={styles.ruleTitle}>Compromisso</Text>
            <Text style={styles.ruleText}>
              Se confirmou presença, compareça. Se tiver um imprevisto, avise com a máxima antecedência possível.
            </Text>
          </View>

          <View style={styles.ruleBox}>
            <Text style={styles.ruleTitle}>Segurança</Text>
            <Text style={styles.ruleText}>
              Mantenha seu perfil atualizado com informações reais. A confiança é a base da nossa comunidade.
            </Text>
          </View>
        </View>

        {/* --- Botão de Ação --- */}
        <View style={styles.footer}>
          <Text style={styles.disclaimer}>
            Ao continuar, você concorda em seguir estas diretrizes e nossos Termos de Uso.
          </Text>
          <Button onPress={handleAgree} variant="shabbat" style={styles.button}>
            Li e Concordo, Vamos lá!
          </Button>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
            <Text style={styles.cancelText}>Voltar</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 10,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  text: {
    fontSize: 15,
    color: "#4B5563",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardContent: {
    padding: 16,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  rowText: {
    fontSize: 14,
    color: "#374151",
    flex: 1,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 12,
    marginLeft: 32, // Alinhado com o texto
  },
  ruleBox: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4F46E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  ruleTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  ruleText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  footer: {
    marginTop: 16,
    gap: 16,
  },
  disclaimer: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 8,
  },
  button: {
    width: "100%",
  },
  cancelButton: {
    alignItems: "center",
    padding: 12,
  },
  cancelText: {
    color: "#6B7280",
    fontSize: 16,
  },
});