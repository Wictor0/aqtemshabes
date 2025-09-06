<<<<<<< HEAD
import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { supabase } from '../services/supabase';
import { toast } from "../hooks/use-toast";
=======
import React, { createContext, useState, useEffect, useContext } from "react";
import * as SecureStore from "expo-secure-store";
import { toast } from "../hooks/use-toast";
// Importe as funções de API
import { login, getCsrfToken, getSession } from '../services/api';
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
<<<<<<< HEAD
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        // Não é mais necessário setar isLoading aqui, pois o listener só roda após o carregamento inicial
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ type: "error", title: "Credenciais Inválidas", description: "O email ou a senha estão incorretos." });
      return false;
    }
    toast({ type: "success", title: "Login realizado!", description: "Bem-vindo de volta!" });
    return true;
  };

  const signUp = async (email, password, metadata) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: metadata },
    });
    if (error) {
      toast({ type: "error", title: "Erro no cadastro", description: error.message });
      return false;
    }
    toast({ type: "success", title: "Cadastro realizado!", description: "Verifique seu e-mail para confirmar a conta." });
    return true;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      session,
      user: session?.user,
      isAuthenticated: !!session,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, isLoading] 
  );
=======
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // A função signIn foi refeita para lidar com a resposta de redirecionamento
  const signIn = async (email, password) => {
    try {
      const csrfToken = await getCsrfToken();
      if (!csrfToken) {
        throw new Error("Não foi possível obter o token de segurança.");
      }

      const loginResponse = await login(email.toLowerCase(), password, csrfToken);

      // Se a resposta for um redirecionamento (status 302), verificamos para onde ele ia.
      // Se o URL de redirecionamento contiver 'error', o login falhou.
      if (loginResponse.status === 302 && loginResponse.headers.location.includes('error')) {
        throw new Error("Credenciais inválidas");
      }
      
      // Se não houve erro, o login foi bem-sucedido e podemos obter a sessão.
      const sessionResponse = await getSession();
      
      if (sessionResponse.data?.user) {
        const loggedInUser = sessionResponse.data.user;
        
        await SecureStore.setItemAsync('userData', JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        
        toast({ type: "success", title: "Login realizado!", description: "Bem-vindo de volta!" });
        return true;
      } else {
        throw new Error("Credenciais inválidas (sessão vazia após o login)");
      }

    } catch (error) {
      console.error("Erro no login:", error);
      toast({ type: "error", title: "Credenciais Inválidas", description: "O email ou a senha estão incorretos." });
      return false;
    }
  };

  const signOut = async () => {
    // Numa aplicação real, também faríamos uma chamada à API para /auth/signout
    await SecureStore.deleteItemAsync("userData");
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    signIn,
    signOut,
  };
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
<<<<<<< HEAD
}
=======
}
>>>>>>> b760fc628068401f7d3cb8a9a355be2b6e855bab
