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
  TouchableOpacity,
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

import ViewIcon from "../../assets/icons/ViewIcon";
import HideIcon from "../../assets/icons/HideIcon";

export default function WelcomeScreen({ navigation }) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSignUpNavigation = () => {
    navigation.navigate("Guidelines");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true} // 👈 Scroll agora está livre
          showsVerticalScrollIndicator={false}
        >
          {/* TouchableWithoutFeedback aqui dentro garante que o clique fora 
             feche o teclado sem travar o movimento de subida e descida.
          */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.contentWrapper}>
              <View style={styles.heroSection}>
                <LinearGradient
                  colors={["transparent", "transparent"]}
                  style={styles.logoContainer}
                >
                  <Image
                    source={require("../../assets/images/LOGO-REDUZIDA.png")}
                    style={styles.logo}
                  />
                </LinearGradient>
                <Image
                  source={require("../../assets/images/SHABES-TEXTO-CORRIDO.png")}
                  style={{ height: 30, resizeMode: "contain" }}
                />
                <Text style={styles.subtitle}>
                  Quando uma porta se abre, nossa tradição permanece.
                </Text>
              </View>

              <Card style={{ width: "100%", marginTop: -25 }}>
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
                        secureTextEntry={!showPassword}
                        style={{ flex: 1 }}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={{ marginLeft: 8 }}
                      >
                        {showPassword ? (
                          <HideIcon width={22} height={22} color="#6B7280" />
                        ) : (
                          <ViewIcon width={22} height={22} color="#6B7280" />
                        )}
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
                <CardContent>
                  <CardTitle> Novo usuário? </CardTitle>
                  <Button
                    style={{ flex: 1, marginTop: 8 }}
                    onPress={handleSignUpNavigation}
                    variant="host"
                  >
                    Criar Conta
                  </Button>
                </CardContent>
              </Card>
            </View>
          </TouchableWithoutFeedback>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#F3F4F6" },
  container: {
    flexGrow: 1, // 👈 Essencial para o scroll funcionar com conteúdo centralizado
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  contentWrapper: {
    width: "100%",
    maxWidth: 500,
    gap: 24,
    alignItems: "center",
    paddingBottom: 40,
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
  subtitle: { fontSize: 16, color: "#6B7280", textAlign: "center" },
  formSection: { width: "100%", gap: 8, marginBottom: 4 },
});