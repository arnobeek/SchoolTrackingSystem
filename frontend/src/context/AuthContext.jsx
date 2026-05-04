import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('school_user');
    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch (error) {
      localStorage.removeItem('school_user');
      return null;
    }
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('school_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('school_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
