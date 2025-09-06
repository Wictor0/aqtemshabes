import React from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient"; // Importe para usar os gradientes

/*
  TRADUÇÃO DE CONCEITOS:
  - `cva` e `cn` (class-variance-authority, clsx): Foram substituídos por objetos JavaScript e pelo `StyleSheet` do React Native. Criamos um objeto para os estilos base, um para as variantes e um para os tamanhos.
  - `className`: Foi substituído pela prop `style`.
  - `<button>`: Foi substituído por `<TouchableOpacity>`, que é o componente padrão para botões no React Native.
  - `Slot` e `asChild`: Este padrão do Radix UI não é comum no React Native. A composição é feita de forma mais direta, passando componentes como `children`. O componente de Texto (`<Text>`) é separado do container do botão (`<TouchableOpacity>`).
  - `React.forwardRef`: Continua funcionando da mesma forma, permitindo que o componente pai acesse o `TouchableOpacity` interno.
*/

// 1. DEFINIÇÃO DAS VARIANTES DE ESTILO (Substituindo o `cva`)

// Estilos que se aplicam a TODOS os botões
const baseButtonStyles = {
  flexDirection: "row", // Equivalente a 'inline-flex items-center'
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 6, // Equivalente a 'rounded-md'
};

const baseTextStyles = {
  fontSize: 14, // Equivalente a 'text-sm'
  fontWeight: "500", // Equivalente a 'font-medium'
  textAlign: "center",
};

// Estilos para cada VARIANTE (cor, fundo, borda)
const variantStyles = {
  // Estilos para o container (TouchableOpacity)
  container: {
    default: { backgroundColor: "#007AFF" },
    destructive: { backgroundColor: "#FF3B30" },
    outline: {
      borderWidth: 1,
      borderColor: "#E5E7EB",
      backgroundColor: "transparent",
    },
    secondary: { backgroundColor: "#E5E7EB" },
    ghost: { backgroundColor: "transparent" },
    link: { backgroundColor: "transparent" },
    shabbat: {}, // O gradiente é um componente, então o estilo do container fica vazio
    host: {},
  },
  // Estilos para o texto (Text)
  text: {
    default: { color: "#FFFFFF" },
    destructive: { color: "#FFFFFF" },
    outline: { color: "#1F2937" },
    secondary: { color: "#1F2937" },
    ghost: { color: "#3B82F6" },
    link: { color: "#007AFF", textDecorationLine: "underline" },
    shabbat: { color: "#FFFFFF" },
    host: { color: "#FFFFFF" },
  },
};

// Estilos para cada TAMANHO (altura, padding)
const sizeStyles = {
  // Estilos para o container (TouchableOpacity)
  container: {
    default: { height: 40, paddingHorizontal: 16 }, // h-10 px-4
    sm: { height: 36, paddingHorizontal: 12 }, // h-9 px-3
    lg: { height: 44, paddingHorizontal: 32 }, // h-11 px-8
    xl: { height: 64, paddingHorizontal: 32 }, // h-16 px-8
    icon: { height: 40, width: 40 }, // h-10 w-10
  },
  // Estilos para o texto (Text)
  text: {
    xl: { fontSize: 16 }, // text-base
  },
};

// Gradientes para as variantes 'shabbat' e 'host'
const gradientVariants = {
  shabbat: ["#2563EB", "#1D4ED8"], // from-blue-600 to-blue-700
  host: ["#9333EA", "#7E22CE"], // from-purple-600 to-purple-700
};

// 2. O COMPONENTE DO BOTÃO
const Button = React.forwardRef(
  (
    {
      variant = "default",
      size = "default",
      children,
      onPress,
      style,
      textStyle,
      ...props
    },
    ref
  ) => {
    // Monta o array de estilos para o container do botão
    const containerStyle = [
      baseButtonStyles,
      variantStyles.container[variant],
      sizeStyles.container[size],
      style, // Permite passar estilos customizados de fora
    ];

    // Monta o array de estilos para o texto do botão
    const buttonTextStyle = [
      baseTextStyles,
      variantStyles.text[variant],
      sizeStyles.text[size],
      size === "xl" && sizeStyles.text.xl, // Aplica o estilo de texto 'xl' se necessário
      textStyle, // Permite passar estilos de texto customizados
    ];

    const content = <Text style={buttonTextStyle}>{children}</Text>;

    // Se a variante for 'shabbat' ou 'host', usamos o componente LinearGradient
    if (variant === "shabbat" || variant === "host") {
      return (
        <TouchableOpacity onPress={onPress} ref={ref} {...props}>
          <LinearGradient
            colors={gradientVariants[variant]}
            style={containerStyle}
          >
            {content}
          </LinearGradient>
        </TouchableOpacity>
      );
    }

    // Para todas as outras variantes, usamos um TouchableOpacity normal
    return (
      <TouchableOpacity
        style={containerStyle}
        onPress={onPress}
        ref={ref}
        {...props}
      >
        {content}
      </TouchableOpacity>
    );
  }
);

Button.displayName = "Button";

export { Button };
