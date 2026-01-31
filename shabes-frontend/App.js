import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet, Alert, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from 'expo-notifications';

// Providers e Contextos
import { Providers } from "./components/Providers";
import { useAuth } from "./context/AuthContext";

// Serviços e API
import { getMyProfile } from "./services/api";
import { supabase } from "./services/supabase"; 
import { registerForPushNotificationsAsync } from "./services/notificationService";

// Componentes de Layout e UI
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
import HostEventDetailScreen from "./components/screens/HostEventDetailScreen"; 
import NotificationsScreen from "./components/screens/NotificationsScreen";
import AgendaScreen from "./components/screens/AgendaScreen";
import FeedbackScreen from "./components/screens/FeedbackScreen";
import DiscoverEventsScreen from "./components/screens/DiscoverEventsScreen";
import CreateEventScreen from "./components/screens/CreateEventScreen";
import PublicProfileScreen from "./components/screens/PublicProfileScreen";

const Stack = createNativeStackNavigator();

// Configuração de comportamento das notificações (Foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
      <Stack.Screen name="Agenda" component={AgendaScreen} options={{ headerShown: false }} />
      <Stack.Screen name="MatchDetail" component={MatchDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="HostEventDetail" component={HostEventDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ headerShown: false }} />
      <Stack.Screen name="PublicProfile" component={PublicProfileScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="DiscoverEvents" component={DiscoverEventsScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [userStatus, setUserStatus] = useState(null); 
  
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    const configureNavBar = async () => {
        try {
            await NavigationBar.setVisibilityAsync("hidden");
            await NavigationBar.setBehaviorAsync("inset-swipe");
        } catch (e) {}
    };
    configureNavBar();
  }, []);

  /**
   * GERENCIAMENTO GLOBAL DE NOTIFICAÇÕES E PERSISTÊNCIA DE TOKEN
   */
  useEffect(() => {
    // Agora gravamos o token assim que isAuthenticated e user existem, 
    // independente de o status estar aprovado ou não, para garantir a captura imediata.
    if (isAuthenticated && user?.id) {
      
      // 1. Registro do Push Token e Salvamento no Perfil do Usuário
      registerForPushNotificationsAsync().then(async (token) => {
        if (token) {
          console.log("[AquiTemShabes] Push Token obtido:", token);
          
          try {
            // Atualiza a coluna push_token na tabela profiles do Supabase
            const { error } = await supabase
              .from('profiles')
              .update({ push_token: token })
              .eq('id', user.id);
            
            if (error) {
                console.error("[AquiTemShabes] Erro ao gravar push_token no Supabase:", error);
            } else {
                console.log("[AquiTemShabes] Push Token sincronizado com sucesso.");
            }
          } catch (err) {
            console.error("[AquiTemShabes] Exceção ao salvar token:", err);
          }
        }
      });

      // 2. Ouvintes de Notificação (Ativos apenas se estiver logado)
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log("[AquiTemShabes] Notificação em foreground:", notification.request.content.title);
      });

      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const { data } = response.notification.request.content;
        console.log("[AquiTemShabes] Clique detectado:", data);
      });

      return () => {
        if (notificationListener.current) {
          notificationListener.current.remove();
        }
        if (responseListener.current) {
          responseListener.current.remove();
        }
      };
    }
  }, [isAuthenticated, user?.id]);

  // Verificação de Status do Usuário
  useEffect(() => {
    const checkStatus = async () => {
      if (isAuthenticated && user) {
        setIsCheckingStatus(true);
        try {
          const { data } = await getMyProfile();
          setUserStatus(data?.status || 'approved'); 
        } catch (error) {
          console.error("Erro ao verificar status:", error);
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

  // Realtime Monitor para Status do Perfil
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
          setUserStatus(newStatus);
          if (newStatus === 'rejected') {
             Alert.alert(
                 "Acesso Revogado", 
                 "Sua conta não foi aprovada pelos administradores.",
                 [{ text: "OK", onPress: () => signOut() }]
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