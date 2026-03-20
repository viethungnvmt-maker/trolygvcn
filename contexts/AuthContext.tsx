
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { ACCOUNTS } from '../data/accounts';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string, title: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // Check localStorage on mount to persist login session (optional, but good for UX)
  useEffect(() => {
      const storedUser = localStorage.getItem('app_user');
      if (storedUser) {
          try {
              setUser(JSON.parse(storedUser));
          } catch (e) {
              console.error("Failed to parse user", e);
          }
      }
  }, []);

  const login = (username: string, password: string, title: string): boolean => {
    // Find matching account
    const account = ACCOUNTS.find(
        acc => acc.username === username && acc.password === password
    );

    if (account) {
        const userData: User = {
            username: account.username,
            fullName: account.fullName,
            expiry: account.expiry,
            title: title
        };
        setUser(userData);
        localStorage.setItem('app_user', JSON.stringify(userData));
        return true;
    }

    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('app_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
