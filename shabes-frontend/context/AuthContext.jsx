import React, { createContext, useState, useEffect, useContext, useMemo } from "react";
import { supabase } from '../services/supabase';
import { toast } from "../hooks/use-toast";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null); // Novo estado para o usuário completo (Auth + Profile)
  const [isLoading, setIsLoading] = useState(true);

  // Função auxiliar para buscar dados da tabela 'profiles' e mesclar com o usuário da Auth
  const fetchProfileAndSetUser = async (authUser) => {
    if (!authUser) {
      setUser(null);
      return;
    }

    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error) {
        console.warn("⚠️ Perfil não encontrado ou erro ao buscar:", error.message);
        // Fallback: Se não achar perfil, usa dados básicos e define role como 'user'
        setUser({ ...authUser, role: 'user' });
      } else {
        console.log("✅ Perfil carregado com Role:", profile.role);
        // SUCESSO: Mescla os dados da sessão (email, id) com os do banco (role, avatar, nome)
        setUser({ ...authUser, ...profile });
      }
    } catch (err) {
      console.error("Erro inesperado ao buscar perfil:", err);
      setUser({ ...authUser, role: 'user' });
    }
  };

  useEffect(() => {
    // Função para verificar e validar a sessão na inicialização da aplicação.
    const validateSession = async () => {
      try {
        // 1. Tenta atualizar a sessão guardada no dispositivo.
        const { data, error } = await supabase.auth.refreshSession();

        if (error || !data.session) {
          // 2. Se falhar, limpa tudo.
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } else {
          // 3. Se a atualização for bem-sucedida, define a sessão...
          setSession(data.session);
          // ...E busca os dados do perfil (role) imediatamente
          await fetchProfileAndSetUser(data.session.user);
        }
      } catch (error) {
        console.error("Erro na validação de sessão:", error);
      } finally {
        // 4. Termina o carregamento
        setIsLoading(false);
      }
    };

    validateSession();

    // Listener para mudanças em tempo real (Login/Logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);

        if (event === 'SIGNED_IN' && session?.user) {
          // Ao logar, busca o perfil para garantir que temos o 'role'
          await fetchProfileAndSetUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
           // Opcional: Atualizar perfil no refresh se necessário, mas geralmente não precisa
           // await fetchProfileAndSetUser(session.user);
        }
      }
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      toast({ type: "error", title: "Credenciais Inválidas", description: "O email ou a senha estão incorretos." });
      return false;
    }
    // O fetchProfileAndSetUser será chamado automaticamente pelo onAuthStateChange ('SIGNED_IN')
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
    setSession(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      session,
      user, // Agora enviamos o objeto 'user' enriquecido com o 'role' do banco
      isAuthenticated: !!session?.user,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, user, isLoading]
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