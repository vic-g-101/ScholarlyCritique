import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axiosInstance from "../utils/axiosinstance";
import { API_PATHS } from "../utils/apiPaths";

export const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

const UserProvider = ({ children }) => {
  // hydrate from localStorage
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  // If we have a token but no user, fetch the current user once
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (token && !user) {
        try {
          const { data } = await axiosInstance.get(API_PATHS.AUTH.GET_USER_INFO);
          if (!cancelled && data) {
            setUser(data);
            localStorage.setItem("user", JSON.stringify(data));
          }
        } catch {
          // token invalid → logout
          logout();
        }
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // intentionally not depending on `user`

  // Keep tabs/windows in sync
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token") setToken(e.newValue);
      if (e.key === "user") setUser(e.newValue ? JSON.parse(e.newValue) : null);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const login = useCallback((nextUser, nextToken) => {
    setUser(nextUser || null);
    setToken(nextToken || null);
    if (nextUser) localStorage.setItem("user", JSON.stringify(nextUser));
    if (nextToken) localStorage.setItem("token", nextToken);
  }, []);


  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  // Update user (accepts whole user or partial patch)
  const updateUser = useCallback((patchOrUser) => {
    setUser((prev) => {
      const next =
        typeof patchOrUser === "function"
          ? patchOrUser(prev)
          : (prev && patchOrUser && !patchOrUser._id
              ? { ...prev, ...patchOrUser }
              : patchOrUser);
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ user, token, isAuthenticated, login, logout, updateUser }),
    [user, token, isAuthenticated, loading, login, logout, updateUser]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;