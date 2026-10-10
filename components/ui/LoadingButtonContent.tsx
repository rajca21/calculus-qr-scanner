import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

type Props = {
  loading: boolean;
  label: string;
  textClassName: string;
};

export default function LoadingButtonContent({ loading, label, textClassName }: Props) {
  return (
    <View style={styles.content}>
      {/* Keep the label in layout so loading preserves the button's height,
          including when the user increases their system font size. */}
      <Text className={textClassName} style={{ opacity: loading ? 0 : 1 }}>
        {label}
      </Text>
      {loading && (
        <View style={styles.spinner} pointerEvents='none'>
          <ActivityIndicator size='small' color='white' />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  spinner: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
});
