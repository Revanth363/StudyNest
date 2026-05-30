import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { connectSocket, disconnectSocket } from "../socket/socket";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get("/auth/me");
        setUser(res.data.user);
        connectSocket(res.data.user._id);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, []);

  const login = (userData) => {
    setUser(userData);
    connectSocket(userData._id);
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {
    } finally {
      disconnectSocket();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);