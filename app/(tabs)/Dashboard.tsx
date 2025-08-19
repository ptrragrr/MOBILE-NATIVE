// app/(tabs)/Dashboard.tsx
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  amount: number;
  status: string;
  date: string;
  time: string;
  items: any[];
}

const Dashboard = () => {
  const router = useRouter();
  const { userInfo } = useContext(AuthContext);

  const [todaySales, setTodaySales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [salesHistory, setSalesHistory] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  
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
  kode: item.kode_transaksi, // kode transaksi
  metode: item.metode_pembayaran, // metode pembayaran
  amount: Number(item.total_transaksi) || 0,
  date: new Date(item.created_at).toLocaleDateString("id-ID"),
  time: new Date(item.created_at).toLocaleTimeString("id-ID"),
  barang: (item.detail || []).map((d: any) => ({
    nama: d.nama_barang,
    qty: d.jumlah,
    harga: Number(d.harga_satuan) || 0,
    subtotal: Number(d.subtotal) || 0,
  })),
}));
      // const mapped = res.data.data.map((item: any) => ({
      //   id: item.id,
      //   kasir: item.nama_kasir || "Unknown",
      //   amount: Number(item.total_transaksi) || 0,   // ✅ ambil total_transaksi
      //   date: new Date(item.created_at).toLocaleDateString("id-ID"),
      //   time: new Date(item.created_at).toLocaleTimeString("id-ID"),
      //   items: item.keranjang || []
      // }));

      setSalesHistory(mapped);
    } catch (err) {
      console.error("Gagal memuat history:", err);
      Alert.alert('Gagal memuat history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.welcomeText}>
          Halo, {userInfo?.user?.name || "User"}! 👋
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
                <Text style={styles.iconText}>📦</Text>
              </View>
              <Text style={styles.summaryTitle}>Total Produk</Text>
              <Text style={styles.summaryValue}>{totalProducts}</Text>
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
                    <Text style={styles.historyAmount}>
                      {formatRupiah(transaction.amount)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </>
      )}
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
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
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
  },
});
