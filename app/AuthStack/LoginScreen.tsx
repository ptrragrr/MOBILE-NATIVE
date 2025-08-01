// app/AuthStack/LoginScreen.tsx
import { useRouter } from 'expo-router';
import { useContext, useState } from 'react';
import { Button, Text, TextInput, View } from 'react-native';
import { AuthContext } from '../../context/AuthContext';

export default function LoginScreen() {
  const { setIsLoggedIn } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleLogin = () => {
    if (username === 'admin' && password === 'admin') {
      setIsLoggedIn(true);
      router.replace('/(tabs)/Dashboard');
    } else {
      alert('Username atau password salah');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Login</Text>
      <TextInput placeholder="Username" onChangeText={setUsername} value={username} />
      <TextInput placeholder="Password" secureTextEntry onChangeText={setPassword} value={password} />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
