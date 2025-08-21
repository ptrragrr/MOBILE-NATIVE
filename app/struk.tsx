import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import api from "./axios";

export default function StrukScreen() {
  const { id } = useLocalSearchParams();
  const [transaksi, setTransaksi] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/transaksi/${id}`)
      .then((res) => setTransaksi(res.data))
      .catch((err) => console.error("Gagal fetch transaksi:", err))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <ActivityIndicator size="large" color="blue" />;
  if (!transaksi) return <Text>Transaksi tidak ditemukan</Text>;

  return (
    <ScrollView className="p-4 bg-white">
      <Text className="text-xl font-bold mb-2">Struk Pembayaran</Text>
      <Text>ID Transaksi: {transaksi.id}</Text>
      <Text>Total Harga: Rp{transaksi.total_harga}</Text>
      <Text>Status: {transaksi.status}</Text>

      <Text className="mt-4 font-bold">Detail Barang:</Text>
      {transaksi.items?.map((item: any, idx: number) => (
        <View key={idx} className="flex-row justify-between border-b py-1">
          <Text>{item.nama} x{item.qty}</Text>
          <Text>Rp{item.harga}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
