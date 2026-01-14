import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, Text } from 'react-native';
import { Card } from './Card';
import { Feather } from '@expo/vector-icons';
import { RelationshipMilestone as RelationshipMilestoneType } from '@/lib/types';

interface RelationshipMilestoneProps {
  milestone: RelationshipMilestoneType;
  onEdit: (milestone: RelationshipMilestoneType) => void;
  onDelete: (id: string) => void;
}

export function RelationshipMilestone({ milestone, onEdit, onDelete }: RelationshipMilestoneProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'relationship': return '#E91E63';
      case 'story': return '#9C27B0';
      case 'achievement': return '#4CAF50';
      case 'personal': return '#FF9800';
      default: return '#2196F3';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'relationship': return 'heart';
      case 'story': return 'book';
      case 'achievement': return 'award';
      case 'personal': return 'user';
      default: return 'bookmark';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(milestone.category) }]}>
          <Feather name={getCategoryIcon(milestone.category)} size={16} color="#fff" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{milestone.title}</Text>
          <Text style={styles.date}>{formatDate(milestone.date)}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.description}>{milestone.description}</Text>

      {/* Photos */}
      {milestone.photos.length > 0 && (
        <View style={styles.photosSection}>
          <Text style={styles.photosLabel}>Photos</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.photosContainer}>
              {milestone.photos.slice(0, 3).map((photo, index) => (
                <View key={index} style={styles.photoWrapper}>
                  <Image source={{ uri: photo }} style={styles.photo} />
                  {index === 2 && milestone.photos.length > 3 && (
                    <View style={styles.morePhotos}>
                      <Text style={styles.morePhotosText}>
                        +{milestone.photos.length - 3}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(milestone)}
        >
          <Feather name="edit-2" size={16} color="#757575" />
          <Text style={styles.actionButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => onDelete(milestone.id)}
        >
          <Feather name="trash-2" size={16} color="#F44336" />
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 16,
  },
  photosSection: {
    marginBottom: 16,
  },
  photosLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  photosContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  morePhotos: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  morePhotosText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#757575',
  },
  deleteButton: {},
  deleteButtonText: {
    color: '#F44336',
  },
});
