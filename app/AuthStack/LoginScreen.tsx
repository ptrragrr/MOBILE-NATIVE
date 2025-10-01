// app/AuthStack/LoginScreen.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import Svg, { Path } from 'react-native-svg';
import { AuthContext } from '../../context/AuthContext';
import api from '../axios';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { setIsLoggedIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert('Error', 'Email dan password harus diisi');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        '/auth/login',
        { email: username, password }
      );

      if (response.data.status) {
        const token = response.data.token;
        const user = response.data.user;
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('User', JSON.stringify(user));

        console.log('Login success:', response.data);
        
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
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFB5B5" translucent={false} />
      
      {/* Top Pink Section with Wave */}
      <View style={styles.topSection}>
        {/* Decorative Pattern */}
        <View style={styles.patternContainer}>
          {[...Array(6)].map((_, i) => (
            <View key={i} style={[styles.decorativeCircle, { 
              top: Math.random() * 200,
              left: Math.random() * width,
              opacity: 0.1 + Math.random() * 0.15
            }]} />
          ))}
        </View>

        {/* Wave SVG */}
        <Svg
          height="100"
          width={width}
          viewBox={`0 0 ${width} 100`}
          style={styles.wave}
        >
          <Path
            d={`M0,50 Q${width/4},20 ${width/2},50 T${width},50 L${width},100 L0,100 Z`}
            fill="#FFFFFF"
          />
        </Svg>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.content}>
            {/* Sign In Title */}
            <Text style={styles.signInTitle}>Sign in</Text>

            {/* Form Container */}
            <View style={styles.formContainer}>
              {/* Email Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>✉️</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="demo@email.com"
                    placeholderTextColor="#B0B0B0"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    keyboardType="email-address"
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Text style={styles.inputIcon}>🔒</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="**********"
                    placeholderTextColor="#B0B0B0"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                  />
                </View>
              </View>

              {/* Remember Me & Forgot Password */}
              {/* <View style={styles.optionsRow}>
                <TouchableOpacity 
                  style={styles.rememberMeContainer}
                  onPress={() => setRememberMe(!rememberMe)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                    {rememberMe && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.rememberMeText}>Remember Me</Text>
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.7}>
                  <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View> */}

              {/* Login Button */}
              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? 'Loading...' : 'Login'}
                </Text>
              </TouchableOpacity>

              {/* Footer Text */}
              {/* <View style={styles.footer}>
                <Text style={styles.footerText}>
                  Don't have an account?{' '}
                  <Text style={styles.signUpLink}>Sign up</Text>
                </Text>
              </View> */}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topSection: {
    height: 250,
    backgroundColor: '#007bff',
    position: 'relative',
  },
  patternContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
  },
  wave: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 20,
  },

  // Title
  signInTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 32,
  },

  // Form
  formContainer: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#2D2D2D',
    fontWeight: '400',
  },

  // Options Row
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  rememberMeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#D0D0D0',
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FFB5B5',
    borderColor: '#FFB5B5',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  rememberMeText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#FF8A8A',
    fontWeight: '600',
  },

  // Login Button
  loginButton: {
    backgroundColor: '#007bff',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    // shadowColor: '#FFB5B5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Footer
  footer: {
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666666',
    fontSize: 14,
    fontWeight: '400',
  },
  signUpLink: {
    color: '#007bff',
    fontWeight: '700',
  },
});