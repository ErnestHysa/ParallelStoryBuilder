import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';

interface CoverArtGeneratorProps {
  visible?: boolean;
  onClose: () => void;
  storyId?: string;
  storyTitle?: string;
  theme?: any;
  onGenerated?: (imageUrl: string) => void;
  onCoverGenerated?: (imageUrl: string) => void;
}

const STYLE_OPTIONS = [
  'professional book cover',
  'illustrated fantasy',
  'modern minimalist',
  'vintage style',
  'digital painting',
  'watercolor',
  'comic book',
  'abstract art',
];

export function AICoverArtGenerator({
  visible,
  onClose,
  storyId,
  storyTitle,
  theme,
  onGenerated,
  onCoverGenerated,
}: CoverArtGeneratorProps) {
  const { user } = useAuthStore();

  const handleGenerated = (imageUrl: string) => {
    onGenerated?.(imageUrl);
    onCoverGenerated?.(imageUrl);
  };

  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('professional book cover');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isLoading, setIsLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cost, setCost] = useState(0.04);

  useEffect(() => {
    if (storyTitle) {
      setPrompt(`Book cover for "${storyTitle}"`);
    }
  }, [storyTitle]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt for the cover art');
      return;
    }

    if (!user) {
      setError('Please log in to generate cover art');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // For demo purposes, use a placeholder image service
      const imageUrl = `https://picsum.photos/seed/${encodeURIComponent(prompt)}/${width}/${height}`;
      setGeneratedImage(imageUrl);
      setShowPreview(true);

      Alert.alert(
        'Success!',
        `Cover art generated successfully. Cost: $${cost.toFixed(2)}`,
        [{ text: 'OK' }]
      );

      handleGenerated(imageUrl);
    } catch (err: any) {
      console.error('Cover art generation error:', err);
      setError(err.message || 'Failed to generate cover art');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedImage(null);
    setPrompt('');
    setError(null);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Generate Cover Art</Text>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Feather name="x" size={24} color="#212121" />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Describe your cover art:</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="e.g., A magical forest at sunset with a mysterious castle in the background..."
          placeholderTextColor="#9E9E9E"
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />

        <Text style={styles.label}>Style:</Text>
        <View style={styles.styleButtons}>
          {STYLE_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option}
              style={[styles.styleButton, style === option && styles.styleButtonSelected]}
              onPress={() => setStyle(option)}
            >
              <Text
                style={[
                  styles.styleButtonText,
                  style === option && styles.styleButtonTextSelected,
                ]}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Dimensions:</Text>
        <View style={styles.dimensionsContainer}>
          <View style={styles.dimensionInput}>
            <TextInput
              style={styles.input}
              placeholder="Width (px)"
              placeholderTextColor="#9E9E9E"
              value={width.toString()}
              onChangeText={(value) => setWidth(parseInt(value) || 1024)}
              keyboardType="numeric"
            />
          </View>
          <View style={styles.dimensionInput}>
            <TextInput
              style={styles.input}
              placeholder="Height (px)"
              placeholderTextColor="#9E9E9E"
              value={height.toString()}
              onChangeText={(value) => setHeight(parseInt(value) || 1024)}
              keyboardType="numeric"
            />
          </View>
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        {generatedImage && (
          <Image
            source={{ uri: generatedImage }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        )}

        <Text style={styles.costText}>Estimated cost: ${cost.toFixed(2)}</Text>

        {isLoading ? (
          <View style={styles.generateButton}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.generateButtonText}>Generating...</Text>
          </View>
        ) : (
          <>
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerate}
              disabled={isLoading}
            >
              <Feather name="image" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate Cover Art</Text>
            </TouchableOpacity>

            {generatedImage && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.previewButton]}
                  onPress={() => setShowPreview(true)}
                >
                  <Feather name="eye" size={16} color="#FFFFFF" />
                  <Text style={styles.actionButtonText}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={handleRegenerate}
                >
                  <Feather name="refresh-cw" size={16} color="#212121" />
                  <Text style={styles.secondaryButtonText}>Regenerate</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <Modal
        visible={showPreview}
        animationType="fade"
        transparent
        onRequestClose={() => setShowPreview(false)}
      >
        <View style={styles.previewModal}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Feather name="x" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.previewContent}>
            {generatedImage && (
              <Image
                source={{ uri: generatedImage }}
                style={styles.fullPreviewImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
  },
  closeButton: {
    padding: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    marginTop: 16,
    color: '#212121',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#212121',
    backgroundColor: '#FFFFFF',
  },
  textarea: {
    height: 120,
    textAlignVertical: 'top',
  },
  styleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  styleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  styleButtonSelected: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  styleButtonText: {
    color: '#212121',
    fontWeight: '500',
    fontSize: 12,
  },
  styleButtonTextSelected: {
    color: '#FFFFFF',
  },
  dimensionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  dimensionInput: {
    flex: 1,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 16,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginTop: 20,
  },
  costText: {
    color: '#757575',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
  },
  generateButton: {
    backgroundColor: '#E91E63',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  previewButton: {
    backgroundColor: '#E91E63',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: '#F5F5F5',
  },
  secondaryButtonText: {
    color: '#212121',
  },
  previewModal: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  previewHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  previewContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPreviewImage: {
    maxWidth: '90%',
    maxHeight: '70%',
    borderRadius: 12,
  },
});
