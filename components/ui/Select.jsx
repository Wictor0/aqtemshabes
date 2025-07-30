import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from "react-native";
// Usaremos um ícone de um pacote nativo ou criaremos um SVG simples
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
  TRADUÇÃO DE CONCEITOS:
  - `@radix-ui/react-select`: Totalmente substituído por uma implementação customizada usando `<Modal>` e `<FlatList>`.
  - `SelectTrigger`: É um `<TouchableOpacity>` que mostra o valor selecionado e abre o modal.
  - `SelectContent`: É o `<Modal>` que contém a lista de opções.
  - `SelectItem`: É um `<TouchableOpacity>` dentro da `FlatList` no modal.
*/

export function Select({
  options = [],
  selectedValue,
  onValueChange,
  placeholder = "Selecione uma opção...",
}) {
  const [modalVisible, setModalVisible] = useState(false);

  const selectedLabel = options.find(
    (option) => option.value === selectedValue
  )?.label;

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        onValueChange(item.value);
        setModalVisible(false);
      }}
    >
      <Text style={styles.itemText}>{item.label}</Text>
      {selectedValue === item.value && <Text style={styles.checkMark}>✓</Text>}
    </TouchableOpacity>
  );

  return (
    <View>
      {/* O Botão que abre o modal */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.triggerText}>{selectedLabel || placeholder}</Text>
        <ChevronDownIcon />
      </TouchableOpacity>

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
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
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
