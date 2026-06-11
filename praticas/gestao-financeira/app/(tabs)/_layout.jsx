import { Tabs, router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useContext, useEffect } from "react";
import { Alert, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../constants/colors";
import { MoneyContext } from "../../contexts/GlobalState";

export default function TabsLayout() {
  const { authReady, currentUser, logout } = useContext(MoneyContext);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (authReady && !currentUser) {
      router.replace("/login");
    }
  }, [authReady, currentUser]);

  if (!authReady || !currentUser) return null;

  function handleLogout() {
    Alert.alert("Sair", "Deseja voltar para a tela de login?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  }

  return (
    <Tabs
      screenOptions={{
        tabBarHideOnKeyboard: true,
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.primaryContrast,
        headerTitleAlign: "center",
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          height: 64 + insets.bottom,
          paddingTop: 5,
          paddingBottom: Math.max(insets.bottom, 8),
          backgroundColor: colors.background,
        },
        headerRight: () => (
          <TouchableOpacity
            onPress={handleLogout}
            hitSlop={8}
            style={styles.logoutButton}
          >
            <MaterialIcons name="logout" size={24} color={colors.primaryContrast} />
          </TouchableOpacity>
        ),
        tabBarButton: (props) => (
          <TouchableOpacity {...props} activeOpacity={0.8} />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Transações",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="attach-money" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: "Categorias",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="category" size={26} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add-transactions"
        options={{
          title: "Adicionar Transação",
          tabBarLabel: "",
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <MaterialIcons
                name="add"
                size={40}
                color={colors.primaryContrast}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="summary"
        options={{
          title: "Resumo",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="pie-chart" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-data"
        options={{
          title: "Meus dados",
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="person" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  addButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: 64,
    width: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
  },
  logoutButton: {
    paddingHorizontal: 16,
  },
});
