// src/screens/RegisterScreen.js
// Tela de registro

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';

// Componente principal da tela de Registro
export default function RegisterScreen({ navigation }) {
  // Estados para armazenar os valores preenchidos nos inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Função de cadastro obtida do contexto de autenticação
  const { signUp } = useAuth();

  // Função que valida e envia os dados para cadastro
  const handleRegister = async () => {
    // Verifica se todos os campos foram preenchidos
    if (!email || !password || !confirmPassword) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    // Valida se as senhas coincidem
    if (password !== confirmPassword) {
      Alert.alert('Erro', 'As senhas não coincidem');
      return;
    }

    // Valida tamanho mínimo da senha
    if (password.length < 6) {
      Alert.alert('Erro', 'A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Inicia carregamento
    setLoading(true);

    // Tenta criar o usuário via supabase (AuthContext)
    const { error } = await signUp(email, password);

    if (error) {
      // Caso ocorra erro no supabase
      Alert.alert('Erro', error.message);
    } else {
      // Sucesso ao criar conta
      Alert.alert('Sucesso', 'Conta criada com sucesso! Faça login.');
      navigation.navigate('Login');
    }

    setLoading(false);
  };

  return (
    // Ajuste do teclado dependendo do sistema operacional
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Cabeçalho da tela */}
        <View style={styles.header}>
          <Text style={styles.title}>Criar Conta</Text>
          <Text style={styles.subtitle}>Cadastre-se para começar</Text>
        </View>

        {/* Formulário */}
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TextInput
            style={styles.input}
            placeholder="Confirmar Senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          {/* Botão de cadastro */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
