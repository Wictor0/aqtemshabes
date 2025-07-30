import React, { useEffect } from "react"; // 1. Importe o useEffect
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
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
import LoadingSpinner from "./components/ui/LoadingSpinner";

const Stack = createNativeStackNavigator();

function AppNavigator() {
  const { isAuthenticated, isLoading } = useAuth();

  // 3. Adicione este useEffect para controlar a barra de navegação
  useEffect(() => {
    // Esconde a barra de navegação e define o comportamento para 'sticky-immersive'
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
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },
});
