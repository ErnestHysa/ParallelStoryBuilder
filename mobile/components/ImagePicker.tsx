import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface ImagePickerProps {
  visible: boolean;
  onClose: () => void;
  onImageSelect: (uri: string) => void;
}

const ImagePickerComponent: React.FC<ImagePickerProps> = ({
  visible,
  onClose,
  onImageSelect,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'gallery' | 'camera'>('gallery');
  const [loading, setLoading] = useState(false);

  const pickFromGallery = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setLoading(false);
    }
  };

  const takeFromCamera = async () => {
    setLoading(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    } finally {
      setLoading(false);
    }
  };

  const handleUseImage = () => {
    if (selectedImage) {
      onImageSelect(selectedImage);
      onClose();
      setSelectedImage(null);
    }
  };

  const handleCropRotate = () => {
    Alert.alert('Feature', 'Crop and rotate functionality coming soon!');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            accessibilityLabel="Close image picker"
          >
            <Ionicons name="close" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Image</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, mediaType === 'gallery' && styles.activeTab]}
            onPress={() => setMediaType('gallery')}
            accessibilityLabel="Gallery"
          >
            <Ionicons
              name="images"
              size={20}
              color={mediaType === 'gallery' ? '#007AFF' : '#666'}
            />
            <Text
              style={[styles.tabText, mediaType === 'gallery' && styles.activeTabText]}
            >
              Gallery
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, mediaType === 'camera' && styles.activeTab]}
            onPress={() => setMediaType('camera')}
            accessibilityLabel="Camera"
          >
            <Ionicons
              name="camera"
              size={20}
              color={mediaType === 'camera' ? '#007AFF' : '#666'}
            />
            <Text
              style={[styles.tabText, mediaType === 'camera' && styles.activeTabText]}
            >
              Camera
            </Text>
          </TouchableOpacity>
        </View>

        {mediaType === 'gallery' && (
          <View style={styles.galleryContainer}>
            <View style={styles.galleryPrompt}>
              <Ionicons name="images" size={48} color="#ccc" style={styles.promptIcon} />
              <Text style={styles.promptText}>
                Tap the button below to browse your photo library
              </Text>
            </View>
          </View>
        )}

        {mediaType === 'camera' && (
          <View style={styles.cameraContainer}>
            <TouchableOpacity
              style={styles.cameraButton}
              onPress={takeFromCamera}
              disabled={loading}
              accessibilityLabel="Take photo"
            >
              <Ionicons name="camera" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.cameraHint}>
              Tap to take a photo
            </Text>
          </View>
        )}

        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <View style={styles.selectedImageHeader}>
              <Text style={styles.selectedImageTitle}>Selected Image</Text>
              <TouchableOpacity
                onPress={() => setSelectedImage(null)}
                accessibilityLabel="Remove selection"
              >
                <Ionicons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <RNImage
              source={{ uri: selectedImage }}
              style={styles.selectedImage}
              resizeMode="cover"
            />
            <View style={styles.imageActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCropRotate}
                accessibilityLabel="Crop and rotate"
              >
                <Ionicons name="crop" size={20} color="#333" />
                <Text style={styles.actionText}>Crop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  Alert.alert('Feature', 'Image compression coming soon!');
                }}
                accessibilityLabel="Compress"
              >
                <Ionicons name="resize" size={20} color="#333" />
                <Text style={styles.actionText}>Compress</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.useButton}
              onPress={handleUseImage}
              disabled={loading}
              accessibilityLabel="Use this image"
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#fff" />
                  <Text style={styles.useButtonText}>Use Image</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {!selectedImage && mediaType === 'gallery' && (
          <View style={styles.bottomContainer}>
            <TouchableOpacity
              style={styles.galleryButton}
              onPress={pickFromGallery}
              disabled={loading}
              accessibilityLabel="Browse gallery"
            >
              <Ionicons name="images" size={20} color="#fff" />
              <Text style={styles.galleryButtonText}>
                {loading ? 'Loading...' : 'Browse Gallery'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  galleryContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  galleryPrompt: {
    alignItems: 'center',
  },
  promptIcon: {
    marginBottom: 16,
  },
  promptText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  cameraButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  cameraHint: {
    fontSize: 16,
    color: '#666',
  },
  selectedImageContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  selectedImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  selectedImageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f0f0f0',
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  actionText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 4,
  },
  useButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  useButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  galleryButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  galleryButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default ImagePickerComponent;
