import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useContext, useEffect } from 'react';
import { AuthContext, AuthProvider } from '../context/AuthContext';

// ⬅️ Layout internal yang punya akses AuthContext
function MainLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const segments = useSegments();
  const { isLoggedIn } = useContext(AuthContext);

  useEffect(() => {
    if (segments.length === 0) return; // 🛑 Pastikan segmen sudah siap

    const inAuthGroup = segments[0] === 'AuthStack';

    if (!isLoggedIn && !inAuthGroup) {
      router.replace('/AuthStack/LoginScreen');
    }

    // if (isLoggedIn && inAuthGroup) {
    //   router.replace('/(tabs)/Dashboard');
    // }
  }, [isLoggedIn, segments]);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Slot />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

// function MainLayout() {
//   const colorScheme = useColorScheme();
//   const router = useRouter();
//   const segments = useSegments();
//   const { isLoggedIn } = useContext(AuthContext);

//   useEffect(() => {
//     const inAuthGroup = segments[0] === 'AuthStack';

//     if (!isLoggedIn && !inAuthGroup) {
//       router.replace('/AuthStack/LoginScreen');
//     }

//     // if (isLoggedIn && inAuthGroup) {
//     //   router.replace('/(tabs)/Dashboard');
//     // }
//   }, [isLoggedIn, segments]);

//   return (
//     <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
//       <Slot />
//       <StatusBar style="auto" />
//     </ThemeProvider>
//   );
// }

// ⬅️ Bungkus provider DI LUAR MainLayout
export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) return null;

  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  );
}
