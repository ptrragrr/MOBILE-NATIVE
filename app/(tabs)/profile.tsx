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

// Helper buat handle URL foto
const getPhotoUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/150/667eea/FFFFFF?text=PP';
  if (path.startsWith('http')) return path;
  return `https://clear-gnat-certainly.ngrok-free.app/storage/${path}`; // ganti domain sesuai backend kamu
};

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
          profilePhoto: admin.photo || 'https://via.placeholder.com/150/667eea/FFFFFF?text=PP',
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
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
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

      setUserData(res.data.user);
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui!');
    } catch (err) {
      console.error('Gagal update profil:', err.response?.data || err.message);
      Alert.alert('Error', JSON.stringify(err.response?.data || err.message));
    }
  };

  const handleCancelEdit = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggedIn(false);
    router.replace('/AuthStack/LoginScreen');
  };

  const ProfileField = ({ label, value, isEditable = false, keyName, multiline = false, icon = '' }) => (
    <View style={styles.fieldContainer}>
      <View style={styles.fieldHeader}>
        <View style={styles.fieldIconBox}>
          <Text style={styles.fieldIcon}>{icon}</Text>
        </View>
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
          placeholderTextColor="#94a3b8"
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
          <View style={styles.loadingPulse}>
            <Text style={styles.loadingIcon}>⚡</Text>
          </View>
          <Text style={styles.loadingText}>Memuat profil...</Text>
          <Text style={styles.loadingSubtext}>Tunggu sebentar</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with gradient background */}
      <View style={styles.headerGradient}>
        <View style={styles.decorativeBlur} />
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Profil Saya</Text>
            <Text style={styles.headerSubtitle}>Kelola informasi pribadi</Text>
          </View>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)} style={styles.editButton}>
            <Text style={styles.editIcon}>{isEditing ? '✕' : '✏️'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Enhanced Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileCardBg} />
          
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={isEditing ? handlePickImage : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <View style={styles.avatarBorder}>
                <Image source={{ uri: editedData.profilePhoto }} style={styles.avatarImage} />
                <View style={styles.avatarGlow} />
                {isEditing && (
                  <View style={styles.editPhotoOverlay}>
                    <Text style={styles.editPhotoIcon}>📸</Text>
                    <Text style={styles.editPhotoText}>Ubah Foto</Text>
                  </View>
                )}
              </View>
              <View style={styles.statusIndicator} />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.name || 'Nama Pengguna'}</Text>
            <View style={styles.positionBadge}>
              <Text style={styles.profilePosition}>{userData.position || 'Pengguna'}</Text>
            </View>
            <View style={styles.joinDateContainer}>
              <View style={styles.joinDateIcon}>
                <Text>📅</Text>
              </View>
              <Text style={styles.joinDate}>Bergabung {userData.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconBox}>
                <Text style={styles.sectionIconText}>👤</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Informasi Pribadi</Text>
                <Text style={styles.sectionSubtitle}>Data personal Anda</Text>
              </View>
            </View>
            <View style={styles.sectionDivider} />
          </View>
          
          <ProfileField label="Nama Lengkap" value={userData.name} isEditable keyName="name" icon="🏷️" />
          <ProfileField label="Email" value={userData.email} isEditable keyName="email" icon="✉️" />
          <ProfileField label="No. Telepon" value={userData.phone} isEditable keyName="phone" icon="📞" />
        </View>

        {/* Action Buttons */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={styles.sectionIconBox}>
                <Text style={styles.sectionIconText}>⚙️</Text>
              </View>
              <View>
                <Text style={styles.sectionTitle}>Pengaturan Akun</Text>
                <Text style={styles.sectionSubtitle}>Kelola akun Anda</Text>
              </View>
            </View>
            <View style={styles.sectionDivider} />
          </View>

          {isEditing ? (
            <View style={styles.editActions}>
              {/* <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.cancelIcon}>✕</Text>
                </View>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity> */}
              <TouchableOpacity style={[styles.baseButton, styles.cancelButton]} onPress={handleCancelEdit}>
  <View style={styles.buttonIconContainer}>
    <Text style={styles.cancelIcon}>✕</Text>
  </View>
  <Text style={styles.cancelButtonText}>Batal</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.baseButton, styles.saveButton]} onPress={handleSaveProfile}>
  <View style={styles.buttonIconContainer}>
    <Text style={styles.saveIcon}>✓</Text>
  </View>
  <Text style={styles.saveButtonText}>Simpan</Text>
</TouchableOpacity>
              {/* <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                <View style={styles.buttonIconContainer}>
                  <Text style={styles.saveIcon}>✓</Text>
                </View>
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity> */}
            </View>
          ) : (
            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity
                style={[styles.actionButton, styles.logoutButton]}
                onPress={() => setShowLogoutModal(true)}
              >
                <View style={styles.actionButtonContent}>
                  <View style={[styles.actionIconContainer, styles.logoutIconContainer]}>
                    <Text style={styles.actionIcon}>🚪</Text>
                  </View>
                  <View style={styles.actionTextContainer}>
                    <Text style={[styles.actionText, styles.logoutText]}>Keluar dari Akun</Text>
                    <Text style={styles.actionSubtext}>Logout dari aplikasi</Text>
                  </View>
                  <View style={styles.actionArrowContainer}>
                    <Text style={[styles.actionArrow, styles.logoutArrow]}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Enhanced Logout Modal */}
      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutModalHeader}>
              <View style={styles.logoutIconCircle}>
                <View style={styles.logoutIconInner}>
                  <Text style={styles.logoutModalIcon}>👋</Text>
                </View>
              </View>
              <View style={styles.modalHeaderText}>
                <Text style={styles.logoutModalTitle}>Konfirmasi Logout</Text>
                <Text style={styles.logoutModalSubtitle}>Sampai jumpa lagi!</Text>
              </View>
            </View>
            
            <View style={styles.logoutModalContent}>
              <Text style={styles.logoutModalMessage}>
                Anda akan keluar dari aplikasi dan perlu login kembali untuk mengakses akun Anda.
              </Text>
            </View>
            
            <View style={styles.logoutModalActions}>
              <TouchableOpacity style={styles.stayButton} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.stayButtonText}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.logoutConfirmButton} onPress={handleLogout}>
                <View style={styles.logoutConfirmIcon}>
                  <Text>🚪</Text>
                </View>
                <Text style={styles.logoutConfirmText}>Ya, Logout</Text>
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
    backgroundColor: '#f1f5f9',
  },
  
  // Enhanced Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 20,
  },
  loadingCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    minWidth: 200,
  },
  loadingPulse: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
  loadingText: {
    fontSize: 18,
    color: '#1e293b',
    fontWeight: '700',
    marginBottom: 4,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#64748b',
  },

  // Enhanced Header
  headerGradient: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    backgroundColor: '#667eea',
    paddingTop: 50,
    paddingBottom: 30,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  decorativeBlur: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 75,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  backIcon: {
    fontSize: 22,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  editButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  editIcon: {
    fontSize: 18,
    color: '#ffffff',
  },

  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -16,
  },

  // Enhanced Profile Card
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 15,
    position: 'relative',
    overflow: 'hidden',
  },
  profileCardBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
  },
  avatarSection: {
    marginBottom: 20,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarBorder: {
    padding: 6,
    borderRadius: 68,
    backgroundColor: '#ffffff',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  avatarGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 68,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    zIndex: -1,
  },
  avatarImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e2e8f0',
  },
  editPhotoOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    bottom: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  editPhotoText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    borderWidth: 4,
    borderColor: '#ffffff',
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 12,
    textAlign: 'center',
  },
  positionBadge: {
    backgroundColor: 'rgba(102, 126, 234, 0.15)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  profilePosition: {
    fontSize: 14,
    color: '#667eea',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  joinDateIcon: {
    marginRight: 8,
  },
  joinDate: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },

  // Enhanced Section
  sectionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIconText: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionDivider: {
    height: 3,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 2,
  },

  // Enhanced Fields
  fieldContainer: {
    marginBottom: 20,
  },
  fieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fieldIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldIcon: {
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
  },
  fieldValueContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  fieldValue: {
    fontSize: 16,
    color: '#1e293b',
    fontWeight: '600',
  },
  fieldInput: {
    fontSize: 16,
    color: '#1e293b',
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    fontWeight: '600',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  multilineInput: {
    height: 90,
    textAlignVertical: 'top',
  },

  // Enhanced Actions
  editActions: {
    flexDirection: 'row',
    gap: 16,
  },
  baseButton: {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 16,
  paddingVertical: 18,
  gap: 10,
},
  cancelButton: {
  backgroundColor: '#f1f5f9',
  borderWidth: 2,
  borderColor: '#e2e8f0',
},
  buttonIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelIcon: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 'bold',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  saveButton: {
  backgroundColor: '#667eea',
  shadowColor: '#667eea',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.4,
  shadowRadius: 12,
  elevation: 8,
},
  saveIcon: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },

  actionButtonsContainer: {
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  actionButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  actionSubtext: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  actionArrowContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionArrow: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
  logoutButton: {
    backgroundColor: '#fef7f7',
    borderColor: '#fecaca',
  },
  logoutIconContainer: {
    backgroundColor: '#ef4444',
    shadowColor: '#ef4444',
  },
  logoutText: {
    color: '#dc2626',
  },
  logoutArrow: {
    color: '#ef4444',
  },

  bottomPadding: {
    height: 30,
  },

  // Enhanced Modals
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  // Enhanced Logout Modal
  logoutModalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    width: '100%',
    maxWidth: 380,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 30,
  },
  logoutModalHeader: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 24,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  logoutIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
    marginBottom: 16,
  },
  logoutIconInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutModalIcon: {
    fontSize: 32,
  },
  modalHeaderText: {
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 4,
  },
  logoutModalSubtitle: {
    fontSize: 16,
    color: '#667eea',
    fontWeight: '600',
  },
  logoutModalContent: {
    paddingHorizontal: 28,
    paddingVertical: 24,
    alignItems: 'center',
  },
  logoutModalMessage: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '500',
  },
  logoutModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 28,
    gap: 16,
    backgroundColor: '#f8fafc',
  },
  stayButton: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  stayButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#64748b',
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  logoutConfirmIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});