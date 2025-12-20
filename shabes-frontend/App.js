import React, { useEffect, useState } from "react";
import { View, StyleSheet, Alert } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from "expo-navigation-bar";

import { Providers } from "./components/Providers";
import { useAuth } from "./context/AuthContext";
import { getMyProfile } from "./services/api";
import { supabase } from "./services/supabase"; // Importação do Supabase para Realtime
import Header from "./components/layout/Header";
import TabNavigator from "./navigation/TabNavigator";
import LoadingSpinner from "./components/ui/LoadingSpinner";

// Telas de Autenticação
import WelcomeScreen from "./components/screens/WelcomeScreen";
import SignUpScreen from "./components/screens/SignUpScreen";
import GuidelinesScreen from "./components/screens/GuidelinesScreen";
import PendingApprovalScreen from "./components/screens/PendingApprovalScreen";
import RejectedScreen from "./components/screens/RejectedScreen";

// Telas do App
import MatchDetailScreen from "./components/screens/MatchDetailScreen";
import EventDetailScreen from "./components/screens/EventDetailScreen";
import HostEventDetailScreen from "./components/screens/HostEventDetailScreen"; // Painel do Anfitrião
import NotificationsScreen from "./components/screens/NotificationsScreen";
import AgendaScreen from "./components/screens/AgendaScreen";
import FeedbackScreen from "./components/screens/FeedbackScreen";
import DiscoverEventsScreen from "./components/screens/DiscoverEventsScreen";
import CreateEventScreen from "./components/screens/CreateEventScreen";
import PublicProfileScreen from "./components/screens/PublicProfileScreen";

const Stack = createNativeStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Guidelines" component={GuidelinesScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <Header {...props} />,
      }}
    >
      <Stack.Screen name="Main" component={TabNavigator} />
      
      {/* Telas sem Header padrão (usam layout próprio ou safe area) */}
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HostEventDetail" component={HostEventDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ headerShown: false }} />
      
      {/* Telas com Header padrão */}
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="DiscoverEvents" component={DiscoverEventsScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [userStatus, setUserStatus] = useState(null); // 'pending', 'approved', 'rejected'

  useEffect(() => {
    const configureNavBar = async () => {
        try {
            await NavigationBar.setVisibilityAsync("hidden");
            await NavigationBar.setBehaviorAsync("inset-swipe");
        } catch (e) {
            // Ignora erro em iOS ou ambientes sem suporte
        }
    };
    configureNavBar();
  }, []);

  // 1. Verifica o status inicial ao abrir o app/logar
  useEffect(() => {
    const checkStatus = async () => {
      if (isAuthenticated && user) {
        setIsCheckingStatus(true);
        try {
          const { data } = await getMyProfile();
          // Se status não existir, assume 'approved' para compatibilidade
          setUserStatus(data?.status || 'approved'); 
        } catch (error) {
          console.error("Erro ao verificar status do usuário:", error);
          // Em erro de rede, mantemos o usuário preso por segurança ou tentamos novamente
          setUserStatus('error'); 
        } finally {
          setIsCheckingStatus(false);
        }
      } else {
        setUserStatus(null);
      }
    };

    checkStatus();
  }, [isAuthenticated, user]);

  // 2. Monitoramento em Tempo Real (Realtime)
  // Escuta mudanças na tabela 'profiles' para deslogar instantaneamente se for rejeitado
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile_status_monitor')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          const newStatus = payload.new.status;
          console.log("⚡ Status atualizado em tempo real:", newStatus);
          
          setUserStatus(newStatus);

          if (newStatus === 'rejected') {
             Alert.alert(
                 "Acesso Revogado", 
                 "Sua conta não foi aprovada pelos administradores.",
                 [{ text: "OK", onPress: () => signOut() }] // Força logout ao clicar OK
             );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, signOut]);

  if (isLoading || (isAuthenticated && isCheckingStatus)) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  // Roteamento baseado no Status
  if (userStatus === 'approved') {
    return <AppStack />;
  } else if (userStatus === 'rejected') {
    return <RejectedScreen />;
  } else {
    // 'pending', 'error' ou qualquer outro estado desconhecido
    return <PendingApprovalScreen />;
  }
}

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
    backgroundColor: "#F3F4F6",
  },
});