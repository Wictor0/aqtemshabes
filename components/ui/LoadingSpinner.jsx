import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

/*
  TRADUÇÃO DE CONCEITOS:
  - `div` com `animate-spin`: Substituído pelo componente `<ActivityIndicator>` do React Native.
  - `size`: O `ActivityIndicator` aceita 'small', 'large' ou um número para um tamanho customizado. Mapeamos as suas props para esses valores.
  - `className`: Substituído por `style`.
*/

// Mapeia as suas props de tamanho para os valores que o ActivityIndicator entende.
const sizeMap = {
  small: "small",
  default: "large",
  large: 60, // Para um tamanho grande customizado, passamos um número.
};

export default function LoadingSpinner({
  size = "default",
  style,
  color = "#007AFF",
}) {
  const indicatorSize = sizeMap[size] || sizeMap.default;

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={indicatorSize} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16, // p-4
    alignItems: "center",
    justifyContent: "center",
  },
});
