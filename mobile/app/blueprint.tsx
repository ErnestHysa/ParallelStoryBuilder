/**
 * Relationship Blueprint Quiz Screen
 *
 * Onboarding quiz that personalizes the app experience
 */

import React from 'react';
import { View, StyleSheet, StatusBar } from 'react-native';
import { BlueprintQuiz } from '@/components/BlueprintQuiz';

export default function BlueprintScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFAFA" />
      <BlueprintQuiz standalone />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
});
