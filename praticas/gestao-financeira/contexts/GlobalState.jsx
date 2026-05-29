import { createContext, useCallback, useEffect, useState } from "react";
import { api } from "../services/api";

export const MoneyContext = createContext();

export default function GlobalState({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    if (currentUser) {
      refresh();
    }
  }, [currentUser, refresh]);

  const register = useCallback(async (data) => {
    const result = await api.register(data);
    api.setCurrentUserId(result.user.id);
    setCurrentUser(result.user);
    await refresh();
    return result.user;
  }, [refresh]);

  const login = useCallback(async (data) => {
    const result = await api.login(data);
    api.setCurrentUserId(result.user.id);
    setCurrentUser(result.user);
    await refresh();
    return result.user;
  }, [refresh]);

  const logout = useCallback(() => {
    api.setCurrentUserId(null);
    setCurrentUser(null);
    setTransactions([]);
    setCategories([]);
  }, []);

  const requestPasswordReset = useCallback(async (data) => {
    return api.requestPasswordReset(data);
  }, []);

  const resetPassword = useCallback(async (data) => {
    return api.resetPassword(data);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const result = await api.updateProfile(currentUser.id, data);
    setCurrentUser(result.user);
    return result.user;
  }, [currentUser]);

  const deleteAccount = useCallback(async (password) => {
    await api.deleteAccount(currentUser.id, password);
    api.setCurrentUserId(null);
    setCurrentUser(null);
    setTransactions([]);
    setCategories([]);
  }, [currentUser]);

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
