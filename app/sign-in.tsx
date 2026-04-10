import * as React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Text, Button, Input } from '../components';
import { colors, spacing } from '../constants/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(app)');
    } catch (err: any) {
      setError(err?.message || 'Sign in failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.bg }}
    >
      <View style={{
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingHorizontal: spacing['3xl'],
      }}>
        <View style={{
          width: '100%', maxWidth: 380,
        }}>
          <View style={{ alignItems: 'center', marginBottom: spacing['4xl'] }}>
            <MaterialCommunityIcons name="brain" size={36} color={colors.accent} style={{ marginBottom: spacing.lg }} />
            <Text variant="h1" align="center">Sign In</Text>
          </View>

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />
          <Input
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? (
            <Text variant="caption" color={colors.error} style={{ marginBottom: spacing.md }}>
              {error}
            </Text>
          ) : null}

          <Button fullWidth loading={loading} onPress={handleSignIn}>
            Sign In
          </Button>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
