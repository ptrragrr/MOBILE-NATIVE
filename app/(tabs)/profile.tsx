import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';
import api from '../axios';

const { width, height } = Dimensions.get('window');

// Helper untuk URL foto
const getPhotoUrl = (path) => {
  if (!path) return 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=Profile';
  if (path.startsWith('http')) return path;
  return `https://clear-gnat-certainly.ngrok-free.app/storage/${path}`;
};

// Component Field Editor
const EditableField = React.memo(({ 
  icon, 
  label, 
  value, 
  onChangeText,
  keyboardType = 'default',
  isEditing,
  placeholder
}) => (
  <View style={styles.fieldWrapper}>
    <View style={styles.fieldIcon}>
      <Text style={styles.iconText}>{icon}</Text>
    </View>
    <View style={styles.fieldContent}>
      <Text style={styles.fieldTitle}>{label}</Text>
      {isEditing ? (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === 'email-address' ? 'none' : 'words'}
        />
      ) : (
        <Text style={styles.fieldText}>{value || 'Belum diisi'}</Text>
      )}
    </View>
  </View>
));

export default function ProfilePage() {
  const router = useRouter();
  const { setIsLoggedIn, token } = useContext(AuthContext);

  const [isEditing, setIsEditing] = useState(false);
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

  // Handlers
  const handleFieldChange = useCallback((field, value) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleNameChange = useCallback((value) => handleFieldChange('name', value), [handleFieldChange]);
  const handleEmailChange = useCallback((value) => handleFieldChange('email', value), [handleFieldChange]);
  const handlePhoneChange = useCallback((value) => handleFieldChange('phone', value), [handleFieldChange]);

  const handlePickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permission.status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan akses ke galeri foto');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setEditedData(prev => ({ ...prev, profilePhoto: result.assets[0].uri }));
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const formData = new FormData();
      formData.append('name', editedData.name);
      formData.append('email', editedData.email);
      formData.append('phone', editedData.phone);

      if (editedData.profilePhoto && !editedData.profilePhoto.startsWith('http')) {
        const uri = editedData.profilePhoto;
        const filename = uri.split('/').pop() || 'photo.jpg';
        const fileType = filename.split('.').pop();
        const mimeType = `image/${fileType === 'jpg' ? 'jpeg' : fileType}`;

        formData.append('profile_photo', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename,
          type: mimeType,
        });
      }

      const response = await api.post('/auth/update-profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      const updatedUser = response.data.user;
      const updatedProfile = {
        name: updatedUser.name || '',
        email: updatedUser.email || '',
        phone: updatedUser.phone || '',
        position: updatedUser.role?.name || userData.position,
        joinDate: userData.joinDate,
        profilePhoto: updatedUser.photo || userData.profilePhoto,
      };

      setUserData(updatedProfile);
      setEditedData(updatedProfile);
      setIsEditing(false);
      Alert.alert('Berhasil', 'Profil telah diperbarui');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Gagal', 'Terjadi kesalahan saat memperbarui profil');
    }
  }, [editedData, token, userData]);

  const handleCancel = useCallback(() => {
    setEditedData(userData);
    setIsEditing(false);
  }, [userData]);

  const handleLogout = useCallback(() => {
    setShowLogoutModal(false);
    setIsLoggedIn(false);
    router.replace('/AuthStack/LoginScreen');
  }, [setIsLoggedIn, router]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.data.user;

        const profileData = {
          name: user.name || '',
          email: user.email || '',
          phone: user.phone || '',
          position: user.role?.name || '',
          joinDate: user.created_at
            ? new Date(user.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })
            : '',
          profilePhoto: user.photo || '',
        };

        setUserData(profileData);
        setEditedData(profileData);
      } catch (error) {
        console.error('Fetch profile error:', error);
        Alert.alert('Error', 'Gagal memuat profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const photoUrl = useMemo(() => {
    return getPhotoUrl(editedData.profilePhoto || userData.profilePhoto);
  }, [editedData.profilePhoto, userData.profilePhoto]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#007bff" />
        <View style={styles.loadingContent}>
          <View style={styles.spinner}>
            <View style={styles.spinnerInner} />
          </View>
          <Text style={styles.loadingTitle}>Memuat Profil</Text>
          <Text style={styles.loadingSubtitle}>Harap tunggu sebentar...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
      
      {/* Header dengan foto profil */}
      <View style={styles.header}>
        <View style={styles.headerBackground}>
          <View style={styles.backgroundPattern} />
        </View>
        
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.backBtnText}>←</Text>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>Profil</Text>
            
            <TouchableOpacity 
              style={[styles.editBtn, isEditing && styles.editBtnActive]}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Text style={styles.editBtnText}>{isEditing ? '✓' : '✎'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.profileSection}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={isEditing ? handlePickImage : undefined}
              activeOpacity={isEditing ? 0.7 : 1}
            >
              <Image source={{ uri: photoUrl }} style={styles.avatar} />
              {isEditing && (
                <View style={styles.avatarOverlay}>
                  <Text style={styles.cameraIcon}>📷</Text>
                </View>
              )}
              <View style={styles.onlineIndicator} />
            </TouchableOpacity>
            
     <Text style={styles.userName}>
  {editedData.name || 'Users'}
</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{userData.position || 'Role'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informasi Personal</Text>
            <Text style={styles.cardSubtitle}>Data pribadi Anda</Text>
          </View>
          
          <View style={styles.fieldsContainer}>
            <EditableField
              icon="👤"
              label="Nama Lengkap"
              value={editedData.name}
              onChangeText={handleNameChange}
              isEditing={isEditing}
              placeholder="Masukkan nama lengkap"
            />
            
            <EditableField
              icon="✉️"
              label="Email"
              value={editedData.email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              isEditing={isEditing}
              placeholder="Masukkan email"
            />
            
            <EditableField
              icon="📱"
              label="Nomor Telepon"
              value={editedData.phone}
              onChangeText={handlePhoneChange}
              keyboardType="phone-pad"
              isEditing={isEditing}
              placeholder="Masukkan nomor telepon"
            />
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Informasi Akun</Text>
            <Text style={styles.cardSubtitle}>Detail akun Anda</Text>
          </View>
          
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Text style={styles.iconText}>📅</Text>
            </View>
            <View>
              <Text style={styles.infoLabel}>Bergabung Sejak</Text>
              <Text style={styles.infoValue}>{userData.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        {isEditing ? (
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.btn, styles.cancelBtn]}
              onPress={handleCancel}
            >
              <Text style={styles.cancelBtnText}>Batal</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.btn, styles.saveBtn]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Simpan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={() => setShowLogoutModal(true)}
          >
            <View style={styles.logoutIcon}>
              <Text style={styles.iconText}>🚪</Text>
            </View>
            <View style={styles.logoutContent}>
              <Text style={styles.logoutTitle}>Keluar dari Akun</Text>
              <Text style={styles.logoutSubtitle}>Logout dari aplikasi</Text>
            </View>
            <Text style={styles.arrowIcon}>›</Text>
          </TouchableOpacity>
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>

      {/* Logout Modal */}
      {showLogoutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalIcon}>
              <Text style={styles.modalIconText}>👋</Text>
            </View>
            
            <Text style={styles.modalTitle}>Konfirmasi Logout</Text>
            <Text style={styles.modalMessage}>
              Apakah Anda yakin ingin keluar dari aplikasi?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalBtn, styles.cancelModalBtn]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.cancelModalText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalBtn, styles.confirmBtn]}
                onPress={handleLogout}
              >
                <Text style={styles.confirmText}>Logout</Text>
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
    backgroundColor: '#F9FAFB',
  },
  
  // Loading Screen
  loadingContainer: {
    flex: 1,
    backgroundColor: '#b7bae9ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  spinner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderTopColor: '#FFFFFF',
    marginBottom: 20,
  },
  spinnerInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  loadingSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // Header
  header: {
    height: height * 0.45,
    position: 'relative',
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#007bff',
  },
  backgroundPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    backgroundImage: 'radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
  },
  headerContent: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnActive: {
    backgroundColor: '#10B981',
  },
  editBtnText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  
  // Profile Section
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    backgroundColor: '#E5E7EB',
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Content
  content: {
    flex: 1,
    marginTop: -30,
    paddingHorizontal: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  
  // Fields
  fieldsContainer: {
    gap: 16,
  },
  fieldWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fieldIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  fieldContent: {
    flex: 1,
  },
  fieldTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  fieldText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  fieldInput: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
    paddingBottom: 4,
    paddingTop: 0,
  },
  
  // Info Item
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginTop: 2,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveBtn: {
    backgroundColor: '#4F46E5',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Logout Button
  logoutButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoutContent: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 2,
  },
  logoutSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#9CA3AF',
    fontWeight: '600',
  },

  bottomSpace: {
    height: 20,
  },

  // Modal
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  modalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconText: {
    fontSize: 28,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelModalBtn: {
    backgroundColor: '#F3F4F6',
  },
  cancelModalText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  confirmBtn: {
    backgroundColor: '#DC2626',
  },
  confirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});