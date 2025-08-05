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
  const router = useRouter();

const handleLogin = async () => {
  if (!username || !password) {
    Alert.alert('Error', 'Username dan password harus diisi');
    return;
  }

  setLoading(true);

  try {
    const response = await axios.post(
      'https://fcda10aff9bc.ngrok-free.app/api/auth/login',
      { email: username, password }
    );

    if (response.data.status) {
      const token = response.data.token; // pastikan backend balikin token JWT
      await AsyncStorage.setItem('token', token); // simpan token

      console.log('Login success:', response.data);
      setIsLoggedIn(true);
      router.replace('/Dashboard');
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


//   const handleLogin = async () => {
//   if (!username || !password) {
//     Alert.alert('Error', 'Username dan password harus diisi');
//     return;
//   }

//   setLoading(true);

//   try {
//     const response = await axios.post(
//   'http://192.168.137.26:8000/api/auth/login',
//   { 
//     email: username,
//     password: password,
//   }
// );

//     // Misal backend ngirim token atau user data
//     console.log('Login success:', response.data);

//     setIsLoggedIn(true);
//     router.replace('/(tabs)/index');
//   } catch (error) {
//     console.error('Login faile:', error);
//     Alert.alert('Error', 'Login gagal. Cek username atau password.');
//   } finally {
//     setLoading(false);
//   }
// };
  // const handleLogin = () => {
  //   if (!username || !password) {
  //     Alert.alert('Error', 'Username dan password harus diisi');
  //     return;
  //   }

  //   setLoading(true);
    
  //   // Simulasi loading
  //   setTimeout(() => {
  //     if (username === 'admin' && password === 'admin') {
  //       setIsLoggedIn(true);
  //       router.replace('/(tabs)/Dashboard');
  //     } else {
  //       Alert.alert('Error', 'Username atau password salah');
  //     }
  //     setLoading(false);
  //   }, 1000);
  // };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.welcomeText}>Selamat Datang</Text>
            <Text style={styles.subtitle}>Masuk ke akun Anda</Text>
          </View>

          {/* Form Container */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              {/* Username Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan username"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Masukkan password"
                  placeholderTextColor="#999"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
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
                  colors={loading ? ['#ccc', '#999'] : ['#667eea', '#764ba2']}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? 'Memuat...' : 'Masuk'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>


            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>© 2024 Your App Name</Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    padding: 30,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    backdropFilter: 'blur(10px)',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 15,
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#e1e5e9',
    color: '#333',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loginButton: {
    borderRadius: 12,
    marginTop: 10,
    shadowColor: '#667eea',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
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
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
});