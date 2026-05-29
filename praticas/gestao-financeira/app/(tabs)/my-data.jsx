import { useContext, useEffect, useState } from "react";
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
  View,
} from "react-native";
import RNDateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { colors } from "../../constants/colors";
import { MoneyContext } from "../../contexts/GlobalState";
import { globalStyles } from "../../styles/globalStyles";

function formatDateBR(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("pt-BR");
}

function maskDate(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function maskCep(value) {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function parseDateBR(value) {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const isValid =
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day);

  return isValid ? date : null;
}

export default function MyDataScreen() {
  const { currentUser, updateProfile, deleteAccount } = useContext(MoneyContext);
  const [name, setName] = useState(currentUser?.name ?? "");
  const [phone, setPhone] = useState(currentUser?.phone ?? "");
  const [address, setAddress] = useState(currentUser?.address ?? "");
  const [city, setCity] = useState(currentUser?.city ?? "");
  const [state, setState] = useState(currentUser?.state ?? "");
  const [zipCode, setZipCode] = useState(currentUser?.zipCode ?? "");
  const [birthDate, setBirthDate] = useState(formatDateBR(currentUser?.birthDate));
  const [showCalendar, setShowCalendar] = useState(false);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [loadingCep, setLoadingCep] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function loadStates() {
      try {
        const response = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
        );
        const data = await response.json();
        setStates(data.map((item) => ({ id: item.id, nome: item.nome, sigla: item.sigla })));
      } catch {
        Alert.alert("Erro", "Não foi possível carregar os estados do IBGE.");
      }
    }

    loadStates();
  }, []);

  useEffect(() => {
    async function loadCities() {
      if (!state) {
        setCities([]);
        return;
      }

      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${state}/municipios?orderBy=nome`
        );
        const data = await response.json();
        setCities(data.map((item) => ({ id: item.id, nome: item.nome })));
      } catch {
        Alert.alert("Erro", "Não foi possível carregar as cidades do IBGE.");
      }
    }

    loadCities();
  }, [state]);

  async function handleCepChange(value) {
    const masked = maskCep(value);
    setZipCode(masked);

    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setLoadingCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = await response.json();

      if (data.erro) {
        Alert.alert("CEP não encontrado", "Confira o CEP informado.");
        return;
      }

      setAddress(
        [data.logradouro, data.bairro].filter(Boolean).join(", ")
      );
      setState(data.uf ?? "");
      setCity(data.localidade ?? "");
    } catch {
      Alert.alert("Erro", "Não foi possível consultar o CEP.");
    } finally {
      setLoadingCep(false);
    }
  }

  async function handleSave() {
    if (name.trim().length < 2) {
      Alert.alert("Erro", "Informe seu nome.");
      return;
    }

    const parsedBirthDate = birthDate.trim() ? parseDateBR(birthDate.trim()) : null;
    if (birthDate.trim() && !parsedBirthDate) {
      Alert.alert("Erro", "Informe a data no formato dd/mm/aaaa.");
      return;
    }

    setSubmitting(true);

    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        city: city.trim(),
        state: state.trim().toUpperCase(),
        zipCode: zipCode.trim(),
        birthDate: parsedBirthDate ? parsedBirthDate.toISOString() : "",
      });
      Alert.alert("Dados atualizados", "Suas informações foram salvas.");
    } catch (e) {
      Alert.alert("Erro ao salvar", e.message ?? "Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleDeleteAccount() {
    if (!deletePassword.trim()) {
      Alert.alert("Senha obrigatória", "Informe sua senha atual para excluir a conta.");
      return;
    }

    Alert.alert(
      "Excluir conta",
      "Essa ação apaga sua conta, categorias e transações. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteAccount(deletePassword);
              Alert.alert("Conta excluída", "Seu cadastro foi removido.");
              router.replace("/login");
            } catch (e) {
              Alert.alert("Erro ao excluir", e.message ?? "Tente novamente.");
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={globalStyles.screenContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={90}
        style={styles.keyboard}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Text style={styles.sectionTitle}>Informações pessoais</Text>

          <View>
            <Text style={globalStyles.inputLabel}>Nome</Text>
            <TextInput value={name} onChangeText={setName} style={globalStyles.input} />
          </View>

          <View>
            <Text style={globalStyles.inputLabel}>E-mail</Text>
            <TextInput
              value={currentUser?.email ?? ""}
              editable={false}
              style={[globalStyles.input, styles.disabledInput]}
            />
          </View>

          <View>
            <Text style={globalStyles.inputLabel}>Telefone</Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              style={globalStyles.input}
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
            />
          </View>

          <View>
            <Text style={globalStyles.inputLabel}>Data de nascimento</Text>
            <View style={styles.dateRow}>
              <TextInput
                value={birthDate}
                onChangeText={(text) => setBirthDate(maskDate(text))}
                style={[globalStyles.input, styles.dateInput]}
                placeholder="dd/mm/aaaa"
                keyboardType="number-pad"
                maxLength={10}
              />
              <TouchableOpacity
                onPress={() => setShowCalendar(true)}
                style={styles.calendarButton}
              >
                <MaterialIcons name="calendar-month" size={24} color={colors.primaryContrast} />
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Endereço</Text>

          <View>
            <Text style={globalStyles.inputLabel}>CEP</Text>
            <TextInput
              value={zipCode}
              onChangeText={handleCepChange}
              style={globalStyles.input}
              placeholder="00000-000"
              keyboardType="number-pad"
              maxLength={9}
            />
            {loadingCep && <Text style={styles.helperText}>Consultando CEP...</Text>}
          </View>

          <View>
            <Text style={globalStyles.inputLabel}>Endereço</Text>
            <TextInput
              value={address}
              onChangeText={setAddress}
              style={[globalStyles.input, styles.addressInput]}
              placeholder="Rua, numero, complemento"
              multiline
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={globalStyles.inputLabel}>Cidade</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={city} onValueChange={setCity}>
                <Picker.Item label="Selecione a cidade" value="" />
                {cities.map((item) => (
                  <Picker.Item key={item.id} label={item.nome} value={item.nome} />
                ))}
              </Picker>
            </View>
          </View>

          <View>
            <Text style={globalStyles.inputLabel}>Estado</Text>
            <View style={styles.pickerWrapper}>
              <Picker selectedValue={state} onValueChange={setState}>
                <Picker.Item label="Selecione o estado" value="" />
                {states.map((item) => (
                  <Picker.Item
                    key={item.id}
                    label={`${item.sigla} - ${item.nome}`}
                    value={item.sigla}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSave}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.primaryContrast} />
            ) : (
              <Text style={styles.buttonText}>Salvar dados</Text>
            )}
          </TouchableOpacity>

          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Excluir conta</Text>
            <Text style={globalStyles.secondaryText}>
              Esta ação apaga seus dados pessoais, categorias e transações.
            </Text>
            <TextInput
              value={deletePassword}
              onChangeText={setDeletePassword}
              secureTextEntry
              style={globalStyles.input}
              placeholder="Senha atual"
            />
            <TouchableOpacity
              style={[styles.deleteButton, deleting && styles.buttonDisabled]}
              onPress={handleDeleteAccount}
              disabled={deleting}
            >
              {deleting ? (
                <ActivityIndicator color={colors.primaryContrast} />
              ) : (
                <Text style={styles.buttonText}>Excluir minha conta</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>

        {showCalendar && (
          <RNDateTimePicker
            mode="date"
            display={Platform.OS === "ios" ? "inline" : "default"}
            value={parseDateBR(birthDate) ?? new Date(1990, 0, 1)}
            maximumDate={new Date()}
            onChange={(_, selectedDate) => {
              setShowCalendar(false);
              if (selectedDate) {
                setBirthDate(selectedDate.toLocaleDateString("pt-BR"));
              }
            }}
          />
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.primaryText,
    marginTop: 4,
  },
  disabledInput: {
    backgroundColor: "#eee",
    color: colors.secondaryText,
  },
  dateRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  dateInput: {
    flex: 1,
  },
  calendarButton: {
    width: 48,
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  fieldGroup: {
    marginTop: 10,
  },
  addressInput: {
    minHeight: 58,
    paddingVertical: 12,
    textAlignVertical: "top",
  },
  pickerWrapper: {
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.secondaryText,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
  },
  helperText: {
    color: colors.secondaryText,
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
  buttonText: {
    color: colors.primaryContrast,
    fontSize: 16,
    fontWeight: "bold",
  },
  dangerZone: {
    gap: 10,
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "#ddd",
  },
  dangerTitle: {
    color: colors.negativeText,
    fontSize: 16,
    fontWeight: "800",
  },
  deleteButton: {
    backgroundColor: colors.negativeText,
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
});
