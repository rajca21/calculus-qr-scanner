import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Point = { x: number; y: number };

function Stroke({ from, to }: { from: Point; to: Point }) {
  const length = Math.hypot(to.x - from.x, to.y - from.y);
  return <View style={{
    position: 'absolute', backgroundColor: 'white', height: 2, width: length + 1,
    borderRadius: 1, left: (from.x + to.x - length) / 2, top: (from.y + to.y) / 2 - 1,
    transform: [{ rotate: `${Math.atan2(to.y - from.y, to.x - from.x)}rad` }],
  }} />;
}

export default function OcrCameraHint({ width, height, buttonBottom }: { width: number; height: number; buttonBottom: number }) {
  const [textHeight, setTextHeight] = useState(48);
  if (!width || !height) return null;
  const top = height / 2 + 135;
  const start = { x: width * 0.65, y: top + textHeight + 8 };
  const end = { x: 76, y: height - buttonBottom - 22 };
  const control = { x: width * 0.45, y: Math.max(start.y, end.y) + 30 };
  // Short native strokes form a quadratic curve without an additional native dependency.
  const points = Array.from({ length: 33 }, (_, index) => {
    const t = index / 32;
    return {
      x: (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x,
      y: (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y,
    };
  });
  const angle = Math.atan2(end.y - control.y, end.x - control.x);
  return <View pointerEvents='none' style={StyleSheet.absoluteFill}>
    <Text accessibilityLiveRegion='polite' onLayout={(event) => setTextHeight(event.nativeEvent.layout.height)}
      style={[styles.text, { top }]}>
      Ukoliko QR kod nije čitljiv, pokušajte pomoću OCR
    </Text>
    {points.slice(1).map((point, index) => <Stroke key={index} from={points[index]} to={point} />)}
    {[-0.55, 0.55].map((offset) => <Stroke key={offset} from={end} to={{
      x: end.x - 11 * Math.cos(angle + offset), y: end.y - 11 * Math.sin(angle + offset),
    }} />)}
  </View>;
}

const styles = StyleSheet.create({
  text: { position: 'absolute', left: 88, right: 20, textAlign: 'center', fontFamily: 'Rubik-Medium',
    fontSize: 14, lineHeight: 21, color: 'white', backgroundColor: '#00000099', borderRadius: 10, padding: 10 },
});
