import { StyleSheet, Text, View } from "react-native";
import CategoryItem from "./CategoryItem";
import { globalStyles } from "../styles/globalStyles";

/**
 * Linha do resumo: bolinha da categoria + nome + total formatado em BRL.
 *
 * @param {{ category: object, value: number }} props
 * @returns {JSX.Element}
 */
export default function SummaryItem({ category, value }) {
  const numericValue = Number(value);
  const valueStyle = category?.isIncome
    ? globalStyles.positiveText
    : globalStyles.negativeText;

  return (
    <View style={styles.itemContainer}>
      <CategoryItem category={category} />
      <View style={styles.textContainer}>
        <Text style={globalStyles.primaryText}>
          {category?.displayName ?? "Sem categoria"}
        </Text>
        <Text style={valueStyle}>
          {(Number.isFinite(numericValue) ? numericValue : 0).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  itemContainer: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 4,
  },
  textContainer: {
    display: "flex",
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    marginLeft: 12,
  },
});
