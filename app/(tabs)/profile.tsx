import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../axios';

export default function ProfilePage() {
  const router = useRouter();
  const { setIsLoggedIn, token } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
    joinDate: '',
    profilePhoto: '',
  });

  const [editedData, setEditedData] = useState(userData);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const admin = res.data.user;

        const profileData = {
          name: admin.name || '',
          email: admin.email || '',
          phone: admin.phone || '',
          position: admin.role?.name || '',
          joinDate: admin.created_at
            ? new Date(admin.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '',
          profilePhoto: admin.profile_photo || 'https://via.placeholder.com/150/667eea/FFFFFF?text=PP',
        };

        setUserData(profileData);
        setEditedData(profileData);
      } catch (err) {
        console.error('Gagal ambil profil:', err.response?.data || err.message);
        Alert.alert('Error', 'Gagal memuat data profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Izin diperlukan', 'Izinkan aplikasi mengakses galeri');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      console.log(uri);
      setEditedData({ ...editedData, profilePhoto: uri });
    }
  };

  const handleSaveProfile = async () => {
  try {
    const formData = new FormData();
    formData.append('name', editedData.name);
    formData.append('email', editedData.email);
    formData.append('phone', editedData.phone);

    if (editedData.profilePhoto && !editedData.profilePhoto.startsWith('http')) {
      const uri = editedData.profilePhoto;
      const filename = uri.split('/').pop() || `photo.jpg`;
      const ext = filename.split('.').pop();
      let type = `image/${ext}`;
      if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
      if (ext === 'png') type = 'image/png';

      formData.append('profile_photo', {
        uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), // Android langsung uri
        name: filename,
        type,
      });
    }

    const res = await api.post('/auth/update-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
    });

    // response Laravel
    setUserData(res.data.user);
    setIsEditing(false);
    Alert.alert('Berhasil', 'Profil berhasil diperbarui!');
  } catch (err) {
    console.error('Gagal update profil:', err.response?.data || err.message);
    Alert.alert('Error', JSON.stringify(err.response?.data || err.message));
  }
};
  // const handleSaveProfile = async () => {
  //   try {
  //     const formData = new FormData();
  //     formData.append('name', editedData.name);
  //     formData.append('email', editedData.email);
  //     formData.append('phone', editedData.phone);

  //     if (editedData.profilePhoto && !editedData.profilePhoto.startsWith('http')) {
  //       const uri = editedData.profilePhoto;
  //       const filename = uri.split('/').pop() || `photo.jpg`;
  //       const ext = filename.split('.').pop();
  //       let type = `image/${ext}`;
  //       if (ext === 'jpg') type = 'image/jpeg';

  //       formData.append('profile_photo', {
  //         uri,
  //         name: filename,
  //         type,
  //       });
  //     }

  //     const res = await api.post('/auth/update-profile', formData, {
  //       headers: {
  //         'Content-Type': 'multipart/form-data',
  //         Authorization: `Bearer ${token}`,
  //       },
  //     });

  //     setUserData(res.data.user);
  //     setIsEditing(false);
  //     Alert.alert('Berhasil', 'Profil berhasil diperbarui!');
  //   } catch (err) {
  //     console.error('Gagal update profil:', err.response?.data || err.message);
  //     Alert.alert('Error', JSON.stringify(err.response?.data || err.message));
  //   }
  // };

  const handleCancelEdit = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  // const handleChangePassword = async () => {
  //   if (passwordData.newPassword !== passwordData.confirmPassword) {
  //     Alert.alert('Error', 'Password baru dan konfirmasi password tidak sama!');
  //     return;
  //   }
  //   if (passwordData.newPassword.length < 6) {
  //     Alert.alert('Error', 'Password minimal 6 karakter!');
  //     return;
  //   }
  //   try {
  //     await api.post('/change-password', passwordData, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     setShowChangePasswordModal(false);
  //     setPasswordData({
  //       currentPassword: '',
  //       newPassword: '',
  //       confirmPassword: '',
  //     });
  //     Alert.alert('Berhasil', 'Password berhasil diubah!');
  //   } catch (err) {
  //     Alert.alert('Error', 'Gagal mengubah password');
  //   }
  // };

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggedIn(false);
    router.replace('/AuthStack/LoginScreen');
  };

  const ProfileField = ({ label, value, isEditable = false, keyName, multiline = false, icon = '' }) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <Text style={styles.fieldIcon}>{icon}</Text>
        <Text style={styles.fieldLabel}>{label}</Text>
      </View>
      {isEditing && isEditable ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={editedData[keyName]}
          onChangeText={(text) => setEditedData({ ...editedData, [keyName]: text })}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          placeholder={`Masukkan ${label.toLowerCase()}`}
        />
      ) : (
        <View style={styles.fieldValueContainer}>
          <Text style={styles.fieldValue}>{value || 'Belum diisi'}</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <Text style={styles.loadingText}>⏳ Memuat profil...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profil Saya</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
            <Text style={styles.editIcon}>{isEditing ? '✕' : '✏️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={isEditing ? handlePickImage : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <View style={styles.avatarBorder}>
                <Image source={{ uri: editedData.profilePhoto }} style={styles.avatarImage} />
                {isEditing && (
                  <View style={styles.editPhotoOverlay}>
                    <Text style={styles.editPhotoIcon}>📷</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusIndicator} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.name || 'Nama Pengguna'}</Text>
            {/* <View style={styles.positionBadge}>
              <Text style={styles.profilePosition}>{userData.position || 'Posisi'}</Text>
            </View> */}
            <View style={styles.joinDateContainer}>
              <Text style={styles.joinDateIcon}>📅</Text>
              <Text style={styles.joinDate}>Bergabung {userData.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
            <View style={styles.sectionDivider} />
          </View>
          
          <ProfileField label="Nama Lengkap" value={userData.name} isEditable keyName="name" icon="👤" />
          <ProfileField label="Email" value={userData.email} isEditable keyName="email" icon="📧" />
          <ProfileField label="No. Telepon" value={userData.phone} isEditable keyName="phone" icon="📱" />
          {/* <ProfileField label="Posisi" value={userData.position} isEditable={false} icon="💼" /> */}
        </View>

        {/* Action Buttons */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
            <View style={styles.sectionDivider} />
          </View>

          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelIcon}>✕</Text>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <Text style={styles.saveIcon}>✓</Text>
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.actionButtonsContainer}>
              {/* <TouchableOpacity
                style={styles.actionButton}
                onPress={() => setShowChangePasswordModal(true)}
              >
                <View style={styles.actionButtonContent}>
                  <View style={styles.actionIconContainer}>
                    <Text style={styles.actionIcon}>🔐</Text>
                  </View>
                  <Text style={styles.actionText}>Ubah Password</Text>
                  <Text style={styles.actionArrow}>›</Text>
                </View>
              </TouchableOpacity> */}
              
              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={() => setShowLogoutModal(true)}
              >
                <View style={styles.actionButtonContent}>
                  <View style={[styles.actionIconContainer, styles.logoutIconContainer]}>
                    <Text style={styles.actionIcon}>🚪</Text>
                  </View>
                  <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
                  <Text style={[styles.actionArrow, styles.logoutArrow]}>›</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Change Password Modal */}
      {/* {showChangePasswordModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContainer}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconContainer}>
                <Text style={styles.modalIcon}>🔐</Text>
              </View>
              <Text style={styles.modalTitle}>Ubah Password</Text>
              <Text style={styles.modalSubtitle}>Buat password baru yang aman</Text>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.passwordInputContainer}>
                <Text style={styles.inputLabel}>Password Lama</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    secureTextEntry
                    style={styles.passwordInput}
                    placeholder="Masukkan password lama"
                    value={passwordData.currentPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, currentPassword: text })}
                  />
                </View>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={styles.inputLabel}>Password Baru</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔑</Text>
                  <TextInput
                    secureTextEntry
                    style={styles.passwordInput}
                    placeholder="Masukkan password baru"
                    value={passwordData.newPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, newPassword: text })}
                  />
                </View>
              </View>

              <View style={styles.passwordInputContainer}>
                <Text style={styles.inputLabel}>Konfirmasi Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>✓</Text>
                  <TextInput
                    secureTextEntry
                    style={styles.passwordInput}
                    placeholder="Konfirmasi password baru"
                    value={passwordData.confirmPassword}
                    onChangeText={(text) => setPasswordData({ ...passwordData, confirmPassword: text })}
                  />
                </View>
              </View>
            </View>

            <View style={styles.passwordModalActions}>
              <TouchableOpacity
                style={styles.passwordCancelButton}
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.passwordCancelText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.passwordSaveButton} onPress={handleChangePassword}>
                <Text style={styles.passwordSaveText}>Ubah Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )} */}

      {/* Logout Modal */}
      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutModalHeader}>
              <View style={styles.logoutIconCircle}>
                <Text style={styles.logoutModalIcon}>👋</Text>
              </View>
            </View>
            
            <View style={styles.logoutModalContent}>
              <Text style={styles.logoutModalTitle}>Yakin Logout?</Text>
              <Text style={styles.logoutModalMessage}>
                Kamu akan keluar dari aplikasi dan perlu login lagi untuk mengakses akun.
              </Text>
            </View>
            
            <View style={styles.logoutModalActions}>
              <TouchableOpacity style={styles.stayButton} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.stayButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirmButton} onPress={handleLogout}>
                <Text style={styles.logoutConfirmText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
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
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  loadingText: {
    fontSize: 16,
    color: '#64748b',
    fontWeight: '500',
  },

  // Header
  headerGradient: {
    backgroundColor: '#ffffffff',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
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
    color: '#000000ff',
  },
  editButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIcon: {
    fontSize: 16,
    color: '#ffffff',
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -10,
  },

  // Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 20,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#394655ff',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  avatarSection: {
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    padding: 4,
    borderRadius: 60,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#a6abc0ff',
  },
  editPhotoOverlay: {
    position: 'absolute',
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  positionBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  profilePosition: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '600',
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  joinDateIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  joinDate: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },

  // Section
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  sectionDivider: {
    height: 2,
    backgroundColor: '#f1f5f9',
    borderRadius: 1,
  },

  // Fields
  fieldContainer: {
    marginBottom: 16,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  fieldValueContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    fontWeight: '500',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },

  // Actions
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  cancelIcon: {
    fontSize: 16,
    color: '#64748b',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // backgroundColor: '#dc3545',
    color: '#64748b',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
    gap: 8,
  },
  saveIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  actionButtonsContainer: {
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  actionArrow: {
    fontSize: 20,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  logoutIconContainer: {
    backgroundColor: '#ef4444',
  },
  logoutText: {
    color: '#dc2626',
  },
  logoutArrow: {
    color: '#ef4444',
  },

  bottomPadding: {
    height: 20,
  },

  // Modals - Updated positioning
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start', // Changed from 'center' to 'flex-start'
    alignItems: 'center',
    paddingTop: 100, // Added top padding to position modals in center-top
    paddingHorizontal: 20,
  },

  // Password Modal
  passwordModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#f8fafc',
  },
  modalIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIcon: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  modalContent: {
    padding: 24,
  },
  passwordInputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  inputIcon: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingRight: 16,
    color: '#1e293b',
  },
  passwordModalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  passwordCancelButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  passwordCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748b',
  },
  passwordSaveButton: {
    flex: 1,
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  passwordSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },

  // Logout Modal
  logoutModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 25,
  },
  logoutModalHeader: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#f8fafc',
  },
  logoutIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoutModalIcon: {
    fontSize: 36,
  },
  logoutModalContent: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
  },
  logoutModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
    backgroundColor: '#f8fafc',
  },
  stayButton: {
    flex: 1,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  stayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#475569',
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  logoutConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});