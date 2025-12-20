import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Linking,
} from "react-native";
import { Button } from "../ui/Button";
import { Card, CardContent } from "../ui/Card";
import Icon from "../ui/Icon";
import { useAuth } from "../../context/AuthContext";

export default function RejectedScreen() {
  const { signOut } = useAuth();

  const handleContactSupport = () => {
    // Substitua pelo link ou email do seu suporte
    Linking.openURL('mailto:aquitemshabes@gmail.com?subject=Revisão de Cadastro');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Icon name="slash" size={40} color="#EF4444" />
          </View>
          <Text style={styles.title}>Solicitação Não Aprovada</Text>
          <Text style={styles.subtitle}>
            Atualização sobre o status do seu cadastro.
          </Text>
        </View>

        <Card style={styles.card}>
          <CardContent style={styles.cardContent}>
            <View style={styles.textBlock}>
              <Text style={styles.paragraph}>
                Agradecemos seu interesse em fazer parte da comunidade AquiTemShabes.
              </Text>
              <Text style={styles.paragraph}>
                Após uma análise cuidadosa realizada pelo nosso conselho de chanceladores, informamos que sua solicitação de entrada <Text style={styles.bold}>não foi aprovada</Text> neste momento.
              </Text>
              
              <View style={styles.highlightBox}>
                <Icon name="info" size={20} color="#7F1D1D" style={{marginRight: 8, marginTop: 2}}/>
                <Text style={styles.highlightText}>
                  O Shabes é uma comunidade com diretrizes específicas de convivência e segurança. Esta decisão foi baseada em nossos critérios internos de admissão para garantir a integridade da rede.
                </Text>
              </View>

              <Text style={styles.paragraph}>
                Se você acredita que houve um equívoco ou gostaria de solicitar uma nova revisão, entre em contato com nosso suporte.
              </Text>
            </View>
          </CardContent>
        </Card>

        <View style={styles.footer}>
          <Button 
            variant="outline" 
            onPress={handleContactSupport} 
            style={styles.supportButton}
          >
            <Icon name="mail" size={18} color="#374151" style={{marginRight: 8}}/>
            <Text style={styles.supportButtonText}>Contatar Suporte</Text>
          </Button>
          
          <Button 
            variant="destructive" // Um botão vermelho/destrutivo para sair
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
    backgroundColor: "#FEF2F2", // Um fundo levemente avermelhado
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
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#991B1B", // Vermelho escuro
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#7F1D1D",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 32,
  },
  cardContent: {
    padding: 24,
  },
  textBlock: {
    gap: 16,
  },
  paragraph: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 24,
  },
  bold: {
    fontWeight: "bold",
    color: "#DC2626",
  },
  highlightBox: {
    backgroundColor: "#FEF2F2",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    borderLeftWidth: 4,
    borderLeftColor: "#EF4444",
  },
  highlightText: {
    fontSize: 14,
    color: "#7F1D1D",
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    gap: 12,
  },
  button: {
    width: "100%",
  },
  supportButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
  },
  supportButtonText: {
    color: "#374151",
    fontWeight: "500",
  },
});