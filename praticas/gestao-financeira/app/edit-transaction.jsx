import { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Picker } from "@react-native-picker/picker";

import { MoneyContext } from "../contexts/GlobalState";
import { globalStyles } from "../styles/globalStyles";
import { colors } from "../constants/colors";

export default function EditTransaction() {
  const { id } = useLocalSearchParams();
  const transactionId = Array.isArray(id) ? id[0] : id;

  const { transactions, categories, updateTransaction } =
    useContext(MoneyContext);

  const transaction = useMemo(
    () => transactions.find((t) => t.id === transactionId),
    [transactions, transactionId]
  );

  const [description, setDescription] = useState(
    transaction?.description ?? ""
  );

  const [value, setValue] = useState(
    String(transaction?.value ?? "")
  );

  const [categoryId, setCategoryId] = useState(
    transaction?.categoryId ?? categories[0]?.id
  );

  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description ?? "");
      setValue(String(transaction.value ?? ""));
      setCategoryId(transaction.categoryId ?? categories[0]?.id ?? "");
    }
  }, [transaction, categories]);

  useEffect(() => {
    if (!categoryId && categories[0]?.id) {
      setCategoryId(categories[0].id);
    }
  }, [categoryId, categories]);

  async function handleSave() {
    if (!transaction) {
      Alert.alert("Erro", "Transação não encontrada.");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Erro", "Informe a descrição.");
      return;
    }

    const numericValue = Number(String(value).replace(",", "."));
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      Alert.alert("Erro", "Informe um valor maior que zero.");
      return;
    }

    if (!categoryId) {
      Alert.alert("Erro", "Selecione uma categoria.");
      return;
    }

    try {
      await updateTransaction(transactionId, {
        description: description.trim(),
        value: numericValue,
        categoryId,
        date: transaction.date,
      });

      Alert.alert("Sucesso", "Transação atualizada!");
      router.back();
    } catch (e) {
      Alert.alert("Erro", e.message);
    }
  }

  if (!transaction) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <Text style={globalStyles.primaryText}>Transação não encontrada.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={globalStyles.screenContainer}>
      <View style={styles.content}>
        <Text style={styles.title}>Editar transação</Text>

        <Text style={globalStyles.inputLabel}>Descrição</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          style={globalStyles.input}
        />

        <Text style={globalStyles.inputLabel}>Valor</Text>
        <TextInput
          value={value}
          onChangeText={setValue}
          keyboardType="numeric"
          style={globalStyles.input}
        />

        <Text style={globalStyles.inputLabel}>Categoria</Text>

        <View style={styles.pickerWrapper}>
          <Picker
            selectedValue={categoryId}
            onValueChange={setCategoryId}
          >
            {categories.map((cat) => (
              <Picker.Item
                key={cat.id}
                label={cat.displayName}
                value={cat.id}
              />
            ))}
          </Picker>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleSave}>
          <Text style={styles.buttonText}>Salvar alterações</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 20,
  },
  pickerWrapper: {
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  buttonText: {
    color: colors.primaryContrast,
    fontSize: 16,
    fontWeight: "bold",
  },
});
