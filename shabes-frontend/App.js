import React from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from 'react-native-safe-area-context'; // 1. IMPORTE AQUI

import { Providers } from "./components/Providers";
import { useAuth } from "./context/AuthContext";
import Header from "./components/layout/Header"; 

// Telas
import WelcomeScreen from "./components/screens/WelcomeScreen";
import SignUpScreen from "./components/screens/SignUpScreen";
import MatchDetailScreen from "./components/screens/MatchDetailScreen";
import EventDetailScreen from "./components/screens/EventDetailScreen";
import NotificationsScreen from "./components/screens/NotificationsScreen";
import AgendaScreen from "./components/screens/AgendaScreen"; 
import TabNavigator from "./navigation/TabNavigator";
import LoadingSpinner from "./components/ui/LoadingSpinner";

const Stack = createNativeStackNavigator();

// Pilha de navegação para utilizadores deslogados
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// Pilha de navegação para utilizadores logados
// Dentro do ficheiro App.js

function AppStack() {
  return (
    <Stack.Navigator 
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ headerShown: false }} /> 
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

// Navegador Raiz que escolhe qual pilha mostrar
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  return isAuthenticated ? <AppStack /> : <AuthStack />;
}

// Componente principal da Aplicação
export default function App() {
  return (
    // 2. ENVOLVA TUDO COM O SafeAreaProvider
    <SafeAreaProvider>
      <Providers>
        <NavigationContainer>
          <RootNavigator />
          <Toast />
        </NavigationContainer>
      </Providers>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});