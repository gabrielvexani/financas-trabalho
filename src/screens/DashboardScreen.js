// Tela principal (Dashboard) onde o usuário vê:
// - Saldo atual
// - Gráfico de receitas e despesas por mês
// - Destaques (maior despesa, categoria mais usada)
// - Menu de navegação

// Importações principais do React e React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';

// Biblioteca para gráficos
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';

// Contexto de autenticação
import { useAuth } from '../contexts/AuthContext';

// Cliente Supabase
import { supabase } from '../config/supabase';

export default function DashboardScreen({ navigation }) {

  // Estado do saldo atual
  const [balance, setBalance] = useState(0);

  // Dados formatados para o gráfico
  const [chartData, setChartData] = useState([]);

  // Destaques (maior despesa, categoria mais usada)
  const [highlights, setHighlights] = useState({});

  // Estado do refresh (pull to refresh)
  const [refreshing, setRefreshing] = useState(false);

  // Usuário logado e função de logout
  const { user, signOut } = useAuth();

  // -----------------------------------
  // 🔄 Carrega todos os dados do dashboard
  // -----------------------------------
  const loadDashboardData = async () => {
    try {
      // Busca todas as transações do usuário
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;

      // Calcula total de receitas
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      // Calcula total de despesas
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      // Define saldo atual
      setBalance(totalIncome - totalExpenses);

      // Prepara dados para o gráfico
      const monthlyData = processMonthlyData(transactions);
      setChartData(monthlyData);

      // Calcula os destaques
      const highlightsData = calculateHighlights(transactions);
      setHighlights(highlightsData);

    } catch (error) {
      Alert.alert('Erro', 'Erro ao carregar dados do dashboard');
      console.error(error);
    }
  };

  // -----------------------------------
  // 📊 Processa dados para o gráfico mensal
  // Agrupa receitas e despesas por mês
  // -----------------------------------
  const processMonthlyData = (transactions) => {
    const months = {};

    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;

      if (!months[monthKey]) {
        months[monthKey] = { income: 0, expenses: 0 };
      }

      if (transaction.type === 'income') {
        months[monthKey].income += transaction.amount;
      } else {
        months[monthKey].expenses += transaction.amount;
      }
    });

    return Object.keys(months).map(key => ({
      month: key,
      income: months[key].income,
      expenses: months[key].expenses,
    }));
  };

  // -----------------------------------
  // ⭐ Calcula destaques:
  // - maior despesa
  // - categoria mais usada
  // -----------------------------------
  const calculateHighlights = (transactions) => {

    // Maior despesa
    const expenses = transactions.filter(t => t.type === 'expense');
    const highestExpense = expenses.length > 0 
      ? expenses.reduce((max, t) => t.amount > max.amount ? t : max, expenses[0])
      : null;

    // Contagem de categorias
    const categoryCount = {};
    transactions.forEach(t => {
      categoryCount[t.category] = (categoryCount[t.category] || 0) + 1;
    });

    // Categoria mais usada
    const mostUsedCategory = Object.keys(categoryCount).length > 0
      ? Object.keys(categoryCount).reduce((a, b) => categoryCount[a] > categoryCount[b] ? a : b)
      : 'Nenhuma';

    return {
      highestExpense,
      mostUsedCategory,
    };
  };

  // -----------------------------------
  // 🔄 Atualiza ao puxar pra baixo
  // -----------------------------------
  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // Carrega tudo ao abrir a tela
  useEffect(() => {
    loadDashboardData();
  }, []);

  // -----------------------------------
  // 🚪 Logout
  // -----------------------------------
  const handleSignOut = async () => {
    await signOut();
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>

      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard</Text>

        {/* Botão de sair */}
        <TouchableOpacity onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sair</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Card do saldo atual */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo Atual</Text>
          <Text style={[
            styles.balanceValue,
            { color: balance >= 0 ? '#34C759' : '#FF3B30' }
          ]}>
            R$ {balance.toFixed(2)}
          </Text>
        </View>

        {/* Card do gráfico */}
        <View style={styles.chartCard}>
          <Text style={styles.cardTitle}>Receitas vs Despesas</Text>

          {chartData.length > 0 ? (
            <VictoryChart theme={VictoryTheme.material} domainPadding={20}>
              <VictoryAxis />
              <VictoryAxis dependentAxis />

              {/* Barras de receitas */}
              <VictoryBar
                data={chartData}
                x="month"
                y="income"
                style={{ data: { fill: '#34C759' } }}
              />

              {/* Barras de despesas */}
              <VictoryBar
                data={chartData}
                x="month"
                y="expenses"
                style={{ data: { fill: '#FF3B30' } }}
              />

            </VictoryChart>
          ) : (
            <Text style={styles.noDataText}>Nenhum dado disponível</Text>
          )}
        </View>

        {/* Card de destaques */}
        <View style={styles.highlightsCard}>
          <Text style={styles.cardTitle}>Destaques</Text>

          {/* Maior despesa */}
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>Maior Despesa:</Text>
            <Text style={styles.highlightValue}>
              {highlights.highestExpense 
                ? `R$ ${highlights.highestExpense.amount.toFixed(2)} - ${highlights.highestExpense.description}`
                : 'Nenhuma despesa'}
            </Text>
          </View>

          {/* Categoria mais usada */}
          <View style={styles.highlightItem}>
            <Text style={styles.highlightLabel}>Categoria Mais Usada:</Text>
            <Text style={styles.highlightValue}>
              {highlights.mostUsedCategory}
            </Text>
          </View>
        </View>

        {/* Menu de navegação */}
        <View style={styles.menuGrid}>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Expenses')}
          >
            <Text style={styles.menuIcon}>💰</Text>
            <Text style={styles.menuText}>Despesas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Incomes')}
          >
            <Text style={styles.menuIcon}>💵</Text>
            <Text style={styles.menuText}>Receitas</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Categories')}
          >
            <Text style={styles.menuIcon}>📂</Text>
            <Text style={styles.menuText}>Categorias</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => navigation.navigate('Transactions')}
          >
            <Text style={styles.menuIcon}>📋</Text>
            <Text style={styles.menuText}>Transações</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}
