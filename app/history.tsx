import { useRouter } from "expo-router";
import React, { useContext, useEffect, useState } from "react";
import {
  ActivityIndicator,
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
  const [selectedTrx, setSelectedTrx] = useState<any | null>(null); // transaksi dipilih
  const [showModal, setShowModal] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.get("/history", {
        headers: { Authorization: `Bearer ${userInfo?.token}` },
      });

      console.log("DATA HISTORY:", JSON.stringify(res.data.data[0], null, 2));

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
  subtotal: Number(d.subtotal) || 0,
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor="#f5f7fa" />
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#4a90e2" />
          <Text style={{ marginTop: 8, color: "#2c3e50" }}>Memuat riwayat...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backWrap}>
          <Text style={styles.backBtn}>⬅</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Riwayat Transaksi</Text>
      </View>

      {/* LIST */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {salesHistory.length === 0 ? (
          <Text style={styles.empty}>Belum ada transaksi</Text>
        ) : (
          salesHistory.map((trx) => (
            <TouchableOpacity
              key={trx.id}
              style={styles.card}
              onPress={() => {
                setSelectedTrx(trx);
                setShowModal(true);
              }}
            >
              <View style={styles.row}>
                <Text style={styles.kasir}>{trx.kasir}</Text>
                <Text style={styles.amount}>{formatRupiah(trx.amount)}</Text>
              </View>
              <Text style={styles.date}>
                {trx.date} • {trx.time}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* MODAL DETAIL */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Detail Transaksi</Text>
            {selectedTrx && (
              <ScrollView>
                <Text>Kode: {selectedTrx.kode}</Text>
                <Text>Kasir: {selectedTrx.kasir}</Text>
                <Text>Metode: {selectedTrx.metode}</Text>
                <Text>
                  Tanggal: {selectedTrx.date} • {selectedTrx.time}
                </Text>

                <Text style={{ marginTop: 10, fontWeight: "bold" }}>
                  Daftar Barang:
                </Text>
                {selectedTrx.barang.map((b: any, i: number) => (
                  <View key={i} style={styles.itemRow}>
                    <Text>
                      {b.nama} x{b.qty}
                    </Text>
                    <Text>{formatRupiah(b.subtotal)}</Text>
                  </View>
                ))}
                <View
                  style={{
                    borderTopWidth: 1,
                    borderColor: "#ddd",
                    marginTop: 10,
                    paddingTop: 10,
                  }}
                >
                  <Text style={{ fontWeight: "bold", fontSize: 16 }}>
                    Total: {formatRupiah(selectedTrx.amount)}
                  </Text>
                </View>
              </ScrollView>
            )}
            <TouchableOpacity
              onPress={() => setShowModal(false)}
              style={styles.closeBtn}
            >
              <Text style={{ color: "#fff" }}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f7fa" },
  scroll: { paddingHorizontal: 16, paddingTop: 10 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 30,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  backWrap: {
    marginRight: 12,
    backgroundColor: "#eaf2ff",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  backBtn: { fontSize: 18, color: "#4a90e2" },
  title: { fontSize: 18, fontWeight: "700", color: "#2c3e50" },

  empty: { textAlign: "center", marginTop: 40, color: "#7f8c8d", fontSize: 15 },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  kasir: { fontSize: 16, fontWeight: "600", color: "#34495e" },
  amount: { fontSize: 16, fontWeight: "700", color: "#27ae60" },
  date: { fontSize: 13, color: "#7f8c8d" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "85%",
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 4,
  },
  closeBtn: {
    marginTop: 16,
    backgroundColor: "#4a90e2",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});
