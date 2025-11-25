// ExpensesScreen.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../config/supabase';

// Tela para registrar novas despesas
export default function ExpensesScreen({ navigation }) {
  // Estados para formulário
  const [amount, setAmount] = useState(''); // valor da despesa
  const [description, setDescription] = useState(''); // descrição
  const [category, setCategory] = useState(''); // categoria escolhida
  const [date, setDate] = useState(new Date()); // data da despesa
  const [showDatePicker, setShowDatePicker] = useState(false); // controle do calendário
  const [receipt, setReceipt] = useState(null); // imagem comprovante
  const [categories, setCategories] = useState([]); // lista de categorias
  const [loading, setLoading] = useState(false); // loading do botão
  const { user } = useAuth();

  // Categorias padrão caso usuário não tenha criado nenhuma
  const defaultCategories = [
    'Alimentação', 'Transporte', 'Moradia', 'Saúde', 
    'Educação', 'Lazer', 'Compras', 'Outros'
  ];

  // Carrega categorias ao abrir a tela
  useEffect(() => {
    loadCategories();
  }, []);

  // Busca categorias do banco (ou usa padrão)
  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'expense');

      if (error) {
        console.log('Erro ao carregar categorias, usando padrão:', error);
        setCategories(defaultCategories.map(name => ({ id: name, name })));
      } else {
        if (data.length === 0) {
          setCategories(defaultCategories.map(name => ({ id: name, name })));
        } else {
          setCategories(data);
        }
      }
    } catch (error) {
      console.log('Erro crítico, usando padrão:', error);
      setCategories(defaultCategories.map(name => ({ id: name, name })));
    }
  };

  // Selecionar imagem da galeria
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Acesso à galeria é necessário.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) setReceipt(result.assets[0].uri);
  };

  // Tirar foto usando a câmera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Acesso à câmera é necessário.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) setReceipt(result.assets[0].uri);
  };

  // Enviar nova despesa para o banco
  const handleSubmit = async () => {
    if (!amount || !description || !category) {
      Alert.alert('Erro', 'Preencha valor, descrição e categoria');
      return;
    }

    // Converter valor
    const amountValue = parseFloat(amount.replace(',', '.'));
    if (isNaN(amountValue) || amountValue <= 0) {
      Alert.alert('Erro', 'Insira um valor válido maior que zero');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: amountValue,
        description,
        category,
        date: date.toISOString().split('T')[0],
        receipt_url: receipt, // ainda sem upload
      });

      if (error) throw error;

      Alert.alert('Sucesso', 'Despesa cadastrada!');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível cadastrar');
      console.error(error);
    }
    setLoading(false);
  };

  // Formatação simples do campo valor
  const handleAmountChange = (text) => {
    const cleanedText = text.replace(/[^0-9,.]/g, '');
    const formattedText = cleanedText.replace(',', '.');

    if (formattedText === '' || !isNaN(formattedText)) {
      setAmount(cleanedText);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Cabeçalho */}
      <View style={styles.header}>
        <Text style={styles.title}>Nova Despesa</Text>
      </View>

      {/* Formulário */}
      <View style={styles.form}>
        {/* Valor */}
        <TextInput
          style={styles.input}
          placeholder="Valor (R$)"
          value={amount}
          onChangeText={handleAmountChange}
          keyboardType="decimal-pad"
        />

        {/* Descrição */}
        <TextInput
          style={styles.input}
          placeholder="Descrição"
          value={description}
          onChangeText={setDescription}
        />

        {/* Data */}
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateText}>Data: {date.toLocaleDateString('pt-BR')}</Text>
        </TouchableOpacity>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={(event, selectedDate) => {
              setShowDatePicker(false);
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}

        {/* Categorias */}
        <View style={styles.categoryContainer}>
          <Text style={styles.label}>Categoria:</Text>
          <Text style={styles.subLabel}>Selecione uma categoria:</Text>

          {/* Lista horizontal */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id || cat.name}
                style={[styles.categoryButton, category === cat.name && styles.categoryButtonSelected]}
                onPress={() => setCategory(cat.name)}
              >
                <Text style={[styles.categoryText, category === cat.name && styles.categoryTextSelected]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Categoria escolhida */}
          {category ? (
            <Text style={styles.selectedCategory}>Selecionada: <Text style={styles.selectedCategoryName}>{category}</Text></Text>
          ) : (
            <Text style={styles.noCategorySelected}>Nenhuma categoria selecionada</Text>
          )}
        </View>

        {/* Comprovante */}
        <View style={styles.receiptSection}>
          <Text style={styles.label}>Comprovante (opcional):</Text>

          {receipt && <Image source={{ uri: receipt }} style={styles.receiptImage} />}

          <View style={styles.receiptButtons}>
            <TouchableOpacity style={styles.receiptButton} onPress={pickImage}>
              <Text style={styles.receiptButtonText}>📁 Galeria</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.receiptButton} onPress={takePhoto}>
              <Text style={styles.receiptButtonText}>📷 Câmera</Text>
            </TouchableOpacity>

            {receipt && (
              <TouchableOpacity style={[styles.receiptButton, styles.removeButton]} onPress={() => setReceipt(null)}>
                <Text style={styles.receiptButtonText}>❌ Remover</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Botão de envio */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>{loading ? 'Cadastrando...' : 'Cadastrar Despesa'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Estilização visual da tela
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: 'white', padding: 20, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  form: { padding: 20 },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius:
