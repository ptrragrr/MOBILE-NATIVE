// BarangManagementSimple.js - Improved UI
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
import api from './axios';

const BarangManagementSimple = () => {
  const [barangList, setBarangList] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [form, setForm] = useState({ nama: '', harga: '', stok: '', kategori: '', gambar: '' });
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editId, setEditId] = useState(null);

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

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8
    });
    if (!result.canceled) {
      setForm({ ...form, gambar: result.assets[0].uri });
    }
  };

  const handleSubmit = async () => {
    if (!form.nama || !form.harga || !form.kategori) {
      return Alert.alert('Peringatan', 'Mohon isi semua field yang diperlukan!');
    }
    const formData = new FormData();
    formData.append('nama_barang', form.nama);
    formData.append('harga_barang', form.harga);
    formData.append('stok_barang', form.stok);
    formData.append('id_kategori', form.kategori);
    if (form.gambar) {
      formData.append('foto_barang', {
        uri: form.gambar,
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
      setForm({ nama: '', harga: '', stok: '', kategori: '', gambar: '' });
      setEditId(null);
      setModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Gagal menyimpan barang');
    }
  };

  const handleDelete = async (id) => {
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

  const filteredBarang = barangList.filter(b => 
    b.nama_barang.toLowerCase().includes(search.toLowerCase())
  );

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
              setEditId(item.id);
              setForm({
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
            onPress={() => handleDelete(item.id)}
          >
            <Text style={styles.deleteButtonText}>Hapus</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Manajemen Barang</Text>
        <Text style={styles.subtitle}>{filteredBarang.length} barang ditemukan</Text>
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Cari nama barang..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#999"
        />
      </View>

      {/* Barang List */}
      <FlatList
        data={filteredBarang}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderBarangItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Tidak ada barang ditemukan</Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          setForm({ nama: '', harga: '', stok: '', kategori: '', gambar: '' });
          setEditId(null);
          setModalVisible(true);
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
              {editId ? 'Edit Barang' : 'Tambah Barang'}
            </Text>
            <TouchableOpacity onPress={handleSubmit}>
              <Text style={styles.modalSaveText}>
                {editId ? 'Update' : 'Simpan'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Nama Barang */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Nama Barang *</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan nama barang"
                value={form.nama}
                onChangeText={text => setForm({ ...form, nama: text })}
                placeholderTextColor="#999"
              />
            </View>

            {/* Harga */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Harga *</Text>
              <TextInput
                style={styles.input}
                placeholder="Masukkan harga"
                value={form.harga}
                onChangeText={text => setForm({ ...form, harga: text })}
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
                value={form.stok}
                onChangeText={text => setForm({ ...form, stok: text })}
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
                      form.kategori === kat.id.toString() && styles.categoryButtonSelected
                    ]}
                    onPress={() => setForm({ ...form, kategori: kat.id.toString() })}
                  >
                    <Text style={[
                      styles.categoryButtonText,
                      form.kategori === kat.id.toString() && styles.categoryButtonTextSelected
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
                  {form.gambar ? 'Ganti Foto' : 'Pilih Foto'}
                </Text>
              </TouchableOpacity>

              {form.gambar && (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: form.gambar }} style={styles.imagePreview} />
                </View>
              )}
            </View>
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
    fontSize: 16,
    color: '#6c757d',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 30,
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
  fabText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '300',
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
});

export default BarangManagementSimple;