import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import api from './axios';

const { width } = Dimensions.get('window');

// Custom Select2-like Component
const CustomSelect = ({ data, selectedValue, onSelect, placeholder, loading }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredData = data.filter(item => 
    item.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const selectedItem = data.find(item => item.id.toString() === selectedValue);
  
  return (
    <>
      <TouchableOpacity 
        style={styles.customSelectButton} 
        onPress={() => setModalVisible(true)}
        disabled={loading}
      >
        <Text style={[
          styles.customSelectText, 
          !selectedItem && styles.customSelectPlaceholder
        ]}>
          {loading ? 'Memuat...' : (selectedItem ? selectedItem.nama : placeholder)}
        </Text>
        <Text style={styles.customSelectArrow}>
          {loading ? '⏳' : '▼'}
        </Text>
      </TouchableOpacity>
      
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.selectModalContainer}>
          <View style={styles.selectModalHeader}>
            <Text style={styles.selectModalTitle}>Pilih Kategori</Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
              style={styles.selectModalClose}
            >
              <Text style={styles.selectModalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectSearchContainer}>
            <Text style={styles.selectSearchIcon}>🔍</Text>
            <TextInput
              style={styles.selectSearchInput}
              placeholder="Cari kategori..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#999"
            />
          </View>
          
          <FlatList
            data={filteredData}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.selectOptionItem,
                  selectedValue === item.id.toString() && styles.selectOptionSelected
                ]}
                onPress={() => {
                  onSelect(item.id.toString());
                  setModalVisible(false);
                  setSearchQuery('');
                }}
              >
                <Text style={[
                  styles.selectOptionText,
                  selectedValue === item.id.toString() && styles.selectOptionTextSelected
                ]}>
                  {item.nama}
                </Text>
                {selectedValue === item.id.toString() && (
                  <Text style={styles.selectOptionCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={() => (
              <View style={styles.selectEmptyContainer}>
                <Text style={styles.selectEmptyText}>Kategori tidak ditemukan</Text>
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
};

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
    gambar: ''
  });

  const [filteredBarang, setFilteredBarang] = useState([]);

  // Fixed: Use consistent BASE_URL
  const BASE_URL = 'https://fadf50ca5131.ngrok-free.app/api';

  useEffect(() => {
    fetchBarang();
    fetchKategori();
  }, []);

  useEffect(() => {
    let filtered = barang;

    if (searchQuery.trim()) {
      filtered = filtered.filter(b =>
        b.nama_barang.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.kategori.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (selectedCategory !== 'Semua') {
      filtered = filtered.filter(b => b.kategori === selectedCategory);
    }

    setFilteredBarang(filtered);
  }, [barang, searchQuery, selectedCategory]);

  const fetchBarang = async () => {
    try {
      const res = await api.get('/tambah/barang');
      setBarang(res.data.data);
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', 'Gagal memuat barang dari server');
    }
  };

  const fetchKategori = async () => {
    setLoadingKategori(true);
    try {
      const res = await api.get('/tambah/kategori');
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

    if (barangForm.gambar && barangForm.gambar !== '') {
      formData.append('foto_barang', {
        uri: barangForm.gambar,
        type: 'image/jpeg',
        name: 'barang.jpg',
      });
    }

    try {
      // Fixed: Use consistent BASE_URL and API structure
      await api.post('/tambah/barang/store', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchBarang();
      resetForm();
      setShowAddBarang(false);
      Alert.alert('Sukses', 'Barang berhasil ditambahkan!');
    } catch (error) {
      console.error(error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Gagal menambah barang');
    }
  };

  const handleEditBarang = async () => {
    const formData = new FormData();
    formData.append('nama_barang', barangForm.nama);
    formData.append('id_kategori', barangForm.kategori);
    formData.append('harga_barang', barangForm.harga);
    formData.append('stok_barang', barangForm.stok || 0);

    if (barangForm.gambar && barangForm.gambar.startsWith('file')) {
      formData.append('foto_barang', {
        uri: barangForm.gambar,
        type: 'image/jpeg',
        name: 'barang.jpg'
      });
    }

    try {
      await api.post(`/tambah/barang/${editingBarang.id}?_method=PUT`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      fetchBarang();
      resetForm();
      setShowEditBarang(false);
      Alert.alert('Sukses', 'Barang berhasil diupdate!');
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
            await api.delete(`/tambah/barang/${id}`);
            fetchBarang();
            Alert.alert('Sukses', 'Barang berhasil dihapus!');
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
    setBarangForm({ nama: '', kategori: '', harga: '', stok: '', gambar: '' });
    setEditingBarang(null);
  };

  const openEdit = (item) => {
    setEditingBarang(item);
    setBarangForm({
      nama: item.nama_barang,
      kategori: item.id_kategori?.toString() || '',
      harga: item.harga_barang?.toString() || '',
      stok: item.stok_barang?.toString() || '',
      gambar: item.foto_barang || ''
    });
    setShowEditBarang(true);
  };

  const renderBarang = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.imageContainer}>
          {item.foto_barang ? (
            <Image
              source={{ uri: item.foto_barang }}
              style={styles.image}
            />
          ) : (
            <View
              style={[
                styles.image,
                {
                  backgroundColor: '#ccc',
                  justifyContent: 'center',
                  alignItems: 'center',
                },
              ]}
            >
              <Text style={{ color: '#666' }}>No Image</Text>
            </View>
          )}
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{item.stok_barang}</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.title} numberOfLines={2}>
            {item.nama_barang}
          </Text>
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

  // Fixed: Add complete return statement with proper JSX structure
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <Text style={styles.headerTitle}>Barang Management</Text>
        <Text style={styles.headerSubtitle}>Kelola data barang Anda</Text>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari barang..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <FlatList
        data={filteredBarang}
        keyExtractor={item => item.id.toString()}
        renderItem={renderBarang}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>Belum ada barang</Text>
            <Text style={styles.emptySubtext}>Tambahkan barang pertama Anda</Text>
          </View>
        )}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddBarang(true)}>
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.fabGradient}>
          <Text style={styles.fabIcon}>+</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Add Modal */}
      <Modal
        visible={showAddBarang}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddBarang(false)}
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Tambah Barang</Text>
              <Text style={styles.modalSubtitle}>Lengkapi informasi barang baru</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Barang</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama barang"
                  value={barangForm.nama}
                  onChangeText={(text) => setBarangForm({ ...barangForm, nama: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <CustomSelect
                  data={categoriesApi}
                  selectedValue={barangForm.kategori}
                  onSelect={(value) => setBarangForm({ ...barangForm, kategori: value })}
                  placeholder="Pilih kategori"
                  loading={loadingKategori}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Harga</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={barangForm.harga}
                    onChangeText={(text) => setBarangForm({ ...barangForm, harga: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>Stok</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={barangForm.stok}
                    onChangeText={(text) => setBarangForm({ ...barangForm, stok: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gambar Barang</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={handleImagePicker}>
                  <LinearGradient colors={['#e3f2fd', '#bbdefb']} style={styles.imagePickerGradient}>
                    <Text style={styles.imagePickerIcon}>📷</Text>
                    <Text style={styles.imagePickerText}>Pilih Gambar</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {barangForm.gambar && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: barangForm.gambar }} style={styles.previewImage} />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={() => {
                  resetForm();
                  setShowAddBarang(false);
                }}
              >
                <LinearGradient colors={['#9e9e9e', '#757575']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>Batal</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtn} onPress={handleAddBarang}>
                <LinearGradient colors={['#4CAF50', '#45a049']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>Tambah</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Modal>

      {/* Edit Modal */}
      <Modal
        visible={showEditBarang}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditBarang(false)}
      >
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Barang</Text>
              <Text style={styles.modalSubtitle}>Ubah informasi barang</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Nama Barang</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan nama barang"
                  value={barangForm.nama}
                  onChangeText={(text) => setBarangForm({ ...barangForm, nama: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Kategori</Text>
                <CustomSelect
                  data={categoriesApi}
                  selectedValue={barangForm.kategori}
                  onSelect={(value) => setBarangForm({ ...barangForm, kategori: value })}
                  placeholder="Pilih kategori"
                  loading={loadingKategori}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                  <Text style={styles.inputLabel}>Harga</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={barangForm.harga}
                    onChangeText={(text) => setBarangForm({ ...barangForm, harga: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 10 }]}>
                  <Text style={styles.inputLabel}>Stok</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    value={barangForm.stok}
                    onChangeText={(text) => setBarangForm({ ...barangForm, stok: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Gambar Barang</Text>
                <TouchableOpacity style={styles.imagePickerBtn} onPress={handleImagePicker}>
                  <LinearGradient colors={['#e3f2fd', '#bbdefb']} style={styles.imagePickerGradient}>
                    <Text style={styles.imagePickerIcon}>📷</Text>
                    <Text style={styles.imagePickerText}>Ubah Gambar</Text>
                  </LinearGradient>
                </TouchableOpacity>
                
                {barangForm.gambar && (
                  <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: barangForm.gambar }} style={styles.previewImage} />
                  </View>
                )}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.modalBtn} 
                onPress={() => {
                  resetForm();
                  setShowEditBarang(false);
                }}
              >
                <LinearGradient colors={['#9e9e9e', '#757575']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>Batal</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtn} onPress={handleEditBarang}>
                <LinearGradient colors={['#FF9800', '#F57C00']} style={styles.modalBtnGradient}>
                  <Text style={styles.modalBtnText}>Update</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '400',
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 20,
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
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: 60,
    padding: 20,
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
    flex: 1,
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
  
  // Custom Select2-like Styles
  customSelectButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  customSelectText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  customSelectPlaceholder: {
    color: '#999',
  },
  customSelectArrow: {
    fontSize: 12,
    color: '#7f8c8d',
    marginLeft: 8,
  },
  selectModalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight + 16 || 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
  },
  selectModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalCloseText: {
    fontSize: 16,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  selectSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    margin: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectSearchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  selectSearchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2c3e50',
  },
  selectOptionItem: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 4,
    borderLeftColor: '#667eea',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#2c3e50',
    flex: 1,
  },
  selectOptionTextSelected: {
    color: '#667eea',
    fontWeight: '600',
  },
  selectOptionCheck: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  selectEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  selectEmptyText: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
  },
});