import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isDarkMode } = useTheme();
  
  // Örnek kategori listesi
  const categories = [
    { id: '1', name: 'Teknoloji', icon: 'laptop-outline' },
    { id: '2', name: 'Sağlık', icon: 'fitness-outline' },
    { id: '3', name: 'Eğitim', icon: 'school-outline' },
    { id: '4', name: 'Spor', icon: 'football-outline' },
    { id: '5', name: 'Müzik', icon: 'musical-notes-outline' },
    { id: '6', name: 'Seyahat', icon: 'airplane-outline' },
    { id: '7', name: 'Yemek', icon: 'restaurant-outline' },
    { id: '8', name: 'Filmler', icon: 'film-outline' },
  ];
  
  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity style={[styles.categoryItem, isDarkMode && styles.darkCategoryItem]}>
      <Ionicons name={item.icon} size={32} color={isDarkMode ? '#fff' : '#333'} />
      <Text style={[styles.categoryName, isDarkMode && styles.darkText]}>{item.name}</Text>
    </TouchableOpacity>
  );
  
  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, isDarkMode && styles.darkSearchInputContainer]}>
          <Ionicons name="search" size={20} color={isDarkMode ? '#aaa' : '#777'} />
          <TextInput
            style={[styles.searchInput, isDarkMode && styles.darkSearchInput]}
            placeholder="Arama yap..."
            placeholderTextColor={isDarkMode ? '#aaa' : '#777'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>
      
      <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Kategoriler</Text>
      
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.categoriesContainer}
      />
      
      <Text style={[styles.sectionTitle, isDarkMode && styles.darkText]}>Popüler Etiketler</Text>
      
      <View style={styles.tagsContainer}>
        {['#teknoloji', '#sağlık', '#eğitim', '#spor', '#müzik', '#seyahat'].map((tag, index) => (
          <TouchableOpacity 
            key={index} 
            style={[styles.tagItem, isDarkMode && styles.darkTagItem]}
          >
            <Text style={[styles.tagText, isDarkMode && styles.darkTagText]}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  darkContainer: {
    backgroundColor: '#121212',
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkSearchInputContainer: {
    backgroundColor: '#1e1e1e',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  darkSearchInput: {
    color: '#fff',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  darkText: {
    color: '#f0f0f0',
  },
  categoriesContainer: {
    marginBottom: 24,
  },
  categoryItem: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    margin: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 120,
  },
  darkCategoryItem: {
    backgroundColor: '#1e1e1e',
  },
  categoryIcon: {
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  darkTagItem: {
    backgroundColor: '#2c2c2c',
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  darkTagText: {
    color: '#f0f0f0',
  },
});
