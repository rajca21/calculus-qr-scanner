type FocusedInputScroll = {
  scrollOffset: number;
  inputTop: number;
  inputHeight: number;
  visibleTop: number;
  visibleBottom: number;
};

export function getFocusedInputScrollOffset({
  scrollOffset,
  inputTop,
  inputHeight,
  visibleTop,
  visibleBottom,
}: FocusedInputScroll): number {
  if (visibleBottom <= visibleTop) return scrollOffset;

  if (inputTop < visibleTop || inputHeight > visibleBottom - visibleTop) {
    return Math.max(0, scrollOffset + inputTop - visibleTop);
  }

  const overflow = inputTop + inputHeight - visibleBottom;
  return overflow > 0 ? scrollOffset + overflow : scrollOffset;
}
