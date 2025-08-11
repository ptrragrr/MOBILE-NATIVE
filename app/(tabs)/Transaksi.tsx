// TransactionScreen.js
import React, { useEffect, useState } from 'react';
import {
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
import api from '../axios';

const { width, height } = Dimensions.get('window');

export default function TransactionScreen({ route }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerMoney, setCustomerMoney] = useState('');
  const [categories, setCategories] = useState(['Semua', 'Makanan', 'Minuman', 'Snack']);
  const [selectedCategory, setSelectedCategory] = useState('Semua');

//   export default axios.create({
//   baseURL: 'https://417805b09dd7.ngrok-free.app/tambah/kategori', // pakai URL ngrok + /api
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });

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
            : `https://your-domain.com/storage/${item.foto_barang}`
          : null,
        kategori: item.kategori || 'Lainnya'
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

  const filteredProducts = products.filter(item => {
    const matchesSearch = item.nama?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const addToCart = (barang) => {
    if (barang.stok <= 0) {
      Alert.alert('Stok Habis', 'Produk ini sedang tidak tersedia');
      return;
    }
    
    const existingItem = cart.find(item => item.id === barang.id);
    if (existingItem) {
      if (existingItem.qty >= barang.stok) {
        Alert.alert('Stok Terbatas', `Stok tersedia: ${barang.stok}`);
        return;
      }
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
    const product = products.find(p => p.id === id);
    setCart(cart
      .map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.qty + change);
          if (newQty > product.stok) {
            Alert.alert('Stok Terbatas', `Stok tersedia: ${product.stok}`);
            return item;
          }
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
    const tax = subtotal * 0.11; // PPN 11%
    const discount = 0;
    return { subtotal, tax, discount, total: subtotal + tax - discount };
  };

  const { subtotal, tax, discount, total } = calculateTotal();

  const processPayment = async () => {
    if (selectedPayment === 'cash') {
      const money = parseInt(customerMoney.replace(/\D/g, '')) || 0;
      if (money < total) {
        Alert.alert('Uang Kurang', `Kekurangan: ${formatRupiah(total - money)}`);
        return;
      }
      const change = money - total;
      
      Alert.alert(
        '✅ Pembayaran Berhasil',
        `Kembalian: ${formatRupiah(change)}\nTerima kasih!`,
        [{ text: 'OK', onPress: resetTransaction }]
      );
    } else {
      Alert.alert(
        '✅ Pembayaran Berhasil',
        'Transaksi berhasil diproses',
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
    <TouchableOpacity 
      style={[styles.productCard, item.stok <= 0 && styles.productCardDisabled]} 
      onPress={() => addToCart(item)}
      activeOpacity={0.7}
    >
      <View style={styles.productImageContainer}>
        {item.foto ? (
          <Image
            source={{ uri: item.foto }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.productPlaceholder}>
            <View style={styles.productPlaceholderIcon}>
              <Text style={styles.productPlaceholderText}>
                {item.nama?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          </View>
        )}
        
        <View style={styles.stockBadge}>
          <Text style={styles.stockBadgeText}>{item.stok}</Text>
        </View>
        
        {item.stok > 0 && (
          <View style={styles.addButton}>
            <Text style={styles.addButtonText}>+</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{item.nama}</Text>
        <Text style={styles.productPrice}>{formatRupiah(item.harga)}</Text>
        <View style={styles.stockInfo}>
          <View style={[
            styles.stockDot, 
            { backgroundColor: item.stok > 10 ? '#22c55e' : item.stok > 0 ? '#f59e0b' : '#ef4444' }
          ]} />
          <Text style={styles.stockText}>
            {item.stok} tersedia
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            <Text style={styles.modalTitle}>Pembayaran</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>Total Bayar</Text>
            <Text style={styles.totalAmount}>{formatRupiah(total)}</Text>
          </View>

          <View style={styles.paymentMethods}>
            {[
              { key: 'cash', label: '💵 Tunai', icon: '💵' },
              { key: 'card', label: '💳 Kartu', icon: '💳' },
              { key: 'qris', label: '📱 QRIS', icon: '📱' }
            ].map(method => (
              <TouchableOpacity
                key={method.key}
                style={[
                  styles.paymentMethod,
                  selectedPayment === method.key && styles.paymentMethodActive,
                ]}
                onPress={() => setSelectedPayment(method.key)}
              >
                <Text style={styles.paymentMethodIcon}>{method.icon}</Text>
                <Text style={[
                  styles.paymentMethodText,
                  selectedPayment === method.key && styles.paymentMethodTextActive,
                ]}>
                  {method.label.replace(/[^\w\s]/gi, '')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {selectedPayment === 'cash' && (
            <View style={styles.cashSection}>
              <Text style={styles.inputLabel}>Jumlah Uang Diterima</Text>
              <View style={styles.cashInputContainer}>
                <Text style={styles.currencySymbol}>Rp</Text>
                <TextInput
                  style={styles.cashInput}
                  placeholder="0"
                  value={customerMoney ? parseInt(customerMoney).toLocaleString('id-ID') : ''}
                  onChangeText={text => {
                    const clean = text.replace(/[^0-9]/g, '');
                    setCustomerMoney(clean);
                  }}
                  keyboardType="numeric"
                />
              </View>
              
              {customerMoney && (
                <View style={styles.changeSection}>
                  <Text style={styles.changeLabel}>Kembalian:</Text>
                  <Text style={[
                    styles.changeAmount,
                    { color: parseInt(customerMoney) >= total ? '#10b981' : '#ef4444' }
                  ]}>
                    {formatRupiah(Math.max(0, parseInt(customerMoney || '0') - total))}
                  </Text>
                </View>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.payButton,
              (selectedPayment === 'cash' && (!customerMoney || parseInt(customerMoney) < total)) 
                && styles.payButtonDisabled
            ]}
            onPress={processPayment}
            disabled={selectedPayment === 'cash' && (!customerMoney || parseInt(customerMoney) < total)}
          >
            <Text style={styles.payButtonText}>
              💰 Bayar {formatRupiah(total)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#ffffffff" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.storeIcon}>
            <Text style={styles.storeIconText}>🏪</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>Toko Sejahtera</Text>
            <Text style={styles.headerSubtitle}>Point of Sale System</Text>
          </View>
        </View>
        
        <View style={styles.cartBadge}>
          <Text style={styles.cartBadgeText}>{cart.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Products Section */}
        <View style={styles.productsSection}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Cari produk..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
          </View>

          {/* Category Filter */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {categories.map(category => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.categoryButtonTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Products Grid */}
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
          <View style={styles.cartHeader}>
            <View style={styles.cartTitleContainer}>
              <Text style={styles.cartIcon}>🛒</Text>
              <Text style={styles.cartTitle}>Keranjang</Text>
            </View>
            {cart.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={() => setCart([])}
              >
                <Text style={styles.clearButtonText}>Kosongkan</Text>
              </TouchableOpacity>
            )}
          </View>

          {cart.length === 0 ? (
            <View style={styles.emptyCart}>
              <Text style={styles.emptyCartIcon}>🛒</Text>
              <Text style={styles.emptyCartText}>Keranjang Kosong</Text>
              <Text style={styles.emptyCartSubtext}>Pilih produk untuk memulai transaksi</Text>
            </View>
          ) : (
            <>
              <View style={styles.cartList}>
                {cart.map((item) => (
                  <View key={item.id} style={styles.cartItem}>
                    <View style={styles.cartItemImage}>
                      {item.foto ? (
                        <Image source={{ uri: item.foto }} style={styles.cartImage} />
                      ) : (
                        <View style={styles.cartImagePlaceholder}>
                          <Text style={styles.cartImageText}>
                            {item.nama?.charAt(0).toUpperCase() || '?'}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <View style={styles.cartItemDetails}>
                      <Text style={styles.cartItemName}>{item.nama}</Text>
                      <Text style={styles.cartItemPrice}>{formatRupiah(item.harga)}</Text>
                      <Text style={styles.cartItemTotal}>{formatRupiah(item.harga * item.qty)}</Text>
                    </View>
                    
                    <View style={styles.cartItemActions}>
                      <View style={styles.quantityControl}>
                        <TouchableOpacity 
                          style={styles.quantityBtn}
                          onPress={() => updateQuantity(item.id, -1)}
                        >
                          <Text style={styles.quantityBtnText}>−</Text>
                        </TouchableOpacity>
                        <View style={styles.quantityContainer}>
                          <Text style={styles.quantityText}>{item.qty}</Text>
                        </View>
                        <TouchableOpacity 
                          style={styles.quantityBtn}
                          onPress={() => updateQuantity(item.id, 1)}
                        >
                          <Text style={styles.quantityBtnText}>+</Text>
                        </TouchableOpacity>
                      </View>
                      
                      <TouchableOpacity 
                        style={styles.deleteBtn}
                        onPress={() => removeFromCart(item.id)}
                      >
                        <Text style={styles.deleteBtnText}>🗑</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>PPN (11%)</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(tax)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.totalRow}>
                  <Text style={styles.totalRowLabel}>Total</Text>
                  <Text style={styles.totalRowValue}>{formatRupiah(total)}</Text>
                </View>
              </View>

              {/* Checkout Button */}
              <TouchableOpacity
                style={styles.checkoutButton}
                onPress={() => setShowPaymentModal(true)}
              >
                <Text style={styles.checkoutButtonText}>
                  💰 Bayar {formatRupiah(total)}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      <PaymentModal />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffffff',
  },

  // Header
  header: {
    backgroundColor: '#ffffffff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIcon: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
  },
  storeIconText: {
    fontSize: 24,
  },
  headerInfo: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000ff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.8)',
    marginTop: 2,
  },
  cartBadge: {
    backgroundColor: '#dc2626',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Content
  content: {
    flex: 1,
    padding: 16,
  },

  // Products Section
  productsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 25,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1f2937',
  },

  // Categories
  categoryContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryButtonActive: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  categoryButtonTextActive: {
    color: '#ffffff',
  },

  // Products List
  productsList: {
    paddingBottom: 10,
  },

  // Product Card
  productCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    margin: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  productCardDisabled: {
    opacity: 0.6,
  },
  productImageContainer: {
    position: 'relative',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e2e8f0',
  },
  productPlaceholderIcon: {
    backgroundColor: '#9ca3af',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productPlaceholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  stockBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  stockBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: '#22c55e',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    height: 40,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
    marginBottom: 8,
  },
  stockInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  stockText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },

  // Cart Section
  cartSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cartTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cartTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  clearButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Empty Cart
  emptyCart: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyCartIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },

  // Cart List
  cartList: {
    marginBottom: 20,
  },

  // Cart Item
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  cartItemImage: {
    marginRight: 16,
  },
  cartImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  cartImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartImageText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  cartItemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  cartItemActions: {
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  quantityBtn: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    margin: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  quantityBtnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  quantityContainer: {
    paddingHorizontal: 16,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 16,
  },

  // Summary
  summary: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '600',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalRowLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalRowValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f46e5',
  },

  // Checkout Button
  checkoutButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#6b7280',
    fontWeight: 'bold',
  },

  // Total Section
  totalSection: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  totalLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '500',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },

  // Payment Methods
  paymentMethods: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  paymentMethod: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  paymentMethodActive: {
    borderColor: '#4f46e5',
    backgroundColor: '#eff6ff',
  },
  paymentMethodIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  paymentMethodTextActive: {
    color: '#4f46e5',
  },

  // Cash Section
  cashSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  cashInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    color: '#6b7280',
    fontWeight: 'bold',
    marginRight: 8,
  },
  cashInput: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 20,
    color: '#1f2937',
    fontWeight: 'bold',
  },
  changeSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  changeLabel: {
    fontSize: 16,
    color: '#065f46',
    fontWeight: '600',
  },
  changeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },

  // Pay Button
  payButton: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  payButtonDisabled: {
    backgroundColor: '#d1d5db',
    shadowOpacity: 0,
    elevation: 0,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});