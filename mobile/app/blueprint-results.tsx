/**
 * Relationship Blueprint Results Screen
 *
 * Displays personalized results after completing the quiz
 */

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { BlueprintResults } from '@/components/BlueprintResults';

export default function BlueprintResultsScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <BlueprintResults />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
