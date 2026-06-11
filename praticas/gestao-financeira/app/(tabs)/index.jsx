import { useState, useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { MoneyContext } from "../../contexts/GlobalState";
import TransactionItem from "../../components/TransactionItem";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../constants/colors";

export default function Transactions() {
  const { currentUser, transactions, loading, error, refresh, removeTransaction } =
    useContext(MoneyContext);

  const { userName } = useLocalSearchParams();
  const nomeAutenticado = currentUser?.name ?? (userName ? String(userName) : "Usuario");
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? { text: "Bom dia", icon: "weather-sunny", color: "#F59E0B" }
      : hour < 18
        ? { text: "Boa tarde", icon: "weather-sunset", color: "#F97316" }
        : { text: "Boa noite", icon: "weather-night", color: "#6366F1" };

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const today = new Date();
  const [mes] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [ano] = useState(String(today.getFullYear()));

  const transacoesFiltradas = transactions.filter(
    (t) => t.date && t.date.startsWith(`${ano}-${mes}`)
  );

  const handleLongPress = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const handleExcluir = async () => {
    if (!selectedItem) return;

    try {
      await removeTransaction(selectedItem.id);
      setModalVisible(false);
      setSelectedItem(null);
    } catch (e) {
      Alert.alert("Erro ao excluir", e.message ?? "Tente novamente.");
    }
  };

  const handleEditar = () => {
    if (!selectedItem) return;

    setModalVisible(false);

    router.push({
      pathname: "/edit-transaction",
      params: { id: selectedItem.id },
    });
  };

  if (loading && transactions.length === 0) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={globalStyles.secondaryText}>Carregando transações...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <Text style={globalStyles.primaryText}>Não foi possível carregar.</Text>
        <Text style={globalStyles.secondaryText}>{error}</Text>

        <TouchableOpacity onPress={refresh} style={styles.retry}>
          <Text style={styles.retryText}>Tentar novamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={globalStyles.screenContainer}>
      <View style={styles.header}>
        <View style={styles.welcomeRow}>
          <MaterialCommunityIcons
            name={greeting.icon}
            size={26}
            color={greeting.color}
          />
          <Text style={styles.welcomeText}>
            {greeting.text}, {nomeAutenticado}!
          </Text>
        </View>
      </View>

      <View style={styles.filterContainer}>
        <Text style={globalStyles.primaryText}>Filtrando período:</Text>
        <Text style={styles.filterValue}>
          {mes}/{ano}
        </Text>
      </View>

      <FlatList
        data={transacoesFiltradas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onLongPress={() => handleLongPress(item)}
            activeOpacity={0.7}
          >
            <TransactionItem {...item} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Nenhuma transação encontrada para {mes}/{ano}.
          </Text>
        }
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refresh} />
        }
        contentContainerStyle={styles.listContent}
      />

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opções da Transação</Text>

            <Text style={styles.modalDescription}>
              {selectedItem?.description}
            </Text>

            <TouchableOpacity
              style={[styles.modalButton, styles.btnEdit]}
              onPress={handleEditar}
            >
              <Text style={styles.btnText}>✏️ Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.btnDelete]}
              onPress={handleExcluir}
            >
              <Text style={styles.btnText}>🗑️ Excluir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.btnCancel]}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.btnTextCancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 12,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
  },
  retry: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: colors.primaryContrast,
    fontWeight: "600",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: "#fff",
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
    flex: 1,
  },
  welcomeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#eee",
    marginBottom: 10,
  },
  filterValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: colors.primary,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 24,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  modalDescription: {
    marginBottom: 20,
    color: "#777",
  },
  modalButton: {
    width: "100%",
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
    alignItems: "center",
  },
  btnEdit: {
    backgroundColor: "#4F46E5",
  },
  btnDelete: {
    backgroundColor: "#EF4444",
  },
  btnCancel: {
    backgroundColor: "#E5E7EB",
    marginTop: 24,
  },
  btnText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  btnTextCancel: {
    color: "#374151",
    fontWeight: "bold",
    fontSize: 16,
  },
});
