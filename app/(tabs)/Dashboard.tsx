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
  const [showHistoryModal, setShowHistoryModal] = useState(false);

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

  const handleOpenHistory = () => {
    setShowHistoryModal(true);
  };

  const handleCloseHistory = () => {
    setShowHistoryModal(false);
  };

  const todaySales = 2450000;
  const todayTransactions = 47;
  const totalProducts = 156;

  const recentTransactions = [
    { id: '#001', time: '14:30', amount: 125000, customer: 'Ahmad S.', date: '2024-08-07', status: 'success' },
    { id: '#002', time: '14:15', amount: 85000, customer: 'Sari M.', date: '2024-08-07', status: 'success' },
    { id: '#003', time: '13:45', amount: 165000, customer: 'Budi P.', date: '2024-08-07', status: 'success' },
    { id: '#004', time: '13:20', amount: 95000, customer: 'Lisa A.', date: '2024-08-07', status: 'success' },
  ];

  const salesHistory = [
    { id: '#001', time: '14:30', amount: 125000, customer: 'Ahmad S.', date: '2024-08-07', status: 'success', items: 'Kopi Arabica, Roti Bakar' },
    { id: '#002', time: '14:15', amount: 85000, customer: 'Sari M.', date: '2024-08-07', status: 'success', items: 'Teh Hijau, Biskuit' },
    { id: '#003', time: '13:45', amount: 165000, customer: 'Budi P.', date: '2024-08-07', status: 'success', items: 'Susu UHT, Kopi, Snack' },
    { id: '#004', time: '13:20', amount: 95000, customer: 'Lisa A.', date: '2024-08-07', status: 'success', items: 'Roti Tawar, Selai' },
    { id: '#005', time: '12:45', amount: 75000, customer: 'Dedi R.', date: '2024-08-07', status: 'success', items: 'Air Mineral, Permen' },
    { id: '#006', time: '12:30', amount: 145000, customer: 'Nina K.', date: '2024-08-07', status: 'success', items: 'Kopi Premium, Cake' },
    { id: '#007', time: '11:15', amount: 65000, customer: 'Tono S.', date: '2024-08-06', status: 'success', items: 'Teh Botol, Kerupuk' },
    { id: '#008', time: '10:30', amount: 185000, customer: 'Maya L.', date: '2024-08-06', status: 'success', items: 'Paket Sarapan' },
    { id: '#009', time: '09:45', amount: 95000, customer: 'Andi P.', date: '2024-08-06', status: 'success', items: 'Jus Jeruk, Sandwich' },
    { id: '#010', time: '16:20', amount: 115000, customer: 'Siska M.', date: '2024-08-05', status: 'success', items: 'Kopi Latte, Donut' },
    { id: '#011', time: '15:45', amount: 85000, customer: 'Bambang H.', date: '2024-08-05', status: 'cancelled', items: 'Teh Tarik' },
    { id: '#012', time: '14:30', amount: 155000, customer: 'Rina D.', date: '2024-08-05', status: 'success', items: 'Paket Makan Siang' },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Dashboard</Text>
          <Text style={styles.subtitle}>Toko Sejahtera</Text>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/profile')}
          style={styles.profileButton}
        >
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
            <TouchableOpacity 
              onPress={handleOpenHistory}
              style={styles.viewAllButton}
            >
              <Text style={styles.viewAllText}>Lihat Semua</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionsList}>
            {recentTransactions.map((transaction, index) => (
              <View key={index} style={styles.transactionItem}>
                <View>
                  <Text style={styles.transactionId}>{transaction.id}</Text>
                  <Text style={styles.transactionCustomer}>{transaction.customer}</Text>
                </View>
                <View style={styles.transactionRight}>
                  <Text style={styles.transactionAmount}>{formatRupiah(transaction.amount)}</Text>
                  <Text style={styles.transactionTime}>{transaction.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* History Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showHistoryModal}
        onRequestClose={handleCloseHistory}
      >
        <View style={styles.historyModalOverlay}>
          <View style={styles.historyModalContainer}>
            {/* Header */}
            <View style={styles.historyHeader}>
              <Text style={styles.historyTitle}>History Penjualan</Text>
              <TouchableOpacity 
                onPress={handleCloseHistory}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>
            
            {/* List */}
            <ScrollView style={styles.historyList}>
              {salesHistory.map((item, index) => (
                <View key={index} style={styles.historyCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardId}>{item.id}</Text>
                    <View style={[styles.badge, {
                      backgroundColor: item.status === 'success' ? '#DCFCE7' : '#FEE2E2'
                    }]}>
                      <Text style={[styles.badgeText, {
                        color: item.status === 'success' ? '#059669' : '#DC2626'
                      }]}>
                        {item.status === 'success' ? 'Berhasil' : 'Dibatalkan'}
                      </Text>
                    </View>
                  </View>
                  
                  <Text style={styles.cardCustomer}>{item.customer}</Text>
                  <Text style={styles.cardItems}>{item.items}</Text>
                  <Text style={styles.cardDate}>{item.date} • {item.time}</Text>
                  <Text style={styles.cardAmount}>{formatRupiah(item.amount)}</Text>
                </View>
              ))}
            </ScrollView>
            
            {/* Footer */}
            <View style={styles.historyFooter}>
              <Text style={styles.footerText}>
                Total: {salesHistory.filter(t => t.status === 'success').length} transaksi berhasil
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={handleCancelLogout}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Keluar dari Dashboard?</Text>
            <Text style={styles.modalMessage}>
              Data Anda akan tersimpan dengan aman
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelLogout}
              >
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={handleConfirmLogout}
              >
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
    backgroundColor: '#F8FAFC' 
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
    color: '#1E293B' 
  },
  subtitle: { 
    marginTop: 2, 
    color: '#64748B', 
    fontSize: 16 
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
    paddingHorizontal: 20 
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
    height: 30 
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