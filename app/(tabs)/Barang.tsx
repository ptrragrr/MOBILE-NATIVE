import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import api from './axios';

const { width } = Dimensions.get('window');

// Custom Select Component with cleaner design
const CustomSelect = ({ data, selectedValue, onSelect, placeholder, loading }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Safe filter dengan pengecekan data
  const filteredData = data && data.length > 0 ? data.filter(item => 
    item && item.nama && item.nama.toLowerCase().includes(searchQuery.toLowerCase())
  ) : [];
  
  // Safe find dengan pengecekan data
  const selectedItem = data && data.length > 0 ? data.find(item => 
    item && item.id && item.id.toString() === selectedValue
  ) : null;
  
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
        <View style={styles.selectArrowContainer}>
          <Text style={styles.customSelectArrow}>
            {loading ? '⏳' : '▼'}
          </Text>
        </View>
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
              <Text style={styles.selectModalCloseText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectSearchContainer}>
            <View style={styles.searchIconContainer}>
              <Text style={styles.selectSearchIcon}>🔍</Text>
            </View>
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
            keyExtractor={(item, index) => item?.id ? item.id.toString() : index.toString()}
            renderItem={({ item }) => {
              // Safety check untuk item
              if (!item || !item.id || !item.nama) return null;
              
              return (
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
                    <View style={styles.checkmarkContainer}>
                      <Text style={styles.selectOptionCheck}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={() => (
              <View style={styles.selectEmptyContainer}>
                <Text style={styles.selectEmptyIcon}>🔍</Text>
                <Text style={styles.selectEmptyText}>
                  {loading ? 'Memuat kategori...' : 'Kategori tidak ditemukan'}
                </Text>
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

  const BASE_URL = 'https://ef4d352813da.ngrok-free.app/';

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
      console.log('Kategori response:', res.data); // Debug log
      
      // Pastikan data kategori tersimpan dengan benar
      if (res.data && res.data.data) {
        setCategoriesApi(res.data.data);
      } else if (res.data && Array.isArray(res.data)) {
        setCategoriesApi(res.data);
      } else {
        console.warn('Format data kategori tidak sesuai:', res.data);
        setCategoriesApi([]);
      }
    } catch (error) {
      console.error('Error fetching kategori:', error.response?.data || error.message);
      Alert.alert('Error', 'Gagal memuat kategori dari server');
      setCategoriesApi([]); // Set empty array jika error
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
      <View style={styles.cardImageSection}>
        {item.foto_barang ? (
          <Image
            source={{ uri: item.foto_barang }}
            style={styles.cardImage}
          />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text style={styles.imagePlaceholderIcon}>📦</Text>
            <Text style={styles.imagePlaceholderText}>No Image</Text>
          </View>
        )}
        <View style={styles.stockIndicator}>
          <Text style={styles.stockText}>Stock: {item.stok_barang}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.nama_barang}
          </Text>
          <Text style={styles.cardPrice}>{formatRupiah(item.harga_barang)}</Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={() => openEdit(item)}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]} 
            onPress={() => handleDeleteBarang(item.id)}
          >
            <Text style={styles.deleteButtonText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Modal Form Component
  const ModalForm = ({ visible, onClose, onSubmit, title, subtitle, buttonText, isEdit = false }) => (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleSection}>
                <Text style={styles.modalTitle}>{title}</Text>
                <Text style={styles.modalSubtitle}>{subtitle}</Text>
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Nama Barang</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Masukkan nama barang"
                  value={barangForm.nama}
                  onChangeText={(text) => setBarangForm({ ...barangForm, nama: text })}
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.inputSection}>
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
                <View style={[styles.inputSection, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>Harga</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    value={barangForm.harga}
                    onChangeText={(text) => setBarangForm({ ...barangForm, harga: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>

                <View style={[styles.inputSection, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.inputLabel}>Stok</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="0"
                    value={barangForm.stok}
                    onChangeText={(text) => setBarangForm({ ...barangForm, stok: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                  />
                </View>
              </View>

              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Gambar Barang</Text>
                <TouchableOpacity style={styles.imagePickerButton} onPress={handleImagePicker}>
                  <View style={styles.imagePickerContent}>
                    <Text style={styles.imagePickerIcon}>📷</Text>
                    <Text style={styles.imagePickerText}>
                      {isEdit ? 'Ubah Gambar' : 'Pilih Gambar'}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                {barangForm.gambar && (
                  <View style={styles.imagePreview}>
                    <Image source={{ uri: barangForm.gambar }} style={styles.previewImage} />
                  </View>
                )}
              </View>

              <View style={{ height: 120 }} />
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  resetForm();
                  onClose();
                }}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.modalButton, styles.submitButton]} 
                onPress={onSubmit}
              >
                <Text style={styles.submitButtonText}>{buttonText}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Barang Management</Text>
        <Text style={styles.headerSubtitle}>Kelola data barang Anda</Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari barang..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Content */}
      <FlatList
        data={filteredBarang}
        keyExtractor={item => item.id.toString()}
        renderItem={renderBarang}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Belum ada barang</Text>
            <Text style={styles.emptySubtitle}>Tambahkan barang pertama Anda</Text>
          </View>
        )}
      />

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddBarang(true)}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>

      {/* Modals */}
      <ModalForm
        visible={showAddBarang}
        onClose={() => setShowAddBarang(false)}
        onSubmit={handleAddBarang}
        title="Tambah Barang"
        subtitle="Lengkapi informasi barang baru"
        buttonText="Tambah"
        isEdit={false}
      />

      <ModalForm
        visible={showEditBarang}
        onClose={() => setShowEditBarang(false)}
        onSubmit={handleEditBarang}
        title="Edit Barang"
        subtitle="Ubah informasi barang"
        buttonText="Update"
        isEdit={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Header
  header: {
    backgroundColor: '#fff',
    paddingTop: StatusBar.currentHeight + 20 || 64,
    paddingBottom: 24,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    fontWeight: '400',
  },

  // Search
  searchSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIconWrapper: {
    marginRight: 12,
  },
  searchIcon: {
    fontSize: 16,
    color: '#666',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },

  // List
  listContent: {
    padding: 24,
    paddingBottom: 100,
  },

  // Card
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImageSection: {
    position: 'relative',
    height: 160,
  },
  cardImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#f5f5f5',
  },
  cardImagePlaceholder: {
    width: '100%',
    height: 160,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  stockIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  stockText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
    lineHeight: 24,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2d7d32',
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#e3f2fd',
  },
  editButtonText: {
    color: '#1976d2',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#ffebee',
  },
  deleteButtonText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '600',
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '300',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitleSection: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 16,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '300',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    paddingHorizontal: 24,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  imagePickerButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
    overflow: 'hidden',
  },
  imagePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  imagePickerIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  imagePickerText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1976d2',
  },
  imagePreview: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1976d2',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  // Custom Select
  customSelectButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#e9ecef',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customSelectText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  customSelectPlaceholder: {
    color: '#999',
  },
  selectArrowContainer: {
    marginLeft: 8,
  },
  customSelectArrow: {
    fontSize: 12,
    color: '#666',
  },
  selectModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  selectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    paddingTop: StatusBar.currentHeight + 16 || 60,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  selectModalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectModalCloseText: {
    fontSize: 20,
    color: '#666',
    fontWeight: '300',
  },
  selectSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    margin: 24,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIconContainer: {
    marginRight: 12,
  },
  selectSearchIcon: {
    fontSize: 16,
    color: '#666',
  },
  selectSearchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  selectOptionItem: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectOptionSelected: {
    backgroundColor: '#e3f2fd',
    borderLeftWidth: 3,
    borderLeftColor: '#1976d2',
  },
  selectOptionText: {
    fontSize: 16,
    color: '#1a1a1a',
    flex: 1,
  },
  selectOptionTextSelected: {
    color: '#1976d2',
    fontWeight: '600',
  },
  checkmarkContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#1976d2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectOptionCheck: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  selectEmptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  selectEmptyIcon: {
    fontSize: 32,
    marginBottom: 12,
    opacity: 0.5,
  },
  selectEmptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});