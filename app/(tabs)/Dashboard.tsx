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
import api from '../axios'; // axios.ts berada di app/

const formatRupiah = (amount: number | string | null | undefined) => {
  const number = typeof amount === 'string' ? parseFloat(amount) : amount ?? 0;
  if (isNaN(Number(number))) return 'Rp 0';
  try {
    return 'Rp ' + Number(number).toLocaleString('id-ID');
  } catch (error) {
    const formatted = String(number).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return 'Rp ' + formatted;
  }
};

type Transaction = {
  id: string;
  time?: string;
  amount: number;
  customer?: string;
  date?: string;
  status?: 'success' | 'cancelled' | string;
  items?: string;
};

export default function Dashboard() {
  const router = useRouter();
  const { setIsLoggedIn } = useContext(AuthContext);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [todaySales, setTodaySales] = useState<number>(0);
  const [todayTransactions, setTodayTransactions] = useState<number>(0);
  const [totalProducts, setTotalProducts] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [salesHistory, setSalesHistory] = useState<Transaction[]>([]);

  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard'); // pastikan route /api/dashboard ada

      // fallback kalau struktur berbeda
      const data = res.data ?? {};

      setTodaySales(data.today_sales ?? 0);
      setTodayTransactions(data.today_transactions ?? 0);
      setTotalProducts(data.total_products ?? 0);

      // Pastikan arrays selalu ada
      setRecentTransactions(Array.isArray(data.recent_transactions) ? data.recent_transactions : []);
      setSalesHistory(Array.isArray(data.sales_history) ? data.sales_history : []);
    } catch (err: any) {
      console.error('Gagal ambil data dashboard', err);
      // tampilkan pesan singkat ke user
      if (err?.response) {
        // server response available
        const status = err.response.status;
        if (status === 404) {
          Alert.alert('Error 404', 'Endpoint /dashboard tidak ditemukan. Periksa route API Laravel.');
        } else {
          Alert.alert(`Error ${status}`, err.response?.data?.message ?? 'Gagal ambil data dari server.');
        }
      } else if (err?.request) {
        Alert.alert('Network Error', 'Tidak dapat terhubung ke server. Periksa koneksi / baseURL.');
      } else {
        Alert.alert('Error', 'Terjadi kesalahan saat mengambil data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Kamu bisa tambahkan dependency untuk refresh berkala
    // atau pull-to-refresh implementasi bila perlu
  }, []);

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setIsLoggedIn(false);
    router.replace('/AuthStack/LoginScreen');
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={{ marginTop: 8, color: '#64748B' }}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Toko Sejahtera</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/profile')} style={styles.profileButton}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Quick Stats */}
        <View style={styles.quickStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatRupiah(todaySales)}</Text>
            <Text style={styles.statLabel}>Penjualan Hari Ini</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{todayTransactions}</Text>
            <Text style={styles.statLabel}>Transaksi</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{totalProducts}</Text>
            <Text style={styles.statLabel}>Produk</Text>
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
            <TouchableOpacity onPress={() => setShowHistoryModal(true)} style={styles.viewAllButton}>
              <Text style={styles.viewAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {recentTransactions.length === 0 ? (
              <Text style={{ color: '#94A3B8' }}>Belum ada transaksi</Text>
            ) : (
              recentTransactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionItem}>
                  <View>
                    <Text style={styles.transactionId}>{transaction.id}</Text>
                    <Text style={styles.transactionCustomer}>{transaction.customer ?? '-'}</Text>
                  </View>
                  <View style={styles.transactionRight}>
                    <Text style={styles.transactionAmount}>{formatRupiah(transaction.amount)}</Text>
                    <Text style={styles.transactionTime}>{transaction.time ?? ''}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* History Modal */}
      <Modal animationType="slide" transparent={true} visible={showHistoryModal} onRequestClose={() => setShowHistoryModal(false)}>
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContainer}>
            {/* Header */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History Penjualan</Text>
              <TouchableOpacity onPress={() => setShowHistoryModal(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* List */}
            <ScrollView style={styles.historyList}>
              {salesHistory.length === 0 ? (
                <Text style={{ color: '#94A3B8' }}>Belum ada riwayat penjualan</Text>
              ) : (
                salesHistory.map((item) => (
                  <View key={item.id} style={styles.historyCard}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardId}>{item.id}</Text>
                      <View
                        style={[
                          styles.badge,
                          { backgroundColor: item.status === 'success' ? '#DCFCE7' : '#FEE2E2' },
                        ]}
                      >
                        <Text style={[styles.badgeText, { color: item.status === 'success' ? '#059669' : '#DC2626' }]}>
                          {item.status === 'success' ? 'Berhasil' : 'Dibatalkan'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.cardCustomer}>{item.customer ?? '-'}</Text>
                    <Text style={styles.cardItems}>{item.items ?? '-'}</Text>
                    <Text style={styles.cardDate}>{(item.date ?? '') + (item.time ? ` • ${item.time}` : '')}</Text>
                    <Text style={styles.cardAmount}>{formatRupiah(item.amount)}</Text>
                  </View>
                ))
              )}
            </ScrollView>

            {/* Footer */}
            <View style={styles.historyFooter}>
              <Text style={styles.footerText}>
                Total: {salesHistory.filter((t) => t.status === 'success').length} transaksi berhasil
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal animationType="fade" transparent={true} visible={showLogoutModal} onRequestClose={() => setShowLogoutModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Keluar dari Dashboard?</Text>
            <Text style={styles.modalMessage}>Data Anda akan tersimpan dengan aman</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmLogout}>
                <Text style={styles.confirmButtonText}>Keluar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    marginTop: 50,
    marginBottom: 24,
    marginHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1E293B',
  },
  subtitle: {
    marginTop: 2,
    color: '#64748B',
    fontSize: 16,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  profileIcon: {
    fontSize: 20,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  quickStats: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  statItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  viewAllButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2563EB',
    borderRadius: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  transactionsList: {
    gap: 12,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  transactionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 2,
  },
  transactionCustomer: {
    fontSize: 14,
    color: '#64748B',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
  bottomPadding: {
    height: 30,
  },

  // History Modal Styles
  historyModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  historyModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: 'bold',
  },
  historyList: {
    flex: 1,
    padding: 24,
  },
  historyCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardId: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardCustomer: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  cardItems: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
  },
  cardDate: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  cardAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#059669',
  },
  historyFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  footerText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    fontWeight: '500',
  },

  // Logout Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
