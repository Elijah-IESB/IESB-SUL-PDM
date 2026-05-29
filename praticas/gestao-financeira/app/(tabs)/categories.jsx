import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { MoneyContext } from "../../contexts/GlobalState";
import Button from "../../components/Button";
import CategoryItem from "../../components/CategoryItem";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../constants/colors";

const PRESET_COLORS = [
  "#DE9AC3",
  "#DEA17B",
  "#E6E088",
  "#AB8FBE",
  "#82C9DE",
  "#FFB6B6",
  "#9ED9A9",
  "#F5C26B",
  "#7DD3FC",
  "#A7F3D0",
];

const PRESET_ICONS = [
  "label",
  "restaurant",
  "local-grocery-store",
  "home",
  "school",
  "directions-car",
  "health-and-safety",
  "flight",
  "shopping-bag",
  "paid",
  "savings",
  "credit-card",
  "account-balance-wallet",
  "emoji-events",
];

function normalize(value) {
  return value.trim().toLowerCase();
}

export default function CategoriesScreen() {
  const { categories, loading, addCategory, updateCategory, removeCategory } =
    useContext(MoneyContext);

  const [editingId, setEditingId] = useState(null);
  const [displayName, setDisplayName] = useState("");
  const [icon, setIcon] = useState("label");
  const [background, setBackground] = useState(PRESET_COLORS[0]);
  const [isIncome, setIsIncome] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(editingId);

  const resetForm = () => {
    setEditingId(null);
    setDisplayName("");
    setIcon("label");
    setBackground(PRESET_COLORS[0]);
    setIsIncome(false);
  };

  const validateDuplicate = () => {
    const nextName = normalize(displayName);
    return categories.some(
      (category) =>
        category.id !== editingId &&
        normalize(category.displayName) === nextName
    );
  };

  const handleSave = async () => {
    if (!displayName.trim() || displayName.trim().length < 2) {
      Alert.alert("Informe o nome da categoria.");
      return;
    }
    if (validateDuplicate()) {
      Alert.alert("Categoria duplicada", "Ja existe uma categoria com esse nome.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        displayName: displayName.trim(),
        icon,
        background,
        isIncome,
      };

      if (isEditing) {
        await updateCategory(editingId, payload);
        Alert.alert("Categoria atualizada!");
      } else {
        await addCategory(payload);
        Alert.alert("Categoria criada!");
      }

      resetForm();
    } catch (e) {
      Alert.alert("Erro ao salvar", e.message ?? "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (item) => {
    if (item.isDefault) {
      Alert.alert("Categoria padrao", "Categorias padrao nao podem ser alteradas.");
      return;
    }

    setEditingId(item.id);
    setDisplayName(item.displayName);
    setIcon(item.icon);
    setBackground(item.background);
    setIsIncome(Boolean(item.isIncome));
  };

  const handleDelete = (item) => {
    Alert.alert("Excluir categoria", `Deseja excluir "${item.displayName}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await removeCategory(item.id);
            if (editingId === item.id) resetForm();
          } catch (e) {
            Alert.alert("Erro ao excluir", e.message ?? "Tente novamente.");
          }
        },
      },
    ]);
  };

  if (loading && categories.length === 0) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={globalStyles.screenContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
        style={styles.keyboard}
      >
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            <View style={styles.formContainer}>
              <Text style={styles.sectionTitle}>
                {isEditing ? "Editar categoria" : "Nova categoria"}
              </Text>

              <View>
                <Text style={globalStyles.inputLabel}>Nome</Text>
                <TextInput
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="ex.: Saude"
                  style={globalStyles.input}
                />
              </View>

              <Text style={globalStyles.inputLabel}>Tipo</Text>
              <View style={styles.segment}>
                <TouchableOpacity
                  onPress={() => setIsIncome(false)}
                  style={[styles.segmentButton, !isIncome && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, !isIncome && styles.segmentTextActive]}>
                    Despesa
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setIsIncome(true)}
                  style={[styles.segmentButton, isIncome && styles.segmentActive]}
                >
                  <Text style={[styles.segmentText, isIncome && styles.segmentTextActive]}>
                    Receita
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={globalStyles.inputLabel}>Icone</Text>
              <View style={styles.iconGrid}>
                {PRESET_ICONS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setIcon(item)}
                    style={[styles.iconButton, icon === item && styles.iconSelected]}
                  >
                    <MaterialIcons
                      name={item}
                      size={24}
                      color={icon === item ? colors.primaryContrast : colors.primaryText}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={globalStyles.inputLabel}>Cor</Text>
              <View style={styles.colorRow}>
                {PRESET_COLORS.map((item) => (
                  <TouchableOpacity
                    key={item}
                    onPress={() => setBackground(item)}
                    style={[
                      styles.colorDot,
                      { backgroundColor: item },
                      background === item && styles.colorDotSelected,
                    ]}
                  />
                ))}
              </View>

              <Button onPress={handleSave} disabled={submitting}>
                {submitting
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar categoria"
                    : "Adicionar categoria"}
              </Button>

              {isEditing && (
                <TouchableOpacity onPress={resetForm} style={styles.cancelEdit}>
                  <Text style={styles.cancelEditText}>Cancelar edicao</Text>
                </TouchableOpacity>
              )}

              <View style={[globalStyles.line, { marginTop: 16 }]} />
              <Text style={styles.sectionTitle}>Categorias cadastradas</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.categoryRow}>
              <CategoryItem category={item} />
              <View style={styles.categoryInfo}>
                <Text style={globalStyles.primaryText}>{item.displayName}</Text>
                <Text style={globalStyles.secondaryText}>
                  {item.isDefault ? "padrao" : "personalizada"}
                  {item.isIncome ? " · receita" : " · despesa"}
                </Text>
              </View>

              {!item.isDefault && (
                <View style={styles.actions}>
                  <TouchableOpacity onPress={() => handleEdit(item)} hitSlop={8}>
                    <MaterialIcons name="edit" size={24} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                    <MaterialIcons
                      name="delete-outline"
                      size={24}
                      color={colors.negativeText}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 12,
  },
  formContainer: {
    gap: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.primaryText,
    marginTop: 4,
  },
  segment: {
    flexDirection: "row",
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.secondaryText,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  segmentActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    color: colors.primaryText,
    fontWeight: "700",
  },
  segmentTextActive: {
    color: colors.primaryContrast,
  },
  iconGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  iconSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  colorRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "transparent",
  },
  colorDotSelected: {
    borderColor: colors.primaryText,
  },
  cancelEdit: {
    alignItems: "center",
    paddingVertical: 8,
  },
  cancelEditText: {
    color: colors.negativeText,
    fontWeight: "700",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  categoryInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 14,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
