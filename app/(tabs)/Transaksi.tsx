// TransactionScreen.js
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
import api from '../axios'; // pastikan sudah ada axios instance

export default function TransactionScreen({ route }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerMoney, setCustomerMoney] = useState('');

  const fetchBarang = async () => {
    try {
      const res = await api.get('/tambah/barang');
      const rawData = Array.isArray(res.data.data) ? res.data.data : [];

      const mappedData = rawData.map(item => ({
        id: item.id,
        nama: item.nama_barang,
        harga: parseInt(item.harga_barang),
        stok: item.stok_barang,
        foto: item.foto_barang
          ? item.foto_barang.startsWith('http')
            ? item.foto_barang
            : `https://your-domain.com/storage/${item.foto_barang}` // ganti domain
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

  const formatRupiah = (amount) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);

  const filteredProducts = products.filter(item =>
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
      <View style={styles.productImageContainer}>
        {item.foto ? (
          <Image
            source={{ uri: item.foto }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productPlaceholder}>
            <Text style={styles.productEmoji}>📦</Text>
          </View>
        )}
        <View style={styles.addToCartBadge}>
          <Text style={styles.addToCartText}>+</Text>
        </View>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.nama}</Text>
        <Text style={styles.productPrice}>{formatRupiah(item.harga)}</Text>
        <View style={styles.stockContainer}>
          <View style={[styles.stockDot, { backgroundColor: item.stok > 10 ? '#00D084' : item.stok > 0 ? '#FF8A00' : '#FF4757' }]} />
          <Text style={styles.productStock}>Stok: {item.stok}</Text>
        </View>
      </View>
    </Pressable>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemImageContainer}>
        {item.foto ? (
          <Image
            source={{ uri: item.foto }}
            style={styles.cartItemImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.cartItemPlaceholder}>
            <Text style={styles.cartItemEmoji}>📦</Text>
          </View>
        )}
      </View>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.nama}</Text>
        <Text style={styles.cartItemPrice}>{formatRupiah(item.harga)}</Text>
        <Text style={styles.cartItemSubtotal}>{formatRupiah(item.harga * item.qty)}</Text>
      </View>
      <View style={styles.cartItemActions}>
        <View style={styles.quantityControls}>
          <Pressable style={styles.quantityButton} onPress={() => updateQuantity(item.id, -1)}>
            <Text style={styles.quantityButtonText}>−</Text>
          </Pressable>
          <View style={styles.quantityContainer}>
            <Text style={styles.quantity}>{item.qty}</Text>
          </View>
          <Pressable style={styles.quantityButton} onPress={() => updateQuantity(item.id, 1)}>
            <Text style={styles.quantityButtonText}>+</Text>
          </Pressable>
        </View>
        <Pressable style={styles.removeButton} onPress={() => removeFromCart(item.id)}>
          <Text style={styles.removeButtonText}>🗑️</Text>
        </Pressable>
      </View>
    </View>
  );

  // Payment modal component
  const PaymentModal = () => (
    <Modal
      visible={showPaymentModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowPaymentModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>💳 Pembayaran</Text>
            <Text style={styles.modalSubtitle}>Total: {formatRupiah(total)}</Text>
          </View>

          <View style={styles.paymentMethods}>
            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedPayment === 'cash' && styles.methodButtonSelected,
              ]}
              onPress={() => setSelectedPayment('cash')}
            >
              <Text style={styles.methodEmoji}>💵</Text>
              <Text style={[
                styles.methodButtonText,
                selectedPayment === 'cash' && styles.methodButtonTextSelected,
              ]}>Tunai</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.methodButton,
                selectedPayment === 'card' && styles.methodButtonSelected,
              ]}
              onPress={() => setSelectedPayment('card')}
            >
              <Text style={styles.methodEmoji}>💳</Text>
              <Text style={[
                styles.methodButtonText,
                selectedPayment === 'card' && styles.methodButtonTextSelected,
              ]}>Kartu</Text>
            </TouchableOpacity>
          </View>

          {selectedPayment === 'cash' && (
            <View style={styles.cashInputSection}>
              <Text style={styles.modalLabel}>💰 Jumlah Uang</Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencyPrefix}>Rp</Text>
                <TextInput
                  placeholder="0"
                  value={customerMoney}
                  onChangeText={text => {
                    const clean = text.replace(/[^0-9]/g, '');
                    setCustomerMoney(clean);
                  }}
                  keyboardType="numeric"
                  style={styles.modalInput}
                />
              </View>
              {customerMoney && (
                <Text style={styles.changeAmount}>
                  Kembalian: {formatRupiah(Math.max(0, parseInt(customerMoney || '0') - total))}
                </Text>
              )}
            </View>
          )}

          <View style={styles.modalActions}>
            <Pressable
              style={styles.modalPayButton}
              onPress={processPayment}
            >
              <Text style={styles.modalPayButtonText}>
                {selectedPayment === 'cash' ? '💵 Bayar Tunai' : '💳 Bayar Kartu'}
              </Text>
            </Pressable>

            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalCancelButtonText}>Batal</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerIcon}>🏪</Text>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Toko Sejahtera</Text>
            <Text style={styles.headerSubtitle}>Point of Sale System</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Products */}
        <View style={styles.productsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛍️ Pilih Produk</Text>
            <Text style={styles.productCount}>{filteredProducts.length} items</Text>
          </View>
          
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              placeholder="Cari produk..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholderTextColor="#94A3B8"
            />
          </View>
          
          <FlatList
            data={filteredProducts}
            renderItem={renderProduct}
            keyExtractor={item => item.id.toString()}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsList}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Cart Section */}
        <View style={styles.cartSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🛒 Keranjang</Text>
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cart.length}</Text>
            </View>
          </View>
          
          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartIcon}>🛒</Text>
              <Text style={styles.emptyCartText}>Keranjang masih kosong</Text>
              <Text style={styles.emptyCartSubtext}>Tambahkan produk untuk mulai transaksi</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cart}
                renderItem={renderCartItem}
                keyExtractor={item => item.id.toString()}
                scrollEnabled={false}
                style={styles.cartList}
                showsVerticalScrollIndicator={false}
              />

              {/* RINGKASAN TOTAL */}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>PPN (10%)</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(tax)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total Bayar</Text>
                  <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
                </View>
              </View>

              {/* Tombol Bayar */}
              <Pressable
                style={[styles.payButton, cart.length === 0 && styles.payButtonDisabled]}
                disabled={cart.length === 0}
                onPress={() => setShowPaymentModal(true)}
              >
                <Text style={styles.payButtonIcon}>💰</Text>
                <Text style={styles.payButtonText}>Lanjut ke Pembayaran</Text>
              </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  
  // Header Styles
  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  headerText: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1E293B',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  
  scrollContainer: {
    flex: 1,
  },
  
  // Section Styles
  productsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  
  cartSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    minHeight: 300,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  
  productCount: {
    fontSize: 14,
    color: '#64748B',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    fontWeight: '600',
  },
  
  // Search Styles
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
  },
  
  // Products List
  productsList: {
    paddingBottom: 10,
  },
  
  // Product Card
  productCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  productImageContainer: {
    position: 'relative',
    height: 120,
    backgroundColor: '#F8FAFC',
  },
  
  productImage: {
    width: '100%',
    height: '100%',
  },
  
  productPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  
  productEmoji: {
    fontSize: 40,
    opacity: 0.5,
  },
  
  addToCartBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#3B82F6',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  addToCartText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 18,
  },
  
  productInfo: {
    padding: 12,
  },
  
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
    height: 34,
  },
  
  productPrice: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '700',
    marginBottom: 6,
  },
  
  stockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  
  productStock: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  
  // Cart Styles
  cartBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    minWidth: 28,
    alignItems: 'center',
  },
  
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  
  emptyCart: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emptyCartIcon: {
    fontSize: 60,
    opacity: 0.3,
    marginBottom: 16,
  },
  
  emptyCartText: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  
  emptyCartSubtext: {
    color: '#94A3B8',
    fontSize: 14,
  },
  
  cartList: {
    maxHeight: 300,
    marginBottom: 20,
  },
  
  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  
  cartItemImageContainer: {
    marginRight: 12,
  },
  
  cartItemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  
  cartItemPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  cartItemEmoji: {
    fontSize: 24,
  },
  
  cartItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  
  cartItemPrice: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 2,
  },
  
  cartItemSubtotal: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '600',
  },
  
  cartItemActions: {
    alignItems: 'center',
  },
  
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 2,
    marginBottom: 8,
  },
  
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  quantityButtonText: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 18,
  },
  
  quantityContainer: {
    minWidth: 40,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  
  quantity: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  
  removeButton: {
    padding: 8,
  },
  
  removeButtonText: {
    fontSize: 16,
  },
  
  // Summary Styles
  summary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  
  summaryValue: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  
  totalValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#3B82F6',
  },
  
  // Payment Button
  payButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  payButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
    elevation: 0,
  },
  
  payButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  
  payButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  
  modalHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  
  modalSubtitle: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },
  
  paymentMethods: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  
  methodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  
  methodButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EFF6FF',
  },
  
  methodEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  
  methodButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 14,
  },
  
  methodButtonTextSelected: {
    color: '#3B82F6',
  },
  
  cashInputSection: {
    marginBottom: 24,
  },
  
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  
  currencyPrefix: {
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
    marginRight: 8,
  },
  
  modalInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
  },
  
  changeAmount: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  
  modalActions: {
    gap: 12,
  },
  
  modalPayButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  
  modalPayButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  
  modalCancelButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  
  modalCancelButtonText: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
});