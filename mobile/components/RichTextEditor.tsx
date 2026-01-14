import React, { useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  Text,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import RichTextToolbar from './RichTextToolbar';
import ImagePickerComponent from './ImagePicker';
// import AudioRecorder from './AudioRecorder'; // May have dependencies to fix
// import { insertImage, insertAudio, formatText } from '../lib/richTextSerializer';
// import { uploadImageToStorage, uploadAudioToStorage } from '../lib/mediaStorage';

interface RichTextEditorProps {
  initialValue?: string;
  value?: string;
  onChangeText?: (content: string) => void;
  onChange?: (content: string) => void;
  placeholder?: string;
  editable?: boolean;
  onFormat?: (format: string) => void;
  error?: string;
  style?: any;
}

// Simple rich text editor using React Native TextInput
// For full rich text support, consider installing react-native-webview or expo-document-picker
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialValue = '',
  value,
  onChangeText,
  onChange,
  placeholder = 'Start writing your story...',
  editable = true,
  onFormat,
  error,
  style,
}) => {
  const [content, setContent] = useState(value || initialValue);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const inputRef = useRef<TextInput>(null);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    onChange?.(newContent);
    onChangeText?.(newContent);
  }, [onChange, onChangeText]);

  const handleFormat = useCallback((command: string, value?: string) => {
    // For now, just log the format command
    // In a full implementation with WebView, this would execCommand on the document
    console.log('Format command:', command, value);
    onFormat?.(command);
  }, [onFormat]);

  const handleInsertImage = useCallback(async (imageUri: string) => {
    try {
      // In production, upload to Supabase Storage
      // const { url, publicUrl } = await uploadImageToStorage(imageUri);

      // For now, just insert a markdown-style image link
      const imageMarkdown = `\n![Image](${imageUri})\n`;
      const newContent = content + imageMarkdown;
      handleContentChange(newContent);

      setShowImagePicker(false);
    } catch (error) {
      console.error('Error inserting image:', error);
    }
  }, [content, handleContentChange]);

  const handleImagePick = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      await handleInsertImage(result.assets[0].uri);
    }
  }, [handleInsertImage]);

  const toggleToolbar = useCallback(() => {
    setToolbarVisible(prev => !prev);
  }, []);

  return (
    <View style={styles.container}>
      {toolbarVisible && (
        <RichTextToolbar
          onFormat={handleFormat}
          onImagePick={handleImagePick}
          onRecordAudio={() => {
            // Audio recording functionality coming soon
            console.log('Audio recording not implemented yet');
          }}
          onToggleToolbar={toggleToolbar}
        />
      )}

      {!toolbarVisible && (
        <TouchableOpacity style={styles.toolbarToggle} onPress={toggleToolbar}>
          <View style={styles.toolbarToggleIcon} />
        </TouchableOpacity>
      )}

      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.editorContainer}>
            <TextInput
              ref={inputRef}
              style={error ? styles.editorError : styles.editor}
              multiline
              numberOfLines={10}
              value={content}
              onChangeText={handleContentChange}
              placeholder={placeholder}
              placeholderTextColor="#999"
              editable={editable}
              textAlignVertical="top"
              selectionColor="#007AFF"
              autoFocus={false}
            />
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {showImagePicker && (
        <ImagePickerComponent
          visible={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onImageSelect={handleInsertImage}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  toolbarToggle: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
  },
  toolbarToggleIcon: {
    width: 32,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  editorContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  editor: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    minHeight: 200,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  editorError: {
    borderWidth: 1,
    borderColor: '#F44336',
    borderRadius: 8,
  },
  errorText: {
    color: '#F44336',
    fontSize: 14,
    marginTop: 8,
  },
});

export default RichTextEditor;
