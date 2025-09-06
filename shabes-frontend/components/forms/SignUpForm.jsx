import React, { useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from "react-native";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Label } from "../ui/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/Card";
import LoadingSpinner from "../ui/LoadingSpinner";
import Icon from "../ui/Icon";

export default function SignUpForm({ onSubmit, isLoading, onBack }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    address: "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (formData.password !== formData.confirmPassword) {
      alert("As senhas não conferem!"); // Pode usar seu toast aqui
      return;
    }
    // Chama a função que veio da SignUpScreen
    onSubmit({
      email: formData.email,
      password: formData.password,
      metadata: {
        full_name: formData.name,
        phone: formData.phone,
        address: formData.address,
      }
    });
  };

  return (
    <Card style={{ width: "100%" }}>
      <CardHeader>
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Icon name="chevron-left" size={28} />
          </TouchableOpacity>
          <View>
            <CardTitle>Criar Conta</CardTitle>
            <CardDescription>Preencha seus dados para finalizar</CardDescription>
          </View>
        </View>
      </CardHeader>
      <CardContent>
        <View style={styles.formSection}>
          <Label>Nome Completo</Label>
          <Input value={formData.name} onChangeText={(v) => handleInputChange("name", v)} />
        </View>
        <View style={styles.formSection}>
          <Label>Email</Label>
          <Input value={formData.email} onChangeText={(v) => handleInputChange("email", v)} keyboardType="email-address" autoCapitalize="none" />
        </View>
        <View style={styles.formSection}>
          <Label>Telefone</Label>
          <Input value={formData.phone} onChangeText={(v) => handleInputChange("phone", v)} keyboardType="phone-pad" />
        </View>
        <View style={styles.formSection}>
          <Label>Senha</Label>
          <Input value={formData.password} onChangeText={(v) => handleInputChange("password", v)} secureTextEntry />
        </View>
        <View style={styles.formSection}>
          <Label>Confirmar Senha</Label>
          <Input value={formData.confirmPassword} onChangeText={(v) => handleInputChange("confirmPassword", v)} secureTextEntry />
        </View>
        <Button onPress={handleSubmit} disabled={isLoading} style={{ marginTop: 16 }}>
          {isLoading ? <LoadingSpinner size="small" color="#FFFFFF" /> : "Criar Conta"}
        </Button>
      </CardContent>
    </Card>
  );
}

const styles = StyleSheet.create({
  headerContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: { padding: 8 },
  formSection: { gap: 6, marginBottom: 12 },
});