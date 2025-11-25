// src/screens/IncomesScreen.js
// Tela de cadastro de receitas. Similar à de despesas, mas voltada para entradas.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

export default function IncomesScreen({ navigation }) {
  // Estados principais
  const [amount, setAmount] = useState(''); // Valor da receita
  const [description, setDescription] = useState(''); // Descrição
  const [source, setSource] = useState(''); // Fonte (categoria)
  const [date, setDate] = useState(new Date()); // Data
  const [showDatePicker, setShowDatePicker] = useState(false); // Exibir seletor de data
  const [categories, setCategories] = useState([]); // Categorias de receita do usuário
  const [loading, setLoading] = useState(false); // Estado de carregamento
  const { user } = useAuth(); // Usuário atual

  // Carrega categorias de receita ao abrir a tela
  useEffect(() => {
    loadCategories();
  }, []);

  // Carrega categorias do Supabase
  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'income');

    if (!error) {
      setCategories(data);
    }
  };

  // Função para registrar a receita
  const handleSubmit = async () => {
    if (!amount || !description || !source) {
      Alert.alert('Erro', 'Por favor, preencha valor, descrição e fonte');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'income', // Tipo receita
          amount: parseFloat(amount),
          description,
          category: source, // Aqui a "fonte" vira categoria
          date: date.toISOString().split('T')[0],
        });

      if (error) throw error;

      Alert.alert('Sucesso', 'Receita cadastrada com sucesso!');
      navigation.goBack();
      
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar a receita');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <ScrollView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Nova Receita</Text>
      </View>

      {/* Formulário */}
      <View style={styles.form}>
        {/* Valor */}
        <TextInput
          style={styles.input}
          placeholder="Valor (R$)"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
        />

        {/* Descrição */}
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
        />

        {/* Fonte (categoria de receita) */}
        <TextInput
          style={style
