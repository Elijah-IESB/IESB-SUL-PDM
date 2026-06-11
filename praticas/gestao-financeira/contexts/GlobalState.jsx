import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export const MoneyContext = createContext();
const SESSION_STORAGE_KEY = "@gestao-financeira:user";

export default function GlobalState({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [error, setError] = useState(null);

  const persistUser = useCallback(async (user) => {
    api.setCurrentUserId(user?.id ?? null);
    setCurrentUser(user);

    try {
      if (user) {
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch (e) {
      console.warn("Não foi possível persistir a sessão local.", e);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [cats, txs] = await Promise.all([
        api.listCategories(),
        api.listTransactions(),
      ]);

      setCategories(cats);
      setTransactions(txs);
    } catch (e) {
      setError(e.message ?? "Falha ao carregar dados do servidor");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    async function restoreSession() {
      try {
        const storedUser = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (storedUser) {
          const user = JSON.parse(storedUser);
          api.setCurrentUserId(user.id);
          setCurrentUser(user);
        }
      } catch {
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY);
        api.setCurrentUserId(null);
      } finally {
        setAuthReady(true);
      }
    }

    restoreSession();
  }, []);

  useEffect(() => {
    if (authReady && currentUser) {
      refresh();
    }
  }, [authReady, currentUser, refresh]);

  const register = useCallback(async (data) => {
    const result = await api.register(data);
    await persistUser(result.user);
    return result.user;
  }, [persistUser]);

  const login = useCallback(async (data) => {
    const result = await api.login(data);
    await persistUser(result.user);
    return result.user;
  }, [persistUser]);

  const logout = useCallback(async () => {
    await persistUser(null);
    setTransactions([]);
    setCategories([]);
  }, [persistUser]);

  const requestPasswordReset = useCallback(async (data) => {
    return api.requestPasswordReset(data);
  }, []);

  const resetPassword = useCallback(async (data) => {
    return api.resetPassword(data);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const result = await api.updateProfile(currentUser.id, data);
    await persistUser(result.user);
    return result.user;
  }, [currentUser, persistUser]);

  const deleteAccount = useCallback(async (password) => {
    await api.deleteAccount(currentUser.id, password);
    await persistUser(null);
    setTransactions([]);
    setCategories([]);
  }, [currentUser, persistUser]);

  const addTransaction = useCallback(async (data) => {
    const created = await api.createTransaction(data);
    setTransactions((prev) => [created, ...prev]);
    return created;
  }, []);

  const updateTransaction = useCallback(async (id, data) => {
    const updated = await api.updateTransaction(id, data);

    setTransactions((prev) =>
      prev.map((transaction) =>
        transaction.id === id ? updated : transaction
      )
    );

    return updated;
  }, []);

  const removeTransaction = useCallback(async (id) => {
    await api.deleteTransaction(id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addCategory = useCallback(async (data) => {
    const created = await api.createCategory(data);

    setCategories((prev) =>
      [...prev, created].sort((a, b) =>
        a.displayName.localeCompare(b.displayName)
      )
    );

    return created;
  }, []);

  const updateCategory = useCallback(async (id, data) => {
    const updated = await api.updateCategory(id, data);

    setCategories((prev) =>
      prev.map((category) => (category.id === id ? updated : category))
    );

    return updated;
  }, []);

  const removeCategory = useCallback(async (id) => {
    await api.deleteCategory(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return (
    <MoneyContext.Provider
      value={{
        currentUser,
        authReady,
        register,
        login,
        logout,
        requestPasswordReset,
        resetPassword,
        updateProfile,
        deleteAccount,
        transactions,
        categories,
        loading,
        error,
        refresh,
        addTransaction,
        updateTransaction,
        removeTransaction,
        addCategory,
        updateCategory,
        removeCategory,
      }}
    >
      {children}
    </MoneyContext.Provider>
  );
}
