import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Modal,
    RefreshControl,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../app/axios";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get('window');

export default function RoleManagement() {
  const router = useRouter();
  const { token } = useContext(AuthContext);
  const [roles, setRoles] = useState([]);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    full_name: "",
    guard_name: "api",
  });

  const [stats, setStats] = useState({
    totalRole: 0,
    hasilPencarian: 0,
  });

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/master/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const roleData = res.data.data || res.data;
      setRoles(roleData);
      setFilteredRoles(roleData);
      setStats({
        totalRole: roleData.length,
        hasilPencarian: roleData.length,
      });
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", "Gagal memuat data role");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRoles(roles);
      setStats(prev => ({ ...prev, hasilPencarian: roles.length }));
    } else {
      const filtered = roles.filter(role =>
        role.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRoles(filtered);
      setStats(prev => ({ ...prev, hasilPencarian: filtered.length }));
    }
  }, [searchQuery, roles]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRoles();
    setRefreshing(false);
  };

  const handleAddRole = async () => {
    if (!formData.name.trim() || !formData.full_name.trim()) {
      Alert.alert("Error", "Nama dan Nama Lengkap wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      if (editingRole) {
        const res = await api.put(
          `/master/roles/${editingRole.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedRole = res.data.role || res.data.data || res.data;
        setRoles(prev => prev.map(role => 
          role.id === editingRole.id ? updatedRole : role
        ));
        Alert.alert("Berhasil", "Role berhasil diperbarui!");
      } else {
        const res = await api.post(
          "/master/roles",
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const newRole = res.data.role || res.data.data || res.data;
        setRoles(prev => [...prev, newRole]);
        Alert.alert("Berhasil", "Role berhasil ditambahkan!");
      }
      
      setShowModal(false);
      setFormData({ name: "", full_name: "", guard_name: "api" });
      setEditingRole(null);
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", editingRole ? "Gagal memperbarui role" : "Gagal menambahkan role");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      full_name: role.full_name,
      guard_name: role.guard_name,
    });
    setShowModal(true);
  };

  const handleDeleteRole = (role) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus role "${role.full_name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/master/roles/${role.id}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              setRoles(prev => prev.filter(r => r.id !== role.id));
              Alert.alert("Berhasil", "Role berhasil dihapus!");
            } catch (error) {
              console.log(error.response?.data || error.message);
              Alert.alert("Error", "Gagal menghapus role");
            }
          }
        }
      ]
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({ name: "", full_name: "", guard_name: "api" });
    setEditingRole(null);
  };

  const RoleCard = ({ item, index }) => (
    <View style={[styles.roleCard, { marginTop: index === 0 ? 16 : 8 }]}>
      <View style={styles.roleHeader}>
        <View style={styles.roleInfo}>
          <Text style={styles.roleName}>{item.full_name}</Text>
          <Text style={styles.roleEmail}>{item.name}@gmail.com</Text>
          <Text style={styles.rolePhone}>081234567{89 + index}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleText}>{item.name}</Text>
          </View>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditRole(item)}
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteRole(item)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>Belum Ada Role</Text>
      <Text style={styles.emptySubtitle}>
        Mulai dengan menambahkan role pertama Anda
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.emptyButtonText}>Tambah Role</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola Role</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowModal(true)}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, email, atau role..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalRole}</Text>
          <Text style={styles.statLabel}>Total Role</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.hasilPencarian}</Text>
          <Text style={styles.statLabel}>Hasil Pencarian</Text>
        </View>
      </View>

      {/* Role List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredRoles}
            keyExtractor={(item, index) => `${item?.id ?? "role"}-${index}`}
            refreshControl={
              <RefreshControl 
                refreshing={refreshing} 
                onRefresh={onRefresh}
                colors={['#6366F1']}
                tintColor="#6366F1"
              />
            }
            renderItem={({ item, index }) => <RoleCard item={item} index={index} />}
            ListEmptyComponent={<EmptyState />}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 20 }}
          />
        )}
      </View>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showModal}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>
                    {editingRole ? 'Edit Role' : 'Tambah Role Baru'}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {editingRole ? 'Perbarui informasi role' : 'Isi informasi role dengan lengkap'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeModal}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formContainer}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Singkat *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(t) => setFormData({ ...formData, name: t })}
                      placeholder="contoh: admin"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nama Lengkap *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.full_name}
                      onChangeText={(t) => setFormData({ ...formData, full_name: t })}
                      placeholder="contoh: Administrator"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={closeModal}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelButtonText}>Batal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveButton, submitting && styles.disabledButton]}
                  onPress={handleAddRole}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting && <ActivityIndicator size="small" color="#fff" style={{ marginRight: 8 }} />}
                  <Text style={styles.saveButtonText}>
                    {submitting ? 
                      (editingRole ? "Memperbarui..." : "Menyimpan...") : 
                      (editingRole ? "Perbarui" : "Simpan")
                    }
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EF4444",
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111827",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#10B981",
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginVertical: 10,
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "800",
    color: "#6366F1",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#6B7280",
    fontWeight: "500",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  roleCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  roleEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  rolePhone: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  roleTag: {
    alignSelf: 'flex-start',
    backgroundColor: "#6366F1",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#0EA5E9",
  },
  deleteButton: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  actionButtonText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: 'center',
    marginBottom: 32,
  },
  emptyButton: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#6B7280",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: "#6B7280",
    fontWeight: "600",
  },
  formContainer: {
    padding: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
  },
  input: {
    padding: 16,
    fontSize: 16,
    color: "#111827",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFFFFF",
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: "#6366F1",
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  disabledButton: {
    opacity: 0.6,
  },
});