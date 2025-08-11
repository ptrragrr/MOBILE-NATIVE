// TransactionScreen.js
import React, { useEffect, useState } from 'react';
import {
  Alert, FlatList, Image,
  Pressable, ScrollView,
  StyleSheet, Text, TextInput, View
} from 'react-native';
import api from './axios'; // axios instance

export default function TransactionScreen({ route }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerMoney, setCustomerMoney] = useState('');

  // Ambil barang dari API & mapping ke format transaksi
  const fetchBarang = async () => {
    try {
      const res = await api.get('/tambah/barang');
      console.log("API response:", res.data);

      const rawData = Array.isArray(res.data.data) ? res.data.data : [];

      const mappedData = rawData.map(item => ({
        id: item.id,
        nama: item.nama_barang,
        harga: parseInt(item.harga_barang),
        stok: item.stok_barang,
        foto: item.foto_barang
          ? item.foto_barang.startsWith('http')
            ? item.foto_barang
            : `https://your-domain.com/storage/${item.foto_barang}` // ganti dengan domain kamu
          : null
      }));

      setProducts(mappedData);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Gagal memuat data barang');
    }
  };

  useEffect(() => {
    fetchBarang();
  }, []);

  useEffect(() => {
    if (route?.params?.refresh) {
      fetchBarang();
    }
  }, [route?.params?.refresh]);

  const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(amount);

  const filteredProducts = products.filter((item) =>
    item.nama?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (barang) => {
    const existingItem = cart.find(item => item.id === barang.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === barang.id
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...barang, qty: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCart(cart
      .map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.qty + change);
          return newQty === 0 ? null : { ...item, qty: newQty };
        }
        return item;
      })
      .filter(Boolean)
    );
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const tax = subtotal * 0.1;
    return { subtotal, tax, total: subtotal + tax };
  };

  const { subtotal, tax, total } = calculateTotal();

  const processPayment = () => {
    if (selectedPayment === 'cash') {
      const money = parseInt(customerMoney.replace(/\D/g, '')) || 0;
      if (money < total) {
        Alert.alert('Error', 'Uang tidak cukup!');
        return;
      }
      const change = money - total;
      Alert.alert(
        'Pembayaran Berhasil',
        `Kembalian: ${formatRupiah(change)}`,
        [{ text: 'OK', onPress: resetTransaction }]
      );
    } else {
      Alert.alert(
        'Pembayaran Berhasil',
        'Transaksi kartu berhasil diproses',
        [{ text: 'OK', onPress: resetTransaction }]
      );
    }
  };

  const resetTransaction = () => {
    setCart([]);
    setCustomerMoney('');
    setShowPaymentModal(false);
  };

  const renderProduct = ({ item }) => (
    <Pressable style={styles.productCard} onPress={() => addToCart(item)}>
      {item.foto ? (
        <Image
          source={{ uri: item.foto }}
          style={{ width: 50, height: 50, borderRadius: 6, marginBottom: 8 }}
          resizeMode="cover"
        />
      ) : (
        <Text style={styles.productEmoji}>📦</Text>
      )}
      <Text style={styles.productName}>{item.nama}</Text>
      <Text style={styles.productPrice}>{formatRupiah(item.harga)}</Text>
      <Text style={styles.productStock}>Stok: {item.stok}</Text>
    </Pressable>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        {item.foto ? (
          <Image
            source={{ uri: item.foto }}
            style={{ width: 40, height: 40, borderRadius: 4, marginRight: 12 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={styles.cartItemEmoji}>📦</Text>
        )}
        <View style={styles.cartItemDetails}>
          <Text style={styles.cartItemName}>{item.nama}</Text>
          <Text style={styles.cartItemPrice}>{formatRupiah(item.harga)}</Text>
        </View>
      </View>
      <View style={styles.quantityControls}>
        <Pressable style={styles.quantityButton} onPress={() => updateQuantity(item.id, -1)}>
          <Text style={styles.quantityButtonText}>-</Text>
        </Pressable>
        <Text style={styles.quantity}>{item.qty}</Text>
        <Pressable style={styles.quantityButton} onPress={() => updateQuantity(item.id, 1)}>
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
      </View>
      <Pressable style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
        <Text style={styles.removeButtonText}>×</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi POS</Text>
        <Text style={styles.headerSubtitle}>Toko Sejahtera</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Products */}
        <View style={styles.productsSection}>
          <Text style={styles.sectionTitle}>Pilih Produk</Text>
          <TextInput
            placeholder="Cari produk..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsList}
          />
        </View>

        {/* Cart */}
        <View style={styles.cartSection}>
          <Text style={styles.sectionTitle}>Keranjang ({cart.length})</Text>
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartText}>Keranjang kosong</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
                style={styles.cartList}
              />
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// styles tetap pakai punyamu

// Styles tetap bisa pakai dari kode kamu sebelumnya
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#495057',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  productsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginBottom: 8,
  },
  cartSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    minHeight: 400,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  searchInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#DEE2E6',
    fontSize: 16,
  },
  productsList: {
    paddingBottom: 20,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 6,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E9ECEF',
    minHeight: 120,
    justifyContent: 'center',
  },
  productEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    color: '#212529',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 13,
    color: '#007BFF',
    fontWeight: '600',
    marginBottom: 2,
  },
  productStock: {
    fontSize: 11,
    color: '#6C757D',
  },
  emptyCart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    color: '#6C757D',
    fontSize: 16,
  },
  cartList: {
    maxHeight: 250,
    marginBottom: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  cartItemInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartItemEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  cartItemPrice: {
    fontSize: 12,
    color: '#6C757D',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 4,
    backgroundColor: '#6C757D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  quantity: {
    marginHorizontal: 12,
    fontSize: 16,
    fontWeight: '600',
    minWidth: 30,
    textAlign: 'center',
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 4,
    backgroundColor: '#DC3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6C757D',
  },
  summaryValue: {
    fontSize: 14,
    color: '#212529',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  paymentMethods: {
    marginBottom: 16,
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  paymentButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#007BFF',
    alignItems: 'center',
  },
  paymentButtonActive: {
    backgroundColor: '#007BFF',
  },
  paymentButtonText: {
    fontSize: 14,
    color: '#007BFF',
    fontWeight: '600',
  },
  paymentButtonTextActive: {
    color: '#FFFFFF',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 20,
  },
  payButton: {
    backgroundColor: '#28A745',
    paddingVertical: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    borderWidth: 1,
    borderColor: '#6C757D',
    paddingVertical: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#6C757D',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalSummary: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
  },
  modalTotalLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  modalTotalValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007BFF',
  },
  modalPaymentInfo: {
    marginBottom: 20,
  },
  modalPaymentLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 4,
  },
  modalPaymentValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  cashInput: {
    marginBottom: 20,
  },
  cashInputLabel: {
    fontSize: 14,
    color: '#6C757D',
    marginBottom: 8,
  },
  cashInputField: {
    borderWidth: 1,
    borderColor: '#DEE2E6',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#28A745',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#6C757D',
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6C757D',
    fontSize: 16,
  },
  footer: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  footerText: {
    color: '#6C757D',
    fontSize: 12,
  },
});