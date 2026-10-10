import React, { useEffect } from 'react';
import {
  Keyboard,
  Modal,
  View,
  StyleSheet,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
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
  keyboardAware?: boolean;
  children: React.ReactNode;
};

export default function BottomDrawer({
  visible,
  onClose,
  heightRatio = 0.6,
  keyboardAware = false,
  children,
}: BottomDrawerProps) {
  const { height: screenHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { height: keyboardHeight } = useReanimatedKeyboardAnimation();
  const maxSheetHeight = Math.max(0, screenHeight - insets.top - 12);
  const SHEET_H = Math.min(
    maxSheetHeight,
    Math.max(240, screenHeight * heightRatio),
  );

  const ty = useSharedValue(SHEET_H);
  const backdrop = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      ty.set(SHEET_H);
      backdrop.set(0);
      ty.set(withTiming(0, { duration: 280 }));
      backdrop.set(withTiming(1, { duration: 180 }));
    } else {
      ty.set(withTiming(SHEET_H, { duration: 220 }));
      backdrop.set(withTiming(0, { duration: 180 }));
    }
  }, [visible, SHEET_H, ty, backdrop]);

  const closeDrawer = () => {
    Keyboard.dismiss();
    ty.set(
      withTiming(SHEET_H, { duration: 220 }, (finished) => {
        if (finished) runOnJS(onClose)();
      }),
    );
    backdrop.set(withTiming(0, { duration: 180 }));
  };

  const startY = useSharedValue(0);
  const finishClose = () => {
    Keyboard.dismiss();
    onClose();
  };
  const pan = Gesture.Pan()
    .onStart(() => {
      startY.set(ty.get());
    })
    .onUpdate((e) => {
      const next = Math.max(0, startY.get() + e.translationY);
      ty.set(next);
      backdrop.set(1 - Math.min(1, next / SHEET_H));
    })
    .onEnd((e) => {
      const shouldClose = e.velocityY > 800 || ty.get() > SHEET_H * 0.35;

      if (shouldClose) {
        ty.set(
          withTiming(SHEET_H, { duration: 200 }, (finished) => {
            if (finished) runOnJS(finishClose)();
          }),
        );
        backdrop.set(withTiming(0, { duration: 160 }));
      } else {
        ty.set(withSpring(0, { damping: 18, stiffness: 160 }));
        backdrop.set(withTiming(1, { duration: 120 }));
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.get() }],
    // The form scroll view owns the keyboard inset. Grow the sheet by that
    // amount so its visible area moves up without applying a second inset.
    height: Math.min(
      maxSheetHeight,
      SHEET_H + (keyboardAware ? Math.max(0, -keyboardHeight.get()) : 0),
    ),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.get(),
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={true}
      transparent
      animationType='none'
      onRequestClose={closeDrawer}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Animated.View
          style={[styles.backdrop, backdropStyle]}
          pointerEvents='auto'
          onTouchEnd={closeDrawer}
        />

        <View style={styles.wrap} pointerEvents='box-none'>
          <Animated.View
            style={[
              styles.sheet,
              {
                paddingBottom: Math.max(
                  insets.bottom,
                  Platform.OS === 'ios' ? 24 : 16,
                ),
              },
              sheetStyle,
            ]}
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
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  wrap: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
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
