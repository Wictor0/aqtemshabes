import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
  TouchableWithoutFeedback,
} from "react-native";

// Ícone simples ▼
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

export function Select({
  options = [],
  selectedValue,
  onValueChange,
  placeholder = "Selecione uma opção...",
}) {
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

  const selectedLabel = options.find(
    (option) => option.value === selectedValue
  )?.label;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onValueChange(item.value);
        close();
      }}
    >
      <Text style={styles.itemText}>{item.label}</Text>
      {selectedValue === item.value && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View>
      {/* Botão que abre o modal */}
      <TouchableOpacity style={styles.trigger} onPress={open}>
        <Text style={styles.triggerText}>{selectedLabel || placeholder}</Text>
        <ChevronDownIcon />
      </TouchableOpacity>

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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 60,
    marginBottom: -40,
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
