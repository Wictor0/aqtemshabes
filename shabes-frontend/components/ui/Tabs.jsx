import React, { useState, createContext, useContext } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

/*
  TRADUÇÃO DE CONCEITOS:
  - `@radix-ui/react-tabs`: Substituído por uma implementação customizada usando a Context API do React para gerenciar o estado.
  - `Tabs`: Componente principal que provê o contexto com a aba ativa.
  - `TabsList`: Um `<View>` que agrupa os botões das abas.
  - `TabsTrigger`: Um `<TouchableOpacity>` que, ao ser pressionado, atualiza a aba ativa no contexto.
  - `TabsContent`: Um `<View>` que só renderiza seu conteúdo se a sua `value` for igual à aba ativa no contexto.
*/

// 1. Criar o Contexto para as Abas
const TabsContext = createContext({
  activeTab: "",
  setActiveTab: () => {},
});

// --- Componente Principal ---
// Ele vai gerenciar qual aba está ativa.
export function Tabs({ defaultValue, children }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <View>{children}</View>
    </TabsContext.Provider>
  );
}

// --- Lista de Abas (Container) ---
export function TabsList({ children }) {
  return <View style={styles.tabsList}>{children}</View>;
}

// --- Botão de Aba (Trigger) ---
// Este é o botão que o usuário pressiona.
export function TabsTrigger({ value, children }) {
  const { activeTab, setActiveTab } = useContext(TabsContext);
  const isActive = activeTab === value;

  return (
    <TouchableOpacity
      style={[styles.tabsTrigger, isActive && styles.activeTabsTrigger]}
      onPress={() => setActiveTab(value)}
    >
      <Text
        style={[
          styles.tabsTriggerText,
          isActive && styles.activeTabsTriggerText,
        ]}
      >
        {children}
      </Text>
    </TouchableOpacity>
  );
}

// --- Conteúdo da Aba ---
// Este conteúdo só aparece se a aba correspondente estiver ativa.
export function TabsContent({ value, children }) {
  const { activeTab } = useContext(TabsContext);
  if (activeTab !== value) {
    return null;
  }
  return <View style={styles.tabsContent}>{children}</View>;
}

// --- Estilos ---
const styles = StyleSheet.create({
  tabsList: {
    flexDirection: "row",
    height: 40,
    borderRadius: 8,
    backgroundColor: "#E5E7EB", // bg-muted
    padding: 4, // p-1
  },
  tabsTrigger: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6, // rounded-sm
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  activeTabsTrigger: {
    backgroundColor: "#FFFFFF", // data-[state=active]:bg-background
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    // Sombra para Android
    elevation: 2,
  },
  tabsTriggerText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6B7280", // text-muted-foreground
  },
  activeTabsTriggerText: {
    color: "#111827", // data-[state=active]:text-foreground
  },
  tabsContent: {
    marginTop: 8, // mt-2
  },
});
