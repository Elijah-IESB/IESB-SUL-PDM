import { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { colors } from "../constants/colors";
import { MoneyContext } from "../contexts/GlobalState";

const MODE = {
  LOGIN: "login",
  REGISTER: "register",
  REQUEST_RESET: "requestReset",
  CONFIRM_RESET: "confirmReset",
};

function passwordRulesText() {
  return "Mínimo 8 caracteres, com maiúscula, minúscula, número e especial.";
}

export default function LoginScreen() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [senha, setSenha] = useState("");
  const [mode, setMode] = useState(MODE.LOGIN);
  const [loading, setLoading] = useState(false);
  const { register, login, requestPasswordReset, resetPassword } =
    useContext(MoneyContext);

  const isCadastro = mode === MODE.REGISTER;
  const isSolicitarToken = mode === MODE.REQUEST_RESET;
  const isConfirmarToken = mode === MODE.CONFIRM_RESET;

  async function handleSubmit() {
    if (isCadastro && nome.trim().length < 2) {
      Alert.alert("Erro", "Informe seu nome.");
      return;
    }
    if (!email.trim()) {
      Alert.alert("Erro", "Informe seu e-mail.");
      return;
    }
    if (!isSolicitarToken && !senha.trim()) {
      Alert.alert("Erro", "Informe a senha.");
      return;
    }
    if (isConfirmarToken && token.trim().length !== 6) {
      Alert.alert("Erro", "Informe o token de 6 digitos.");
      return;
    }

    setLoading(true);

    try {
      if (isSolicitarToken) {
        const result = await requestPasswordReset({ email: email.trim() });
        Alert.alert(
          "Token enviado",
          result.devToken
            ? `Use este token para testar: ${result.devToken}`
            : "Confira seu e-mail e informe o token recebido."
        );
        setMode(MODE.CONFIRM_RESET);
        return;
      }

      if (isConfirmarToken) {
        await resetPassword({
          email: email.trim(),
          token: token.trim(),
          newPassword: senha,
        });
        Alert.alert("Senha atualizada", "Agora você já pode entrar com a nova senha.");
        setMode(MODE.LOGIN);
        setToken("");
        setSenha("");
        return;
      }

      const user = isCadastro
        ? await register({
            name: nome.trim(),
            email: email.trim(),
            password: senha,
          })
        : await login({
            email: email.trim(),
            password: senha,
          });

      router.replace({
        pathname: "/(tabs)",
        params: { userName: user.name },
      });
    } catch (e) {
      Alert.alert(
        isCadastro
          ? "Erro ao cadastrar"
          : isSolicitarToken || isConfirmarToken
            ? "Erro ao recuperar"
            : "Erro ao entrar",
        e.message ?? "Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function title() {
    if (isCadastro) return "Crie sua conta para começar";
    if (isSolicitarToken) return "Informe seu e-mail";
    if (isConfirmarToken) return "Digite o token recebido";
    return "Entre para acessar";
  }

  function resetToLogin() {
    setMode(MODE.LOGIN);
    setToken("");
    setSenha("");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.container}
        >
          <Text style={styles.title}>Gestão Financeira</Text>
          <Text style={styles.subtitle}>{title()}</Text>

          {isCadastro && (
            <TextInput
              style={styles.input}
              placeholder="Seu nome"
              autoCapitalize="words"
              value={nome}
              onChangeText={setNome}
            />
          )}

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          {isConfirmarToken && (
            <TextInput
              style={styles.input}
              placeholder="Token de 6 dígitos"
              value={token}
              onChangeText={(value) => setToken(value.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
            />
          )}

          {!isSolicitarToken && (
            <TextInput
              style={styles.input}
              placeholder={isConfirmarToken ? "Nova senha" : "Senha"}
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
            />
          )}

          {(isCadastro || isConfirmarToken) && (
            <Text style={styles.passwordHint}>{passwordRulesText()}</Text>
          )}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryContrast} />
            ) : (
              <Text style={styles.buttonText}>
                {isCadastro
                  ? "Criar conta"
                  : isSolicitarToken
                    ? "Enviar token"
                    : isConfirmarToken
                      ? "Atualizar senha"
                      : "Entrar"}
              </Text>
            )}
          </TouchableOpacity>

          {!isSolicitarToken && !isConfirmarToken && (
            <TouchableOpacity onPress={() => setMode(MODE.REQUEST_RESET)}>
              <Text style={styles.forgotLink}>Esqueci minha senha</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => {
              if (isCadastro || isSolicitarToken || isConfirmarToken) {
                resetToLogin();
              } else {
                setMode(MODE.REGISTER);
                setSenha("");
              }
            }}
          >
            <Text style={styles.switchLink}>
              {isCadastro || isSolicitarToken || isConfirmarToken
                ? "Já tenho conta. Entrar"
                : "Ainda não tenho conta. Cadastrar"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboard: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 32,
    paddingBottom: 48,
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
    color: colors.primaryText,
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
  passwordHint: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: -8,
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.primaryContrast,
    fontSize: 18,
    fontWeight: "bold",
  },
  forgotLink: {
    color: colors.primary,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 18,
  },
  switchLink: {
    color: colors.primaryText,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 16,
  },
});
