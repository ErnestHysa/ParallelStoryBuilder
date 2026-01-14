import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Dimensions,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');
const itemWidth = (screenWidth - 48) / 3; // 3 columns with 16px padding on each side

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'audio' | 'video';
  title?: string;
  size?: number;
  uploadedAt: Date;
  metadata?: {
    duration?: number;
    dimensions?: { width: number; height: number };
  };
}

interface MediaGalleryProps {
  media: MediaItem[];
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
  loading?: boolean;
  emptyMessage?: string;
  onClose?: () => void;
}

const MediaGallery: React.FC<MediaGalleryProps> = ({
  media,
  onDelete,
  onRefresh,
  loading = false,
  emptyMessage = 'No media items found',
  onClose,
}) => {
  const [selectedItem, setSelectedItem] = useState<MediaItem | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleDelete = (id: string) => {
    setShowDeleteConfirm(true);
    setSelectedItem(media.find(item => item.id === id) || null);
  };

  const confirmDelete = () => {
    if (selectedItem && onDelete) {
      onDelete(selectedItem.id);
    }
    setShowDeleteConfirm(false);
    setSelectedItem(null);
  };

  const onRefreshHandler = () => {
    setRefreshing(true);
    onRefresh?.();
    setTimeout(() => setRefreshing(false), 2000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const renderMediaItem = ({ item }: { item: MediaItem }) => (
    <TouchableOpacity
      style={styles.mediaItem}
      onPress={() => setSelectedItem(item)}
      accessibilityLabel={`View ${item.type}`}
    >
      <View style={styles.mediaContainer}>
        {item.type === 'image' ? (
          <RNImage
            source={{ uri: item.uri }}
            style={styles.mediaImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.mediaPlaceholder}>
            <Ionicons
              name={item.type === 'audio' ? 'musical-notes' : 'videocam'}
              size={32}
              color="#ccc"
            />
          </View>
        )}

        {onDelete && (
          <TouchableOpacity
            style={styles.deleteOverlay}
            onPress={(e) => {
              e.stopPropagation();
              handleDelete(item.id);
            }}
            accessibilityLabel="Delete media item"
          >
            <Ionicons name="trash" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        <View style={styles.mediaInfo}>
          <Text style={styles.mediaType} numberOfLines={1}>
            {item.type.toUpperCase()}
          </Text>
          {item.metadata?.duration && (
            <Text style={styles.mediaDuration}>
              {formatDuration(item.metadata.duration)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="folder-open-outline" size={64} color="#ccc" />
      <Text style={styles.emptyText}>{emptyMessage}</Text>
    </View>
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {media.length > 0 && (
        <FlatList
          data={media}
          renderItem={renderMediaItem}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.grid}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefreshHandler}
              tintColor="#007AFF"
            />
          }
          ListEmptyComponent={renderEmptyState}
          ListFooterComponent={loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#007AFF" />
            </View>
          ) : null}
        />
      )}

      {media.length === 0 && !loading && renderEmptyState()}

      {/* Lightbox Modal */}
      <Modal
        visible={!!selectedItem}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.lightboxContainer}>
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setSelectedItem(null)}
            accessibilityLabel="Close lightbox"
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>

          {selectedItem && (
            <>
              <ScrollView
                style={styles.lightboxContent}
                contentContainerStyle={styles.lightboxContentContainer}
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
              >
                {selectedItem.type === 'image' ? (
                  <RNImage
                    source={{ uri: selectedItem.uri }}
                    style={styles.lightboxImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.mediaPlaceholder}>
                    <Ionicons
                      name={selectedItem.type === 'audio' ? 'musical-notes' : 'videocam'}
                      size={64}
                      color="#ccc"
                    />
                    <Text style={styles.lightboxMediaType}>
                      {selectedItem.type.toUpperCase()}
                    </Text>
                  </View>
                )}
              </ScrollView>

              <View style={styles.lightboxInfo}>
                <Text style={styles.lightboxTitle}>
                  {selectedItem.title || 'Media Item'}
                </Text>

                <View style={styles.lightboxDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {selectedItem.uploadedAt.toLocaleDateString()}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Ionicons name="document-text" size={16} color="#666" />
                    <Text style={styles.detailText}>
                      {formatFileSize(selectedItem.size || 0)}
                    </Text>
                  </View>

                  {selectedItem.metadata?.duration && (
                    <View style={styles.detailItem}>
                      <Ionicons name="time" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {formatDuration(selectedItem.metadata.duration)}
                      </Text>
                    </View>
                  )}

                  {selectedItem.metadata?.dimensions && (
                    <View style={styles.detailItem}>
                      <Ionicons name="resize" size={16} color="#666" />
                      <Text style={styles.detailText}>
                        {selectedItem.metadata.dimensions.width} × {selectedItem.metadata.dimensions.height}
                      </Text>
                    </View>
                  )}
                </View>

                {onDelete && (
                  <TouchableOpacity
                    style={styles.lightboxDelete}
                    onPress={() => {
                      handleDelete(selectedItem.id);
                      setSelectedItem(null);
                    }}
                    accessibilityLabel="Delete media item"
                  >
                    <Ionicons name="trash" size={20} color="#fff" />
                    <Text style={styles.lightboxDeleteText}>
                      Delete Item
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </>
          )}
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteConfirm}
        animationType="fade"
        transparent
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View style={styles.confirmModalContainer}>
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>
              Delete Media Item
            </Text>
            <Text style={styles.confirmMessage}>
              Are you sure you want to delete this item? This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => setShowDeleteConfirm(false)}
                accessibilityLabel="Cancel deletion"
              >
                <Text style={styles.confirmButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteButton}
                onPress={confirmDelete}
                accessibilityLabel="Confirm deletion"
              >
                <Text style={styles.confirmDeleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  grid: {
    padding: 16,
  },
  mediaItem: {
    width: itemWidth,
    aspectRatio: 1,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  mediaContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#fff',
  },
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 16,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 4,
  },
  mediaType: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  mediaDuration: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 64,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  loadingContainer: {
    paddingVertical: 32,
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  lightboxClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxContent: {
    flex: 1,
  },
  lightboxContentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightboxImage: {
    width: '100%',
    height: '100%',
  },
  lightboxMediaType: {
    color: '#fff',
    fontSize: 24,
    marginTop: 16,
  },
  lightboxInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  lightboxTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  lightboxDetails: {
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#ccc',
    marginLeft: 8,
  },
  lightboxDelete: {
    backgroundColor: '#ff4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignSelf: 'center',
  },
  lightboxDeleteText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
    marginLeft: 8,
  },
  confirmModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    width: '100%',
    maxWidth: 400,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  confirmMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    lineHeight: 20,
  },
  confirmButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#333',
  },
  confirmDeleteButton: {
    backgroundColor: '#ff4444',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    color: '#fff',
  },
});

export default MediaGallery;
