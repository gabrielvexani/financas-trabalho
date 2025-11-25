// Tela responsável por gerenciar categorias de receitas e despesas do usuário.

// Importações do React e componentes do React Native
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';

// Contexto de autenticação para acessar o usuário logado
import { useAuth } from '../contexts/AuthContext';

// Conexão com o Supabase
import { supabase } from '../config/supabase';

export default function CategoriesScreen({ navigation }) {

  // Lista de categorias carregadas do banco
  const [categories, setCategories] = useState([]);

  // Nome da nova categoria que o usuário está digitando
  const [newCategoryName, setNewCategoryName] = useState('');

  // Tipo da nova categoria (expense ou income)
  const [newCategoryType, setNewCategoryType] = useState('expense');

  // Estado para mostrar botão "Adicionando..."
  const [loading, setLoading] = useState(false);

  // Pegamos o usuário logado
  const { user } = useAuth();


  // Ao abrir a tela, carrega as categorias do banco
  useEffect(() => {
    loadCategories();
  }, []);


  // Função que busca todas as categorias do usuário no supabase
  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', user.id) // Apenas categorias do usuário
      .order('created_at', { ascending: false }); // Ordena da mais nova para a mais antiga

    if (!error) {
      setCategories(data);
    }
  };


  // Função para adicionar uma nova categoria no banco
  const handleAddCategory = async () => {

    // Verifica se o nome não está vazio
    if (!newCategoryName.trim()) {
      Alert.alert('Erro', 'Por favor, digite um nome para a categoria');
      return;
    }

    setLoading(true);

    try {
      // Envia a nova categoria para o supabase
      const { error } = await supabase
        .from('categories')
        .insert({
          user_id: user.id,
          name: newCategoryName.trim(),
          type: newCategoryType,
        });

      if (error) throw error;

      // Limpa o campo após adicionar
      setNewCategoryName('');
      
      // Recarrega lista
      loadCategories();

      Alert.alert('Sucesso', 'Categoria adicionada com sucesso!');

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível adicionar a categoria');
      console.error(error);
    }

    setLoading(false);
  };


  // Função para excluir uma categoria
  const handleDeleteCategory = async (categoryId) => {

    Alert.alert(
      'Confirmar Exclusão',
      'Tem certeza que deseja excluir esta categoria?',
      [
        { text: 'Cancelar', style: 'cancel' },

        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {

            // Remove a categoria do banco
            const { error } = await supabase
              .from('categories')
              .delete()
              .eq('id', categoryId);

            if (error) {
              Alert.alert('Erro', 'Não foi possível excluir a categoria');
            } else {
              loadCategories(); // Recarrega a lista após excluir
            }
          },
        },
      ]
    );
  };


  // Renderiza cada item da lista de categorias
  const renderCategory = ({ item }) => (
    <View style={[
      styles.categoryCard,
      { borderLeftColor: item.type === 'income' ? '#34C759' : '#FF3B30' } // Verde para receita, vermelho para despesa
    ]}>

      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>

        <Text
          style={[
            styles.categoryType,
            { color: item.type === 'income' ? '#34C759' : '#FF3B30' }
          ]}
        >
          {item.type === 'income' ? 'Receita' : 'Despesa'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item.id)}
      >
        <Text style={styles.deleteButtonText}>Excluir</Text>
      </TouchableOpacity>

    </View>
  );


  // Renderização principal da tela
  return (
    <View style={styles.container}>

      {/* Cabeçalho da tela */}
      <View style={styles.header}>
        <Text style={styles.title}>Categorias</Text>
      </View>

      {/* Conteúdo rolável */}
      <ScrollView style={styles.form}>

        {/* Formulário de adicionar categoria */}
        <Text style={styles.sectionTitle}>Adicionar Nova Categoria</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome da categoria"
          value={newCategoryName}
          onChangeText={setNewCategoryName}
        />

        {/* Botões para escolher o tipo (receita ou despesa) */}
        <View style={styles.typeSelector}>
          
          {/* Despesa */}
          <TouchableOpacity
            style={[
              styles.typeButton,
              newCategoryType === 'expense' && styles.typeButtonSelected,
            ]}
            onPress={() => setNewCategoryType('expense')}
          >
            <Text
              style={[
                styles.typeButtonText,
                newCategoryType === 'expense' && styles.typeButtonTextSelected
              ]}
            >
              Despesa
            </Text>
          </TouchableOpacity>

          {/* Receita */}
          <TouchableOpacity
            style={[
              styles.typeButton,
              newCategoryType === 'income' && styles.typeButtonSelected,
            ]}
            onPress={() => setNewCategoryType('income')}
          >
            <Text
              style={[
                styles.typeButtonText,
                newCategoryType === 'income' && styles.typeButtonTextSelected
              ]}
            >
              Receita
            </Text>
          </TouchableOpacity>

        </View>

        {/* Botão adicionar categoria */}
        <TouchableOpacity
          style={[styles.addButton, loading && styles.addButtonDisabled]}
          onPress={handleAddCategory}
          disabled={loading}
        >
          <Text style={styles.addButtonText}>
            {loading ? 'Adicionando...' : 'Adicionar Categoria'}
          </Text>
        </TouchableOpacity>


        {/* Lista de categorias */}
        <Text style={styles.sectionTitle}>Minhas Categorias</Text>

        {categories.length === 0 ? (
          <Text style={styles.noCategoriesText}>Nenhuma categoria cadastrada</Text>
        ) : (
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            scrollEnabled={false} // evita conflito com ScrollView
          />
        )}

      </ScrollView>
    </View>
  );
}


// Estilos visuais da tela
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  header: {
    backgroundColor: 'white',
    padding: 20,
    paddingTop: 60,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },

  form: {
    flex: 1,
    padding: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },

  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },

  typeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 5,
  },

  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },

  typeButtonSelected: {
    backgroundColor: '#007AFF',
  },

  typeButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },

  typeButtonTextSelected: {
    color: 'white',
  },

  addButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 30,
  },

  addButtonDisabled: {
    backgroundColor: '#ccc',
  },

  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },

  categoryCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderLeftWidth: 4, // Barra colorida indicando o tipo
  },

  categoryInfo: {
    flex: 1,
  },

  categoryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  categoryType: {
    fontSize: 14,
  },

  deleteButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },

  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },

  noCategoriesText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    marginVertical: 20,
  },
});
