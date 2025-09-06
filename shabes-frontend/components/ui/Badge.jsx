import React from "react";
import { View, Text, StyleSheet } from "react-native";

/*
  TRADUÇÃO DE CONCEITOS:
  - `cva` e `cn`: Foram substituídos por objetos de estilo do `StyleSheet`.
  - `<div>`: Foi substituído por `<View>`.
  - O conteúdo de texto: Precisa ser explicitamente renderizado dentro de um componente `<Text>`.
*/

// Estilos que se aplicam a TODOS os badges
const baseContainerStyles = {
  paddingHorizontal: 10, // px-2.5
  paddingVertical: 2, // py-0.5
  borderRadius: 9999, // rounded-full
  borderWidth: 1,
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "flex-start", // Para o badge não ocupar a largura toda
};

const baseTextStyles = {
  fontSize: 12, // text-xs
  fontWeight: "600", // font-semibold
};

// Estilos para cada VARIANTE de badge
const variantStyles = {
  container: {
    default: { backgroundColor: "#007AFF", borderColor: "transparent" },
    secondary: { backgroundColor: "#E5E7EB", borderColor: "transparent" },
    destructive: { backgroundColor: "#FF3B30", borderColor: "transparent" },
    outline: { borderColor: "#D1D5DB" },
    warning: { backgroundColor: "#F59E0B", borderColor: "transparent" },
  },
  text: {
    default: { color: "#FFFFFF" },
    secondary: { color: "#1F2937" },
    destructive: { color: "#FFFFFF" },
    outline: { color: "#1F2937" },
    warning: { color: "#FFFFFF" },
  },
};

function Badge({ variant = "default", style, textStyle, children }) {
  // Combina os estilos para o container (View)
  const containerStyle = [
    baseContainerStyles,
    variantStyles.container[variant],
    style,
  ];

  // Combina os estilos para o texto (Text)
  const badgeTextStyle = [
    baseTextStyles,
    variantStyles.text[variant],
    textStyle,
  ];

  return (
    <View style={containerStyle}>
      <Text style={badgeTextStyle}>{children}</Text>
    </View>
  );
}

export { Badge };
