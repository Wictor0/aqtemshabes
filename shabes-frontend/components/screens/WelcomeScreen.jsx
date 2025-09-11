import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Image,
  TouchableOpacity, // 👈 importei aqui
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../ui/Card";
import LoadingSpinner from "../ui/LoadingSpinner";
import { toast } from "../../hooks/use-toast";
import { useAuth } from "../../context/AuthContext";

export default function WelcomeScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 👇 estado pra controlar visibilidade da senha
  const [showPassword, setShowPassword] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      toast({
        type: "error",
        title: "Erro",
        description: "Por favor, preencha o email e a senha.",
      });
      return;
    }
    setIsLoading(true);
    await signIn(email, password);
    setIsLoading(false);
  };

  const handleInviteCode = () => {
    if (!inviteCode.trim()) {
      toast({
        type: "error",
        title: "Erro",
        description: "Digite um código de convite.",
      });
      return;
    }
    const validCodes = ["SHALOM2025", "SHABBAT2024"];
    if (validCodes.includes(inviteCode.toUpperCase())) {
      navigation.navigate("SignUp", { inviteCode });
    } else {
      toast({
        type: "error",
        title: "Código Inválido",
        description: "O código de convite não foi encontrado.",
      });
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="always"
          >
            <View style={styles.contentWrapper}>
              <View style={styles.heroSection}>
                <LinearGradient
                  colors={["transparent", "transparent"]}
                  style={styles.logoContainer}
                >
                  <Image
                    source={require("../../assets/images/icon.png")}
                    style={styles.logo}
                  />
                </LinearGradient>
                <Text style={styles.title}>Aquitemshabes</Text>
                <Text style={styles.subtitle}>
                  Conectando comunidades através do Shabat
                </Text>
              </View>
              <Card style={{ width: "100%" }}>
                <CardHeader>
                  <CardTitle>Já tem conta?</CardTitle>
                  <CardDescription>Entre com suas credenciais</CardDescription>
                </CardHeader>
                <CardContent>
                  <View style={styles.formSection}>
                    <Label>Email</Label>
                    <Input
                      value={email}
                      onChangeText={setEmail}
                      placeholder="seu@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                  <View style={styles.formSection}>
                    <Label>Senha</Label>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Input
                        value={password}
                        onChangeText={setPassword}
                        placeholder="••••••••"
                        type={showPassword ? "text" : "password"} // 👈 alterna
                        style={{ flex: 1 }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ marginLeft: 8 }}
                      >
                        <Text style={{ fontSize: 16 }}>
                          {showPassword ? "🙈" : "🐵"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </CardContent>
                <CardFooter>
                  <Button
                    style={{ flex: 1 }}
                    onPress={handleSignIn}
                    disabled={isLoading}
                    variant="shabbat"
                  >
                    {isLoading ? (
                      <LoadingSpinner size="small" color="#FFFFFF" />
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </CardFooter>
              </Card>
              <Card style={{ width: "100%" }}>
                <CardHeader>
                  <CardTitle>Novo usuário?</CardTitle>
                  <CardDescription>
                    Digite seu código de convite para se cadastrar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <View style={styles.formSection}>
                    <Label>Código de Convite</Label>
                    <Input
                      value={inviteCode}
                      onChangeText={(text) => setInviteCode(text.toUpperCase())}
                      placeholder="SHALOM2025"
                      autoCapitalize="characters"
                    />
                  </View>
                </CardContent>
                <CardFooter>
                  <Button
                    style={{ flex: 1 }}
                    onPress={handleInviteCode}
                    variant="host"
                  >
                    Continuar Cadastro
                  </Button>
                </CardFooter>
              </Card>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F4F6" },
  container: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 500,
    gap: 24,
    alignItems: "center",
  },
  heroSection: { alignItems: "center", gap: 12, marginBottom: 16 },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  title: { fontSize: 32, fontWeight: "bold", color: "#1F2937" },
  subtitle: { fontSize: 16, color: "#6B7280" },
  formSection: { width: "100%", gap: 8, marginBottom: 4 },
});
