import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, Alert, ActivityIndicator, Modal, Text, TouchableOpacity, Image } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { TextArea } from '@/components/TextArea';
import { useRelationshipStore } from '@/stores/relationshipStore';
import { supabase } from '@/lib/supabase';
import { theme } from '@/lib/theme';
import { AntDesign, MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

interface MilestoneForm {
  title: string;
  description: string;
  date: string;
  category: 'personal' | 'relationship' | 'story' | 'achievement';
}

interface Milestone {
  id: string;
  title: string;
  description?: string;
  date_achieved: string;
  category: string;
  relationship_id: string;
  created_by: string;
}

export default function RelationshipMilestones() {
  const { id: relationshipId } = useLocalSearchParams();
  const router = useRouter();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [milestoneImages, setMilestoneImages] = useState<string[]>([]);
  const [editingMilestone, setEditingMilestone] = useState<MilestoneForm | null>(null);
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);

  const {
    sharedMilestones,
    fetchSharedMilestones,
    addSharedMilestone,
    updateSharedMilestone,
    deleteSharedMilestone
  } = useRelationshipStore();

  useEffect(() => {
    loadMilestones();
  }, [relationshipId]);

  const loadMilestones = async () => {
    if (!relationshipId) return;

    setLoading(true);
    try {
      await fetchSharedMilestones();
    } catch (error) {
      console.error('Error loading milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMilestone = async () => {
    if (!editingMilestone) return;

    try {
      const newMilestone: Partial<Milestone> = {
        title: editingMilestone.title,
        description: editingMilestone.description,
        date_achieved: editingMilestone.date,
        category: editingMilestone.category,
      };

      // For demo, just add to local state
      const tempId = `temp-${Date.now()}`;
      const createdMilestone: Milestone = {
        id: tempId,
        relationship_id: relationshipId as string,
        created_by: 'current-user',
        date_achieved: editingMilestone.date,
        category: editingMilestone.category,
        title: editingMilestone.title,
        description: editingMilestone.description,
      };

      setMilestones(prev => [createdMilestone, ...prev]);
      setShowForm(false);
      setEditingMilestone(null);
      setMilestoneImages([]);
    } catch (error) {
      console.error('Error adding milestone:', error);
      Alert.alert('Error', 'Failed to add milestone. Please try again.');
    }
  };

  const handleUpdateMilestone = async (id: string) => {
    if (!editingMilestone) return;

    try {
      await updateSharedMilestone(id, editingMilestone);
      setShowForm(false);
      setEditingMilestone(null);
      setSelectedMilestoneId(null);
      loadMilestones();
    } catch (error) {
      console.error('Error updating milestone:', error);
      Alert.alert('Error', 'Failed to update milestone. Please try again.');
    }
  };

  const handleDeleteMilestone = async (id: string) => {
    Alert.alert(
      'Delete Milestone',
      'Are you sure you want to delete this milestone?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSharedMilestone(id);
              setMilestones(prev => prev.filter(m => m.id !== id));
            } catch (error) {
              console.error('Error deleting milestone:', error);
              Alert.alert('Error', 'Failed to delete milestone. Please try again.');
            }
          },
        },
      ]
    );
  };

  const openAddForm = () => {
    setEditingMilestone({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      category: 'relationship'
    });
    setShowForm(true);
  };

  const openEditForm = (milestone: Milestone) => {
    setEditingMilestone({
      title: milestone.title,
      description: milestone.description || '',
      date: milestone.date_achieved,
      category: milestone.category as any,
    });
    setSelectedMilestoneId(milestone.id);
    setShowForm(true);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [4, 3] as [number, number],
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      setMilestoneImages(prev => [
        ...prev,
        ...result.assets.map(asset => asset.uri)
      ]);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

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
      case 'achievement': return 'trophy';
      case 'personal': return 'user';
      default: return 'bookmark';
    }
  };

  const displayMilestones = milestones.length > 0 ? milestones : sharedMilestones || [];

  const renderMilestoneForm = () => (
    <Modal visible={showForm} animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedMilestoneId ? 'Edit Milestone' : 'Add New Milestone'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowForm(false);
                setEditingMilestone(null);
                setSelectedMilestoneId(null);
                setMilestoneImages([]);
              }}
              style={styles.closeButton}
            >
              <AntDesign name="close" size={20} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formScroll}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title</Text>
              <Input
                placeholder="What's this milestone called?"
                value={editingMilestone?.title || ''}
                onChangeText={(text) => setEditingMilestone((prev: any) => ({ ...prev, title: text }))}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date</Text>
              <Input
                placeholder="When did this happen?"
                value={editingMilestone?.date || ''}
                onChangeText={(text) => setEditingMilestone((prev: any) => ({ ...prev, date: text }))}
              />
            </View>

            <View style={styles.categorySection}>
              <Text style={styles.label}>Category</Text>
              <View style={styles.categoryGrid}>
                {(['relationship', 'story', 'achievement', 'personal'] as const).map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.categoryButton,
                      editingMilestone?.category === category && styles.categoryButtonActive
                    ]}
                    onPress={() => setEditingMilestone((prev: any) => ({ ...prev, category }))}
                  >
                    <AntDesign name={getCategoryIcon(category) as any} size={16} />
                    <Text style={styles.categoryButtonText}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Description</Text>
              <TextArea
                placeholder="Tell the story..."
                value={editingMilestone?.description || ''}
                onChangeText={(text) => setEditingMilestone((prev: any) => ({ ...prev, description: text }))}
              />
            </View>

            {milestoneImages.length > 0 && (
              <View style={styles.imageSection}>
                <Text style={styles.label}>Photos ({milestoneImages.length})</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.imageContainer}>
                    {milestoneImages.map((image, index) => (
                      <View key={index} style={styles.imageWrapper}>
                        <Image source={{ uri: image }} style={styles.image} />
                        <TouchableOpacity
                          style={styles.removeImage}
                          onPress={() => setMilestoneImages(prev => prev.filter((_, i) => i !== index))}
                        >
                          <AntDesign name="close" size={16} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </ScrollView>
                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.addPhotoButton}
                >
                  <AntDesign name="plus" size={16} color="#E91E63" />
                  <Text style={styles.addPhotoText}>Add Photo</Text>
                </TouchableOpacity>
              </View>
            )}

            <Button
              onPress={() => {
                if (selectedMilestoneId) {
                  handleUpdateMilestone(selectedMilestoneId);
                } else {
                  handleAddMilestone();
                }
              }}
              style={styles.saveButton}
            >
              Save Milestone
            </Button>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: 'Our Milestones',
            headerStyle: { backgroundColor: theme.colors.primary },
            headerTintColor: '#fff',
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Our Milestones',
          headerStyle: { backgroundColor: theme.colors.primary },
          headerTintColor: '#fff',
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Card style={styles.headerCard}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.headerTitle}>Our Journey Together</Text>
              <Text style={styles.headerSubtitle}>
                Capture and celebrate your special moments
              </Text>
            </View>
            <Button
              onPress={openAddForm}
              variant="primary"
              style={styles.addButton}
            >
              Add Milestone
            </Button>
          </View>
        </Card>

        <View style={styles.timeline}>
          {displayMilestones.length > 0 ? (
            displayMilestones.map((milestone: any, index: number) => (
              <View key={milestone.id} style={styles.milestoneContainer}>
                <View style={[styles.timelineLine, index === displayMilestones.length - 1 && styles.timelineEnd]} />
                <View style={styles.milestoneItem}>
                  <View style={styles.milestoneHeader}>
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(milestone.category) }]}>
                      <Feather name={getCategoryIcon(milestone.category) as any} size={16} color="#fff" />
                    </View>
                    <View style={styles.milestoneHeaderContent}>
                      <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                      <Text style={styles.milestoneDate}>
                        {formatDate(milestone.date_achieved)}
                      </Text>
                    </View>
                  </View>
                  {milestone.description && (
                    <Text style={styles.milestoneDescription}>{milestone.description}</Text>
                  )}
                  <View style={styles.milestoneActions}>
                    <TouchableOpacity
                      onPress={() => openEditForm(milestone)}
                      style={styles.actionButton}
                    >
                      <AntDesign name="edit" size={16} color="#666" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteMilestone(milestone.id)}
                      style={styles.actionButton}
                    >
                      <AntDesign name="delete" size={16} color="#E91E63" />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="location-on" size={64} color={theme.colors.textSecondary} />
              <Text style={styles.emptyStateTitle}>
                No milestones yet
              </Text>
              <Text style={styles.emptyStateText}>
                Start capturing your journey together!
              </Text>
              <Button
                onPress={openAddForm}
                variant="primary"
                style={styles.emptyStateButton}
              >
                Add Your First Milestone
              </Button>
            </View>
          )}
        </View>

        {/* Anniversary Countdown */}
        <Card style={styles.anniversaryCard}>
          <View style={styles.anniversaryHeader}>
            <AntDesign name="heart" size={24} color="#E91E63" />
            <Text style={styles.anniversaryTitle}>Next Anniversary</Text>
          </View>
          <Text style={styles.anniversaryDate}>
            {formatDate('2024-02-14')}
          </Text>
          <Text style={styles.anniversaryCountdown}>
            Coming soon!
          </Text>
        </Card>
      </ScrollView>

      {showForm && renderMilestoneForm()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  addButton: {
    minWidth: 120,
  },
  timeline: {
    position: 'relative' as const,
    paddingLeft: 32,
  },
  timelineLine: {
    position: 'absolute' as const,
    left: 8,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: '#e0e0e0',
  },
  timelineEnd: {
    bottom: 'auto' as any,
    height: 20,
  },
  milestoneContainer: {
    marginBottom: 24,
  },
  milestoneItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  milestoneHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginRight: 12,
  },
  milestoneHeaderContent: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#333',
  },
  milestoneDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  milestoneDescription: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  milestoneActions: {
    flexDirection: 'row' as const,
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#666',
  },
  deleteButtonText: {
    color: '#E91E63',
  },
  emptyState: {
    alignItems: 'center' as const,
    paddingVertical: 64,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: '#333',
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginTop: 8,
  },
  emptyStateButton: {
    marginTop: 24,
  },
  anniversaryCard: {
    marginTop: 24,
    padding: 16,
  },
  anniversaryHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  anniversaryTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  anniversaryDate: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#E91E63',
    textAlign: 'center' as const,
    marginTop: 16,
  },
  anniversaryCountdown: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center' as const,
    marginTop: 4,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  formScroll: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryGrid: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
  },
  categoryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  categoryButtonActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  categoryButtonText: {
    fontSize: 12,
    color: '#333',
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#333',
    marginBottom: 8,
  },
  imageSection: {
    marginBottom: 16,
  },
  imageContainer: {
    flexDirection: 'row' as const,
    gap: 8,
  },
  imageWrapper: {
    position: 'relative' as const,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  removeImage: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E91E63',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  addPhotoButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 8,
    marginTop: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E91E63',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  addPhotoText: {
    fontSize: 14,
    color: '#E91E63',
  },
  saveButton: {
    marginTop: 24,
  },
});
