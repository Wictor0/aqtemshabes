import React from 'react';
import { View } from 'react-native';
import Icon from './Icon';

export default function VerifiedBadge({ role, size = 16, style }) {
  // Se não houver role, não exibe nada
  if (!role) return null;

  const isCreator = role === 'creator';

  // Configuração baseada no Role
  // Creator: Coroa Roxa
  // User: Selo Azul
  const color = isCreator ? '#7C3AED' : '#3B82F6'; 
  const iconName = isCreator ? 'crown' : 'check-decagram'; 

  return (
    <View style={[{ justifyContent: 'center', marginLeft: 4 }, style]}>
      <Icon name={iconName} size={size} color={color} />
    </View>
  );
}