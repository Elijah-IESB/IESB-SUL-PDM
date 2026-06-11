import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useContext, useEffect } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "../constants/colors";
import { MoneyContext } from "../contexts/GlobalState";

export default function WelcomeScreen() {
  const { authReady, currentUser } = useContext(MoneyContext);

  useEffect(() => {
    if (authReady && currentUser) {
      router.replace("/(tabs)");
    }
  }, [authReady, currentUser]);

  if (!authReady || currentUser) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Gestão Financeira</Text>
        <Text style={styles.subtitle}>
          Organize receitas, despesas e categorias em um só lugar, com resumo mensal
          e exportação para Excel.
        </Text>
      </View>

      <View style={styles.featureList}>
        <View style={styles.feature}>
          <MaterialIcons name="shield" size={24} color={colors.primary} />
          <Text style={styles.featureText}>Seus dados separados por usuário</Text>
        </View>
        <View style={styles.feature}>
          <MaterialIcons name="pie-chart" size={24} color={colors.primary} />
          <Text style={styles.featureText}>Resumo claro do mês</Text>
        </View>
        <View style={styles.feature}>
          <MaterialIcons name="table-chart" size={24} color={colors.primary} />
          <Text style={styles.featureText}>Relatório em Excel quando precisar</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.button} onPress={() => router.push("/login")}>
        <Text style={styles.buttonText}>Acessar aplicativo</Text>
        <MaterialIcons name="arrow-forward" size={22} color={colors.primaryContrast} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 28,
    justifyContent: "space-between",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    paddingTop: 54,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 14,
    fontSize: 17,
    lineHeight: 25,
    color: colors.primaryText,
    textAlign: "center",
  },
  featureList: {
    gap: 14,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  featureText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  buttonText: {
    color: colors.primaryContrast,
    fontWeight: "900",
    fontSize: 18,
  },
});
