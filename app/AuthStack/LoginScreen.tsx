// app/AuthStack/LoginScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { AuthContext } from '../../context/AuthContext';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { setIsLoggedIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Username dan password harus diisi');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        'https://088ae9a8cc46.ngrok-free.app/api/auth/login',
        { email: username, password }
      );

      if (response.data.status) {
        const token = response.data.token;
        await AsyncStorage.setItem('token', token);

        console.log('Login success:', response.data);
        
        // Pop-up berhasil login
        Alert.alert(
          '🎉 Berhasil!',
          'Anda berhasil login',
          [
            {
              text: 'OK',
              onPress: () => {
                setIsLoggedIn(true);
                router.replace('/Dashboard');
              }
            }
          ],
          { cancelable: false }
        );
      } else {
        Alert.alert('Error', response.data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      Alert.alert('Error', error.response?.data?.message || 'Terjadi kesalahan server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <LinearGradient
        colors={['#fafafa', '#f5f5f5', '#efefef']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled={true}
        >
          <View style={styles.content}>
            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />
            <View style={styles.decorativeCircle3} />

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <View style={styles.logo}>
                  <Text style={styles.logoText}>🔒</Text>
                </View>
              </View>
              <Text style={styles.welcomeText}>Selamat Datang Kembali!</Text>
              <Text style={styles.subtitle}>Login untuk melanjutkan pekerjaanmu</Text>
            </View>

            {/* Form Container */}
            <View style={styles.formContainer}>
              <View style={styles.form}>
                {/* Username Input */}
                <View style={styles.inputContainer}>
                  <Text style={[
                    styles.inputLabel,
                    focusedInput === 'username' && styles.inputLabelFocused
                  ]}>
                    Username
                  </Text>
                  <TextInput
                    style={[
                      styles.inputSimple,
                      focusedInput === 'username' && styles.inputSimpleFocused
                    ]}
                    placeholder="Masukkan username"
                    placeholderTextColor="#9ca3af"
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setFocusedInput('username')}
                    onBlur={() => setFocusedInput('')}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    editable={true}
                  />
                </View>

                {/* Password Input */}
                <View style={styles.inputContainer}>
                  <Text style={[
                    styles.inputLabel,
                    focusedInput === 'password' && styles.inputLabelFocused
                  ]}>
                    Password
                  </Text>
                  <TextInput
                    style={[
                      styles.inputSimple,
                      focusedInput === 'password' && styles.inputSimpleFocused
                    ]}
                    placeholder="Masukkan password"
                    placeholderTextColor="#9ca3af"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedInput('password')}
                    onBlur={() => setFocusedInput('')}
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    editable={true}
                  />
                </View>

                {/* Login Button */}
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleLogin}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={loading ? ['#e5e7eb', '#d1d5db'] : ['#374151', '#1f2937']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.loginButtonText}>
                      {loading ? '⏳ Loading...' : 'Login'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Additional Options */}
                <View style={styles.additionalOptions}>
                  <TouchableOpacity style={styles.optionButton}>
                    <Text style={styles.optionText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Secure • Reliable • Fast
              </Text>
              <Text style={styles.copyrightText}>
                © 2024 Your App Name
              </Text>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    minHeight: height,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 24,
  },
  
  // Decorative Elements
  decorativeCircle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  decorativeCircle2: {
    position: 'absolute',
    top: 100,
    left: -30,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  decorativeCircle3: {
    position: 'absolute',
    bottom: 150,
    right: -20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  logoText: {
    fontSize: 32,
  },
  welcomeText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    fontWeight: '400',
  },

  // Form
  formContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
    marginLeft: 2,
  },
  inputLabelFocused: {
    color: '#1f2937',
  },
  
  // Input Styles - Simplified
  inputSimple: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1f2937',
    fontWeight: '400',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 50,
  },
  inputSimpleFocused: {
    borderColor: '#9ca3af',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  // Button
  loginButton: {
    borderRadius: 12,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  loginButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },

  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e7eb',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '400',
  },

  // Additional Options
  additionalOptions: {
    alignItems: 'center',
  },
  optionButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  optionText: {
    color: '#6b7280',
    fontSize: 14,
    fontWeight: '500',
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 16,
  },
  footerText: {
    color: '#9ca3af',
    fontSize: 13,
    fontWeight: '400',
    marginBottom: 6,
  },
  copyrightText: {
    color: '#d1d5db',
    fontSize: 12,
    fontWeight: '300',
  },
});