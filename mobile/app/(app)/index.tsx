import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Parallel Story Builder</Text>
        <Text style={styles.subtitle}>Setup Required</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Welcome!</Text>
          <Text style={styles.cardText}>
            This app needs to be configured before you can use it.
          </Text>
          <Text style={styles.cardText}>
            Please follow the setup instructions in the README to configure Supabase.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#E91E63',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#757575',
    lineHeight: 24,
    marginBottom: 8,
  },
});
