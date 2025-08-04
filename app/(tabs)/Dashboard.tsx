import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const formatRupiah = (amount) => {
  const number = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(number)) return 'Rp 0';
  try {
    return 'Rp ' + number.toLocaleString('id-ID');
  } catch (error) {
    const formatted = number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    return 'Rp ' + formatted;
  }
};

export default function Dashboard() {
  const router = useRouter();
  const { setIsLoggedIn } = useContext(AuthContext);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutPress = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    setIsLoggedIn(false);
    router.replace('/AuthStack/LoginScreen');
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const todaySales = 2450000;
  const todayTransactions = 47;
  const totalProducts = 156;

  const recentTransactions = [
    { id: '#001', time: '14:30', amount: 125000, items: 3, customer: 'Ahmad S.' },
    { id: '#002', time: '14:15', amount: 85000, items: 2, customer: 'Sari M.' },
    { id: '#003', time: '13:45', amount: 165000, items: 5, customer: 'Budi P.' },
    { id: '#004', time: '13:20', amount: 95000, items: 2, customer: 'Lisa A.' },
  ];

  const topProducts = [
    { name: 'Kopi Arabica', sales: 45, revenue: 1125000 },
    { name: 'Teh Hijau', sales: 32, revenue: 480000 },
    { name: 'Susu UHT', sales: 28, revenue: 224000 },
    { name: 'Roti Tawar', sales: 23, revenue: 115000 },
  ];

  const salesData = [
    { day: 'Sen', amount: 1800000 },
    { day: 'Sel', amount: 2200000 },
    { day: 'Rab', amount: 1950000 },
    { day: 'Kam', amount: 2450000 },
    { day: 'Jum', amount: 2100000 },
    { day: 'Sab', amount: 2800000 },
    { day: 'Min', amount: 2300000 },
  ];

  const maxSales = Math.max(...salesData.map(d => d.amount));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard POS</Text>
          <Text style={styles.subtitle}>
            Toko Sejahtera - {new Date().toLocaleDateString('id-ID', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>
        <View style={styles.rightHeader}>
          <TouchableOpacity 
  onPress={() => router.push('/profile')}
  style={styles.profileButton}
  activeOpacity={0.8}
>
  <Text style={styles.profileIcon}>👤</Text>
</TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{formatRupiah(todaySales)}</Text>
            <Text style={styles.statLabel}>Penjualan Hari Ini</Text>
            <Text style={styles.statIcon}>💰</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{todayTransactions}</Text>
            <Text style={styles.statLabel}>Transaksi</Text>
            <Text style={styles.statIcon}>🛒</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{totalProducts}</Text>
            <Text style={styles.statLabel}>Total Produk</Text>
            <Text style={styles.statIcon}>📦</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>4.8/5</Text>
            <Text style={styles.statLabel}>Rating Toko</Text>
            <Text style={styles.statIcon}>⭐</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.sectionTitle}>Penjualan Mingguan</Text>
          <View style={styles.chart}>
            {salesData.map((item, index) => (
              <View key={index} style={styles.chartItem}>
                <View style={[styles.chartBar, { height: (item.amount / maxSales) * 120 }]} />
                <Text style={styles.chartDay}>{item.day}</Text>
                <Text style={styles.chartAmount}>
                  {formatRupiah(item.amount).replace('Rp ', '').substring(0, 4)}K
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Transaksi Terbaru</Text>
          {recentTransactions.map((transaction, index) => (
            <View key={index} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <Text style={styles.transactionId}>{transaction.id}</Text>
                <Text style={styles.transactionTime}>{transaction.time}</Text>
              </View>
              <View style={styles.transactionCenter}>
                <Text style={styles.transactionCustomer}>{transaction.customer}</Text>
                <Text style={styles.transactionItems}>{transaction.items} items</Text>
              </View>
              <View style={styles.transactionRight}>
                <Text style={styles.transactionAmount}>{formatRupiah(transaction.amount)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Top Products */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Produk Terlaris</Text>
          {topProducts.map((product, index) => (
            <View key={index} style={styles.productItem}>
              <View style={styles.productRank}>
                <Text style={styles.productRankText}>{index + 1}</Text>
              </View>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{product.name}</Text>
                <Text style={styles.productSales}>{product.sales} terjual</Text>
              </View>
              <View style={styles.productRevenue}>
                <Text style={styles.productRevenueText}>{formatRupiah(product.revenue)}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footerPadding} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2024 Toko Sejahtera - POS System v1.0.0</Text>
      </View>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Icon Header */}
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconCircle}>
                <Text style={styles.modalIcon}>👋</Text>
              </View>
            </View>
            
            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Sampai Jumpa!</Text>
              <Text style={styles.modalSubtitle}>
                Yakin ingin keluar dari Dashboard POS?
              </Text>
              <Text style={styles.modalMessage}>
                Data Anda akan tersimpan dengan aman dan bisa diakses kembali saat login.
              </Text>
            </View>
            
            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.stayButton} 
                onPress={handleCancelLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.stayButtonIcon}>🏠</Text>
                <Text style={styles.stayButtonText}>Tetap Disini</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoutConfirmButton} 
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.logoutButtonIcon}>🚪</Text>
                <Text style={styles.logoutConfirmButtonText}>Ya, Keluar</Text>
              </TouchableOpacity>
            </View>
            
            {/* Decorative Elements */}
            <View style={styles.decorativeElements}>
              <View style={[styles.decorativeDot, { backgroundColor: '#FB7185' }]} />
              <View style={[styles.decorativeDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[styles.decorativeDot, { backgroundColor: '#10B981' }]} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF1F2' },
  header: {
    marginTop: 50, marginBottom: 20, marginHorizontal: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { marginTop: 4, color: '#4B5563', fontSize: 14 },
  rightHeader: { flexDirection: 'row', alignItems: 'center' },
  logoutButton: {
    backgroundColor: '#EF4444', paddingVertical: 8, paddingHorizontal: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: 'white', fontWeight: 'bold',
  },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  statsContainer: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16,
  },
  statCard: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16,
    marginHorizontal: 4, alignItems: 'center', elevation: 2,
  },
  statNumber: {
    fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 4,
  },
  statLabel: {
    fontSize: 12, color: '#6B7280', textAlign: 'center', marginBottom: 8,
  },
  statIcon: { fontSize: 24 },
  chartContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16,
  },
  chart: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end', height: 160,
  },
  chartItem: { alignItems: 'center', flex: 1 },
  chartBar: {
    width: 20, backgroundColor: '#FB7185', borderRadius: 4, marginBottom: 8,
  },
  chartDay: {
    fontSize: 12, fontWeight: 'bold', color: '#374151', marginBottom: 2,
  },
  chartAmount: {
    fontSize: 10, color: '#6B7280',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 16,
  },
  transactionItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  transactionLeft: { flex: 1 },
  transactionId: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  transactionTime: { fontSize: 12, color: '#6B7280' },
  transactionCenter: { flex: 2, paddingHorizontal: 8 },
  transactionCustomer: { fontSize: 14, color: '#374151' },
  transactionItems: { fontSize: 12, color: '#6B7280' },
  transactionRight: { flex: 1, alignItems: 'flex-end' },
  transactionAmount: {
    fontSize: 14, fontWeight: 'bold', color: '#059669',
  },
  productItem: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  productRank: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FB7185',
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  productRankText: {
    color: '#FFFFFF', fontWeight: 'bold', fontSize: 14,
  },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  productSales: { fontSize: 12, color: '#6B7280' },
  productRevenue: { alignItems: 'flex-end' },
  productRevenueText: {
    fontSize: 14, fontWeight: 'bold', color: '#059669',
  },
  footerPadding: { height: 20 },
  footer: {
    padding: 16, alignItems: 'center', backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  footerText: {
    color: '#9CA3AF', fontSize: 12,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  profileButton: {
  width: 40,
  height: 40,
  borderRadius: 20,
  backgroundColor: '#F3F4F6',
  alignItems: 'center',
  justifyContent: 'center',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},
profileIcon: {
  fontSize: 20,
},
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  modalIconContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    background: 'linear-gradient(135deg, #FFF1F2 0%, #FDF2F8 100%)',
  },
  modalIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FB7185',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FB7185',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalIcon: {
    fontSize: 36,
  },
  modalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  modalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  stayButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stayButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  stayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoutButtonIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  decorativeElements: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
    gap: 8,
  },
  decorativeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});