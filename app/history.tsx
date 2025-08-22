// HistoryScreen.tsx
import * as FileSystem from "expo-file-system";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import api from "./axios";

const formatRupiah = (angka: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);

export default function HistoryScreen() {
  const { userInfo } = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [salesHistory, setSalesHistory] = useState<any[]>([]);
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/history", {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });
      const mapped = res.data.data.map((item: any) => ({
        id: item.id,
        kasir: item.nama_kasir,
        kode: item.kode_transaksi,
        metode: item.metode_pembayaran,
        amount: Number(item.total_transaksi) || 0,
        date: new Date(item.created_at).toLocaleDateString("id-ID"),
        time: new Date(item.created_at).toLocaleTimeString("id-ID"),
        barang: (item.details || []).map((d: any) => ({
          nama: d.barang?.nama_barang || "-",
          qty: d.jumlah,
          harga: Number(d.harga_satuan) || 0,
          subtotal: Number(d.total_harga) || 0,
        })),
      }));
      setSalesHistory(mapped);
    } catch (err) {
      console.error("Gagal memuat history:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDownloadPDF = async () => {
  if (salesHistory.length === 0) {
    return Alert.alert("Belum ada transaksi untuk dicetak.");
  }

  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background-color: #f0f0f0; }
        </style>
      </head>
      <body>
        <h1>Laporan Riwayat Transaksi</h1>
        <table>
          <tr>
            <th>Kode</th>
            <th>Barang</th>
            <th>Kasir</th>
            <th>Metode</th>
            <th>Total</th>
            <th>Tanggal</th>
          </tr>
          ${salesHistory
            .map(
              (trx) => `
            <tr>
              <td>${trx.kode}</td>
              <td>${trx.barang
                .map((b: any) => `${b.nama} (x${b.qty})`)
                .join(", ")}</td>
              <td>${trx.kasir}</td>
              <td>${trx.metode}</td>
              <td>${formatRupiah(trx.amount)}</td>
              <td>${trx.date} ${trx.time}</td>
            </tr>
          `
            )
            .join("")}
        </table>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html });
    const fileName = `laporan-transaksi-${Date.now()}.pdf`;

    // ✅ SAF: user pilih folder simpan
    const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

    if (!permissions.granted) {
      return Alert.alert("Izin ditolak", "Tidak bisa simpan PDF tanpa izin folder.");
    }

    const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName,
      "application/pdf"
    );

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

    Alert.alert("Sukses", "PDF berhasil disimpan ✅");
  } catch (err) {
    console.error("Gagal cetak PDF:", err);
    Alert.alert("Error", "Gagal mencetak PDF");
  }
};

// const handleDownloadPDF = async () => {
//   if (salesHistory.length === 0) {
//     return Alert.alert("Belum ada transaksi untuk dicetak.");
//   }

//   const html = `
//     <html>
//       <head>
//         <style>
//           body { font-family: Arial, sans-serif; padding: 20px; }
//           h1 { text-align: center; }
//           table { width: 100%; border-collapse: collapse; margin-top: 20px; }
//           th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
//           th { background-color: #f0f0f0; }
//         </style>
//       </head>
//       <body>
//         <h1>Laporan Riwayat Transaksi</h1>
//         <table>
//           <tr>
//             <th>Kode</th>
//             <th>Barang</th>
//             <th>Kasir</th>
//             <th>Metode</th>
//             <th>Total</th>
//             <th>Tanggal</th>
//           </tr>
//           ${salesHistory
//             .map(
//               (trx) => `
//             <tr>
//               <td>${trx.kode}</td>
//               <td>${trx.barang
//                 .map((b: any) => `${b.nama} (x${b.qty})`)
//                 .join(", ")}</td>
//               <td>${trx.kasir}</td>
//               <td>${trx.metode}</td>
//               <td>${formatRupiah(trx.amount)}</td>
//               <td>${trx.date} ${trx.time}</td>
//             </tr>
//           `
//             )
//             .join("")}
//         </table>
//       </body>
//     </html>
//   `;

//   try {
//     const { uri } = await Print.printToFileAsync({ html });
//     const fileName = `laporan-transaksi-${Date.now()}.pdf`;

//     // ✅ Minta user pilih folder (misalnya Download)
//     const permissions = await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync();

//     if (!permissions.granted) {
//       return Alert.alert("Izin ditolak", "Tidak bisa simpan PDF tanpa izin folder.");
//     }

//     // ✅ Buat file di folder yang dipilih user
//     const fileUri = await FileSystem.StorageAccessFramework.createFileAsync(
//       permissions.directoryUri,
//       fileName,
//       "application/pdf"
//     );

//     // ✅ Tulis file dalam bentuk base64
//     const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
//     await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });

//     Alert.alert("Sukses", "PDF berhasil disimpan di folder yang dipilih ✅");
//   } catch (err) {
//     console.error("Gagal cetak PDF:", err);
//     Alert.alert("Error", "Gagal mencetak PDF");
//   }
// };


  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
        <View style={styles.loading}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Memuat riwayat transaksi...</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Riwayat Transaksi</Text>
            <Text style={styles.headerSubtitle}>Kelola semua transaksi Anda</Text>
          </View>
          <TouchableOpacity onPress={handleDownloadPDF} style={styles.downloadButton}>
            <Text style={styles.downloadButtonText}>PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* CONTENT */}
      <View style={styles.container}>
        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {salesHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyIconText}>📋</Text>
              </View>
              <Text style={styles.emptyTitle}>Belum Ada Transaksi</Text>
              <Text style={styles.emptySubtitle}>
                Transaksi yang Anda buat akan muncul di sini
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {salesHistory.map((trx) => (
                <TouchableOpacity
                  key={trx.id}
                  style={styles.transactionCard}
                  onPress={() => {
                    setSelectedTrx(trx);
                    setShowModal(true);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardHeader}>
                    <View style={styles.avatarContainer}>
                      <Text style={styles.avatarText}>
                        {trx.kasir.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.cardInfo}>
                      <Text style={styles.kasirName}>{trx.kasir}</Text>
                      <Text style={styles.transactionDate}>
                        {trx.date} • {trx.time}
                      </Text>
                    </View>
                    <View style={styles.amountContainer}>
                      <Text style={styles.amount}>{formatRupiah(trx.amount)}</Text>
                      <Text style={styles.viewDetail}>Lihat Detail →</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

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

            {selectedTrx && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Daftar Barang</Text>
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
              </ScrollView>
            )}

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
    </SafeAreaView>
  );
}

// style tetap sama seperti kode kamu sebelumnya
const styles = StyleSheet.create({
  safe: { 
    flex: 1, 
    backgroundColor: "#f8fafc" 
  },
  
  // Loading Styles
  loading: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20
  },
  loadingCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  loadingText: { 
    marginTop: 16, 
    color: "#64748b", 
    fontSize: 16,
    fontWeight: "500"
  },

  // Header Styles
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  backIcon: { 
    fontSize: 20, 
    color: "#3b82f6",
    fontWeight: "600"
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "700", 
    color: "#1e293b",
    marginBottom: 2
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "400"
  },

  // Container Styles
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },

  // Empty State
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  emptyIconText: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748b",
    textAlign: "center",
    lineHeight: 20,
  },

  // History List
  historyList: {
    gap: 12,
  },
  transactionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#3b82f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  cardInfo: {
    flex: 1,
  },
  kasirName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 13,
    color: "#64748b",
  },
  amountContainer: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: 16,
    fontWeight: "700",
    color: "#059669",
    marginBottom: 2,
  },
  viewDetail: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
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
  sectionTitle: {
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