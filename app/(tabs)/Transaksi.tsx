// app/Transaksi.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../axios';

const { width } = Dimensions.get('window');

/** ==== Types ==== */
type Barang = {
  id: number;
  nama_barang: string;
  harga: number;
  stok: number;
  foto_barang?: string | null;
  kategori?: string | null;
  kategori_nama?: string | null;
};

type CartItem = Barang & {
  quantity: number;
  price: number;
};

type PaymentData = {
  paymentMethod: 'Tunai' | 'Debit';
  cashReceived: number;
};

type ReceiptData = {
  kodeTransaksi: string;
  kasir: string;
  tanggal: string;
  waktu: string;
  items: CartItem[];
  subtotal: number;
  total: number;
  metodePembayaran: 'Tunai' | 'Debit';
  uangTunai: number;
  kembalian: number;
};

const Transaksi: React.FC = () => {
  const [barangList, setBarangList] = useState<Barang[]>([]);
  const [categories, setCategories] = useState<string[]>(['Semua']);
  const [selectedCategory, setSelectedCategory] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: 'Tunai',
    cashReceived: 0,
  });

  /** ==== Fetchers ==== */
  const fetchBarang = async () => {
    try {
      const res = await api.get('/tambah/barang');
      let dataBarang: any[] = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : [];

      const mapped: Barang[] = dataBarang
        .map((item: any) => ({
          ...item,
          harga: parseInt(item.harga ?? item.harga_barang ?? 0, 10) || 0,
          stok: parseInt(item.stok ?? item.stok_barang ?? 0, 10) || 0,
          kategori: item.kategori ?? item.kategori_nama ?? item.kategoriNama ?? null,
        }))
        .filter((item: Barang) => (item.stok ?? 0) > 0);

      setBarangList(mapped);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      console.error('Error fetching barang:', err?.response?.data || err?.message);
      setBarangList([]);
    }
  };

  const fetchKategori = async () => {
    try {
      const res = await api.get('/tambah/kategori');
      const raw: any[] = Array.isArray(res.data?.data) ? res.data.data : [];
      const clean = raw.map((cat: any) => (cat?.nama ?? '').toString().trim()).filter(Boolean);
      const unique = Array.from(new Set(clean));
      setCategories(['Semua', ...unique]);
    } catch (err) {
      console.error('Error fetching kategori:', err);
      setCategories(['Semua']);
    }
  };

  useEffect(() => {
    fetchBarang();
    fetchKategori();
  }, []);

  /** ==== Derived State ==== */
  const filteredBarang = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return barangList.filter((item) => {
      const matchCategory =
        selectedCategory === 'Semua' ||
        (item.kategori ?? '').toString().toLowerCase() === selectedCategory.toLowerCase();
      const matchSearch = (item.nama_barang ?? '').toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [barangList, selectedCategory, searchQuery]);

  const totalAmount = useMemo(
    () => cart.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0),
    [cart]
  );

  /** ==== Cart Ops ==== */
  const addToCart = (item: Barang) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === item.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 };
        return copy;
      }
      return [...prev, { ...item, price: item.harga || 0, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => {
      const idx = prev.findIndex((p) => p.id === itemId);
      if (idx < 0) return prev;
      const target = prev[idx];
      if (target.quantity > 1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity - 1 };
        return copy;
      }
      return prev.filter((p) => p.id !== itemId);
    });
  };

  const getItemQuantity = (itemId: number) => {
    return cart.find((it) => it.id === itemId)?.quantity ?? 0;
  };

  /** ==== Checkout & Payment ==== */
  const processTransaction = async () => {
    if (cart.length === 0) return;
    setShowPaymentModal(true);
  };

  const finalizePayment = async () => {
    try {
      const userStr = await AsyncStorage.getItem('User');
      const user = userStr ? JSON.parse(userStr) : null;

      if (!user?.name) {
        alert('User tidak ditemukan. Pastikan sudah login.');
        return;
      }

      if (paymentData.paymentMethod === 'Tunai' && paymentData.cashReceived < totalAmount) {
        alert('Uang tunai kurang dari total pembayaran.');
        return;
      }

      const payload = {
        nama_kasir: user.name,
        metode_pembayaran: paymentData.paymentMethod,
        items: cart.map((it) => ({
          id: it.id,
          name: it.nama_barang,
          price: it.price,
          quantity: it.quantity,
          subtotal: (it.price || 0) * (it.quantity || 0),
        })),
        total: totalAmount,
        payment: {
          method: paymentData.paymentMethod,
          cashReceived:
            paymentData.paymentMethod === 'Tunai' ? paymentData.cashReceived : totalAmount,
          change:
            paymentData.paymentMethod === 'Tunai'
              ? paymentData.cashReceived - totalAmount
              : 0,
        },
        timestamp: new Date().toISOString(),
      };

      const res = await api.post('/transaksi', payload);

      const receipt: ReceiptData = {
        kodeTransaksi: res.data?.kode_transaksi || `TRX-${Date.now()}`,
        kasir: user.name,
        tanggal: new Date().toLocaleDateString('id-ID'),
        waktu: new Date().toLocaleTimeString('id-ID'),
        items: cart,
        subtotal: totalAmount,
        total: totalAmount,
        metodePembayaran: paymentData.paymentMethod,
        uangTunai:
          paymentData.paymentMethod === 'Tunai' ? paymentData.cashReceived : totalAmount,
        kembalian:
          paymentData.paymentMethod === 'Tunai'
            ? paymentData.cashReceived - totalAmount
            : 0,
      };

      setReceiptData(receipt);
      setShowPaymentModal(false);
      setShowReceiptModal(true);

      // Reset
      setCart([]);
      setPaymentData({ paymentMethod: 'Tunai', cashReceived: 0 });
    } catch (err: any) {
      console.error('❌ Gagal menyimpan transaksi:', err?.response?.data || err?.message);
      alert('❌ Transaksi gagal disimpan! Cek koneksi atau server.');
    }
  };

  /** ==== PRINT & PDF ==== */
  const buildReceiptHTML = (r: ReceiptData) => {
    const rows = r.items
      .map(
        (it) => `
        <tr>
          <td style="padding:8px;border-bottom:1px solid #ddd;">
            <div style="font-weight:600;">${escapeHtml(it.nama_barang ?? '')}</div>
            <div style="font-size:12px;color:#555;">
              ${it.quantity} x Rp ${(it.price || 0).toLocaleString('id-ID')}
            </div>
          </td>
          <td style="padding:8px;text-align:right;border-bottom:1px solid #ddd;">
            Rp ${((it.price || 0) * (it.quantity || 0)).toLocaleString('id-ID')}
          </td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Struk Belanja</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif; color:#000; padding:16px;">
  <div style="text-align:center; margin-bottom:8px;">
    <div style="font-size:18px; font-weight:700;">TOKO SEMBAKO</div>
    <div style="font-size:12px;">Jl.Manukan</div>
    <div style="font-size:12px;">Telp: 0812-3456-7890</div>
  </div>
  <hr />
  <table style="width:100%; font-size:12px;">
    <tr>
      <td>No. Transaksi</td><td style="text-align:right;">${escapeHtml(r.kodeTransaksi)}</td>
    </tr>
    <tr>
      <td>Kasir</td><td style="text-align:right;">${escapeHtml(r.kasir)}</td>
    </tr>
    <tr>
      <td>Tanggal</td><td style="text-align:right;">${escapeHtml(r.tanggal)}</td>
    </tr>
    <tr>
      <td>Waktu</td><td style="text-align:right;">${escapeHtml(r.waktu)}</td>
    </tr>
  </table>
  <hr />
  <div style="text-align:center; font-weight:600; margin:8px 0;">DAFTAR BELANJA</div>
  <table style="width:100%; border-collapse:collapse; font-size:12px;">
    ${rows}
    <tr>
      <td style="padding:8px; font-weight:600;">Subtotal</td>
      <td style="padding:8px; text-align:right; font-weight:600;">Rp ${r.subtotal.toLocaleString('id-ID')}</td>
    </tr>
    <tr>
      <td style="padding:8px; font-weight:700; border-top:1px solid #000;">TOTAL</td>
      <td style="padding:8px; text-align:right; font-weight:700; border-top:1px solid #000;">Rp ${r.total.toLocaleString('id-ID')}</td>
    </tr>
  </table>
  <hr />
  <table style="width:100%; font-size:12px;">
    <tr>
      <td>Metode Pembayaran</td><td style="text-align:right;">${r.metodePembayaran}</td>
    </tr>
    ${
      r.metodePembayaran === 'Tunai'
        ? `<tr><td>Uang Tunai</td><td style="text-align:right;">Rp ${r.uangTunai.toLocaleString(
            'id-ID'
          )}</td></tr>
           <tr><td>Kembalian</td><td style="text-align:right;">Rp ${r.kembalian.toLocaleString(
             'id-ID'
           )}</td></tr>`
        : ''
    }
  </table>
  <hr />
  <div style="text-align:center; font-size:12px;">Terima kasih atas kunjungan Anda!</div>
</body>
</html>`;
  };

  const handlePrint = async () => {
    if (!receiptData) return;
    const html = buildReceiptHTML(receiptData);
    // Buka dialog print langsung (iOS & Android yang support)
    await Print.printAsync({ html });
  };

  const handleSaveSharePDF = async () => {
    if (!receiptData) return;
    const html = buildReceiptHTML(receiptData);
    const file = await Print.printToFileAsync({ html });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(file.uri, {
        UTI: 'com.adobe.pdf',
        mimeType: 'application/pdf',
      });
    } else {
      alert(`PDF tersimpan di:\n${file.uri}`);
    }
  };

  /** ==== Render ==== */
  const renderProductCard = ({ item }: { item: Barang }) => {
    const quantity = getItemQuantity(item.id);

    return (
      <Animated.View
        style={[
          styles.productCard,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.productImageContainer}>
          <Image
            source={{
              uri: item.foto_barang?.startsWith('http')
                ? (item.foto_barang as string)
                : `https://clear-gnat-certainly.ngrok-free.app/storage/${item.foto_barang}`,
            }}
            style={styles.productImage}
            onError={() => console.log('Image failed to load')}
          />
          {quantity > 0 && (
            <View style={styles.quantityBadge}>
              <Text style={styles.quantityBadgeText}>{quantity}</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {item.nama_barang}
          </Text>
          <Text style={styles.productCategory}>{item.kategori ?? ''}</Text>
          <Text style={styles.productPrice}>
            Rp {(item.harga || 0).toLocaleString('id-ID')}
          </Text>
        </View>

        <View style={styles.productActions}>
          {quantity > 0 ? (
            <View style={styles.quantityControls}>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => removeFromCart(item.id)}
              >
                <Text style={styles.quantityButtonText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.quantityText}>{quantity}</Text>
              <TouchableOpacity
                style={styles.quantityButton}
                onPress={() => addToCart(item)}
              >
                <Text style={styles.quantityButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={() => addToCart(item)}>
              <Text style={styles.addButtonText}>Tambah</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Transaksi</Text>
        <Text style={styles.headerSubtitle}>
          {filteredBarang.length} produk • {cart.length} di keranjang
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchSection}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari produk..."
            placeholderTextColor="#999999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity style={styles.clearButton} onPress={() => setSearchQuery('')}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Category */}
      <View style={styles.categorySection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
          contentContainerStyle={styles.categoryContent}
        >
          {categories.map((cat, idx) => (
            <TouchableOpacity
              key={`${cat}-${idx}`}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat && styles.categoryChipTextActive,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Products */}
      <View style={styles.productsSection}>
        {filteredBarang.length > 0 ? (
          <FlatList
            data={filteredBarang}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderProductCard}
            numColumns={2}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.productsGrid}
            columnWrapperStyle={styles.productRow}
            ItemSeparatorComponent={() => <View style={styles.itemSeparator} />}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🛒</Text>
            <Text style={styles.emptyTitle}>Tidak ada produk</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedCategory !== 'Semua'
                ? 'Coba ubah filter atau pencarian'
                : 'Belum ada produk tersedia'}
            </Text>
          </View>
        )}
      </View>

      {/* Cart Summary */}
      {cart.length > 0 && (
        <View style={styles.cartSummary}>
          <TouchableOpacity style={styles.cartDetailsButton} onPress={() => setShowCartModal(true)}>
            <Text style={styles.cartDetailsIcon}>🛒</Text>
            <View style={styles.cartInfo}>
              <Text style={styles.cartItemCount}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} item
              </Text>
              <Text style={styles.cartTotal}>Rp {totalAmount.toLocaleString('id-ID')}</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.checkoutButton} onPress={processTransaction}>
            <Text style={styles.checkoutButtonText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Cart Modal */}
      <Modal visible={showCartModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.cartModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Keranjang Belanja</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowCartModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={cart}
              keyExtractor={(item) => item.id.toString()}
              style={styles.cartList}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <Image
                    source={{
                      uri: item.foto_barang?.startsWith('http')
                        ? (item.foto_barang as string)
                        : `https://clear-gnat-certainly.ngrok-free.app/storage/${item.foto_barang}`,
                    }}
                    style={styles.cartItemImage}
                    onError={() => console.log('Image failed to load')}
                  />
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.nama_barang}</Text>
                    <Text style={styles.cartItemCategory}>{item.kategori ?? ''}</Text>
                    <Text style={styles.cartItemPrice}>
                      Rp {(item.price || 0).toLocaleString('id-ID')}
                    </Text>
                  </View>
                  <View style={styles.cartItemControls}>
                    <View style={styles.quantityControls}>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => removeFromCart(item.id)}
                      >
                        <Text style={styles.quantityButtonText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity
                        style={styles.quantityButton}
                        onPress={() => addToCart(item)}
                      >
                        <Text style={styles.quantityButtonText}>+</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.cartItemSubtotal}>
                      Rp {((item.price || 0) * (item.quantity || 0)).toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              )}
            />

            <View style={styles.cartSummaryModal}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalAmount}>Rp {totalAmount.toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal visible={showPaymentModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.paymentModalContainer}>
            <View className="modal-header" style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pembayaran</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowPaymentModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.paymentForm}>
              {/* Method */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
                <View style={styles.paymentMethods}>
                  {(['Tunai', 'Debit'] as PaymentData['paymentMethod'][]).map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.paymentMethodButton,
                        paymentData.paymentMethod === method && styles.paymentMethodActive,
                      ]}
                      onPress={() =>
                        setPaymentData((prev) => ({
                          ...prev,
                          paymentMethod: method,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.paymentMethodText,
                          paymentData.paymentMethod === method && styles.paymentMethodTextActive,
                        ]}
                      >
                        {method === 'Tunai' ? '💵 Tunai' : '💳 Debit'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Cash */}
              {paymentData.paymentMethod === 'Tunai' && (
                <View style={styles.formSection}>
                  <Text style={styles.sectionTitle}>Uang Tunai</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Jumlah uang yang diterima"
                    value={
                      paymentData.cashReceived
                        ? `Rp ${Number(paymentData.cashReceived).toLocaleString('id-ID')}`
                        : ''
                    }
                    onChangeText={(text) => {
                      const num = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
                      setPaymentData((prev) => ({ ...prev, cashReceived: num }));
                    }}
                    keyboardType="numeric"
                  />
                  <View style={styles.changeInfo}>
                    <Text style={styles.changeLabel}>
                      Kembalian:{' '}
                      <Text style={styles.changeAmount}>
                        Rp {Math.max(0, paymentData.cashReceived - totalAmount).toLocaleString('id-ID')}
                      </Text>
                    </Text>
                  </View>
                </View>
              )}

              {/* Summary */}
              <View style={styles.formSection}>
                <Text style={styles.sectionTitle}>Ringkasan Pesanan</Text>
                <View style={styles.orderSummary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      Total Item: {cart.reduce((s, it) => s + it.quantity, 0)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal:</Text>
                    <Text style={styles.summaryValue}>Rp {totalAmount.toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.totalRow]}>
                    <Text style={styles.totalLabel}>Total Pembayaran:</Text>
                    <Text style={styles.totalAmount}>Rp {totalAmount.toLocaleString('id-ID')}</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.paymentActions}>
              <TouchableOpacity
                style={[
                  styles.processPaymentButton,
                  paymentData.paymentMethod === 'Tunai' && paymentData.cashReceived < totalAmount
                    ? styles.disabledButton
                    : undefined,
                ]}
                onPress={finalizePayment}
                disabled={paymentData.paymentMethod === 'Tunai' && paymentData.cashReceived < totalAmount}
              >
                <Text style={styles.processPaymentText}>Proses Pembayaran</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Receipt Modal */}
      <Modal visible={showReceiptModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.receiptModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Struk Belanja</Text>
              <TouchableOpacity style={styles.closeButton} onPress={() => setShowReceiptModal(false)}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {receiptData && (
              <ScrollView style={styles.receiptContent} showsVerticalScrollIndicator={false}>
                {/* Header Toko */}
                <View style={styles.receiptHeader}>
                  <Text style={styles.storeName}>TOKO SEMBAKO</Text>
                  <Text style={styles.storeAddress}>Jl.Manukan</Text>
                  <Text style={styles.storeContact}>Telp:0812-3456-7890</Text>
                </View>

                <View style={styles.receiptDivider} />

                {/* Info */}
                <View style={styles.receiptInfo}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>No. Transaksi</Text>
                    <Text style={styles.receiptValue}>{receiptData.kodeTransaksi}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Kasir</Text>
                    <Text style={styles.receiptValue}>{receiptData.kasir}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Tanggal</Text>
                    <Text style={styles.receiptValue}>{receiptData.tanggal}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Waktu</Text>
                    <Text style={styles.receiptValue}>{receiptData.waktu}</Text>
                  </View>
                </View>

                <View style={styles.receiptDivider} />

                {/* Items */}
                <View style={styles.itemsList}>
                  <Text style={styles.itemsHeader}>DAFTAR BELANJA</Text>
                  {receiptData.items.map((item, idx) => (
                    <View key={`${item.id}-${idx}`} style={styles.receiptItem}>
                      <View style={styles.itemNameRow}>
                        <Text style={styles.itemName}>{item.nama_barang}</Text>
                      </View>
                      <View style={styles.itemDetailRow}>
                        <Text style={styles.itemDetail}>
                          {item.quantity} x Rp {(item.price || 0).toLocaleString('id-ID')}
                        </Text>
                        <Text style={styles.itemTotal}>
                          Rp {((item.price || 0) * (item.quantity || 0)).toLocaleString('id-ID')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.receiptDivider} />

                {/* Totals */}
                <View style={styles.receiptSummary}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Subtotal</Text>
                    <Text style={styles.receiptValue}>Rp {receiptData.subtotal.toLocaleString('id-ID')}</Text>
                  </View>
                  <View style={[styles.receiptRow, styles.totalRowReceipt]}>
                    <Text style={styles.totalLabelReceipt}>TOTAL</Text>
                    <Text style={styles.totalValueReceipt}>Rp {receiptData.total.toLocaleString('id-ID')}</Text>
                  </View>
                </View>

                <View style={styles.receiptDivider} />

                {/* Payment */}
                <View style={styles.receiptPayment}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Metode Pembayaran</Text>
                    <Text style={styles.receiptValue}>{receiptData.metodePembayaran}</Text>
                  </View>
                  {receiptData.metodePembayaran === 'Tunai' && (
                    <>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Uang Tunai</Text>
                        <Text style={styles.receiptValue}>
                          Rp {receiptData.uangTunai.toLocaleString('id-ID')}
                        </Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Kembalian</Text>
                        <Text style={styles.receiptValue}>
                          Rp {receiptData.kembalian.toLocaleString('id-ID')}
                        </Text>
                      </View>
                    </>
                  )}
                </View>

                <View style={styles.receiptDivider} />

                {/* Footer */}
                <View style={styles.receiptFooter}>
                  <Text style={styles.footerText}>Terima kasih atas kunjungan Anda!</Text>
                </View>
              </ScrollView>
            )}

            {/* Actions */}
            <View style={styles.receiptActions}>
              <TouchableOpacity style={styles.shareButton} onPress={handleSaveSharePDF}>
                <Text style={styles.shareButtonText}>
                  {Platform.OS === 'ios' ? 'Simpan/Bagikan PDF' : 'Simpan/Bagikan PDF'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.newTransactionButton} onPress={handlePrint}>
                <Text style={styles.newTransactionButtonText}>
                  {Platform.OS === 'ios' ? 'Cetak' : 'Cetak'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Transaksi;

/** ==== Utils ==== */
function escapeHtml(str: string) {
  return str
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/* =======================
   STYLE (TIDAK DIUBAH)
   ======================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#333333', marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: '#666666', opacity: 0.9 },
  searchSection: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: { fontSize: 16, marginRight: 12 },
  searchInput: { flex: 1, fontSize: 16, color: '#333333', paddingVertical: 12 },
  clearButton: { padding: 4 },
  clearButtonText: { fontSize: 14, color: '#999999' },
  categorySection: { paddingBottom: 16 },
  categoryScroll: { paddingLeft: 20 },
  categoryContent: { paddingRight: 20 },
  categoryChip: {
    backgroundColor: '#e5e5e5',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
    alignItems: 'center',
  },
  categoryChipActive: { backgroundColor: '#8325d1ff' },
  categoryChipText: { fontSize: 14, fontWeight: '500', color: '#666666' },
  categoryChipTextActive: { color: '#ffffff', fontWeight: '600' },
  productsSection: { flex: 1, paddingHorizontal: 20 },
  productsGrid: { paddingBottom: 100 },
  productRow: { justifyContent: 'space-between' },
  productCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    width: (width - 50) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  productImageContainer: { position: 'relative', marginBottom: 12 },
  productImage: { width: '100%', height: 120, borderRadius: 12, backgroundColor: '#f0f0f0' },
  quantityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e73737ff',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  quantityBadgeText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  productInfo: { marginBottom: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 4, lineHeight: 18 },
  productCategory: { fontSize: 12, color: '#666666', marginBottom: 6 },
  productPrice: { fontSize: 16, fontWeight: '700', color: '#28a745' },
  productActions: { alignItems: 'center' },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 4,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3178e2ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  quantityText: { fontSize: 16, fontWeight: '600', color: '#3178e2ff', paddingHorizontal: 16 },
  addButton: { backgroundColor: '#3178e2ff', paddingHorizontal: 24, paddingVertical: 8, borderRadius: 16 },
  addButtonText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  itemSeparator: { height: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#666666', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: '#999999', textAlign: 'center', lineHeight: 20 },
  cartSummary: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  cartDetailsButton: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 16 },
  cartDetailsIcon: { fontSize: 24, marginRight: 12 },
  cartInfo: { flex: 1 },
  cartItemCount: { fontSize: 14, color: '#666666', marginBottom: 2 },
  cartTotal: { fontSize: 20, fontWeight: '700', color: '#333333' },
  checkoutButton: { backgroundColor: '#28a745', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 16 },
  checkoutButtonText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  cartModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  paymentModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  receiptModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#333333' },
  closeButton: { padding: 8 },
  closeButtonText: { fontSize: 18, color: '#999999' },
  cartList: { maxHeight: 400, paddingHorizontal: 20 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cartItemImage: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#f0f0f0', marginRight: 12 },
  cartItemInfo: { flex: 1, marginRight: 12 },
  cartItemName: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 4 },
  cartItemCategory: { fontSize: 12, color: '#666666', marginBottom: 4 },
  cartItemPrice: { fontSize: 14, fontWeight: '600', color: '#333333' },
  cartItemControls: { alignItems: 'flex-end' },
  cartItemSubtotal: { fontSize: 14, fontWeight: '700', color: '#333333', marginTop: 8 },
  cartSummaryModal: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderTopWidth: 2,
    borderTopColor: '#333333',
    marginTop: 8,
  },
  totalLabel: { fontSize: 18, fontWeight: '700', color: '#333333' },
  totalAmount: { fontSize: 20, fontWeight: '700', color: '#333333' },
  paymentForm: { maxHeight: 500, paddingHorizontal: 20 },
  formSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333333', marginBottom: 12 },
  formInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333333',
    marginBottom: 12,
    backgroundColor: '#ffffff',
  },
  paymentMethods: { flexDirection: 'row', gap: 12 },
  paymentMethodButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  paymentMethodActive: { backgroundColor: '#e8e8e8', borderColor: '#333333' },
  paymentMethodText: { fontSize: 16, fontWeight: '600', color: '#666666' },
  paymentMethodTextActive: { color: '#333333' },
  changeInfo: { backgroundColor: '#f0f8ff', padding: 12, borderRadius: 8, marginTop: 8 },
  changeLabel: { fontSize: 14, color: '#1a5490' },
  changeAmount: { fontWeight: '700', color: '#0c4a6e' },
  orderSummary: { backgroundColor: '#f8f8f8', padding: 16, borderRadius: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#666666' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#333333' },
  paymentActions: { padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  processPaymentButton: { backgroundColor: '#333333', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  disabledButton: { backgroundColor: '#cccccc' },
  processPaymentText: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  receiptContent: { maxHeight: 500, paddingHorizontal: 24, paddingVertical: 8 },
  receiptHeader: { alignItems: 'center', paddingVertical: 20 },
  storeName: { fontSize: 20, fontWeight: '700', color: '#000000', marginBottom: 4, textAlign: 'center', flexWrap: 'wrap' },
  storeAddress: { fontSize: 14, color: '#000000', marginBottom: 2, textAlign: 'center', flexWrap: 'wrap', lineHeight: 18 },
  storeContact: { fontSize: 14, color: '#000000' },
  receiptDivider: { height: 1, backgroundColor: '#000000', marginVertical: 16 },
  receiptInfo: { paddingVertical: 8 },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, minHeight: 24 },
  receiptLabel: { fontSize: 14, color: '#000000', fontWeight: '500', flex: 1 },
  receiptValue: { fontSize: 14, color: '#000000', fontWeight: '600', textAlign: 'right', flex: 1 },
  itemsList: { paddingVertical: 8 },
  itemsHeader: { fontSize: 14, fontWeight: '600', color: '#333333', marginBottom: 12, textAlign: 'center' },
  receiptItem: { marginBottom: 12 },
  itemNameRow: { marginBottom: 4 },
  itemName: { fontSize: 14, fontWeight: '500', color: '#333333' },
  itemDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemDetail: { fontSize: 12, color: '#666666' },
  itemTotal: { fontSize: 14, fontWeight: '600', color: '#333333' },
  receiptSummary: { paddingVertical: 12 },
  totalRowReceipt: { paddingTop: 12, paddingBottom: 4, borderTopWidth: 1, borderTopColor: '#000000', marginTop: 8, minHeight: 32 },
  totalLabelReceipt: { fontSize: 16, fontWeight: '700', color: '#000000', flex: 1 },
  totalValueReceipt: { fontSize: 16, fontWeight: '700', color: '#000000', textAlign: 'right', flex: 1 },
  receiptPayment: { paddingVertical: 12 },
  receiptFooter: { alignItems: 'center', paddingVertical: 16 },
  footerText: { fontSize: 12, color: '#666666', textAlign: 'center', marginBottom: 2 },
  receiptActions: { flexDirection: 'row', padding: 20, gap: 12, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  shareButton: { flex: 1, backgroundColor: '#f0f0f0', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  shareButtonText: { fontSize: 14, fontWeight: '600', color: '#666666' },
  newTransactionButton: { flex: 1, backgroundColor: '#28a745', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  newTransactionButtonText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
});
