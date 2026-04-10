import * as React from 'react';
import { View, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Text, Button, Input } from '../components';
import { colors, spacing } from '../constants/theme';

export default function SignInScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [step, setStep] = React.useState<'email' | 'otp'>('email');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  async function handleSendOtp() {
    if (!email.trim() || !email.includes('@')) return;
    setError('');
    setLoading(true);
    try {
      await sendOtp(email.trim());
      setStep('otp');
    } catch (err: any) {
      setError(err?.message || 'Failed to send code');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!otp.trim()) return;
    setError('');
    setLoading(true);
    try {
      await verifyOtp(email.trim(), otp.trim());
      router.replace('/(app)');
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired code');
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
        <View style={{ width: '100%', maxWidth: 380 }}>
          <View style={{ alignItems: 'center', marginBottom: spacing['4xl'] }}>
            <MaterialCommunityIcons name="brain" size={36} color={colors.accent} style={{ marginBottom: spacing.lg }} />
            <Text variant="h1" align="center">
              {step === 'email' ? 'Sign In' : 'Enter Code'}
            </Text>
            {step === 'otp' && (
              <Text variant="body" color={colors.textSecondary} align="center" style={{ marginTop: spacing.sm }}>
                We sent a code to {email}
              </Text>
            )}
          </View>

          {step === 'email' ? (
            <>
              <Input
                label="Email"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />
              {error ? (
                <Text variant="caption" color={colors.error} style={{ marginBottom: spacing.md }}>
                  {error}
                </Text>
              ) : null}
              <Button fullWidth loading={loading} onPress={handleSendOtp}>
                Continue
              </Button>
            </>
          ) : (
            <>
              <Input
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                autoComplete="one-time-code"
              />
              {error ? (
                <Text variant="caption" color={colors.error} style={{ marginBottom: spacing.md }}>
                  {error}
                </Text>
              ) : null}
              <Button fullWidth loading={loading} onPress={handleVerifyOtp}>
                Sign In
              </Button>
              <Button
                variant="ghost"
                fullWidth
                onPress={() => { setStep('email'); setOtp(''); setError(''); }}
                style={{ marginTop: spacing.md }}
              >
                Use a different email
              </Button>
            </>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
