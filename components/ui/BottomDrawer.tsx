import React, { useEffect } from 'react';
import { Modal, View, StyleSheet, Dimensions, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';

type BottomDrawerProps = {
  visible: boolean;
  onClose: () => void;
  heightRatio?: number;
  children: React.ReactNode;
};

const { height: SCREEN_H } = Dimensions.get('window');

export default function BottomDrawer({
  visible,
  onClose,
  heightRatio = 0.6,
  children,
}: BottomDrawerProps) {
  const SHEET_H = Math.max(240, Math.min(SCREEN_H, SCREEN_H * heightRatio));

  const ty = useSharedValue(SHEET_H);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      ty.value = SHEET_H;
      backdrop.value = 0;
      ty.value = withTiming(0, { duration: 280 });
      backdrop.value = withTiming(1, { duration: 180 });
    } else {
      ty.value = withTiming(SHEET_H, { duration: 220 });
      backdrop.value = withTiming(0, { duration: 180 });
    }
  }, [visible, SHEET_H, ty, backdrop]);

  const closeDrawer = () => {
    ty.value = withTiming(SHEET_H, { duration: 220 }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
    backdrop.value = withTiming(0, { duration: 180 });
  };

  const startY = useSharedValue(0);
  const pan = Gesture.Pan()
    .onStart(() => {
      startY.value = ty.value;
    })
    .onUpdate((e) => {
      const next = Math.max(0, startY.value + e.translationY);
      ty.value = next;
      backdrop.value = 1 - Math.min(1, next / SHEET_H);
    })
    .onEnd((e) => {
      const shouldClose = e.velocityY > 800 || ty.value > SHEET_H * 0.35;

      if (shouldClose) {
        ty.value = withTiming(SHEET_H, { duration: 200 }, (f) => {
          if (f) runOnJS(onClose)();
        });
        backdrop.value = withTiming(0, { duration: 160 });
      } else {
        ty.value = withSpring(0, { damping: 18, stiffness: 160 });
        backdrop.value = withTiming(1, { duration: 120 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType='none'
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[styles.backdrop, backdropStyle]}
          pointerEvents='auto'
          onTouchEnd={closeDrawer}
        />

        <View style={styles.wrap} pointerEvents='box-none'>
          <Animated.View
            style={[styles.sheet, { height: SHEET_H }, sheetStyle]}
            renderToHardwareTextureAndroid
            needsOffscreenAlphaCompositing
          >
            <GestureDetector gesture={pan}>
              <View style={styles.handleWrap}>
                <View style={styles.handle} />
              </View>
            </GestureDetector>

            <View style={styles.content}>{children}</View>
          </Animated.View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  wrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: Platform.select({ ios: 24, android: 16 }) as number,
    paddingTop: 8,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
  },
  handleWrap: { alignItems: 'center', paddingTop: 6, paddingBottom: 10 },
  handle: { width: 42, height: 5, borderRadius: 3, backgroundColor: '#E5E7EB' },
  content: { flex: 1 },
});
