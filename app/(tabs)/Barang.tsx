// InventoryManagement.js - Combined Barang and Kategori Management
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

  // Fetch Functions
  const fetchBarang = async () => {
    try {
      const res = await api.get('/tambah/barang');
      setBarangList(res.data.data);
    } catch (err) {
      Alert.alert('Gagal memuat barang');
    }
  };

  const fetchKategori = async () => {
    try {
      const res = await api.get('/tambah/kategori');
      setKategoriList(res.data.data);
    } catch (err) {
      Alert.alert('Gagal memuat kategori');
    }
  };

  useEffect(() => {
    fetchBarang();
    fetchKategori();
  }, []);

  // Image Picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.All,
  quality: 0.8
});

    if (!result.canceled) {
      setBarangForm({ ...barangForm, gambar: result.assets[0].uri });
    }
  };

  // Barang Functions
  const handleBarangSubmit = async () => {
    if (!barangForm.nama || !barangForm.harga || !barangForm.kategori) {
      return Alert.alert('Peringatan', 'Mohon isi semua field yang diperlukan!');
    }
    const formData = new FormData();
    formData.append('nama_barang', barangForm.nama);
    formData.append('harga_barang', barangForm.harga);
    formData.append('stok_barang', barangForm.stok);
    formData.append('id_kategori', barangForm.kategori);
    if (barangForm.gambar) {
      formData.append('foto_barang', {
        uri: barangForm.gambar,
        type: 'image/jpeg',
        name: 'barang.jpg'
      });
    }

    try {
      if (editId) {
        await api.post(`/tambah/barang/${editId}?_method=PUT`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Alert.alert('Sukses', 'Barang berhasil diupdate!');
      } else {
        await api.post('/tambah/barang/store', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Alert.alert('Sukses', 'Barang berhasil ditambahkan!');
      }
      fetchBarang();
      setBarangForm({ nama: '', harga: '', stok: '', kategori: '', gambar: '' });
      setEditId(null);
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Gagal menyimpan barang');
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
          } catch {
            Alert.alert('Error', 'Gagal menghapus barang');
          }
        }}
      ]
    );
  };

  // Kategori Functions
  const handleKategoriSubmit = async () => {
    if (!kategoriForm.nama.trim()) {
      return Alert.alert('Peringatan', 'Nama kategori tidak boleh kosong!');
    }

    const payload = {
      nama: kategoriForm.nama.trim(),
      // deskripsi: kategoriForm.deskripsi.trim()
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
      const errorMessage = err.response?.data?.message || 'Gagal menyimpan kategori';
      Alert.alert('Error', errorMessage);
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
    b.nama_barang.toLowerCase().includes(search.toLowerCase())
  );

  const filteredKategori = kategoriList.filter(kat => 
    kat.nama.toLowerCase().includes(search.toLowerCase())
  );

  // Render Functions
  const renderBarangItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.foto_barang }} 
          style={styles.image}
          resizeMode="cover"
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
                gambar: item.foto_barang || ''
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
          {item.nama.charAt(0).toUpperCase()}
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
                // deskripsi: item.deskripsi || ''
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
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalCancelText}>Batal</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {editId 
                ? `Edit ${activeTab === 'barang' ? 'Barang' : 'Kategori'}` 
                : `Tambah ${activeTab === 'barang' ? 'Barang' : 'Kategori'}`
              }
            </Text>
            <TouchableOpacity 
              onPress={activeTab === 'barang' ? handleBarangSubmit : handleKategoriSubmit}
            >
              <Text style={styles.modalSaveText}>
                {editId ? 'Update' : 'Simpan'}
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
                  />
                </View>

                {/* Harga */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Harga *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Masukkan harga"
                    value={barangForm.harga}
                    onChangeText={text => setBarangForm({ ...barangForm, harga: text })}
                    keyboardType="numeric"
                    placeholderTextColor="#999"
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
                  <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                    <Text style={styles.imagePickerText}>
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
                  />
                </View>

                {/* Deskripsi */}

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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6c757d',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
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