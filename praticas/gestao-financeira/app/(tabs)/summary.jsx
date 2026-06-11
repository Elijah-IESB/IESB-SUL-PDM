import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart, LineChart, PieChart } from "react-native-chart-kit";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { MoneyContext } from "../../contexts/GlobalState";
import SummaryItem from "../../components/SummaryItem";
import { globalStyles } from "../../styles/globalStyles";
import { colors } from "../../constants/colors";
import { api } from "../../services/api";

const screenWidth = Dimensions.get("window").width;
const chartWidth = Math.max(screenWidth - 40, 280);

const CHART_TYPES = {
  PIE: "pie",
  BAR: "bar",
  LINE: "line",
};

const chartConfig = {
  backgroundGradientFrom: colors.background,
  backgroundGradientTo: colors.background,
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(55, 191, 129, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(102, 102, 102, ${opacity})`,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: colors.primary,
  },
  propsForBackgroundLines: {
    stroke: "#E1E1E1",
  },
};

function currency(value) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function shortLabel(value) {
  if (!value) return "";
  return value.length > 10 ? `${value.slice(0, 9)}.` : value;
}

export default function Summary() {
  const { transactions, categories, loading } = useContext(MoneyContext);

  const today = new Date();
  const [mes, setMes] = useState(String(today.getMonth() + 1).padStart(2, "0"));
  const [ano, setAno] = useState(String(today.getFullYear()));
  const [chartType, setChartType] = useState(CHART_TYPES.PIE);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (!t.date) return false;
      return t.date.startsWith(`${ano}-${mes}`);
    });
  }, [transactions, mes, ano]);

  const { totalsById, balance, pieData, barData, lineData, hasChartValues } =
    useMemo(() => {
      const acc = {};
      const dailyBalance = {};
      let saldo = 0;

      for (const c of categories) acc[c.id] = 0;

      for (const t of filteredTransactions) {
        const value = Number(t.value);
        const cat = t.category ?? categories.find((c) => c.id === t.categoryId);
        const signedValue = cat?.isIncome ? value : -value;
        const day = String(new Date(t.date).getDate()).padStart(2, "0");

        if (acc[t.categoryId] !== undefined) {
          acc[t.categoryId] += value;
        }

        dailyBalance[day] = (dailyBalance[day] ?? 0) + signedValue;
        saldo += signedValue;
      }

      const expenseCategories = categories
        .filter((cat) => !cat.isIncome && (acc[cat.id] ?? 0) > 0)
        .sort((a, b) => (acc[b.id] ?? 0) - (acc[a.id] ?? 0));

      const expensesChart = expenseCategories.map((cat, index) => ({
        name: cat.displayName,
        value: acc[cat.id],
        color:
          cat.background ||
          ["#DA5567", "#37BF81", "#82C9DE", "#AB8FBE", "#DEA17B"][index % 5],
        legendFontColor: colors.primaryText,
        legendFontSize: 12,
      }));

      const barCategories = expenseCategories.slice(0, 6);
      const barChart = {
        labels: barCategories.map((cat) => shortLabel(cat.displayName)),
        datasets: [{ data: barCategories.map((cat) => Number(acc[cat.id] ?? 0)) }],
      };

      let runningBalance = 0;
      const days = Object.keys(dailyBalance).sort();
      const lineChart = {
        labels: days.map((day, index) =>
          days.length > 8 && index % Math.ceil(days.length / 6) !== 0 ? "" : day
        ),
        datasets: [
          {
            data: days.map((day) => {
              runningBalance += dailyBalance[day];
              return Number(runningBalance.toFixed(2));
            }),
            color: (opacity = 1) => `rgba(55, 191, 129, ${opacity})`,
            strokeWidth: 3,
          },
        ],
      };

      return {
        totalsById: acc,
        balance: saldo,
        pieData: expensesChart,
        barData: barChart,
        lineData: lineChart,
        hasChartValues: expensesChart.length > 0 || days.length > 0,
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

  function renderChart() {
    if (!hasChartValues) {
      return (
        <Text style={styles.emptyText}>
          Nenhuma movimentação encontrada para {mes}/{ano}.
        </Text>
      );
    }

    if (chartType === CHART_TYPES.BAR) {
      if (barData.labels.length === 0) {
        return (
          <Text style={styles.emptyText}>
            Nenhuma despesa encontrada para montar o gráfico de barras.
          </Text>
        );
      }

      return (
        <BarChart
          data={barData}
          width={chartWidth}
          height={260}
          chartConfig={chartConfig}
          fromZero
          showValuesOnTopOfBars
          yAxisLabel="R$ "
          yAxisSuffix=""
          verticalLabelRotation={barData.labels.length > 4 ? 25 : 0}
          style={styles.chart}
        />
      );
    }

    if (chartType === CHART_TYPES.LINE) {
      if (lineData.datasets[0].data.length === 0) {
        return (
          <Text style={styles.emptyText}>
            Nenhuma movimentação encontrada para montar o gráfico linear.
          </Text>
        );
      }

      return (
        <LineChart
          data={lineData}
          width={chartWidth}
          height={240}
          chartConfig={chartConfig}
          bezier
          fromZero={false}
          yAxisLabel="R$ "
          yAxisSuffix=""
          style={styles.chart}
        />
      );
    }

    if (pieData.length === 0) {
      return (
        <Text style={styles.emptyText}>
          Nenhuma despesa encontrada para montar o gráfico de pizza.
        </Text>
      );
    }

    return (
      <PieChart
        data={pieData}
        width={chartWidth}
        height={220}
        chartConfig={chartConfig}
        accessor="value"
        backgroundColor="transparent"
        paddingLeft="12"
        absolute
      />
    );
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
            <Text style={styles.filterButtonText}>‹</Text>
          </TouchableOpacity>

          <Text style={styles.periodText}>{mes}/{ano}</Text>

          <TouchableOpacity onPress={() => mudarMes(1)} style={styles.filterButton}>
            <Text style={styles.filterButtonText}>›</Text>
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
          <Text style={balanceStyle}>{currency(balance)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Gráficos</Text>

        <View style={styles.chartSelector}>
          <TouchableOpacity
            onPress={() => setChartType(CHART_TYPES.PIE)}
            style={[
              styles.chartOption,
              chartType === CHART_TYPES.PIE && styles.chartOptionActive,
            ]}
          >
            <Text
              style={[
                styles.chartOptionText,
                chartType === CHART_TYPES.PIE && styles.chartOptionTextActive,
              ]}
            >
              Pizza
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setChartType(CHART_TYPES.BAR)}
            style={[
              styles.chartOption,
              chartType === CHART_TYPES.BAR && styles.chartOptionActive,
            ]}
          >
            <Text
              style={[
                styles.chartOptionText,
                chartType === CHART_TYPES.BAR && styles.chartOptionTextActive,
              ]}
            >
              Barras
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setChartType(CHART_TYPES.LINE)}
            style={[
              styles.chartOption,
              chartType === CHART_TYPES.LINE && styles.chartOptionActive,
            ]}
          >
            <Text
              style={[
                styles.chartOptionText,
                chartType === CHART_TYPES.LINE && styles.chartOptionTextActive,
              ]}
            >
              Linha
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chartWrapper}>{renderChart()}</View>
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
    width: 44,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
  filterButtonText: {
    color: colors.primaryContrast,
    fontSize: 28,
    fontWeight: "bold",
    lineHeight: 30,
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
  chartSelector: {
    flexDirection: "row",
    backgroundColor: "#E9E9E9",
    borderRadius: 8,
    padding: 4,
    marginBottom: 12,
  },
  chartOption: {
    flex: 1,
    minHeight: 40,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chartOptionActive: {
    backgroundColor: colors.primary,
  },
  chartOptionText: {
    color: colors.primaryText,
    fontWeight: "800",
  },
  chartOptionTextActive: {
    color: colors.primaryContrast,
  },
  chartWrapper: {
    minHeight: 240,
    marginBottom: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  chart: {
    borderRadius: 8,
    marginLeft: -16,
  },
  emptyText: {
    textAlign: "center",
    color: colors.secondaryText ?? "#999",
    marginTop: 20,
  },
});
