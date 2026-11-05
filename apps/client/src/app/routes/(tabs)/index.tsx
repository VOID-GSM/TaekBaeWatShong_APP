import { StyleSheet, Text, View } from 'react-native';

export default function IndexRoute() {
  return (
    <View style={styles.container}>
      <Text>택배왔슝</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
