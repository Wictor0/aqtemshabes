import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { supabase } from '../services/supabase';
import { toast } from "../hooks/use-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
