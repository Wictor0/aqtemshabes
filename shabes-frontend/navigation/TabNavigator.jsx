import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importe os ícones, o Header, e as telas que estarão na Tab Bar
import Icon from '../components/ui/Icon';
import Header from '../components/layout/Header'; 
import HomeScreen from '../components/screens/HomeScreen';
import DiscoverEventsScreen from '../components/screens/DiscoverEventsScreen';
import ProfileScreen from '../components/screens/ProfileScreen';
import CreateEventScreen from '../components/screens/CreateEventScreen';

import HomeIcon from '../assets/icons/HomeIcon';
import SearchIcon from '../assets/icons/SearchIcon';
import ProfileIcon from '../assets/icons/ProfileIcon';

// 👇 Importe o hook de autenticação para checar o role
import { useAuth } from '../context/AuthContext';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const { user } = useAuth();

  // 👇 Lógica de Permissão:
  // Usuário comum ('user') NÃO pode criar eventos.
  // 'creator', 'host' e 'admin' PODEM.
  const canCreateEvent = user?.role === 'creator' || user?.role === 'host' || user?.role === 'admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, 
        
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarIcon: ({ color, size }) => {
          
          if (route.name === 'HomeTab') {
            return <HomeIcon width={size} height={size} color={color} />;
          }
          
          if (route.name === 'DiscoverEvents') {
            return <SearchIcon width={size} height={size} color={color} />;
          }
          
          if (route.name === 'Profile') {
            return <ProfileIcon width={size} height={size} color={color} />;
          }

          let iconName = '';
          if (route.name === 'CreateEvent') iconName = 'plus-circle-outline';
      
          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="DiscoverEvents" component={DiscoverEventsScreen} options={{ title: 'Descobrir' }} />
      
      {/* 👇 RENDERIZAÇÃO CONDICIONAL DA TELA DE CRIAR */}
      {canCreateEvent && (
        <Tab.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Criar' }} />
      )}

      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}