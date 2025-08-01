import { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';
import axios from 'axios';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    try {
      const response = await axios.post('http://192.168.X.X:8000/api/auth/login', {
        email,
        password,
      });

      const token = response.data.token;
      Alert.alert('Login Berhasil', 'Token: ' + token);
      // simpan token di asyncStorage nanti
    } catch (error) {
      Alert.alert('Login Gagal', error.response?.data?.message || 'Terjadi kesalahan');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <TextInput placeholder="Email" onChangeText={setEmail} />
      <TextInput placeholder="Password" onChangeText={setPassword} secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
