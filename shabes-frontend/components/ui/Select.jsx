<<<<<<< HEAD
import React, { useState, useRef, useEffect } from "react";
=======
import React, { useState } from "react";
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
<<<<<<< HEAD
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from "react-native";

// Ícone simples ▼
=======
} from "react-native";
// Usaremos um ícone de um pacote nativo ou criaremos um SVG simples
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
const ChevronDownIcon = () => (
  <View
    style={{
      width: 20,
      height: 20,
      justifyContent: "center",
      alignItems: "center",
    }}
  >
    <View
      style={{
        width: 8,
        height: 8,
        borderBottomWidth: 2,
        borderRightWidth: 2,
        borderColor: "#6B7280",
        transform: [{ rotate: "45deg" }],
      }}
    />
  </View>
);

/*
<<<<<<< HEAD
  Implementação:
  - Backdrop com fade (Animated.opacity)
  - Sheet com slide de baixo pra cima (Animated.translateY)
  - Toque no fundo escuro fecha o modal
=======
  TRADUÇÃO DE CONCEITOS:
  - `@radix-ui/react-select`: Totalmente substituído por uma implementação customizada usando `<Modal>` e `<FlatList>`.
  - `SelectTrigger`: É um `<TouchableOpacity>` que mostra o valor selecionado e abre o modal.
  - `SelectContent`: É o `<Modal>` que contém a lista de opções.
  - `SelectItem`: É um `<TouchableOpacity>` dentro da `FlatList` no modal.
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
*/

export function Select({
  options = [],
  selectedValue,
  onValueChange,
  placeholder = "Selecione uma opção...",
}) {
<<<<<<< HEAD
  // Mantém o Modal montado durante a animação de saída
  const [portalVisible, setPortalVisible] = useState(false);

  // Animações
  const backdropOpacity = useRef(new Animated.Value(0)).current; // 0 -> 1
  const sheetTranslateY = useRef(new Animated.Value(300)).current; // 300 -> 0

  const open = () => {
    setPortalVisible(true);
    // Reseta e anima entrada
    backdropOpacity.setValue(0);
    sheetTranslateY.setValue(300);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(sheetTranslateY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const close = () => {
    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(sheetTranslateY, {
        toValue: 300,
        duration: 260,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setPortalVisible(false);
    });
  };
=======
  const [modalVisible, setModalVisible] = useState(false);
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab

  const selectedLabel = options.find(
    (option) => option.value === selectedValue
  )?.label;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onValueChange(item.value);
<<<<<<< HEAD
        close();
=======
        setModalVisible(false);
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
      }}
    >
      <Text style={styles.itemText}>{item.label}</Text>
      {selectedValue === item.value && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View>
<<<<<<< HEAD
      {/* Botão que abre o modal */}
      <TouchableOpacity style={styles.trigger} onPress={open}>
=======
      {/* O Botão que abre o modal */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
      >
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
        <Text style={styles.triggerText}>{selectedLabel || placeholder}</Text>
        <ChevronDownIcon />
      </TouchableOpacity>

<<<<<<< HEAD
      {/* Modal sem animação nativa: controlamos com Animated */}
      <Modal
        animationType="none"
        transparent
        visible={portalVisible}
        onRequestClose={close}
      >
        {/* Backdrop com fade e clique para fechar */}
        <TouchableWithoutFeedback onPress={close}>
          <Animated.View
            style={[styles.backdrop, { opacity: backdropOpacity }]}
          />
        </TouchableWithoutFeedback>

        {/* Sheet com slide */}
        <SafeAreaView style={styles.modalContainer} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.modalContent,
              { transform: [{ translateY: sheetTranslateY }] },
            ]}
          >
            <Text style={styles.modalTitle}>Selecione uma opção</Text>

            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item, index) =>
                (item?.value ?? index).toString()
              }
              keyboardShouldPersistTaps="handled"
            />

            <TouchableOpacity style={styles.closeButton} onPress={close}>
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </Animated.View>
=======
      {/* O Modal com a lista de opções */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione uma opção</Text>
            <FlatList
              data={options}
              renderItem={renderItem}
              keyExtractor={(item) => item.value.toString()}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Fechar</Text>
            </TouchableOpacity>
          </View>
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 44,
    width: "100%",
    paddingHorizontal: 15,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
  },
  triggerText: {
    fontSize: 16,
    color: "#1F2937",
  },
<<<<<<< HEAD

  // Backdrop separado do conteúdo (não "anda" com o slide)
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  // Container encosta no rodapé pra virar "bottom sheet"
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },

  // O que desliza é só o conteúdo
=======
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
  modalContent: {
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
<<<<<<< HEAD
    paddingBottom: 60,
    marginBottom: -40,
=======
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  itemText: {
    fontSize: 18,
  },
  checkMark: {
    fontSize: 18,
    color: "#007AFF",
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    borderRadius: 8,
    padding: 15,
    alignItems: "center",
  },
  closeButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
