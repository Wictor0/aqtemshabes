import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import { toast } from "../hooks/use-toast";

// 1. Cria o contexto que será partilhado
const AuthContext = createContext(null);

// 2. Cria o Provedor que irá conter a lógica
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Efeito para carregar os dados do utilizador do armazenamento seguro ao iniciar a app
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedUser = await SecureStore.getItemAsync("userData");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Falha ao carregar dados de autenticação", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadStorageData();
  }, []);

  const signIn = async (email, password) => {
    // Esta função será substituída por uma chamada de API real
    try {
      // Simulação de validação
      if (email.toLowerCase() === "teste@teste.com" && password === "123456") {
        const mockUser = {
          id: "1",
          name: "Utilizador Teste",
          email: "teste@teste.com",
        };

        await SecureStore.setItemAsync("userData", JSON.stringify(mockUser));
        setUser(mockUser);

        toast({
          type: "success",
          title: "Login realizado!",
          description: "Bem-vindo de volta!",
        });
        return true;
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (error) {
      toast({
        type: "error",
        title: "Credenciais Inválidas",
        description: "O email ou a senha estão incorretos.",
      });
      return false;
    }
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync("userData");
    setUser(null);
  };

  // O valor que será partilhado com todos os componentes dentro deste provedor
  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 3. Cria um hook customizado para facilitar o uso do contexto
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
