import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { api } from "@/services/api";
import type {
  AuthUser,
  AuthRole,
  AuthResponse,
  ApiResponse,
} from "@diary/shared";

interface AuthState {
  user: AuthUser | null;
  roles: AuthRole[];
  permissions: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  hasPermission: (name: string) => boolean;
  hasAnyPermission: (names: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    roles: [],
    permissions: [],
    isAuthenticated: false,
    isLoading: true,
  });

  const setAuth = (data: AuthResponse) => {
    setState({
      user: data.user,
      roles: data.roles,
      permissions: data.permissions,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const clearAuth = () => {
    setState({
      user: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshAuth = useCallback(async () => {
    try {
      const res = await api.get<ApiResponse<AuthResponse>>("/auth/me");
      if (res.success && res.data) {
        setAuth(res.data);
      } else {
        clearAuth();
      }
    } catch {
      clearAuth();
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    const res = await api.post<ApiResponse<AuthResponse>>("/auth/login", {
      email,
      password,
    });
    if (res.success && res.data) {
      setAuth(res.data);
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
  ) => {
    const res = await api.post<ApiResponse<AuthResponse>>("/auth/register", {
      name,
      email,
      password,
    });
    if (res.success && res.data) {
      setAuth(res.data);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuth();
    }
  };

  const hasPermission = (name: string) => state.permissions.includes(name);
  const hasAnyPermission = (names: string[]) =>
    names.some((n) => state.permissions.includes(n));

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshAuth,
        hasPermission,
        hasAnyPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
