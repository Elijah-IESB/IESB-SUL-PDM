import { Platform, Text, TextInput, TouchableOpacity, View } from "react-native"
import { globalStyles } from "../styles/globalStyles"
import { useState } from "react"
import RNDateTimePicker from "@react-native-community/datetimepicker"

export default function DatePicker({ form, setForm }) {
  const [showPicker, setShowPicker] = useState(false)
  const date = form.date instanceof Date ? form.date : new Date(form.date)
  const safeDate = Number.isNaN(date.getTime()) ? new Date() : date

  const handleDateChange = (_, selectDate) => {
    setShowPicker(false)

    if (selectDate) {
      setForm({ ...form, date: selectDate })
    }
  }

  return (
    <View>
      <Text style={globalStyles.inputLabel}>Data</Text>
      <TouchableOpacity onPress={() => setShowPicker(true)}>
        <TextInput
          value={safeDate.toLocaleDateString("pt-BR")}
          style={globalStyles.input}
          editable={false}
        />
      </TouchableOpacity>

      {showPicker && (
        <RNDateTimePicker
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          value={safeDate}
          onChange={handleDateChange}
        />
      )}
    </View>
  )
}
