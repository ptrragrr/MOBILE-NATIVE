import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

export default function TransactionScreen() {
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('cash');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [customerMoney, setCustomerMoney] = useState('');
  const [Barang, setBarang] = useState([]);


  // Sample products data
  const products = [
    { id: '1', nama: 'Kopi Arabica', harga: 25000, stok: 50, foto: '☕', kategori: 'Minuman' },
    { id: '2', nama: 'Teh Hijau', harga: 15000, stok: 30, foto: '🍃', kategori: 'Minuman' },
    { id: '3', nama: 'Roti Bakar', harga: 12000, stok: 20, foto: '🍞', kategori: 'Makanan' },
    { id: '4', nama: 'Susu UHT', harga: 8000, stok: 40, foto: '🥛', kategori: 'Minuman' },
    { id: '5', nama: 'Es Krim', harga: 18000, stok: 25, foto: '🍦', kategori: 'Dessert' },
    { id: '6', nama: 'Sandwich', harga: 22000, stok: 15, foto: '🥪', kategori: 'Makanan' },
    { id: '7', nama: 'Donat', harga: 10000, stok: 35, foto: '🍩', kategori: 'Dessert' },
    { id: '8', nama: 'Jus Jeruk', harga: 20000, stok: 28, foto: '🍊', kategori: 'Minuman' },
  ];

  

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatRupiahInput = (text) => {
    const cleaned = text.replace(/\D/g, '');
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(parseInt(cleaned || '0'));
  };

  const filteredProducts = products.filter((item) =>
    item.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, qty: item.qty + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
  };

  const updateQuantity = (id, change) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + change);
        return newQty === 0 ? null : { ...item, qty: newQty };
      }
      return item;
    }).filter(Boolean));
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
      <Text style={styles.productEmoji}>{item.foto}</Text>
      <Text style={styles.productName}>{item.nama}</Text>
      <Text style={styles.productPrice}>{formatRupiah(item.harga)}</Text>
      <Text style={styles.productStock}>Stok: {item.stok}</Text>
    </Pressable>
  );

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemEmoji}>{item.foto}</Text>
        <View style={styles.cartItemDetails}>
          <Text style={styles.cartItemName}>{item.nama}</Text>
          <Text style={styles.cartItemPrice}>{formatRupiah(item.harga)}</Text>
        </View>
      </View>
      <View style={styles.quantityControls}>
        <Pressable
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, -1)}
        >
          <Text style={styles.quantityButtonText}>-</Text>
        </Pressable>
        <Text style={styles.quantity}>{item.qty}</Text>
        <Pressable
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.id, 1)}
        >
          <Text style={styles.quantityButtonText}>+</Text>
        </Pressable>
      </View>
      <Pressable
        style={styles.removeButton}
        onPress={() => removeFromCart(item.id)}
      >
        <Text style={styles.removeButtonText}>×</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi POS</Text>
        <Text style={styles.headerSubtitle}>Toko Sejahtera</Text>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Products Section */}
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
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            contentContainerStyle={styles.productsList}
          />
        </View>

        {/* Cart Section */}
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
                keyExtractor={item => item.id}
                scrollEnabled={false}
                style={styles.cartList}
              />
              
              {/* Summary */}
              <View style={styles.summary}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(subtotal)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pajak (10%)</Text>
                  <Text style={styles.summaryValue}>{formatRupiah(tax)}</Text>
                </View>
                <View style={[styles.summaryRow, styles.totalRow]}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>{formatRupiah(total)}</Text>
                </View>
              </View>

              {/* Payment Methods */}
              <View style={styles.paymentMethods}>
                <Text style={styles.paymentTitle}>Metode Pembayaran</Text>
                <View style={styles.paymentButtons}>
                  <Pressable
                    style={[
                      styles.paymentButton,
                      selectedPayment === 'cash' && styles.paymentButtonActive
                    ]}
                    onPress={() => setSelectedPayment('cash')}
                  >
                    <Text style={[
                      styles.paymentButtonText,
                      selectedPayment === 'cash' && styles.paymentButtonTextActive
                    ]}>💰 Tunai</Text>
                  </Pressable>
                  <Pressable
                    style={[
                      styles.paymentButton,
                      selectedPayment === 'card' && styles.paymentButtonActive
                    ]}
                    onPress={() => setSelectedPayment('card')}
                  >
                    <Text style={[
                      styles.paymentButtonText,
                      selectedPayment === 'card' && styles.paymentButtonTextActive
                    ]}>💳 Kartu</Text>
                  </Pressable>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <Pressable
                  style={styles.payButton}
                  onPress={() => setShowPaymentModal(true)}
                >
                  <Text style={styles.payButtonText}>Bayar {formatRupiah(total)}</Text>
                </Pressable>
                <Pressable style={styles.resetButton} onPress={resetTransaction}>
                  <Text style={styles.resetButtonText}>Reset Keranjang</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </ScrollView>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Konfirmasi Pembayaran</Text>
            
            <View style={styles.modalSummary}>
              <Text style={styles.modalTotalLabel}>Total Pembayaran</Text>
              <Text style={styles.modalTotalValue}>{formatRupiah(total)}</Text>
            </View>

            <View style={styles.modalPaymentInfo}>
              <Text style={styles.modalPaymentLabel}>Metode Pembayaran</Text>
              <Text style={styles.modalPaymentValue}>
                {selectedPayment === 'cash' ? '💰 Tunai' : '💳 Kartu'}
              </Text>
            </View>

            {selectedPayment === 'cash' && (
              <View style={styles.cashInput}>
                <Text style={styles.cashInputLabel}>Uang Diterima</Text>
                <TextInput
                  placeholder="Masukkan jumlah uang"
                  value={customerMoney}
                  onChangeText={(text) => setCustomerMoney(formatRupiahInput(text))}
                  keyboardType="numeric"
                  style={styles.cashInputField}
                />
              </View>
            )}

            <View style={styles.modalButtons}>
              <Pressable style={styles.confirmButton} onPress={processPayment}>
                <Text style={styles.confirmButtonText}>Konfirmasi</Text>
              </Pressable>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setShowPaymentModal(false)}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Toko Sejahtera - POS System v1.0.0</Text>
      </View>
    </View>
  );
}

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