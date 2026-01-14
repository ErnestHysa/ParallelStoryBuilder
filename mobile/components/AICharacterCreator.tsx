import React, { useState } from 'react';
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

interface Character {
  id?: string;
  name: string;
  description: string;
  age?: string;
  gender?: string;
  avatarUrl?: string;
  style?: 'realistic' | 'cartoon' | 'anime' | 'fantasy';
}

interface AICharacterCreatorProps {
  visible: boolean;
  onClose: () => void;
  storyId?: string;
  initialCharacter?: Partial<Character>;
  onSave?: (character: Character) => void;
  existingCharacters?: Character[];
}

const STYLE_OPTIONS: Array<{ value: Character['style']; label: string }> = [
  { value: 'realistic', label: 'Realistic' },
  { value: 'cartoon', label: 'Cartoon' },
  { value: 'anime', label: 'Anime' },
  { value: 'fantasy', label: 'Fantasy' },
];

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];

export function AICharacterCreator({
  visible,
  onClose,
  storyId,
  initialCharacter,
  onSave,
  existingCharacters = [],
}: AICharacterCreatorProps) {
  const { user } = useAuthStore();

  const [name, setName] = useState(initialCharacter?.name || '');
  const [description, setDescription] = useState(initialCharacter?.description || '');
  const [age, setAge] = useState(initialCharacter?.age || '');
  const [gender, setGender] = useState(initialCharacter?.gender || '');
  const [style, setStyle] = useState<Character['style']>(
    initialCharacter?.style || 'realistic'
  );
  const [avatar, setAvatar] = useState<string | null>(initialCharacter?.avatarUrl || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateAvatar = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a character name first');
      return;
    }

    setIsGeneratingAvatar(true);
    setError(null);

    try {
      // In a real implementation, this would call an AI service
      // For now, we'll use a placeholder avatar service
      const avatarUrl = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}&style=${style}`;
      setAvatar(avatarUrl);
      setShowAvatarPreview(true);
    } catch (err) {
      setError('Failed to generate avatar. Please try again.');
      Alert.alert('Error', 'Failed to generate avatar. Please try again.');
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a character name');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a character description');
      return;
    }

    // Check for duplicate names
    const duplicateName = existingCharacters.find(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== initialCharacter?.id
    );

    if (duplicateName) {
      Alert.alert('Error', 'A character with this name already exists');
      return;
    }

    setIsLoading(true);

    try {
      const character: Character = {
        id: initialCharacter?.id,
        name: name.trim(),
        description: description.trim(),
        age: age.trim() || undefined,
        gender: gender.trim() || undefined,
        avatarUrl: avatar || undefined,
        style,
      };

      if (storyId && user) {
        // Save to Supabase
        if (initialCharacter?.id) {
          // Update existing character
          const { error: updateError } = await supabase
            .from('story_characters')
            .update({
              name: character.name,
              description: character.description,
              age: character.age,
              gender: character.gender,
              avatar_url: character.avatarUrl,
              style: character.style,
            } as never)
            .eq('id', initialCharacter.id);
          if (updateError) throw updateError;
        } else {
          // Create new character
          const { error: insertError } = await supabase
            .from('story_characters')
            .insert({
              story_id: storyId,
              user_id: user.id,
              name: character.name,
              description: character.description,
              age: character.age,
              gender: character.gender,
              avatar_url: character.avatarUrl,
              style: character.style,
            } as any);
          if (insertError) throw insertError;
        }
      }

      onSave?.(character);
      onClose();
      Alert.alert('Success', 'Character saved successfully!');
    } catch (err) {
      setError('Failed to save character. Please try again.');
      Alert.alert('Error', 'Failed to save character. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {initialCharacter?.id ? 'Edit Character' : 'Create Character'}
          </Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#212121" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            {avatar ? (
              <Image source={{ uri: avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Feather name="user" size={48} color="#BDBDBD" />
              </View>
            )}
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateAvatar}
              disabled={isGeneratingAvatar}
            >
              {isGeneratingAvatar ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Feather name="zap" size={16} color="#FFFFFF" />
                  <Text style={styles.generateButtonText}>
                    {avatar ? 'Regenerate' : 'Generate Avatar'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Name Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Character Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter character name"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9E9E9E"
            />
          </View>

          {/* Description Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              placeholder="Describe your character's appearance, personality, backstory..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9E9E9E"
            />
          </View>

          {/* Age Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 25, young adult, ancient"
              value={age}
              onChangeText={setAge}
              placeholderTextColor="#9E9E9E"
            />
          </View>

          {/* Gender Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender (Optional)</Text>
            <View style={styles.genderButtons}>
              {GENDER_OPTIONS.map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[
                    styles.genderButton,
                    gender === g && styles.genderButtonSelected,
                  ]}
                  onPress={() => setGender(g)}
                >
                  <Text
                    style={[
                      styles.genderButtonText,
                      gender === g && styles.genderButtonTextSelected,
                    ]}
                  >
                    {g}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Style Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Art Style</Text>
            <View style={styles.styleButtons}>
              {STYLE_OPTIONS.map((styleOption) => (
                <TouchableOpacity
                  key={styleOption.value}
                  style={[
                    styles.styleButton,
                    style === styleOption.value && styles.styleButtonSelected,
                  ]}
                  onPress={() => setStyle(styleOption.value)}
                >
                  <Text
                    style={[
                      styles.styleButtonText,
                      style === styleOption.value && styles.styleButtonTextSelected,
                    ]}
                  >
                    {styleOption.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.saveButtonText}>Save Character</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    backgroundColor: '#FAFAFA',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEEEEE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9C27B0',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 8,
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
  genderButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  genderButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  genderButtonSelected: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  genderButtonText: {
    color: '#212121',
    fontWeight: '500',
  },
  genderButtonTextSelected: {
    color: '#FFFFFF',
  },
  styleButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  styleButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FFFFFF',
  },
  styleButtonSelected: {
    backgroundColor: '#9C27B0',
    borderColor: '#9C27B0',
  },
  styleButtonText: {
    color: '#212121',
    fontWeight: '500',
  },
  styleButtonTextSelected: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  cancelButtonText: {
    color: '#212121',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#9C27B0',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
