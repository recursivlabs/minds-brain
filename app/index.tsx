import * as React from 'react';
import { View, Animated, Platform, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { Text, Button } from '../components';
import { colors, spacing } from '../constants/theme';

const { width: W, height: H } = Dimensions.get('window');

function NeuralNode({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  const opacity = React.useRef(new Animated.Value(0.1)).current;
  React.useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.delay(delay),
      Animated.timing(opacity, { toValue: 0.5, duration: 2000, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.1, duration: 2000, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      borderRadius: size / 2, backgroundColor: colors.accent, opacity,
    }} />
  );
}

function NeuralField() {
  const nodes = React.useMemo(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i, x: Math.random() * (W || 1200), y: Math.random() * (H || 900),
      size: Math.random() * 3 + 1, delay: Math.random() * 4000,
    })), []);
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
      {nodes.map(n => <NeuralNode key={n.id} {...n} />)}
    </View>
  );
}

function Glow() {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(0.04)).current;
  React.useEffect(() => {
    const anim = Animated.loop(Animated.parallel([
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 5000, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 5000, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.08, duration: 5000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.04, duration: 5000, useNativeDriver: true }),
      ]),
    ]));
    anim.start();
    return () => anim.stop();
  }, []);
  return (
    <Animated.View style={{
      position: 'absolute', width: 400, height: 400, borderRadius: 200,
      backgroundColor: colors.accent, opacity, transform: [{ scale }],
      ...(Platform.OS === 'web' ? { filter: 'blur(120px)' } as any : {}),
    }} />
  );
}

export default function LandingScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace('/(app)');
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading || isAuthenticated) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <NeuralField />

      <View style={{ alignItems: 'center', justifyContent: 'center', zIndex: 1 }}>
        <Glow />
      </View>

      <View style={{ alignItems: 'center', zIndex: 2, paddingHorizontal: spacing['3xl'] }}>
        <MaterialCommunityIcons name="brain" size={48} color={colors.accent} style={{ marginBottom: spacing.xl }} />
        <Text variant="hero" align="center" style={{ marginBottom: spacing.md }}>
          Minds Brain
        </Text>
        <Text variant="body" color={colors.textSecondary} align="center" style={{ marginBottom: spacing['4xl'], maxWidth: 360 }}>
          Your business intelligence, always on.
        </Text>
        <Button size="lg" onPress={() => router.push('/sign-in')}>
          Sign In
        </Button>
      </View>
    </View>
  );
}
