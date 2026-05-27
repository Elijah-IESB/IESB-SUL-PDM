import { View, Text, StyleSheet } from "react-native";

export default function HomeScreen({ route }: any) {
  const { userName } = route.params || { userName: "Usuário" };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Bem-vindo, {userName} 👋
      </Text>

      <Text style={styles.subtitle}>
        Gestão Financeira App
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },

  title: {
    fontSize: 22,
    fontWeight: "bold",
  },

  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
});