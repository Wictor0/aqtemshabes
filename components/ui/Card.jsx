import React from "react";
import { View, Text, StyleSheet } from "react-native";

/*
  TRADUÇÃO DE CONCEITOS:
  - `div`: Substituído por `<View>`.
  - `h3` e `p`: Substituídos por `<Text>`.
  - `className`: Substituído por `style`.
  - `shadow-sm`: O sombreamento no React Native é feito com props específicas (`shadowColor`, `shadowOffset`, `shadowOpacity`, `shadowRadius`) e só funciona no iOS. Para Android, usamos `elevation`.
*/

// --- Componente Principal do Card ---
const Card = React.forwardRef(({ style, children, ...props }, ref) => (
  <View ref={ref} style={[styles.card, style]} {...props}>
    {children}
  </View>
));
Card.displayName = "Card";

// --- Cabeçalho do Card ---
const CardHeader = React.forwardRef(({ style, children, ...props }, ref) => (
  <View ref={ref} style={[styles.cardHeader, style]} {...props}>
    {children}
  </View>
));
CardHeader.displayName = "CardHeader";

// --- Título do Card ---
const CardTitle = React.forwardRef(({ style, children, ...props }, ref) => (
  <Text ref={ref} style={[styles.cardTitle, style]} {...props}>
    {children}
  </Text>
));
CardTitle.displayName = "CardTitle";

// --- Descrição do Card ---
const CardDescription = React.forwardRef(
  ({ style, children, ...props }, ref) => (
    <Text ref={ref} style={[styles.cardDescription, style]} {...props}>
      {children}
    </Text>
  )
);
CardDescription.displayName = "CardDescription";

// --- Conteúdo do Card ---
const CardContent = React.forwardRef(({ style, children, ...props }, ref) => (
  <View ref={ref} style={[styles.cardContent, style]} {...props}>
    {children}
  </View>
));
CardContent.displayName = "CardContent";

// --- Rodapé do Card ---
const CardFooter = React.forwardRef(({ style, children, ...props }, ref) => (
  <View ref={ref} style={[styles.cardFooter, style]} {...props}>
    {children}
  </View>
));
CardFooter.displayName = "CardFooter";

// --- Estilos ---
const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB", // border
    backgroundColor: "#FFFFFF", // bg-card
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // Sombra para Android
    elevation: 2,
  },
  cardHeader: {
    padding: 24, // p-6
    paddingBottom: 0, // No original, o space-y cuida disso, aqui ajustamos
  },
  cardTitle: {
    fontSize: 24, // text-2xl
    fontWeight: "600", // font-semibold
    lineHeight: 32,
  },
  cardDescription: {
    fontSize: 14, // text-sm
    color: "#6B7280", // text-muted-foreground
    marginTop: 6, // Simula o space-y-1.5
  },
  cardContent: {
    padding: 24, // p-6
    paddingTop: 16,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    padding: 24, // p-6
    paddingTop: 0,
  },
});

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
