import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importe as telas que você criou
import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';

const Stack = createNativeStackNavigator();

export default function AppRoutes() {
  return (
    // O initialRouteName obriga o app a começar pelo "Login"
    <Stack.Navigator initialRouteName="Login">
      
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ headerShown: false }} // Esconde o cabeçalho no login
      />
      
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} // Você pode mudar para true se quiser um cabeçalho padrão
      />

    </Stack.Navigator>
  );
}