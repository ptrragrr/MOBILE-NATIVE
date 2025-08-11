import { useRouter } from 'expo-router';
import React, { useContext, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function ProfilePage() {
  const router = useRouter();
  const { setIsLoggedIn } = useContext(AuthContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  // User data state
  const [userData, setUserData] = useState({
    name: 'Ahmad Wijaya',
    email: 'ahmad.wijaya@tokosejahtera.com',
    phone: '+62 812-3456-7890',
    position: 'Store Manager',
    joinDate: '15 Januari 2023',
    profilePhoto: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=AW'
  });

  const [editedData, setEditedData] = useState(userData);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Stats data
  const userStats = {
    totalSales: 125750000,
    totalTransactions: 1847,
    workingDays: 245,
    avgDailySales: 513265
  };

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

  const handleSaveProfile = () => {
    setUserData(editedData);
    setIsEditing(false);
    Alert.alert('Berhasil', 'Profil berhasil diperbarui!');
  };

  const handleCancelEdit = () => {
    setEditedData(userData);
    setIsEditing(false);
  };

  const handleChangePassword = () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'Password baru dan konfirmasi password tidak sama!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password minimal 6 karakter!');
      return;
    }
    // Simulate password change
    setShowChangePasswordModal(false);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    Alert.alert('Berhasil', 'Password berhasil diubah!');
  };

  const handleLogout = () => {
    setShowLogoutModal(false);
    setIsLoggedIn(false);
    router.replace('/AuthStack/LoginScreen');
  };

  const ProfileField = ({ label, value, isEditable = false, keyName, multiline = false }) => (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {isEditing && isEditable ? (
        <TextInput
          style={[styles.fieldInput, multiline && styles.multilineInput]}
          value={editedData[keyName]}
          onChangeText={(text) => setEditedData({...editedData, [keyName]: text})}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
        />
      ) : (
        <Text style={styles.fieldValue}>{value}</Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profil Saya</Text>
        <TouchableOpacity 
          onPress={() => setIsEditing(!isEditing)}
          style={styles.editButton}
        >
          <Text style={styles.editIcon}>{isEditing ? '✕' : '✏️'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <TouchableOpacity style={styles.avatarWrapper}>
              <Image 
                source={{ uri: userData.profilePhoto }} 
                style={styles.avatarImage}
                defaultSource={{ uri: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=AW' }}
              />
              {isEditing && (
                <View style={styles.editPhotoOverlay}>
                  <Text style={styles.editPhotoIcon}>📷</Text>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>●</Text>
            </View>
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{userData.name}</Text>
            <Text style={styles.profilePosition}>{userData.position}</Text>
            <View style={styles.joinDateContainer}>
              <Text style={styles.joinDateIcon}>📅</Text>
              <Text style={styles.joinDate}>Bergabung {userData.joinDate}</Text>
            </View>
          </View>
        </View>

        {/* Personal Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>👤 Informasi Pribadi</Text>
          
          <ProfileField 
            label="Nama Lengkap" 
            value={userData.name} 
            isEditable={true}
            keyName="name"
          />
          <ProfileField 
            label="Email" 
            value={userData.email} 
            isEditable={true}
            keyName="email"
          />
          <ProfileField 
            label="No. Telepon" 
            value={userData.phone} 
            isEditable={true}
            keyName="phone"
          />
          <ProfileField 
            label="Posisi" 
            value={userData.position} 
            isEditable={false}
          />
          
          {/* Photo Admin Section */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Foto Profil</Text>
            <View style={styles.photoSection}>
              <Image 
                source={{ uri: userData.profilePhoto }} 
                style={styles.previewPhoto}
                defaultSource={{ uri: 'https://via.placeholder.com/150/4F46E5/FFFFFF?text=AW' }}
              />
              {isEditing && (
                <TouchableOpacity style={styles.changePhotoButton}>
                  <Text style={styles.changePhotoIcon}>📷</Text>
                  <Text style={styles.changePhotoText}>Ganti Foto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>⚙️ Pengaturan</Text>
          
          {isEditing ? (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={handleCancelEdit}
              >
                <Text style={styles.cancelIcon}>↶</Text>
                <Text style={styles.cancelButtonText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveIcon}>✓</Text>
                <Text style={styles.saveButtonText}>Simpan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => setShowChangePasswordModal(true)}
              >
                <Text style={styles.actionIcon}>🔐</Text>
                <Text style={styles.actionText}>Ubah Password</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.actionButton, styles.logoutAction]} 
                onPress={() => setShowLogoutModal(true)}
              >
                <Text style={styles.actionIcon}>🚪</Text>
                <Text style={[styles.actionText, styles.logoutText]}>Logout</Text>
                <Text style={styles.actionArrow}>→</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.footerPadding} />
      </ScrollView>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showChangePasswordModal}
        onRequestClose={() => setShowChangePasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.passwordModalContainer}>
            <Text style={styles.modalTitle}>🔐 Ubah Password</Text>
            
            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Password Lama</Text>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry
                value={passwordData.currentPassword}
                onChangeText={(text) => setPasswordData({...passwordData, currentPassword: text})}
                placeholder="Masukkan password lama"
              />
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Password Baru</Text>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry
                value={passwordData.newPassword}
                onChangeText={(text) => setPasswordData({...passwordData, newPassword: text})}
                placeholder="Masukkan password baru"
              />
            </View>

            <View style={styles.passwordInputContainer}>
              <Text style={styles.inputLabel}>Konfirmasi Password Baru</Text>
              <TextInput
                style={styles.passwordInput}
                secureTextEntry
                value={passwordData.confirmPassword}
                onChangeText={(text) => setPasswordData({...passwordData, confirmPassword: text})}
                placeholder="Konfirmasi password baru"
              />
            </View>

            <View style={styles.passwordModalActions}>
              <TouchableOpacity 
                style={styles.passwordCancelButton} 
                onPress={() => setShowChangePasswordModal(false)}
              >
                <Text style={styles.passwordCancelText}>Batal</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.passwordSaveButton} 
                onPress={handleChangePassword}
              >
                <Text style={styles.passwordSaveText}>Ubah Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.logoutModalContainer}>
            <View style={styles.logoutIconContainer}>
              <View style={styles.logoutIconCircle}>
                <Text style={styles.logoutModalIcon}>👋</Text>
              </View>
            </View>
            
            <View style={styles.logoutModalContent}>
              <Text style={styles.logoutModalTitle}>Sampai Jumpa!</Text>
              <Text style={styles.logoutModalMessage}>
                Yakin ingin keluar dari Dashboard POS?
              </Text>
            </View>
            
            <View style={styles.logoutModalActions}>
              <TouchableOpacity 
                style={styles.stayButton} 
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.stayButtonText}>Tetap Disini</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.logoutConfirmButton} 
                onPress={handleLogout}
              >
                <Text style={styles.logoutConfirmText}>Ya, Keluar</Text>
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
    backgroundColor: '#F0F4F8' // Changed from pink to light blue-gray
  },
  header: {
    marginTop: 50,
    marginBottom: 20,
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  backIcon: {
    fontSize: 20,
    color: '#2D3748',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4F46E5', // Changed from pink to indigo
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  editIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    elevation: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5', // Changed from pink to indigo
  },
  editPhotoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editPhotoIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  statusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  statusText: {
    fontSize: 14,
    color: '#48BB78', // Changed to green
  },
  profileInfo: {
    alignItems: 'center',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
  },
  profilePosition: {
    fontSize: 16,
    color: '#4F46E5', // Changed from pink to indigo
    fontWeight: '600',
    marginBottom: 8,
  },
  joinDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  joinDateIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#718096',
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#EDF2F7', // Changed to light gray
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1A202C',
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#718096',
    textAlign: 'center',
    marginBottom: 8,
  },
  statIcon: {
    fontSize: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 16,
    color: '#1A202C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldInput: {
    fontSize: 16,
    color: '#1A202C',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4F46E5', // Changed from pink to indigo
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#718096',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#4F46E5', // Changed from pink to indigo
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  saveIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#FFFFFF',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#EDF2F7', // Changed to light gray
    borderRadius: 12,
    marginBottom: 12,
  },
  actionIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#2D3748',
  },
  actionArrow: {
    fontSize: 16,
    color: '#A0AEC0',
  },
  logoutAction: {
    backgroundColor: '#FED7D7', // Changed to light red
    borderWidth: 1,
    borderColor: '#FEB2B2',
  },
  logoutText: {
    color: '#E53E3E', // Changed to red
  },
  footerPadding: {
    height: 40,
  },
  
  // Photo Section Styles
  photoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  previewPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
    backgroundColor: '#4F46E5', // Changed from pink to indigo
  },
  changePhotoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4F46E5', // Changed from pink to indigo
    borderRadius: 8,
  },
  changePhotoIcon: {
    fontSize: 16,
    marginRight: 8,
    color: '#FFFFFF',
  },
  changePhotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  passwordModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 24,
  },
  passwordInputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D3748',
    marginBottom: 8,
  },
  passwordInput: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordModalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  passwordCancelButton: {
    flex: 1,
    backgroundColor: '#EDF2F7',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  passwordCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#718096',
  },
  passwordSaveButton: {
    flex: 1,
    backgroundColor: '#4F46E5', // Changed from pink to indigo
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 3,
  },
  passwordSaveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  logoutModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    width: '100%',
    maxWidth: 380,
    elevation: 20,
    overflow: 'hidden',
  },
  logoutIconContainer: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
  },
  logoutIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5', // Changed from pink to indigo
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  logoutModalIcon: {
    fontSize: 36,
  },
  logoutModalContent: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: 'center',
  },
  logoutModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 8,
  },
  logoutModalMessage: {
    fontSize: 16,
    color: '#718096',
    textAlign: 'center',
    lineHeight: 24,
  },
  logoutModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 12,
  },
  stayButton: {
    flex: 1,
    backgroundColor: '#EDF2F7',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  stayButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D3748',
  },
  logoutConfirmButton: {
    flex: 1,
    backgroundColor: '#E53E3E', // Changed to red
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 4,
  },
  logoutConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});