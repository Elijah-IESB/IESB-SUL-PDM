import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { colors } from "../constants/colors";

export default function LoginScreen() {
  const [nome, setNome] = useState("");
  const [senha, setSenha] = useState("");

  function handleLogin() {
    if (!nome.trim() || !senha.trim()) {
      Alert.alert("Erro", "Informe nome e senha.");
      return;
    }

    if (senha !== "123456") {
      Alert.alert("Erro", "Senha inválida.");
      return;
    }

   router.replace({
  pathname: "/(tabs)",
  params: { userName: nome },
});
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Gestão Financeira</Text>
      <Text style={styles.subtitle}>Faça login para acessar</Text>

      <TextInput
        style={styles.input}
        placeholder="Seu nome"
        value={nome}
        onChangeText={setNome}
      />

      <TextInput
        style={styles.input}
        placeholder="Senha"
        secureTextEntry
        value={senha}
        onChangeText={setSenha}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Entrar</Text>
      </TouchableOpacity>

      <Text style={styles.hint}>Senha de teste: 123456</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 32,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: colors.primary,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.text,
    textAlign: "center",
    marginBottom: 32,
  },
  input: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: colors.primaryContrast,
    fontSize: 18,
    fontWeight: "bold",
  },
  hint: {
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
});