import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import axios from 'axios';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
        Authorization: `Bearer ${token}`
      }
    });
    setKategori(res.data.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    Alert.alert('Error', 'Gagal memuat kategori dari server');
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
      <Image source={{ uri: item.foto_barang }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.nama_barang}</Text>
        <Text style={styles.desc}>{item.deskripsi}</Text>
        <Text style={styles.price}>{formatRupiah(item.harga_barang)}</Text>
        <Text style={{ fontSize: 13, marginTop: 4 }}>Stok: {item.stok_barang}</Text>

        <View style={styles.actionContainer}>
          <Pressable style={styles.editBtn} onPress={() => openEdit(item)}>
            <Text>Edit</Text>
          </Pressable>
          <Pressable style={styles.deleteBtn} onPress={() => handleDeleteBarang(item.id)}>
            <Text style={{ color: 'red' }}>Hapus</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <TextInput
        placeholder="Cari barang..."
        style={styles.search}
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <FlatList
        data={filteredBarang}
        keyExtractor={item => item.id.toString()}
        renderItem={renderBarang}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20 }}>Tidak ada barangs</Text>}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setShowAddBarang(true)}>
        <Text style={{ fontSize: 24, color: 'white' }}>+</Text>
      </TouchableOpacity>

      <Modal visible={showAddBarang || showEditBarang} animationType="slide">
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <TextInput
            placeholder="Nama Barang"
            value={barangForm.nama}
            onChangeText={text => setBarangForm({ ...barangForm, nama: text })}
            style={styles.input}
          />

          {/* DROPDOWN KATEGORI */}
          {loadingKategori ? (
            <ActivityIndicator size="small" color="#667eea" />
          ) : (
            <Picker
              selectedValue={barangForm.kategori}
              onValueChange={(value) => setBarangForm({ ...barangForm, kategori: value })}
              style={styles.input}
            >
              <Picker.Item label="Pilih Kategori" value="" />
              {categoriesApi.map(cat => (
                <Picker.Item key={cat.id} label={cat.nama} value={cat.id.toString()} />
              ))}
            </Picker>
          )}

          <TextInput
            placeholder="Harga"
            keyboardType="numeric"
            value={barangForm.harga}
            onChangeText={text => setBarangForm({ ...barangForm, harga: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Stok"
            keyboardType="numeric"
            value={barangForm.stok}
            onChangeText={text => setBarangForm({ ...barangForm, stok: text })}
            style={styles.input}
          />
          <TextInput
            placeholder="Deskripsi"
            value={barangForm.deskripsi}
            onChangeText={text => setBarangForm({ ...barangForm, deskripsi: text })}
            style={styles.input}
            multiline
          />

          <TouchableOpacity style={styles.pickImageBtn} onPress={handleImagePicker}>
            <Text style={{ color: '#555' }}>Pilih Foto</Text>
          </TouchableOpacity>

          {barangForm.gambar ? (
            <Image source={{ uri: barangForm.gambar }} style={styles.previewImg} />
          ) : null}

          <View style={styles.modalAction}>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: 'green' }]}
              onPress={showEditBarang ? handleEditBarang : handleAddBarang}
            >
              <Text style={{ color: 'white' }}>{showEditBarang ? 'Update' : 'Simpan'}</Text>
            </Pressable>
            <Pressable
              style={[styles.modalBtn, { backgroundColor: 'gray' }]}
              onPress={() => {
                resetForm();
                setShowAddBarang(false);
                setShowEditBarang(false);
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
  search: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, marginTop: 24 },
  card: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, marginBottom: 12, borderRadius: 12, elevation: 2 },
  image: { width: 80, height: 80, marginRight: 12, borderRadius: 8 },
  title: { fontSize: 16, fontWeight: 'bold' },
  desc: { fontSize: 12, color: '#555' },
  price: { fontSize: 14, color: 'green', marginTop: 4 },
  actionContainer: { flexDirection: 'row', marginTop: 8 },
  editBtn: { backgroundColor: '#e0f7e9', padding: 6, marginRight: 8, borderRadius: 4 },
  deleteBtn: { backgroundColor: '#ffe4e1', padding: 6, borderRadius: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#FF69B4', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 12, borderRadius: 8 },
  pickImageBtn: { borderWidth: 1, borderColor: '#999', padding: 10, borderRadius: 6, alignItems: 'center' },
  previewImg: { width: '100%', height: 200, marginTop: 12, borderRadius: 8 },
  modalBtn: { padding: 12, borderRadius: 8, width: '48%', alignItems: 'center' },
  modalAction: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' }
});
