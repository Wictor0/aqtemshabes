import React from "react";
import { Text, StyleSheet } from "react-native";

/*
  TRADUÇÃO DE CONCEITOS:
  - `<LabelPrimitive.Root>`: Substituído por um componente `<Text>` do React Native. A associação com o input é visual, não por ID.
  - `cva` e `cn`: Substituídos por um `StyleSheet` e a lógica de aplicar estilos em um array.
  - `peer-disabled:opacity-70`: Traduzido para uma prop `disabled` que aplica um estilo de opacidade condicionalmente.
*/

const Label = React.forwardRef(
  ({ style, children, disabled, ...props }, ref) => {
    // Combina os estilos: base, o estilo de desativado (se aplicável), e estilos customizados.
    const labelStyle = [styles.label, disabled && styles.disabled, style];

    return (
      <Text ref={ref} style={labelStyle} {...props}>
        {children}
      </Text>
    );
  }
);
Label.displayName = "Label";

const styles = StyleSheet.create({
  label: {
    fontSize: 14, // text-sm
    fontWeight: "500", // font-medium
    color: "#374151",
  },
  disabled: {
    opacity: 0.7, // opacity-70
  },
});

export { Label };
