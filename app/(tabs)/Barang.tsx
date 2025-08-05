import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

export default function BarangManagement() {
  const [barang, setBarang] = useState([]);
  const [categoriesApi, setCategoriesApi] = useState([]);
  const [loadingKategori, setLoadingKategori] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [showAddBarang, setShowAddBarang] = useState(false);
  const [showEditBarang, setShowEditBarang] = useState(false);
  const [editingBarang, setEditingBarang] = useState(null);

  const [barangForm, setBarangForm] = useState({
    nama: '',
    kategori: '',
    harga: '',
    stok: '',
    deskripsi: '',
    gambar: ''
  });

  const filterCategories = ['Semua'];
  const [filteredBarang, setFilteredBarang] = useState([]);

  const BASE_URL = 'https://fcda10aff9bc.ngrok-free.app/api';

  useEffect(() => {
    fetchBarang();
    fetchKategori();
  }, []);

  useEffect(() => {
    let filtered = barang;

    if (searchQuery.trim()) {
      filtered = filtered.filter(b =>
        b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(b => b.kategori === selectedCategory);
    }

    setFilteredBarang(filtered);
  }, [barang, searchQuery, selectedCategory]);

  const fetchBarang = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan, silakan login ulang');
        return;
      }

      const res = await axios.get(`${BASE_URL}/tambah/barang`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setBarang(res.data.data);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', 'Gagal memuat barang dari server');
    }
  };

  const fetchKategori = async () => {
    setLoadingKategori(true);
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Alert.alert('Error', 'Token tidak ditemukan, silakan login ulang');
        return;
      }

      const res = await axios.get(`${BASE_URL}/tambah/kategori`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCategoriesApi(res.data.data);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', 'Gagal memuat kategori dari server');
    } finally {
      setLoadingKategori(false);
    }
  };

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
      setBarangForm({ ...barangForm, gambar: result.assets[0].uri });
    }
  };

  const handleAddBarang = async () => {
    if (!barangForm.nama || !barangForm.kategori || !barangForm.harga) {
      Alert.alert('Error', 'Nama, kategori, dan harga wajib diisi!');
      return;
    }

    const formData = new FormData();
    formData.append('nama_barang', barangForm.nama);
    formData.append('id_kategori', barangForm.kategori);
    formData.append('harga_barang', barangForm.harga);
    formData.append('stok_barang', barangForm.stok || 0);
    formData.append('deskripsi', barangForm.deskripsi);

    if (barangForm.gambar) {
      formData.append('foto_barang', {
        uri: barangForm.gambar,
        type: 'image/jpeg',
        name: 'barang.jpg'
      });
    }

    try {
      await axios.post(`https://fcda10aff9bc.ngrok-free.app/api/tambah/barang/store`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchBarang();
      resetForm();
      setShowAddBarang(false);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', 'Gagal menambah barang');
    }
  };

  const handleEditBarang = async () => {
    const formData = new FormData();
    formData.append('nama_barang', barangForm.nama);
    formData.append('id_kategori', barangForm.kategori);
    formData.append('harga_barang', barangForm.harga);
    formData.append('stok_barang', barangForm.stok || 0);
    formData.append('deskripsi', barangForm.deskripsi);

    if (barangForm.gambar && barangForm.gambar.startsWith('file')) {
      formData.append('foto_barang', {
        uri: barangForm.gambar,
        type: 'image/jpeg',
        name: 'barang.jpg'
      });
    }

    try {
      await axios.post(`${BASE_URL}/tambah/barang/${editingBarang.id}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchBarang();
      resetForm();
      setShowEditBarang(false);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', 'Gagal mengupdate barang');
    }
  };

  const handleDeleteBarang = async (id) => {
    Alert.alert('Konfirmasi', 'Yakin hapus barang ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        onPress: async () => {
          try {
            await axios.delete(`${BASE_URL}/tambah/barang/${id}`);
            fetchBarang();
          } catch (error) {
            console.error(error.response?.data || error.message);
            Alert.alert('Error', 'Gagal menghapus barang');
          }
        },
        style: 'destructive'
      }
    ]);
  };

  const resetForm = () => {
    setBarangForm({ nama: '', kategori: '', harga: '', stok: '', deskripsi: '', gambar: '' });
    setEditingBarang(null);
  };

  const openEdit = (item) => {
    setEditingBarang(item);
    setBarangForm({
      nama: item.nama_barang,
      kategori: item.id_kategori?.toString() || '',
      harga: item.harga_barang?.toString() || '',
      stok: item.stok_barang?.toString() || '',
      deskripsi: item.deskripsi || '',
      gambar: item.foto_barang || ''
    });
    setShowEditBarang(true);
  };

  const renderBarang = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: item.foto_barang }} style={styles.image} />
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{item.stok_barang}</Text>
          </View>
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>{item.nama_barang}</Text>
          <Text style={styles.desc} numberOfLines={2}>{item.deskripsi}</Text>
          <Text style={styles.price}>{formatRupiah(item.harga_barang)}</Text>
          
          <View style={styles.actionContainer}>
            <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
              <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.actionBtnGradient}>
                <Text style={styles.actionBtnText}>✏️ Edit</Text>
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteBarang(item.id)}>
              <LinearGradient colors={['#f44336', '#d32f2f']} style={styles.actionBtnGradient}>
                <Text style={styles.actionBtnText}>🗑️ Hapus</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#f8f9fa', '#e9ecef']} style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📦 Manajemen Barang</Text>
        <Text style={styles.headerSubtitle}>Kelola inventori dengan mudah</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Cari barang, kategori, atau deskripsi..."
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Product List */}
      <FlatList
        data={filteredBarang}
        keyExtractor={item => item.id.toString()}
        renderItem={renderBarang}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Belum ada barang</Text>
            <Text style={styles.emptySubtext}>Tap tombol + untuk menambah barang</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddBarang(true)}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.fabGradient}>
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Modal */}
      <Modal visible={showAddBarang || showEditBarang} animationType="slide" presentationStyle="pageSheet">
        <LinearGradient colors={['#f8f9fa', '#ffffff']} style={styles.modalContainer}>
          <ScrollView contentContainerStyle={styles.modalContent} showsVerticalScrollIndicator={false}>
            
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showEditBarang ? '✏️ Edit Barang' : '➕ Tambah Barang'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {showEditBarang ? 'Perbarui informasi barang' : 'Masukkan detail barang baru'}
              </Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📝 Nama Barang</Text>
                <TextInput
                  placeholder="Masukkan nama barang"
                  value={barangForm.nama}
                  onChangeText={text => setBarangForm({ ...barangForm, nama: text })}
                  style={styles.input}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>🏷️ Kategori</Text>
                {loadingKategori ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#667eea" />
                    <Text style={styles.loadingText}>Memuat kategori...</Text>
                  </View>
                ) : (
                  <View style={styles.pickerContainer}>
                    <Picker
                      selectedValue={barangForm.kategori}
                      onValueChange={(value) => setBarangForm({ ...barangForm, kategori: value })}
                      style={styles.picker}
                    >
                      <Picker.Item label="Pilih Kategori" value="" />
                      {categoriesApi.map(cat => (
                        <Picker.Item key={cat.id} label={cat.nama} value={cat.id.toString()} />
                      ))}
                    </Picker>
                  </View>
                )}
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>💰 Harga</Text>
                  <TextInput
                    placeholder="0"
                    keyboardType="numeric"
                    value={barangForm.harga}
                    onChangeText={text => setBarangForm({ ...barangForm, harga: text })}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>
                
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>📊 Stok</Text>
                  <TextInput
                    placeholder="0"
                    keyboardType="numeric"
                    value={barangForm.stok}
                    onChangeText={text => setBarangForm({ ...barangForm, stok: text })}
                    style={styles.input}
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📄 Deskripsi</Text>
                <TextInput
                  placeholder="Deskripsi barang (opsional)"
                  value={barangForm.deskripsi}
                  onChangeText={text => setBarangForm({ ...barangForm, deskripsi: text })}
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>📷 Foto Barang</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={handleImagePicker}>
                  <LinearGradient colors={['#e3f2fd', '#bbdefb']} style={styles.imagePickerGradient}>
                    <Text style={styles.imagePickerIcon}>📸</Text>
                    <Text style={styles.imagePickerText}>
                      {barangForm.gambar ? 'Ganti Foto' : 'Pilih Foto'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {barangForm.gambar ? (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: barangForm.gambar }} style={styles.previewImage} />
                  </View>
                ) : null}
              </View>
            </View>

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={showEditBarang ? handleEditBarang : handleAddBarang}
              >
                <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>
                    {showEditBarang ? '✅ Update' : '💾 Simpan'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={() => {
                  resetForm();
                  setShowAddBarang(false);
                  setShowEditBarang(false);
                }}
              >
                <LinearGradient colors={['#757575', '#616161']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>❌ Batal</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#2c3e50',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  stockBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#667eea',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  stockText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: '#7f8c8d',
    lineHeight: 20,
    marginBottom: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '600',
    color: '#27ae60',
    marginBottom: 12,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  editBtn: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  deleteBtn: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  actionBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc3c7',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: 'white',
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
  },
  modalContent: {
    padding: 20,
    paddingTop: StatusBar.currentHeight || 44,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    minHeight: 80,
    maxHeight: 120,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  loadingText: {
    marginLeft: 8,
    color: '#7f8c8d',
    fontSize: 16,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  imagePickerBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePickerGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  imagePickerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
  },
  imagePreviewContainer: {
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalBtnGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});