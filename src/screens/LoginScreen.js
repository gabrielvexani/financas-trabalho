// src/screens/LoginScreen.js
// Tela de login do app. Aqui o usuário insere email e senha para entrar.

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

export default function LoginScreen({ navigation }) {
  // Estados do formulário
  const [email, setEmail] = useState(''); // Guarda o email digitado
  const [password, setPassword] = useState(''); // Guarda a senha digitada
  const [loading, setLoading] = useState(false); // Evita múltiplos cliques

  const { signIn } = useAuth(); // Função de login vinda do contexto de autenticação

  // Função chamada ao clicar em "Entrar"
  const handleLogin = async () => {
    // Validação simples
    if (!email || !password) {
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    setLoading(true);

    // Tenta autenticar com Supabase (via AuthContext)
    const { error } = await signIn(email, password);

    if (error) {
      Alert.alert('Erro', error.message); // Exibe erro de login
    } else {
      navigation.navigate('Dashboard'); // Redireciona para o dashboard após login
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} // Evita teclado sobre inputs
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Cabeçalho da tela */}
        <View style={styles.header}>
