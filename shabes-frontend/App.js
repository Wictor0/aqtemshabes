<<<<<<< HEAD
import React from "react";
=======
import React, { useEffect } from "react"; // 1. Importe o useEffect
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
<<<<<<< HEAD
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
=======
import * as NavigationBar from "expo-navigation-bar"; // 2. Importe a biblioteca de navegação

import { Providers } from "./components/Providers";
import { useAuth } from "./context/AuthContext";
// Os caminhos agora apontam para dentro da pasta 'components'
import WelcomeScreen from "./components/screens/WelcomeScreen";
import SignUpScreen from "./components/screens/SignUpScreen";
import HomeScreen from "./components/screens/HomeScreen";
import ProfileScreen from "./components/screens/ProfileScreen";
import MatchesScreen from "./components/screens/MatchesScreen";
import MatchDetailScreen from "./components/screens/MatchDetailScreen";
import FeedbackScreen from "./components/screens/FeedbackScreen";
import DiscoverEventsScreen from "./components/screens/DiscoverEventsScreen";
import CreateEventScreen from "./components/screens/CreateEventScreen";
import EventDetailScreen from "./components/screens/EventDetailScreen";
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
import LoadingSpinner from "./components/ui/LoadingSpinner";

const Stack = createNativeStackNavigator();

<<<<<<< HEAD
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

=======
function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // 3. Adicione este useEffect para controlar a barra de navegação
  useEffect(() => {
    // Esconde a barra de navegação e define o comportamento para 'sticky-immersive'
    NavigationBar.setVisibilityAsync("hidden");
    NavigationBar.setBehaviorAsync("inset-swipe");
  }, []);

>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

<<<<<<< HEAD
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
=======
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Matches" component={MatchesScreen} />
          <Stack.Screen name="MatchDetail" component={MatchDetailScreen} />
          <Stack.Screen name="Feedback" component={FeedbackScreen} />
          <Stack.Screen
            name="DiscoverEvents"
            component={DiscoverEventsScreen}
          />
          <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
          <Stack.Screen name="EventDetail" component={EventDetailScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <Providers>
      <NavigationContainer>
        <AppNavigator />
        <Toast />
      </NavigationContainer>
    </Providers>
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
<<<<<<< HEAD
    backgroundColor: "#FFFFFF",
  },
});
=======
    backgroundColor: "#F3F4F6",
  },
});
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
