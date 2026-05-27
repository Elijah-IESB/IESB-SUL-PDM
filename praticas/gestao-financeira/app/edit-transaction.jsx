import { useContext, useMemo, useState } from "react";
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

  const { transactions, categories, updateTransaction } =
    useContext(MoneyContext);

  const transaction = useMemo(
    () => transactions.find((t) => t.id === id),
    [transactions, id]
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

  async function handleSave() {
    try {
      await updateTransaction(id, {
        description,
        value: Number(value),
        categoryId,
        date: transaction.date,
      });

      Alert.alert("Sucesso", "Transação atualizada!");
      router.back();
    } catch (e) {
      Alert.alert("Erro", e.message);
    }
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