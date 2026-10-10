import React, { useCallback, useEffect, useRef } from 'react';
import { Platform, ScrollView, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  KeyboardAwareScrollView,
  KeyboardAwareScrollViewRef,
  KeyboardEvents,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';

import { getFocusedInputScrollOffset } from '@/lib/keyboardScroll';

type Props = { children: React.ReactNode };

function AndroidAuthFormScrollView({ children }: Props) {
  const scrollRef = useRef<ScrollView>(null);
  const scrollOffset = useRef(0);
  const keyboardHeight = useRef(0);
  const frame = useRef<number | undefined>(undefined);
  const measurement = useRef(0);
  const insets = useSafeAreaInsets();
  const drawerBottomPadding = Math.max(insets.bottom, 16);
  const { height } = useReanimatedKeyboardAnimation();

  const spacerStyle = useAnimatedStyle(() => ({
    // The drawer already has bottom padding outside the scroll view.
    height: Math.max(0, -height.get() - drawerBottomPadding),
  }));

  const revealFocusedInput = useCallback(() => {
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    const request = ++measurement.current;

    frame.current = requestAnimationFrame(() => {
      const input = TextInput.State.currentlyFocusedInput();
      const scroll = scrollRef.current;
      const viewport = scroll?.getNativeScrollRef();
      if (!input || !scroll || !viewport || keyboardHeight.current <= 0) return;

      // Measure the final native layout, rather than the field's position
      // before the drawer expanded. A visible field must not scroll at all.
      viewport.measureInWindow((_x, viewportTop, _width, viewportHeight) => {
        input.measureInWindow((_inputX, inputTop, _inputWidth, inputHeight) => {
          if (
            request !== measurement.current ||
            input !== TextInput.State.currentlyFocusedInput() ||
            keyboardHeight.current <= 0 ||
            viewportHeight <= 0 ||
            inputHeight <= 0
          ) {
            return;
          }

          const overlap = Math.max(
            0,
            keyboardHeight.current - drawerBottomPadding,
          );
          const target = getFocusedInputScrollOffset({
            scrollOffset: scrollOffset.current,
            inputTop,
            inputHeight,
            visibleTop: viewportTop + 12,
            visibleBottom: viewportTop + viewportHeight - overlap - 24,
          });

          if (Math.abs(target - scrollOffset.current) > 1) {
            scroll.scrollTo({ y: target, animated: true });
          }
        });
      });
    });
  }, [drawerBottomPadding]);

  useEffect(() => {
    const showSubscription = KeyboardEvents.addListener('keyboardDidShow', (event) => {
      keyboardHeight.current = event.height;
      revealFocusedInput();
    });
    const hideSubscription = KeyboardEvents.addListener('keyboardWillHide', () => {
      keyboardHeight.current = 0;
      measurement.current += 1;
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
      measurement.current += 1;
      if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    };
  }, [revealFocusedInput]);

  return (
    <ScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: 'white' }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='none'
      automaticallyAdjustKeyboardInsets={false}
      scrollEventThrottle={16}
      onScroll={(event) => {
        scrollOffset.current = event.nativeEvent.contentOffset.y;
      }}
      onScrollBeginDrag={() => {
        measurement.current += 1;
        if (frame.current !== undefined) cancelAnimationFrame(frame.current);
      }}
      onFocus={revealFocusedInput}
    >
      {children}
      <Animated.View style={spacerStyle} />
    </ScrollView>
  );
}

function IOSAuthFormScrollView({ children }: Props) {
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);

  useEffect(() => {
    let frame: number | undefined;
    const subscription = KeyboardEvents.addListener('keyboardDidShow', () => {
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        scrollRef.current?.assureFocusedInputVisible();
      });
    });

    return () => {
      subscription.remove();
      if (frame !== undefined) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <KeyboardAwareScrollView
      ref={scrollRef}
      style={{ flex: 1, backgroundColor: 'white' }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps='handled'
      keyboardDismissMode='none'
      automaticallyAdjustKeyboardInsets={false}
      bottomOffset={24}
    >
      {children}
    </KeyboardAwareScrollView>
  );
}

export default function AuthFormScrollView(props: Props) {
  return Platform.OS === 'android'
    ? <AndroidAuthFormScrollView {...props} />
    : <IOSAuthFormScrollView {...props} />;
}
