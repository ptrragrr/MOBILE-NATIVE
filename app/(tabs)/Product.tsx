// ProductManagement.js
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function ProductManagement() {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: '',
    price: '',
    stock: '',
    description: '',
    image: ''
  });

  const categories = ['Semua', 'Pakaian', 'Sepatu', 'Celana', 'Hijab'];
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    const sampleProducts = [
      {
        id: 1,
        name: 'Blazer ',
        category: 'Pakaian',
        price: 150000,
        stock: 10,
        description: 'Blazer halus dan lembut dari kulit sapi',
        image: 'https://i.pinimg.com/736x/2a/31/7c/2a317c877062a9cc3de07876dfc301e6.jpg'
      },
      {
        id: 2,
        name: 'Sepatu Nike',
        category: 'Sepatu',
        price: 1200000,
        stock: 20,
        description: 'Sepatu olahraga keren',
        image: 'https://i.pinimg.com/1200x/78/72/65/787265628f6bed641d4fd4e4e08565ae.jpg'
      }
    ];
    setProducts(sampleProducts);
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  const formatRupiah = (angka) => {
    if (!angka) return 'Rp 0';
    return 'Rp ' + parseInt(angka).toLocaleString('id-ID');
  };

  const handleImagePicker = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Izin Ditolak', 'Aplikasi memerlukan akses galeri untuk memilih gambar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [4, 3],
      allowsEditing: true
    });

    if (!result.canceled) {
      setProductForm({ ...productForm, image: result.assets[0].uri });
    }
  };

  const handleAddProduct = () => {
    if (!productForm.name || !productForm.category || !productForm.price) {
      Alert.alert('Error', 'Nama, kategori, dan harga wajib diisi!');
      return;
    }

    const newProduct = {
      id: Date.now(),
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock) || 0,
      image: productForm.image || 'https://via.placeholder.com/300'
    };

    setProducts([...products, newProduct]);
    resetForm();
    setShowAddProduct(false);
  };

  const handleEditProduct = () => {
    const updated = products.map(p =>
      p.id === editingProduct.id
        ? { ...p, ...productForm, price: parseFloat(productForm.price), stock: parseInt(productForm.stock) || 0 }
        : p
    );

    setProducts(updated);
    resetForm();
    setShowEditProduct(false);
  };

  const handleDeleteProduct = (id) => {
    Alert.alert('Konfirmasi', 'Yakin hapus produk ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        onPress: () => setProducts(products.filter(p => p.id !== id)),
        style: 'destructive'
      }
    ]);
  };

  const resetForm = () => {
    setProductForm({ name: '', category: '', price: '', stock: '', description: '', image: '' });
    setEditingProduct(null);
  };

  const openEdit = (item) => {
    setEditingProduct(item);
    setProductForm({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      stock: item.stock.toString(),
      description: item.description,
      image: item.image
    });
    setShowEditProduct(true);
  };

  const renderProduct = ({ item }) => (
  <View style={styles.card}>
    <Image source={{ uri: item.image }} style={styles.image} />
    <View style={{ flex: 1 }}>
      <Text style={styles.title}>{item.name}</Text>
      <Text style={styles.desc}>{item.description}</Text>
      <Text style={styles.price}>{formatRupiah(item.price)}</Text>
      <Text style={{ fontSize: 13, marginTop: 4 }}>Stok: {item.stock}</Text>

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
          <Text>Edit</Text>
        </Pressable>
        <Pressable style={styles.deleteBtn} onPress={() => handleDeleteProduct(item.id)}>
          <Text style={{ color: 'red' }}>Hapus</Text>
        </Pressable>
      </View>
    </View>
  </View>
);

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Cari produk..."
        style={styles.search}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <View style={styles.categoryContainer}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.categoryBtn,
              selectedCategory === cat && styles.categoryBtnActive
            ]}
          >
            <Text style={selectedCategory === cat ? styles.categoryTextActive : styles.categoryText}>
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredProducts}
        keyExtractor={item => item.id.toString()}
        renderItem={renderProduct}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Tidak ada produk.</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddProduct(true)}>
        <Text style={{ fontSize: 24, color: 'white' }}>+</Text>
      </TouchableOpacity>

      <Modal visible={showAddProduct || showEditProduct} animationType="slide">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <TextInput
            placeholder="Nama Produk"
            value={productForm.name}
            onChangeText={text => setProductForm({ ...productForm, name: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Kategori"
            value={productForm.category}
            onChangeText={text => setProductForm({ ...productForm, category: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Harga"
            keyboardType="numeric"
            value={productForm.price}
            onChangeText={text => setProductForm({ ...productForm, price: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Stok"
            keyboardType="numeric"
            value={productForm.stock}
            onChangeText={text => setProductForm({ ...productForm, stock: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Deskripsi"
            value={productForm.description}
            onChangeText={text => setProductForm({ ...productForm, description: text })}
            style={styles.input}
            multiline
          />

          <TouchableOpacity style={styles.pickImageBtn} onPress={handleImagePicker}>
            <Text style={{ color: '#555' }}>Pilih Foto</Text>
          </TouchableOpacity>

          {productForm.image ? (
            <Image source={{ uri: productForm.image }} style={styles.previewImg} />
          ) : null}

          <View style={{ flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' }}>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: 'green' }]}
              onPress={showEditProduct ? handleEditProduct : handleAddProduct}
            >
              <Text style={{ color: 'white' }}>{showEditProduct ? 'Update' : 'Simpan'}</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: 'gray' }]}
              onPress={() => {
                resetForm();
                setShowAddProduct(false);
                setShowEditProduct(false);
              }}
            >
              <Text style={{ color: 'white' }}>Batal</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  search: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    marginTop: 24
  },
  categoryContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8
  },
  categoryBtn: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8
  },
  categoryBtnActive: {
    backgroundColor: '#FF69B4',
    borderColor: '#FF69B4'
  },
  categoryText: {
    color: '#555'
  },
  categoryTextActive: {
    color: 'white',
    fontWeight: 'bold'
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 12,
    elevation: 2
  },
  image: {
    width: 80,
    height: 80,
    marginRight: 12,
    borderRadius: 8
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  desc: {
    fontSize: 12,
    color: '#555'
  },
  price: {
    fontSize: 14,
    color: 'green',
    marginTop: 4
  },
  editBtn: {
    backgroundColor: '#e0f7e9',
    padding: 6,
    marginRight: 8,
    borderRadius: 4
  },
  deleteBtn: {
    backgroundColor: '#ffe4e1',
    padding: 6,
    borderRadius: 4
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#FF69B4',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8
  },
  pickImageBtn: {
    borderWidth: 1,
    borderColor: '#999',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center'
  },
  previewImg: {
    width: '100%',
    height: 200,
    marginTop: 12,
    borderRadius: 8
  },
  modalBtn: {
    padding: 12,
    borderRadius: 8,
    width: '48%',
    alignItems: 'center'
  }
});
