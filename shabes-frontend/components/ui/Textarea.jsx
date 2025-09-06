import React, { useState } from "react";
import { TextInput, StyleSheet } from "react-native";

/*
  TRADUÇÃO DE CONCEITOS:
  - `<textarea>`: Substituído pelo componente `<TextInput>` com a prop `multiline={true}`.
  - `min-h-[80px]`: Traduzido para `minHeight: 80` no estilo.
  - O resto dos conceitos (foco, placeholder, etc.) segue a mesma lógica do componente Input.
*/

const Textarea = React.forwardRef(({ style, ...props }, ref) => {
  const [isFocused, setIsFocused] = useState(false);

  // Estilo dinâmico para a borda quando o input está focado
  const focusStyle = {
    borderColor: isFocused ? "#007AFF" : "#E5E7EB",
    borderWidth: isFocused ? 2 : 1,
  };

  return (
    <TextInput
      ref={ref}
      style={[styles.textarea, focusStyle, style]}
      multiline={true} // A principal diferença: permite múltiplas linhas
      placeholderTextColor="#9CA3AF"
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

const styles = StyleSheet.create({
  textarea: {
    minHeight: 80,
    width: "100%",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12, // px-3
    paddingVertical: 8, // py-2
    paddingTop: 8, // Garante que o texto comece do topo no iOS
    borderRadius: 8, // rounded-md
    fontSize: 14, // text-sm
    textAlignVertical: "top", // Garante que o texto comece do topo no Android
    color: "#1F2937",
  },
});

export { Textarea };
