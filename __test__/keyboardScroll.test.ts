import { getFocusedInputScrollOffset } from '@/lib/keyboardScroll';

describe('focused input visibility after the drawer moves', () => {
  const viewport = { visibleTop: 120, visibleBottom: 480 };

  it('keeps a fully visible input in place after the keyboard opens', () => {
    expect(getFocusedInputScrollOffset({
      ...viewport, scrollOffset: 0, inputTop: 220, inputHeight: 48,
    })).toBe(0);
  });

  it('preserves an existing scroll position when the input is already visible', () => {
    expect(getFocusedInputScrollOffset({
      ...viewport, scrollOffset: 180, inputTop: 220, inputHeight: 48,
    })).toBe(180);
  });

  it('scrolls only the portion of a lower field obscured by the keyboard', () => {
    expect(getFocusedInputScrollOffset({
      ...viewport, scrollOffset: 100, inputTop: 460, inputHeight: 48,
    })).toBe(128);
  });

  it('brings a field above the viewport back down into view', () => {
    expect(getFocusedInputScrollOffset({
      ...viewport, scrollOffset: 200, inputTop: 80, inputHeight: 48,
    })).toBe(160);
  });

  it('never scrolls above the start of the form', () => {
    expect(getFocusedInputScrollOffset({
      ...viewport, scrollOffset: 10, inputTop: 80, inputHeight: 48,
    })).toBe(0);
  });

  it('does not move when keyboard/layout measurements leave no visible area', () => {
    expect(getFocusedInputScrollOffset({
      visibleTop: 120, visibleBottom: 100,
      scrollOffset: 80, inputTop: 200, inputHeight: 48,
    })).toBe(80);
  });
});
