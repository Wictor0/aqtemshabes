import React from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Este componente irá servir como o nosso ícone padrão para toda a aplicação.
// Usamos a biblioteca MaterialCommunityIcons, que tem milhares de ícones.
// Pode encontrar todos os ícones aqui: https://icons.expo.fyi/
export default function Icon({ name, color = "#6B7280", size = 24 }) {
  return <MaterialCommunityIcons name={name} size={size} color={color} />;
}
