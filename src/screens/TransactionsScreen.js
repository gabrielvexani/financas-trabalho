// src/screens/TransactionsScreen.js (Comentada)
// tela de listagem e filtragem de transações do usuário
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
  RefreshControl,
  TextInput,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

// Tela de listagem e filtragem de transações (receitas e despesas)
export default function TransactionsScreen({ navigation }) {
  // Lista completa de transações
  const [transactions, setTransactions] = useState([]);
  // Lista filtrada (aplicando filtros em cima de transactions)
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // Estado do refresh (puxar para atualizar)
  const [refreshing, setRefreshing] = useState(false);

  // Filtros principais
  const [filterType, setFilterType] = useState('all'); // all | income | expense
  const [filterCategory, setFilterCategory] = useState('');

  // Filtros de data (começo do mês atual até hoje)
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState(new Date());

  // Controle dos DatePickers
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Busca por texto (descrição/categoria)
  const [searchText, setSearchText] = useState('');

  const { user } = useAuth();

  // Carrega as transações ao abrir
  useEffect(() => {
    loadTransactions();
  }, []);

  // Reaplica filtros sempre que qualquer parâmetro mudar
  useEffect(() => {
    filterTransactions();
  }, [transactions, filterType, filterCategory, startDate, endDate, searchText]);

  // Função que busca transações no Supabase
  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (!error) {
      setTransactions(data);
    }
  };

  // Executa filtros locais sobre a lista em memória
  const filterTransactions = () => {
    let filtered = transactions;

    // Filtrar por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(t => t.type === filterType);
    }

    // Filtrar por categoria
    if (filterCategory) {
      filtered = filtered.filter(t => 
        t.category.toLowerCase().includes(filterCategory.toLowerCase())
      );
    }

    // Filtrar por intervalo de datas
    filtered = filtered.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Filtrar por busca
    if (searchText) {
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(searchText.toLowerCase()) ||
        t.category.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    setFilteredTransactions(filtered);
  };

  // Atualiza lista puxando para baixo
  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  // Função para deletar transação
  const handleDeleteTransaction = async (transactionId) => {
    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta transação?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('transactions')
              .delete()
              .eq('id', transactionId);

            if (!error) {
              loadTransactions();
            } else {
              Alert.alert('Erro', 'Não foi possível excluir a transação');
            }
          },
        },
      ]
    );
  };

  // Como cada transação aparece na lista
  const renderTransaction = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.transactionCard,
        { borderLeftColor: item.type === 'income' ? '#34C759' : '#FF3B30' }
      ]}
    >
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionDescription}>{item.description}</Text>
        <Text style={styles.transactionCategory}>{item.category}</Text>
        <Text style={styles.transactionDate}>
          {new Date(item.date).toLocaleDateString('pt-BR')}
        </Text>
      </View>

      <View style={styles.transactionAmountContainer}>
        <Text style={[
          styles.transactionAmount,
          { color: item.type === 'income' ? '#34C759' : '#FF3B30' }
        ]}>
          {item.type === 'income' ? '+' : '-'} R$ {item.amount.toFixed(2)}
        </Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteTransaction(item.id)}
        >
          <Text style={styles.deleteButtonText}>Excluir</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Transações</Text>
      </View>

      {/* Filtros principais */}
      <View style={styles.filters}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar..."
          value={searchText}
          onChangeText={setSearchText}
        />

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterButton, filterType === 'all' && styles.filterButtonActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={styles.filterButtonText}>Todas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'income' && styles.filterButtonActive]}
            onPress={() => setFilterType('income')}
          >
            <Text style={styles.filterButtonText}>Receitas</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterButton, filterType === 'expense' && styles.filterButtonActive]}
            onPress={() => setFilterType('expense')}
          >
            <Text style={styles.filterButtonText}>Despesas</Text>
          </TouchableOpacity>
        </View>

        {/* Filtro de datas */}
        <View style={styles.dateFilters}>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              De: {startDate.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              Até: {endDate.toLocaleDateString('pt-BR')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* DatePickers */}
        {showStartDatePicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowStartDatePicker(false);
              if (selectedDate) setStartDate(selectedDate);
            }}
          />
        )}

        {showEndDatePicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowEndDatePicker(false);
              if (selectedDate) setEndDate(selectedDate);
            }}
          />
        )}
      </View>

      {/* Lista de transações */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransaction}
        keyExtractor={(item
