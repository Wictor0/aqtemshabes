import React from "react";
<<<<<<< HEAD
import { StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from "react-native";
import SignUpForm from "../forms/SignUpForm";
import { useAuth } from "../../context/AuthContext";

export default function SignUpScreen({ route, navigation }) {
  const inviteCode = route.params?.inviteCode;
  const { signUp, isLoading } = useAuth();

  const handleSignUp = async ({ email, password, metadata }) => {
    const success = await signUp(email, password, metadata);
    if (success) {
      navigation.goBack(); // Volta para a tela de Welcome/Login
    }
  };
=======
import {
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import SignUpForm from "../forms/SignUpForm";

export default function SignUpScreen({ route, navigation }) {
  const { inviteCode } = route.params;
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <SignUpForm
              inviteCode={inviteCode}
              onBack={() => navigation.goBack()}
<<<<<<< HEAD
              onSubmit={handleSignUp}
              isLoading={isLoading}
=======
              onSignUpComplete={() => navigation.goBack()}
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
<<<<<<< HEAD
  safeArea: { flex: 1, backgroundColor: "#F3F4F6" },
  container: { flexGrow: 1, justifyContent: "center", alignItems: "center", padding: 20 },
});
=======
  safeArea: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
});
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
