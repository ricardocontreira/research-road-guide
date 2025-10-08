import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  email: string;
  name?: string;
}

// Função auxiliar para mensagens de erro amigáveis
const getErrorMessage = (error: any): string => {
  const message = error?.message || '';
  
  if (message.includes('Invalid login credentials')) {
    return 'E-mail ou senha incorretos';
  }
  if (message.includes('Email not confirmed')) {
    return 'Por favor, confirme seu e-mail antes de fazer login';
  }
  if (message.includes('User already registered')) {
    return 'Este e-mail já está cadastrado';
  }
  if (message.includes('Password should be at least')) {
    return 'A senha deve ter pelo menos 6 caracteres';
  }
  return message || 'Ocorreu um erro. Tente novamente.';
};

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      if (data.session && data.user) {
        setSession(data.session);
        
        // Buscar nome do perfil
        const { data: profileData } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', data.user.id)
          .maybeSingle();

        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name: profileData?.name || 'Usuário',
        });
      }
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const redirectUrl = `${window.location.origin}/dashboard`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name,
          }
        }
      });

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      if (data.user && data.session) {
        setSession(data.session);
        setUser({
          id: data.user.id,
          email: data.user.email || email,
          name: name,
        });
      }
    } catch (error: any) {
      throw new Error(getErrorMessage(error));
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setSession(null);
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      setSession(null);
      setUser(null);
    }
  };

  useEffect(() => {
    // 1️⃣ Configurar listener PRIMEIRO
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth event:', event);
        
        setSession(session);
        
        if (session?.user) {
          // Usar setTimeout(0) para evitar deadlock
          setTimeout(async () => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', session.user.id)
              .maybeSingle();

            setUser({
              id: session.user.id,
              email: session.user.email || '',
              name: profileData?.name || 'Usuário',
            });
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // 2️⃣ Verificar sessão existente DEPOIS
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        setTimeout(async () => {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', session.user.id)
            .maybeSingle();

          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profileData?.name || 'Usuário',
          });
          setLoading(false);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    // 3️⃣ Cleanup
    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!session,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
