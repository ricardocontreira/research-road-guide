import { createContext, useContext, useState, ReactNode } from "react";
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Inicialização do cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY não configuradas!');
  console.error('Adicione-as no arquivo .env.local na raiz do projeto.');
}

// Criar cliente Supabase (mesmo se as chaves estiverem vazias, para evitar crashes)
export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

interface User {
  id: string;
  name: string;
  email: string;
}

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

  const login = async (email: string, password: string) => {
    // Mock authentication
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email && password.length >= 6) {
      setUser({
        id: "1",
        name: "Usuário Demo",
        email: email,
      });
    } else {
      throw new Error("E-mail ou senha incorretos");
    }
  };

  const register = async (name: string, email: string, password: string) => {
    // Mock registration
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setUser({
      id: "1",
      name: name,
      email: email,
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
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
