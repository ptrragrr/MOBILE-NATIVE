import { useRouter } from "expo-router";
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
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import api from "../app/axios";
import { AuthContext } from "../context/AuthContext";

const { width } = Dimensions.get("window");

// Daftar roles yang tersedia
const AVAILABLE_ROLES = [
  { id: 1, name: "super-admin", display_name: "Super Admin" },
  { id: 2, name: "admin", display_name: "Administrator" },
  { id: 3, name: "manager", display_name: "Manager" },
  { id: 4, name: "staff", display_name: "Staff" },
  { id: 5, name: "user", display_name: "User" },
];

export default function UserManagement() {
  const router = useRouter();
  const { token } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    roles: [], // Array untuk menyimpan selected roles
  });

  const [stats, setStats] = useState({
    totalUser: 0,
    hasilPencarian: 0,
  });

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/master/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res.data.data || res.data;
      setUsers(userData);
      setFilteredUsers(userData);
      setStats({
        totalUser: userData.length,
        hasilPencarian: userData.length,
      });
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", "Gagal memuat data user");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const [availableRoles, setAvailableRoles] = useState([]);

  const fetchRoles = async () => {
    try {
      const res = await api.get("/master/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Sesuaikan dengan struktur respons API kamu
      const rolesData = res.data.data || res.data;
      setAvailableRoles(rolesData);
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert("Error", "Gagal memuat data roles");
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchRoles(); // ambil roles juga
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
      setStats((prev) => ({ ...prev, hasilPencarian: users.length }));
    } else {
      const filtered = users.filter(
        (user) =>
          user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user.phone?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredUsers(filtered);
      setStats((prev) => ({ ...prev, hasilPencarian: filtered.length }));
    }
  }, [searchQuery, users]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  const handleAddUser = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      Alert.alert("Error", "Nama dan Email wajib diisi");
      return;
    }

    if (
      !editingUser &&
      (!formData.password || !formData.password_confirmation)
    ) {
      Alert.alert("Error", "Password dan Konfirmasi Password wajib diisi");
      return;
    }

    if (!editingUser && formData.password !== formData.password_confirmation) {
      Alert.alert("Error", "Password dan Konfirmasi Password tidak cocok");
      return;
    }

    setSubmitting(true);
    try {
      // Prepare data with roles
      const submitData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        roles: formData.roles,
      };

      // Add password only for new users or when updating password
      if (!editingUser || formData.password) {
        submitData.password = formData.password;
        submitData.password_confirmation = formData.password_confirmation;
      }

      if (editingUser) {
        const res = await api.put(
          `/master/users/${editingUser.id}`,
          submitData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const updatedUser = res.data.user || res.data.data || res.data;
        setUsers((prev) =>
          prev.map((user) => (user.id === editingUser.id ? updatedUser : user))
        );
        Alert.alert("Berhasil", "User berhasil diperbarui!");
      } else {
        const res = await api.post("/master/users/store", submitData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const newUser = res.data.user || res.data.data || res.data;
        setUsers((prev) => [...prev, newUser]);
        Alert.alert("Berhasil", "User berhasil ditambahkan!");
      }

      setShowModal(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        password: "",
        password_confirmation: "",
        roles: [],
      });
      setEditingUser(null);
    } catch (error) {
      console.log(error.response?.data || error.message);
      Alert.alert(
        "Error",
        editingUser ? "Gagal memperbarui user" : "Gagal menambahkan user"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || "",
      password: "",
      password_confirmation: "",
      roles: user.roles?.map((role) => role.name) || [], // Load existing roles
    });
    setShowModal(true);
  };

  const handleDeleteUser = (user) => {
    Alert.alert(
      "Konfirmasi Hapus",
      `Apakah Anda yakin ingin menghapus user "${user.name}"?`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/master/users/${user.id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
              Alert.alert("Berhasil", "User berhasil dihapus!");
            } catch (error) {
              console.log(error.response?.data || error.message);
              Alert.alert("Error", "Gagal menghapus user");
            }
          },
        },
      ]
    );
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      roles: [],
    });
    setEditingUser(null);
  };

  // Toggle role selection
  const toggleRole = (roleName) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.includes(roleName)
        ? prev.roles.filter((r) => r !== roleName)
        : [...prev.roles, roleName],
    }));
  };

  const UserCard = ({ item, index }) => (
    <View style={[styles.userCard, { marginTop: index === 0 ? 16 : 8 }]}>
      <View style={styles.userHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.name}</Text>
          <Text style={styles.userEmail}>{item.email}</Text>
          <Text style={styles.userPhone}>
            {item.phone || `081234567${89 + index}`}
          </Text>
          <View style={styles.rolesContainer}>
            {item.roles && item.roles.length > 0 ? (
              item.roles.slice(0, 2).map((role, roleIndex) => (
                <Text key={roleIndex} style={styles.roleTag}>
                  {(role.display_name || role.name).length > 5
                    ? (role.display_name || role.name).substring(0, 5) + ".."
                    : role.display_name || role.name}
                </Text>
              ))
            ) : (
              <Text style={styles.roleTag}>No Role</Text>
            )}
            {item.roles && item.roles.length > 2 && (
              <Text style={[styles.roleTag, { backgroundColor: "#9CA3AF" }]}>
                +{item.roles.length - 2}
              </Text>
            )}
          </View>
          {/* Show role count */}
          <Text style={styles.roleCount}>
            {item.roles?.length || 0} Role
            {(item.roles?.length || 0) > 1 ? "s" : ""}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditUser(item)}
          >
            <Text style={styles.actionButtonText}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteUser(item)}
          >
            <Text style={styles.actionButtonText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const CheckboxItem = ({ role, isSelected, onToggle }) => (
    <TouchableOpacity
      style={styles.checkboxContainer}
      onPress={() => onToggle(role.name)}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
        {isSelected && <Text style={styles.checkboxIcon}>✓</Text>}
      </View>
      <Text style={styles.checkboxLabel}>{role.display_name}</Text>
    </TouchableOpacity>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>👥</Text>
      <Text style={styles.emptyTitle}>Belum Ada User</Text>
      <Text style={styles.emptySubtitle}>
        Mulai dengan menambahkan user pertama Anda
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.emptyButtonText}>Tambah User</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kelola User</Text>
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
            placeholder="Cari nama, email, atau nomor telepon..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalUser}</Text>
          <Text style={styles.statLabel}>Total User</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.hasilPencarian}</Text>
          <Text style={styles.statLabel}>Hasil Pencarian</Text>
        </View>
      </View>

      {/* User List */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item, index) => `${item?.id ?? "user"}-${index}`}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6366F1"]}
                tintColor="#6366F1"
              />
            }
            renderItem={({ item, index }) => (
              <UserCard item={item} index={index} />
            )}
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
                    {editingUser ? "Edit User" : "Tambah User Baru"}
                  </Text>
                  <Text style={styles.modalSubtitle}>
                    {editingUser
                      ? "Perbarui informasi user"
                      : "Isi informasi user dengan lengkap"}
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
                  <Text style={styles.inputLabel}>Nama Lengkap *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.name}
                      onChangeText={(t) =>
                        setFormData({ ...formData, name: t })
                      }
                      placeholder="contoh: John Doe"
                      placeholderTextColor="#9CA3AF"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email *</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.email}
                      onChangeText={(t) =>
                        setFormData({ ...formData, email: t })
                      }
                      placeholder="contoh: john@example.com"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="email-address"
                      autoCapitalize="none"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nomor Telepon</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.phone}
                      onChangeText={(t) =>
                        setFormData({ ...formData, phone: t })
                      }
                      placeholder="contoh: 081234567890"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="phone-pad"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Password{" "}
                    {!editingUser
                      ? "*"
                      : "(kosongkan jika tidak ingin mengubah)"}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.password}
                      onChangeText={(t) =>
                        setFormData({ ...formData, password: t })
                      }
                      placeholder="Masukkan password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Konfirmasi Password {!editingUser ? "*" : ""}
                  </Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={styles.input}
                      value={formData.password_confirmation}
                      onChangeText={(t) =>
                        setFormData({ ...formData, password_confirmation: t })
                      }
                      placeholder="Ulangi password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                    />
                  </View>
                </View>

                {/* Roles Section */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Roles</Text>
                  <View style={styles.rolesContainer}>
                    {availableRoles.map((role) => (
                      <CheckboxItem
                        key={role.id}
                        role={{ name: role.name, display_name: role.full_name }}
                        isSelected={formData.roles.includes(role.name)}
                        onToggle={toggleRole}
                      />
                    ))}
                  </View>

                  {/* Selected roles summary */}
                  {formData.roles.length > 0 && (
                    <View style={styles.selectedSummary}>
                      <Text style={styles.selectedSummaryText}>
                        {formData.roles.length} role
                        {formData.roles.length > 1 ? "s" : ""} terpilih
                      </Text>
                    </View>
                  )}
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
                  style={[
                    styles.saveButton,
                    submitting && styles.disabledButton,
                  ]}
                  onPress={handleAddUser}
                  disabled={submitting}
                  activeOpacity={0.8}
                >
                  {submitting && (
                    <ActivityIndicator
                      size="small"
                      color="#fff"
                      style={{ marginRight: 8 }}
                    />
                  )}
                  <Text style={styles.saveButtonText}>
                    {submitting
                      ? editingUser
                        ? "Memperbarui..."
                        : "Menyimpan..."
                      : editingUser
                      ? "Perbarui"
                      : "Simpan"}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
  },
  backIcon: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: "600",
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
    justifyContent: "center",
    alignItems: "center",
  },
  addButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
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
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  userCard: {
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 8,
  },
  // rolesContainer: {
  //   flexDirection: 'row',
  //   flexWrap: 'wrap',
  //   marginBottom: 4,
  //   gap: 3,
  // },
  roleTag: {
    backgroundColor: "#6366F1",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 60,
    fontSize: 9,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    overflow: "hidden",
  },
  roleText: {
    fontSize: 9,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // roleCount: {
  //   fontSize: 12,
  //   color: "#10B981",
  //   fontWeight: "500",
  // },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
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
    justifyContent: "center",
    alignItems: "center",
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
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
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
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
    justifyContent: "center",
    alignItems: "center",
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
  // Roles Styles
  rolesContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    padding: 16,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: "#6366F1",
    borderColor: "#6366F1",
  },
  checkboxIcon: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  checkboxLabel: {
    fontSize: 15,
    color: "#374151",
    flex: 1,
  },
  selectedSummary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
  },
  selectedSummaryText: {
    fontSize: 14,
    color: "#6366F1",
    fontWeight: "500",
    textAlign: "center",
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
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
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
