import React, { useState } from "react";
import { TextInput, StyleSheet } from "react-native";

/*
  TRADUÇÃO DE CONCEITOS:
  - `<input>`: Foi substituído pelo componente `<TextInput>` do React Native.
  - `className`: Foi substituído pela prop `style`.
  - `type="password"`: No React Native, usamos a prop booleana `secureTextEntry={true}`.
  - `placeholder`: A prop continua a mesma, mas a cor do placeholder é definida pela prop `placeholderTextColor`.
  - Foco (focus-visible:*): O React Native não tem um seletor de foco como o CSS. Em vez disso, podemos usar os eventos `onFocus` e `onBlur` para mudar o estilo dinamicamente quando o usuário toca no input.
*/

const Input = React.forwardRef(({ style, type, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Determina se o input deve esconder o texto (para senhas)
  const isPassword = type === "password";

  // Estilo dinâmico para a borda quando o input está focado
  const focusStyle = {
    borderColor: isFocused ? "#007AFF" : "#E5E7EB", // Borda azul quando focado, cinza caso contrário
    borderWidth: isFocused ? 2 : 1,
  };

  return (
    <TextInput
      ref={ref}
      style={[styles.input, focusStyle, style]} // Combina os estilos base, de foco e customizados
      secureTextEntry={isPassword} // Esconde o texto se for do tipo 'password'
      placeholderTextColor="#9CA3AF" // Cor para o texto do placeholder (equivalente a text-muted-foreground)
      onFocus={() => setIsFocused(true)} // Ativa o estado de foco
      onBlur={() => setIsFocused(false)} // Desativa o estado de foco
      {...props} // Passa todas as outras props (value, onChangeText, etc.)
    />
  );
});

Input.displayName = "Input";

const styles = StyleSheet.create({
  input: {
    height: 44, // Altura um pouco maior para facilitar o toque
    width: "100%",
    backgroundColor: "#FFFFFF", // Fundo branco
    paddingHorizontal: 15,
    borderRadius: 8,
    fontSize: 16,
    color: "#1F2937", // Cor do texto digitado
  },
});

export { Input };
