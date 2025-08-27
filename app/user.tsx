import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from './axios';

// Helper untuk handle URL foto
const getPhotoUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/60/667eea/FFFFFF?text=U';
  if (path.startsWith('http')) return path;
  return `https://clear-gnat-certainly.ngrok-free.app/storage/${path}`;
};

export default function UserManagement() {
  const router = useRouter();
  const { token } = useContext(AuthContext);

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role_id: '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/master/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("USERS RESPONSE:", response.data);

      // Pastikan yang masuk ke state itu array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else if (Array.isArray(response.data.data)) {
        setUsers(response.data.data);
      } else if (Array.isArray(response.data.users)) {
        setUsers(response.data.users);
      } else {
        setUsers([]); // fallback biar aman
      }
    } catch (error) {
      console.error('Gagal fetch users:', error.response?.data || error.message);
      Alert.alert('Error', 'Gagal memuat data pengguna');
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await api.get("/master/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("ROLES RESPONSE:", res.data);

      // pastikan ambil arraynya
      if (Array.isArray(res.data)) {
        setRoles(res.data);
      } else if (Array.isArray(res.data.data)) {
        setRoles(res.data.data);
      } else {
        setRoles([]);
      }
    } catch (err) {
      console.error("Gagal fetch roles:", err.response?.data || err.message);
      Alert.alert("Error", "Gagal memuat data role");
      setRoles([]); // Set empty array on error
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
    fetchRoles();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      role_id: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = 'Nama wajib diisi';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Nama minimal 2 karakter';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email wajib diisi';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    // Phone validation (optional but if provided should be valid)
    if (formData.phone && formData.phone.length < 10) {
      newErrors.phone = 'Nomor telepon minimal 10 digit';
    }

    // Role validation
    if (!formData.role_id) {
      newErrors.role_id = 'Role wajib dipilih';
    }
    
    // Password validation
    if (showAddModal && !formData.password) {
      newErrors.password = 'Password wajib diisi';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddUser = async () => {
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    try {
      const response = await api.post('/master/users', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle different response structures
      const newUser = response.data.user || response.data.data || response.data;
      
      setUsers(prevUsers => [...prevUsers, newUser]);
      setShowAddModal(false);
      resetForm();
      Alert.alert('Berhasil', 'User berhasil ditambahkan!');
    } catch (error) {
      console.error('Gagal tambah user:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Gagal menambahkan user';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditUser = async () => {
    if (!validateForm() || submitting) return;

    setSubmitting(true);
    try {
      const updateData = { ...formData };
      // Hapus password dari data jika kosong
      if (!updateData.password) {
        delete updateData.password;
      }

      const response = await api.put(`/master/users/${selectedUser.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Handle different response structures
      const updatedUser = response.data.user || response.data.data || response.data;
      
      const updatedUsers = users.map(user => 
        user.id === selectedUser.id ? updatedUser : user
      );
      setUsers(updatedUsers);
      setShowEditModal(false);
      resetForm();
      setSelectedUser(null);
      Alert.alert('Berhasil', 'User berhasil diperbarui!');
    } catch (error) {
      console.error('Gagal update user:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Gagal memperbarui user';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (submitting) return;
    
    setSubmitting(true);
    try {
      await api.delete(`/master/users/${selectedUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const updatedUsers = users.filter(user => user.id !== selectedUser.id);
      setUsers(updatedUsers);
      setShowDeleteModal(false);
      setSelectedUser(null);
      Alert.alert('Berhasil', 'User berhasil dihapus!');
    } catch (error) {
      console.error('Gagal hapus user:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          'Gagal menghapus user';
      Alert.alert('Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      password: '',
      role_id: user.role_id?.toString() || user.role?.id?.toString() || '',
    });
    setErrors({});
    setShowEditModal(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Safe filtering
  const filteredUsers = users.filter(u => {
    if (!u) return false;
    const searchLower = searchQuery.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (u.role?.name && u.role.name.toLowerCase().includes(searchLower))
    );
  });

  const UserCard = ({ item }) => {
    if (!item) return null;
    
    return (
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: getPhotoUrl(item.photo) }} 
            style={styles.userAvatar}
            defaultSource={{ uri: 'https://via.placeholder.com/60/667eea/FFFFFF?text=U' }}
          />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{item.name || 'No Name'}</Text>
            <Text style={styles.userEmail}>{item.email || 'No Email'}</Text>
            {item.phone && (
              <Text style={styles.userPhone}>{item.phone}</Text>
            )}
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{item.role?.name || 'No Role'}</Text>
            </View>
          </View>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.editBtn]}
            onPress={() => openEditModal(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => openDeleteModal(item)}
            activeOpacity={0.7}
          >
            <Text style={styles.actionIcon}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const FormModal = ({ visible, onClose, onSubmit, title, isEdit = false }) => (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      statusBarTranslucent
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.formScrollView}
            contentContainerStyle={styles.formContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Nama */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Nama Lengkap *</Text>
              <TextInput
                style={[styles.input, errors.name && styles.inputError]}
                value={formData.name}
                onChangeText={(text) => {
                  setFormData({ ...formData, name: text });
                  if (errors.name) {
                    setErrors({ ...errors, name: null });
                  }
                }}
                placeholder="Masukkan nama lengkap"
                autoCapitalize="words"
              />
              {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email *</Text>
              <TextInput
                style={[styles.input, errors.email && styles.inputError]}
                value={formData.email}
                onChangeText={(text) => {
                  setFormData({ ...formData, email: text.toLowerCase() });
                  if (errors.email) {
                    setErrors({ ...errors, email: null });
                  }
                }}
                placeholder="Masukkan email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>No. Telepon</Text>
              <TextInput
                style={[styles.input, errors.phone && styles.inputError]}
                value={formData.phone}
                onChangeText={(text) => {
                  setFormData({ ...formData, phone: text });
                  if (errors.phone) {
                    setErrors({ ...errors, phone: null });
                  }
                }}
                placeholder="Masukkan nomor telepon"
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>
                Password {isEdit ? '(Kosongkan jika tidak ingin mengubah)' : '*'}
              </Text>
              <TextInput
                style={[styles.input, errors.password && styles.inputError]}
                value={formData.password}
                onChangeText={(text) => {
                  setFormData({ ...formData, password: text });
                  if (errors.password) {
                    setErrors({ ...errors, password: null });
                  }
                }}
                placeholder={isEdit ? "Masukkan password baru" : "Masukkan password"}
                secureTextEntry
                autoComplete="password"
              />
              {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
            </View>

            {/* Role */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Role *</Text>
              <View style={styles.roleSelector}>
                {roles.length > 0 ? (
                  roles.map((role) => (
                    <TouchableOpacity
                      key={role.id}
                      style={[
                        styles.roleOption,
                        formData.role_id === role.id.toString() && styles.roleOptionSelected
                      ]}
                      onPress={() => {
                        setFormData({ ...formData, role_id: role.id.toString() });
                        if (errors.role_id) {
                          setErrors({ ...errors, role_id: null });
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.roleOptionText,
                        formData.role_id === role.id.toString() && styles.roleOptionTextSelected
                      ]}>
                        {role.name}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <Text style={styles.noRolesText}>Tidak ada role tersedia</Text>
                )}
              </View>
              {errors.role_id && <Text style={styles.errorText}>{errors.role_id}</Text>}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} 
              onPress={onSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Menyimpan...' : (isEdit ? 'Perbarui' : 'Tambah')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>⏳ Memuat data pengguna...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Kelola User</Text>
          <TouchableOpacity
            onPress={() => {
              resetForm();
              setShowAddModal(true);
            }}
            style={styles.addButton}
          >
            <Text style={styles.addIcon}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama, email, atau role..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{users.length}</Text>
            <Text style={styles.statLabel}>Total User</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{filteredUsers.length}</Text>
            <Text style={styles.statLabel}>Hasil Pencarian</Text>
          </View>
        </View>
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
       keyExtractor={(item, index) => item?.id?.toString() || `user-${index}`}
        renderItem={UserCard}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'Tidak Ada Hasil' : 'Tidak Ada User'}
            </Text>
            <Text style={styles.emptyMessage}>
              {searchQuery 
                ? 'Tidak ada user yang sesuai dengan pencarian' 
                : 'Belum ada user yang terdaftar'
              }
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => {
                  resetForm();
                  setShowAddModal(true);
                }}
              >
                <Text style={styles.emptyActionText}>Tambah User Pertama</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Add Modal */}
      <FormModal
        visible={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetForm();
        }}
        onSubmit={handleAddUser}
        title="Tambah User Baru"
      />

      {/* Edit Modal */}
      <FormModal
        visible={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          resetForm();
          setSelectedUser(null);
        }}
        onSubmit={handleEditUser}
        title="Edit User"
        isEdit
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={showDeleteModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.deleteModalContainer}>
            <View style={styles.deleteModalHeader}>
              <View style={styles.deleteIconCircle}>
                <Text style={styles.deleteModalIcon}>⚠️</Text>
              </View>
            </View>
            
            <View style={styles.deleteModalContent}>
              <Text style={styles.deleteModalTitle}>Hapus User?</Text>
              <Text style={styles.deleteModalMessage}>
                Yakin ingin menghapus user "{selectedUser?.name}"? 
                Tindakan ini tidak dapat dibatalkan.
              </Text>
            </View>
            
            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.cancelDeleteBtn}
                onPress={() => {
                  setShowDeleteModal(false);
                  setSelectedUser(null);
                }}
                disabled={submitting}
              >
                <Text style={styles.cancelDeleteText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmDeleteBtn, submitting && styles.confirmDeleteBtnDisabled]}
                onPress={handleDeleteUser}
                disabled={submitting}
              >
                <Text style={styles.confirmDeleteText}>
                  {submitting ? 'Menghapus...' : 'Hapus'}
                </Text>
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
    backgroundColor: '#f8fafc',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // Header
  header: {
    backgroundColor: '#ffffff',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dc3545',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#64748b',
    marginLeft: 8,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },

  // List
  listContainer: {
    padding: 20,
    flexGrow: 1,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#e2e8f0',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 12,
    color: '#3730a3',
    fontWeight: '500',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#dbeafe',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
  },
  actionIcon: {
    fontSize: 14,
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyActionBtn: {
    backgroundColor: '#667eea',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyActionText: {
    color: '#ffffff',
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 16,
    color: '#64748b',
  },

  // Form
  formScrollView: {
    maxHeight: 400,
  },
  formContainer: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1e293b',
    backgroundColor: '#ffffff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },

  // Role Selector
  roleSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roleOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#ffffff',
  },
  roleOptionSelected: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  roleOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  roleOptionTextSelected: {
    color: '#ffffff',
  },
  noRolesText: {
    fontSize: 14,
    color: '#64748b',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },

  // Modal Actions
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#667eea',
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Delete Modal
  deleteModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
  },
  deleteModalHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#f8fafc',
  },
  deleteIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteModalIcon: {
    fontSize: 36,
  },
  deleteModalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteModalMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  deleteModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  cancelDeleteBtn: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  cancelDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  confirmDeleteBtnDisabled: {
    backgroundColor: '#fca5a5',
  },
  confirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});