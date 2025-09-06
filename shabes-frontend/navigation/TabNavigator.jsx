import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

// Importe os ícones, o Header, e as telas que estarão na Tab Bar
import Icon from '../components/ui/Icon';
import Header from '../components/layout/Header'; // O Header que você criou
import HomeScreen from '../components/screens/HomeScreen';
import DiscoverEventsScreen from '../components/screens/DiscoverEventsScreen';
import ProfileScreen from '../components/screens/ProfileScreen';
import CreateEventScreen from '../components/screens/CreateEventScreen';
// A importação de MatchesScreen foi removida

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false, // <-- Apenas isto.
        
        // Outras opções da sua Tab Bar
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#6B7280',
        tabBarIcon: ({ color, size }) => {
          let iconName = 'home-outline';

          if (route.name === 'HomeTab') iconName = 'home-variant-outline';
          // 2. A lógica para a aba "Matches" foi REMOVIDA
          else if (route.name === 'DiscoverEvents') iconName = 'magnify';
          else if (route.name === 'CreateEvent') iconName = 'plus-circle-outline';
          else if (route.name === 'Profile') iconName = 'account-circle-outline';

          return <Icon name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeScreen} options={{ title: 'Início' }} />
      <Tab.Screen name="DiscoverEvents" component={DiscoverEventsScreen} options={{ title: 'Descobrir' }} />
      <Tab.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: 'Criar' }} />
      {/* 3. A tela "Matches" foi REMOVIDA daqui */}
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}