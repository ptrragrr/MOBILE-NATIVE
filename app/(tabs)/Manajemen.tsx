// InventoryManagement.js - Combined Barang and Kategori Management (Fixed Version)
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import api from '../axios';

const InventoryManagement = () => {
  // States
  const [activeTab, setActiveTab] = useState('barang');
  const [barangList, setBarangList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [barangForm, setBarangForm] = useState({ nama: '', harga: '', stok: '', kategori: '', gambar: '' });
  const [kategoriForm, setKategoriForm] = useState({ nama: ''});
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch Functions
  const fetchBarang = async () => {
    try {
      const res = await api.get('/tambah/barang');
      setBarangList(res.data.data || []);
    } catch (err) {
      console.error('Fetch barang error:', err);
      Alert.alert('Error', 'Gagal memuat data barang');
    }
  };

  const fetchKategori = async () => {
    try {
      const res = await api.get('/tambah/kategori');
      setKategoriList(res.data.data || []);
    } catch (err) {
      console.error('Fetch kategori error:', err);
      Alert.alert('Error', 'Gagal memuat data kategori');
    }
  };

  useEffect(() => {
    fetchBarang();
    fetchKategori();

    const interval = setInterval(() => {
      fetchBarang(); // update stok tiap 5 detik
    }, 5000);

    return () => clearInterval(interval);
  }, []);
  
  // Image Picker with better error handling
  const pickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Izin akses galeri diperlukan untuk memilih foto.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Selected image:', selectedImage);
        
        // Validasi ukuran file (maksimal 5MB)
        if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
          Alert.alert('Error', 'Ukuran gambar terlalu besar. Maksimal 5MB.');
          return;
        }
        
        setBarangForm({ ...barangForm, gambar: selectedImage.uri });
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Gagal memilih gambar. Silakan coba lagi.');
    }
  };

  // Improved Barang Submit Function
  const handleBarangSubmit = async () => {
    // Enhanced validation
    if (!barangForm.nama?.trim()) {
      return Alert.alert('Peringatan', 'Nama barang tidak boleh kosong!');
    }
    if (!barangForm.harga || barangForm.harga === '0') {
      return Alert.alert('Peringatan', 'Harga barang harus diisi!');
    }
    if (!barangForm.kategori) {
      return Alert.alert('Peringatan', 'Kategori harus dipilih!');
    }

    setIsLoading(true);
    const formData = new FormData();
    
    try {
      // Append data with proper formatting
      formData.append('nama_barang', barangForm.nama.trim());
      formData.append('harga_barang', barangForm.harga.toString());
      formData.append('stok_barang', barangForm.stok || '0');
      formData.append('id_kategori', barangForm.kategori);
      
      // Handle image upload properly
      if (barangForm.gambar && !barangForm.gambar.startsWith('http')) {
        // For new images from picker
        const filename = barangForm.gambar.split('/').pop() || 'barang.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('foto_barang', {
          uri: barangForm.gambar,
          name: filename,
          type: type
        } as any);
      }

      console.log('Sending data:', {
        nama_barang: barangForm.nama,
        harga_barang: barangForm.harga,
        stok_barang: barangForm.stok,
        id_kategori: barangForm.kategori,
        has_image: !!barangForm.gambar && !barangForm.gambar.startsWith('http')
      });

      let response;
      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json'
        },
        timeout: 30000 // 30 seconds timeout
      };

      if (editId) {
        response = await api.post(`/tambah/barang/${editId}?_method=PUT`, formData, config);
      } else {
        response = await api.post('/tambah/barang/store', formData, config);
      }

      console.log('Success response:', response.data);
      Alert.alert('Sukses', editId ? 'Barang berhasil diupdate!' : 'Barang berhasil ditambahkan!');
      
      // Reset form and refresh data
      setBarangForm({ nama: '', harga: '', stok: '', kategori: '', gambar: '' });
      setEditId(null);
      setModalVisible(false);
      await fetchBarang();
      
    } catch (err) {
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        config: err.config
      });
      
      let errorMessage = 'Gagal menyimpan barang. Silakan coba lagi.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message === 'Network Error') {
        errorMessage = 'Masalah koneksi internet. Periksa koneksi Anda.';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout. Server tidak merespons.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarangDelete = async (id) => {
    Alert.alert(
      'Konfirmasi Hapus', 
      'Apakah Anda yakin ingin menghapus barang ini?', 
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: async () => {
          try {
            await api.delete(`/tambah/barang/${id}`);
            Alert.alert('Sukses', 'Barang berhasil dihapus!');
            fetchBarang();
          } catch (err) {
            console.error('Delete error:', err);
            Alert.alert('Error', 'Gagal menghapus barang');
          }
        }}
      ]
    );
  };

  // Improved price formatting
  const formatRupiah = (value) => {
    if (!value) return '';
    const numberString = value.replace(/[^\d]/g, '');
    if (!numberString) return '';
    return 'Rp ' + parseInt(numberString, 10).toLocaleString('id-ID');
  };

  const handleHargaChange = (text) => {
    const rawNumber = text.replace(/[^\d]/g, '');
    setBarangForm({ ...barangForm, harga: rawNumber });
  };

  // Kategori Functions
  const handleKategoriSubmit = async () => {
    if (!kategoriForm.nama.trim()) {
      return Alert.alert('Peringatan', 'Nama kategori tidak boleh kosong!');
    }

    setIsLoading(true);
    const payload = {
      nama: kategoriForm.nama.trim(),
    };

    try {
      if (editId) {
        await api.put(`/tambah/kategori/${editId}`, payload);
        Alert.alert('Sukses', 'Kategori berhasil diupdate!');
      } else {
        await api.post('/tambah/kategori/store', payload);
        Alert.alert('Sukses', 'Kategori berhasil ditambahkan!');
      }
      
      fetchKategori();
      setKategoriForm({ nama: ''});
      setEditId(null);
      setModalVisible(false);
    } catch (err) {
      console.error('Kategori submit error:', err);
      const errorMessage = err.response?.data?.message || 'Gagal menyimpan kategori';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKategoriDelete = async (id, nama) => {
    Alert.alert(
      'Konfirmasi Hapus', 
      `Apakah Anda yakin ingin menghapus kategori "${nama}"?`, 
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          style: 'destructive', 
          onPress: async () => {
            try {
              await api.delete(`/tambah/kategori/${id}`);
              Alert.alert('Sukses', 'Kategori berhasil dihapus!');
              fetchKategori();
            } catch (err) {
              console.error('Delete kategori error:', err);
              const errorMessage = err.response?.data?.message || 'Gagal menghapus kategori';
              Alert.alert('Error', errorMessage);
            }
          }
        }
      ]
    );
  };

  // Filter Functions
  const filteredBarang = barangList.filter(b => 
    b.nama_barang?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredKategori = kategoriList.filter(kat => 
    kat.nama?.toLowerCase().includes(search.toLowerCase())
  );

  // Render Functions
  const renderBarangItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{
            uri: item.foto_barang?.startsWith('http')
              ? item.foto_barang
              : `https://clear-gnat-certainly.ngrok-free.app/storage/${item.foto_barang}`,
          }}
          style={styles.image}
          onError={() => console.log('Image failed to load:', item.foto_barang)}
        />
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.itemName} numberOfLines={2}>{item.nama_barang}</Text>
        <Text style={styles.itemPrice}>Rp {parseInt(item.harga_barang).toLocaleString('id-ID')}</Text>
        <Text style={styles.itemStock}>Stok: {item.stok_barang}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setActiveTab('barang');
              setEditId(item.id);
              setBarangForm({
                nama: item.nama_barang,
                harga: item.harga_barang.toString(),
                stok: item.stok_barang.toString(),
                kategori: item.id_kategori?.toString() || '',
                gambar: item.foto_barang ? `https://clear-gnat-certainly.ngrok-free.app/storage/${item.foto_barang}` : ''
              });
              setModalVisible(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleBarangDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderKategoriItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.categoryIcon}>
        <Text style={styles.categoryIconText}>
          {item.nama?.charAt(0).toUpperCase()}
        </Text>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.itemName} numberOfLines={1}>{item.nama}</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setActiveTab('kategori');
              setEditId(item.id);
              setKategoriForm({
                nama: item.nama,
              });
              setModalVisible(true);
            }}
          >
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => handleKategoriDelete(item.id, item.nama)}
          >
            <Text style={styles.deleteButtonText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const openAddModal = (type) => {
    setActiveTab(type);
    if (type === 'barang') {
      setBarangForm({ nama: '', harga: '', stok: '', kategori: '', gambar: '' });
    } else {
      setKategoriForm({ nama: ''});
    }
    setEditId(null);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Inventori</Text>
        <Text style={styles.subtitle}>
          {activeTab === 'barang' 
            ? `${filteredBarang.length} barang ditemukan`
            : `${filteredKategori.length} kategori ditemukan`
          }
        </Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'barang' && styles.activeTab]}
          onPress={() => setActiveTab('barang')}
        >
          <Text style={[styles.tabText, activeTab === 'barang' && styles.activeTabText]}>
            Barang
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'kategori' && styles.activeTab]}
          onPress={() => setActiveTab('kategori')}
        >
          <Text style={[styles.tabText, activeTab === 'kategori' && styles.activeTabText]}>
            Kategori
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={`Cari ${activeTab === 'barang' ? 'nama barang' : 'nama kategori'}...`}
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Content List */}
      <FlatList
        data={activeTab === 'barang' ? filteredBarang : filteredKategori}
        keyExtractor={(item) => item.id.toString()}
        renderItem={activeTab === 'barang' ? renderBarangItem : renderKategoriItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {`Tidak ada ${activeTab} ditemukan`}
            </Text>
            <Text style={styles.emptySubtext}>
              {`Tambah ${activeTab} pertama Anda`}
            </Text>
          </View>
        }
        refreshing={isLoading}
        onRefresh={() => {
          fetchBarang();
          fetchKategori();
        }}
      />

      {/* Floating Action Buttons */}
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, styles.fabSecondary]} 
          onPress={() => openAddModal('kategori')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabTextSmall}>K</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => openAddModal('barang')}
          activeOpacity={0.8}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal 
        visible={modalVisible} 
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.modalCancelButton} 
              onPress={() => setModalVisible(false)}
              disabled={isLoading}
            >
              <Text style={[styles.modalCancelText, isLoading && styles.disabledText]}>
                Batal
              </Text>
            </TouchableOpacity>
            
            <View style={styles.modalTitleContainer}>
              <Text style={styles.modalTitle}>
                {editId 
                  ? `Edit ${activeTab === 'barang' ? 'Barang' : 'Kategori'}` 
                  : `Tambah ${activeTab === 'barang' ? 'Barang' : 'Kategori'}`
                }
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.modalSaveButton}
              onPress={activeTab === 'barang' ? handleBarangSubmit : handleKategoriSubmit}
              disabled={isLoading}
            >
              <Text style={[styles.modalSaveText, isLoading && styles.disabledText]}>
                {isLoading ? 'Loading...' : (editId ? 'Update' : 'Simpan')}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'barang' ? (
              // Barang Form
              <>
                {/* Nama Barang */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Barang *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan nama barang"
                    value={barangForm.nama}
                    onChangeText={text => setBarangForm({ ...barangForm, nama: text })}
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                </View>

                {/* Harga */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Harga *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan harga"
                    value={formatRupiah(barangForm.harga)}
                    onChangeText={handleHargaChange}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                </View>

                {/* Stok */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Stok</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan jumlah stok"
                    value={barangForm.stok}
                    onChangeText={text => setBarangForm({ ...barangForm, stok: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
                    editable={!isLoading}
                  />
                </View>

                {/* Kategori */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Kategori *</Text>
                  <View style={styles.categoryContainer}>
                    {kategoriList.map(kat => (
                      <TouchableOpacity
                        key={kat.id}
                        style={[
                          styles.categoryButton, 
                          barangForm.kategori === kat.id.toString() && styles.categoryButtonSelected
                        ]}
                        onPress={() => setBarangForm({ ...barangForm, kategori: kat.id.toString() })}
                        disabled={isLoading}
                      >
                        <Text style={[
                          styles.categoryButtonText,
                          barangForm.kategori === kat.id.toString() && styles.categoryButtonTextSelected
                        ]}>
                          {kat.nama}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Image Picker */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Foto Barang</Text>
                  <TouchableOpacity 
                    onPress={pickImage} 
                    style={[styles.imagePickerButton, isLoading && styles.disabledButton]}
                    disabled={isLoading}
                  >
                    <Text style={[styles.imagePickerText, isLoading && styles.disabledText]}>
                      {barangForm.gambar ? 'Ganti Foto' : 'Pilih Foto'}
                    </Text>
                  </TouchableOpacity>

                  {barangForm.gambar && (
                    <View style={styles.imagePreviewContainer}>
                      <Image source={{ uri: barangForm.gambar }} style={styles.imagePreview} />
                    </View>
                  )}
                </View>
              </>
            ) : (
              // Kategori Form
              <>
                {/* Nama Kategori */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Kategori *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Contoh: Elektronik, Pakaian, Makanan"
                    value={kategoriForm.nama}
                    onChangeText={text => setKategoriForm({ ...kategoriForm, nama: text })}
                    placeholderTextColor="#999"
                    maxLength={50}
                    editable={!isLoading}
                  />
                </View>

                {/* Preview */}
                {kategoriForm.nama.trim() && (
                  <View style={styles.previewContainer}>
                    <Text style={styles.previewLabel}>Preview:</Text>
                    <View style={styles.previewCard}>
                      <View style={styles.previewIcon}>
                        <Text style={styles.previewIconText}>
                          {kategoriForm.nama.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.previewContent}>
                        <Text style={styles.previewName}>{kategoriForm.nama}</Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6c757d',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6c757d',
  },
  activeTabText: {
    color: '#007bff',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  searchInput: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  listContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    marginRight: 16,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e9ecef',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  categoryIconText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28a745',
    marginBottom: 2,
  },
  itemStock: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  itemDescription: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#adb5bd',
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 30,
    alignItems: 'center',
    gap: 12,
  },
  fab: {
    backgroundColor: '#007bff',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
    backgroundColor: '#28a745',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
  },
  fabTextSmall: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCancelButton: {
    minWidth: 80,
    alignItems: 'flex-start',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '500',
  },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
  },
  modalSaveButton: {
    minWidth: 80,
    alignItems: 'flex-end',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  categoryButtonSelected: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  categoryButtonTextSelected: {
    color: '#fff',
  },
  imagePickerButton: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderStyle: 'dashed',
  },
  imagePickerText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  imagePreviewContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  imagePreview: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  previewContainer: {
    marginBottom: 24,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  previewIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007bff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewIconText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 2,
  },
  previewDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
});

export default InventoryManagement;