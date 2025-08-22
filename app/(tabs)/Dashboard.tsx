// app/(tabs)/Dashboard.tsx
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../axios';

const formatRupiah = (angka: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(angka);
};

interface Transaction {
  id: string;
  kasir: string;
  kode: string;
  metode: string;
  amount: number;
  status: string;
  date: string;
  time: string;
  barang: any[];
}

const Dashboard = () => {
  const router = useRouter();
  const { userInfo } = useContext(AuthContext);

  const [todaySales, setTodaySales] = useState(0);
  const [monthlySales, setMonthlySales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [salesHistory, setSalesHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrx, setSelectedTrx] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchHistory = async () => {
  try {
    setLoading(true);
    const res = await api.get('/history', {
      headers: {
        Authorization: `Bearer ${userInfo?.token}`,
      },
    });

    console.log("DATA HISTORY:", res.data);

    const mapped = res.data.data.map((item: any) => ({
      id: item.id,
      kasir: item.nama_kasir,
      kode: item.kode_transaksi,
      metode: item.metode_pembayaran,
      amount: Number(item.total_transaksi) || 0,
      date: new Date(item.created_at).toLocaleDateString("id-ID"),
      time: new Date(item.created_at).toLocaleTimeString("id-ID"),
      created_at: item.created_at,
      barang: (item.details || []).map((d: any) => ({
        nama: d.barang?.nama_barang || "-",
        qty: d.jumlah,
        harga: Number(d.harga_satuan) || 0,
        subtotal: Number(d.total_harga) || 0,
      })),
    }));

    setSalesHistory(mapped);

    // Hitung penjualan hari ini
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
    
    const todayStr = new Date().toLocaleDateString("id-ID");

const todayTotal = mapped
  .filter((item: any) => {
    const itemDateStr = new Date(item.created_at).toLocaleDateString("id-ID");
    return itemDateStr === todayStr;
  })
  .reduce((sum: number, item: any) => sum + item.amount, 0);

setTodaySales(todayTotal);

    // const todayTotal = mapped
    //   .filter((item: any) => {
    //     const itemDate = new Date(item.created_at);
    //     return itemDate >= todayStart && itemDate <= todayEnd;
    //   })
    //   .reduce((sum: number, item: any) => sum + item.amount, 0);
    
    // setTodaySales(todayTotal);

    // Hitung penjualan bulan ini
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    const monthlyTotal = mapped
      .filter((item: any) => {
        const itemDate = new Date(item.created_at);
        return itemDate >= monthStart && itemDate <= monthEnd;
      })
      .reduce((sum: number, item: any) => sum + item.amount, 0);
    
    setMonthlySales(monthlyTotal);

    // Hitung total produk terjual dari semua transaksi
    const totalProductsSold = mapped.reduce((sum: number, transaction: any) => {
      const transactionTotal = transaction.barang.reduce((itemSum: number, item: any) => {
        return itemSum + (item.qty || 0);
      }, 0);
      return sum + transactionTotal;
    }, 0);

    setTotalProducts(totalProductsSold);

  } catch (err) {
    console.error("Gagal memuat history:", err);
    Alert.alert('Gagal memuat history');
  } finally {
    setLoading(false);
  }
};
  // const fetchHistory = async () => {
  //   try {
  //     setLoading(true);
  //     const res = await api.get('/history', {
  //       headers: {
  //         Authorization: `Bearer ${userInfo?.token}`,
  //       },
  //     });

  //     console.log("DATA HISTORY:", res.data);

  //     const mapped = res.data.data.map((item: any) => ({
  //       id: item.id,
  //       kasir: item.nama_kasir,
  //       kode: item.kode_transaksi,
  //       metode: item.metode_pembayaran,
  //       amount: Number(item.total_transaksi) || 0,
  //       date: new Date(item.created_at).toLocaleDateString("id-ID"),
  //       time: new Date(item.created_at).toLocaleTimeString("id-ID"),
  //       created_at: item.created_at, // tambahkan created_at untuk perhitungan
  //       barang: (item.details || []).map((d: any) => ({
  //         nama: d.barang?.nama_barang || "-",
  //         qty: d.jumlah,
  //         harga: Number(d.harga_satuan) || 0,
  //         subtotal: Number(d.total_harga) || 0,
  //       })),
  //     }));

  //     setSalesHistory(mapped);

  //     // Hitung penjualan hari ini
  //     const today = new Date();
  //     const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  //     const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
  //     const todayTotal = mapped
  //       .filter((item: any) => {
  //         const itemDate = new Date(item.created_at);
  //         return itemDate >= todayStart && itemDate <= todayEnd;
  //       })
  //       .reduce((sum: number, item: any) => sum + item.amount, 0);
      
  //     setTodaySales(todayTotal);

  //     // Hitung penjualan bulan ini
  //     const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  //     const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
      
  //     const monthlyTotal = mapped
  //       .filter((item: any) => {
  //         const itemDate = new Date(item.created_at);
  //         return itemDate >= monthStart && itemDate <= monthEnd;
  //       })
  //       .reduce((sum: number, item: any) => sum + item.amount, 0);
      
  //     setMonthlySales(monthlyTotal);

  //   } catch (err) {
  //     console.error("Gagal memuat history:", err);
  //     Alert.alert('Gagal memuat history');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Halo, {userInfo?.user?.name || "Admin"}! 👋
        </Text>
        <Text style={styles.subtitle}>Dashboard Penjualan</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={styles.loadingText}>Memuat data...</Text>
        </View>
      ) : (
        <>
          {/* Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>💰</Text>
              </View>
              <Text style={styles.summaryTitle}>Penjualan Hari Ini</Text>
              <Text style={styles.summaryValue}>{formatRupiah(todaySales)}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>📊</Text>
              </View>
              <Text style={styles.summaryTitle}>Penjualan Bulan Ini</Text>
              <Text style={styles.summaryValue}>{formatRupiah(monthlySales)}</Text>
            </View>
          </View>

          {/* Additional Summary Cards */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryCard}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>📦</Text>
              </View>
              <Text style={styles.summaryTitle}>Total Produk Terjual</Text>
              <Text style={styles.summaryValue}>{totalProducts}</Text>
            </View>

            <View style={styles.summaryCard}>
              <View style={styles.cardIcon}>
                <Text style={styles.iconText}>🧾</Text>
              </View>
              <Text style={styles.summaryTitle}>Total Transaksi</Text>
              <Text style={styles.summaryValue}>{salesHistory.length}</Text>
            </View>
          </View>

          {/* History Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Riwayat Transaksi</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/history')}
              >
                <Text style={styles.viewAllText}>Lihat Semua</Text>
              </TouchableOpacity>
            </View>

            {salesHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>Belum ada transaksi</Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {salesHistory.slice(0, 5).map((transaction, index) => (
                  <TouchableOpacity 
                    key={transaction.id || index} 
                    style={styles.historyCard}
                    onPress={() => {
                      setSelectedTrx(transaction);
                      setShowModal(true);
                    }}
                  >
                    <View style={styles.historyLeft}>
                      <View style={styles.avatar}>
                        <Text style={styles.avatarText}>
                          {transaction.kasir ? transaction.kasir.charAt(0).toUpperCase() : 'U'}
                        </Text>
                      </View>
                      <View style={styles.historyInfo}>
                        <Text style={styles.historyKasir}>
                          {transaction.kasir || 'Unknown'}
                        </Text>
                        <Text style={styles.historyDate}>
                          {transaction.date} • {transaction.time}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.historyRight}>
                      <Text style={styles.historyAmount}>
                        {formatRupiah(transaction.amount)}
                      </Text>
                      <Text style={styles.tapToView}>Lihat Detail →</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </>
      )}

      {/* MODAL DETAIL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>Detail Transaksi</Text>
                <TouchableOpacity
                  onPress={() => setShowModal(false)}
                  style={styles.modalCloseButton}
                >
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Modal Content */}
            {selectedTrx && (
              <ScrollView 
                style={styles.modalContent} 
                showsVerticalScrollIndicator={false}
              >
                {/* Transaction Info */}
                <View style={styles.transactionInfo}>
                  <View style={styles.infoCard}>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Kode Transaksi</Text>
                      <Text style={styles.infoValue}>{selectedTrx.kode}</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Kasir</Text>
                      <Text style={styles.infoValue}>{selectedTrx.kasir}</Text>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Metode Pembayaran</Text>
                      <View style={styles.methodBadge}>
                        <Text style={styles.methodText}>{selectedTrx.metode}</Text>
                      </View>
                    </View>
                    <View style={styles.infoDivider} />
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tanggal & Waktu</Text>
                      <Text style={styles.infoValue}>
                        {selectedTrx.date} • {selectedTrx.time}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Items List */}
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitleModal}>Daftar Barang</Text>
                  <View style={styles.itemsCard}>
                    {selectedTrx.barang.map((b: any, i: number) => (
                      <View key={i} style={styles.itemContainer}>
                        <View style={styles.itemDetails}>
                          <Text style={styles.itemName}>{b.nama}</Text>
                          <Text style={styles.itemQuantity}>Qty: {b.qty}</Text>
                        </View>
                        <Text style={styles.itemPrice}>{formatRupiah(b.subtotal)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Total */}
                <View style={styles.totalSection}>
                  <View style={styles.totalCard}>
                    <View style={styles.totalRow}>
                      <Text style={styles.totalLabel}>Total Pembayaran</Text>
                      <Text style={styles.totalAmount}>
                        {formatRupiah(selectedTrx.amount)}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Tutup</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default Dashboard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#7f8c8d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#7f8c8d',
  },
  summaryContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 140, // Tambahkan minimum height
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 24,
  },
  summaryTitle: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 16,
    paddingHorizontal: 4, // Tambahkan padding horizontal
    flexWrap: 'wrap', // Izinkan text wrap
    width: '100%', // Gunakan full width
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    flexWrap: 'wrap',
    width: '100%',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  viewAllButton: {
    backgroundColor: '#4a90e2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  viewAllText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#6c757d',
  },
  historyList: {
    gap: 8,
  },
  historyCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyRight: {
    alignItems: 'flex-end',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  historyInfo: {
    flex: 1,
  },
  historyKasir: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 2,
  },
  historyDate: {
    fontSize: 13,
    color: '#6c757d',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#27ae60',
    marginBottom: 2,
  },
  tapToView: {
    fontSize: 11,
    color: '#4a90e2',
    fontWeight: '500',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
    minHeight: "60%",
  },
  modalHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalHeaderContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1e293b",
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 16,
    color: "#64748b",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Transaction Info
  transactionInfo: {
    marginTop: 20,
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#e2e8f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  methodBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  methodText: {
    fontSize: 12,
    color: "#1d4ed8",
    fontWeight: "600",
  },

  // Items Section
  itemsSection: {
    marginBottom: 24,
  },
  sectionTitleModal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 12,
  },
  itemsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  itemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: "#64748b",
  },
  itemPrice: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "600",
  },

  // Total Section
  totalSection: {
    marginBottom: 20,
  },
  totalCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#166534",
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#166534",
  },

  // Modal Footer
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  closeButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});