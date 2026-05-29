import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { MoneyContext } from "../../contexts/GlobalState";
import SummaryItem from "../../components/SummaryItem";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../constants/colors";
import { api } from "../../services/api";

const screenWidth = Dimensions.get("window").width;

export default function Summary() {
  const { transactions, categories, loading } = useContext(MoneyContext);

  const today = new Date();
  const [mes, setMes] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [ano, setAno] = useState(String(today.getFullYear()));

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.date) return false;
      return t.date.startsWith(`${ano}-${mes}`);
    });
  }, [transactions, mes, ano]);

  const { totalsById, balance, chartData } = useMemo(() => {
    const acc = {};
    let saldo = 0;

    for (const c of categories) acc[c.id] = 0;

    for (const t of filteredTransactions) {
      const value = Number(t.value);
      const cat = t.category ?? categories.find((c) => c.id === t.categoryId);

      if (acc[t.categoryId] !== undefined) {
        acc[t.categoryId] += value;
      }

      if (cat?.isIncome) {
        saldo += value;
      } else {
        saldo -= value;
      }
    }

    const expensesChart = categories
      .filter((cat) => !cat.isIncome && (acc[cat.id] ?? 0) > 0)
      .map((cat, index) => ({
        name: cat.displayName,
        value: acc[cat.id],
        color: cat.background || ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0"][index % 4],
        legendFontColor: colors.primaryText,
        legendFontSize: 12,
      }));

    return {
      totalsById: acc,
      balance: saldo,
      chartData: expensesChart,
    };
  }, [filteredTransactions, categories]);

  function mudarMes(valor) {
    let novoMes = Number(mes) + valor;
    let novoAno = Number(ano);

    if (novoMes < 1) {
      novoMes = 12;
      novoAno -= 1;
    }

    if (novoMes > 12) {
      novoMes = 1;
      novoAno += 1;
    }

    setMes(String(novoMes).padStart(2, "0"));
    setAno(String(novoAno));
  }

  async function exportarExcel() {
    try {
      const { url, headers } = api.monthlySummaryExport(mes, ano);
      const fileUri = `${FileSystem.documentDirectory}resumo-${ano}-${mes}.xlsx`;
      const result = await FileSystem.downloadAsync(url, fileUri, { headers });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType:
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          dialogTitle: `Resumo ${mes}/${ano}`,
          UTI: "org.openxmlformats.spreadsheetml.sheet",
        });
      } else {
        Alert.alert("Arquivo gerado", result.uri);
      }
    } catch (e) {
      Alert.alert("Erro ao exportar", e.message ?? "Tente novamente.");
    }
  }

  if (loading && categories.length === 0) {
    return (
      <View style={[globalStyles.screenContainer, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const balanceStyle =
    balance >= 0 ? globalStyles.positiveText : globalStyles.negativeText;

  return (
    <View style={globalStyles.screenContainer}>
      <ScrollView style={globalStyles.content}>
        <View style={styles.filterContainer}>
          <TouchableOpacity onPress={() => mudarMes(-1)} style={styles.filterButton}>
            <Text style={styles.filterButtonText}>◀</Text>
          </TouchableOpacity>

          <Text style={styles.periodText}>{mes}/{ano}</Text>

          <TouchableOpacity onPress={() => mudarMes(1)} style={styles.filterButton}>
            <Text style={styles.filterButtonText}>▶</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Resumo por categoria</Text>

        <TouchableOpacity onPress={exportarExcel} style={styles.exportButton}>
          <Text style={styles.exportButtonText}>Exportar mês em Excel</Text>
        </TouchableOpacity>

        {categories.map((category) => (
          <SummaryItem
            key={category.id}
            category={category}
            value={totalsById[category.id] ?? 0}
          />
        ))}

        <View style={globalStyles.line} />

        <View style={styles.balance}>
          <Text style={styles.balanceText}>Saldo</Text>
          <Text style={balanceStyle}>
            {balance.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Gráfico de despesas</Text>

        {chartData.length > 0 ? (
          <PieChart
            data={chartData}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              color: () => colors.primary,
            }}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft="12"
            absolute
          />
        ) : (
          <Text style={styles.emptyText}>
            Nenhuma despesa encontrada para {mes}/{ano}.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 12,
  },
  filterButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  filterButtonText: {
    color: colors.primaryContrast,
    fontSize: 18,
    fontWeight: "bold",
  },
  exportButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  exportButtonText: {
    color: colors.primaryContrast,
    fontWeight: "800",
  },
  periodText: {
    fontSize: 20,
    fontWeight: "bold",
    color: colors.primary,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primaryText,
    marginVertical: 14,
  },
  balance: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 16,
  },
  balanceText: {
    fontSize: 18,
    color: colors.primaryText,
    fontWeight: "800",
  },
  emptyText: {
    textAlign: "center",
    color: colors.secondaryText ?? "#999",
    marginTop: 20,
  },
});
