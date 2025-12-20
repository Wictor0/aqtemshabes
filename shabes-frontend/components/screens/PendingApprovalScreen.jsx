import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Image,
  ScrollView,
} from "react-native";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import Icon from "../ui/Icon";
import { useAuth } from "../../context/AuthContext";

export default function PendingApprovalScreen() {
  const { signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Icon name="shield" size={40} color="#4F46E5" />
          </View>
          <Text style={styles.title}>Cadastro em Análise</Text>
          <Text style={styles.subtitle}>
            Falta pouco para você fazer parte da comunidade AquiTemShabes!
          </Text>
        </View>

        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.infoRow}>
              <Icon name="clock" size={24} color="#F59E0B" style={{ marginTop: 2 }} />
              <View style={styles.textBlock}>
                <Text style={styles.infoTitle}>Prazo de 3 dias</Text>
                <Text style={styles.infoText}>
                  Nossos chanceladores estão analisando o seu perfil e podem entrar em contato a qualquer momento. Este processo garante a segurança do nosso sistema, e pode levar até 3 dias corridos para ser concluído.
                </Text>
              </View>
            </View>

            <View style={styles.separator} />

            <View style={styles.infoRow}>
              <Icon name="check-circle" size={24} color="#10B981" style={{ marginTop: 2 }} />
              <View style={styles.textBlock}>
                <Text style={styles.infoTitle}>O que acontece depois?</Text>
                <Text style={styles.infoText}>
                  Assim que seu perfil for aprovado, você receberá um email com seus dados de acesso ao AquiTemShabes. Seja bem-vindo e participe de nossos eventos.
                </Text>
              </View>
            </View>
          </CardContent>
        </Card>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            A segurança da comunidade é nossa prioridade. Agradecemos sua compreensão e paciência.
          </Text>
          
          <Button 
            variant="outline" 
            onPress={signOut} 
            style={styles.button}
          >
            Sair da Conta
          </Button>
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
    flexGrow: 1,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#EEF2FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 32,
  },
  cardContent: {
    padding: 20,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  textBlock: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: "#6B7280",
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#F3F4F6",
    marginVertical: 16,
  },
  footer: {
    alignItems: "center",
    gap: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
    fontStyle: "italic",
  },
  button: {
    width: "100%",
    borderColor: "#D1D5DB",
  },
});