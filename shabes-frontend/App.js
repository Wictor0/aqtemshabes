import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from "expo-navigation-bar";

import { Providers } from "./components/Providers";
import { useAuth } from "./context/AuthContext";
import Header from "./components/layout/Header";
import TabNavigator from "./navigation/TabNavigator";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Telas de ambas as versões
import WelcomeScreen from "./components/screens/WelcomeScreen";
import SignUpScreen from "./components/screens/SignUpScreen";
import MatchDetailScreen from "./components/screens/MatchDetailScreen";
import EventDetailScreen from "./components/screens/EventDetailScreen";
import NotificationsScreen from "./components/screens/NotificationsScreen";
import AgendaScreen from "./components/screens/AgendaScreen";
import FeedbackScreen from "./components/screens/FeedbackScreen";
import DiscoverEventsScreen from "./components/screens/DiscoverEventsScreen";
import CreateEventScreen from "./components/screens/CreateEventScreen";

const Stack = createNativeStackNavigator();

// Pilha de navegação para usuários deslogados
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

// Pilha de navegação para usuários logados
function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="DiscoverEvents" component={DiscoverEventsScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
    </Stack.Navigator>
  );
}

// Navegador Raiz que escolhe qual pilha mostrar
function RootNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    // Esconde a barra de navegação do Android para uma experiência mais imersiva
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("inset-swipe");
  }, []);

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
    backgroundColor: "#F3F4F6", // Usando o cinza claro da segunda versão
  },
});
