import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from './Button';
import { Switch } from './Switch';
import { Story, Chapter } from '../lib/types';

// Define ExportFormat and ExportOptions locally since storyExport may not exist
export type ExportFormat = 'pdf' | 'markdown' | 'text';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata: boolean;
  includeInspiration: boolean;
}

// Placeholder export function - replace with actual implementation
const exportStory = async (
  story: Story,
  chapters: Chapter[],
  inspirations: string[],
  options: ExportOptions
): Promise<void> => {
  // This is a placeholder - implement actual export logic
  console.log('Exporting story:', { story, chapters, inspirations, options });
  await new Promise(resolve => setTimeout(resolve, 1000));
};

interface ExportDialogProps {
  visible: boolean;
  onClose: () => void;
  story: Story;
  chapters: Chapter[];
  inspirations: string[];
}

const FORMAT_INFO: Record<ExportFormat, { label: string; description: string; icon: keyof typeof Feather.glyphMap }> = {
  pdf: {
    label: 'PDF',
    description: 'Beautiful formatting with styles',
    icon: 'file-text',
  },
  markdown: {
    label: 'Markdown',
    description: 'Plain text with formatting',
    icon: 'code',
  },
  text: {
    label: 'Plain Text',
    description: 'Simple text file',
    icon: 'file',
  },
};

export function ExportDialog({
  visible,
  onClose,
  story,
  chapters,
  inspirations,
}: ExportDialogProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [includeInspiration, setIncludeInspiration] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    const options: ExportOptions = {
      format: selectedFormat,
      includeMetadata,
      includeInspiration,
    };

    try {
      await exportStory(story, chapters, inspirations, options);
      onClose();
    } catch (error) {
      Alert.alert(
        'Export Failed',
        'Unable to export your story. Please try again.',
        [{ text: 'OK', style: 'default' }]
      );
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.modal}>
        <View style={styles.header}>
          <Text style={styles.title}>Export Story</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#757575" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.container}>
          <Text style={styles.storyTitle}>{story.title}</Text>

          {/* Format Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Format</Text>
            <View style={styles.formats}>
              {Object.entries(FORMAT_INFO).map(([format, info]) => (
                <TouchableOpacity
                  key={format}
                  style={[
                    styles.formatOption,
                    selectedFormat === format && styles.selectedFormat,
                  ]}
                  onPress={() => setSelectedFormat(format as ExportFormat)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Export as ${info.label}`}
                  accessibilityHint={info.description}
                >
                  <Feather
                    name={info.icon}
                    size={20}
                    color={selectedFormat === format ? '#FFFFFF' : '#757575'}
                    style={styles.formatIcon}
                  />
                  <View style={styles.formatText}>
                    <Text
                      style={[
                        styles.formatLabel,
                        selectedFormat === format && styles.selectedFormatLabel,
                      ]}
                    >
                      {info.label}
                    </Text>
                    <Text
                      style={[
                        styles.formatDescription,
                        selectedFormat === format && styles.selectedFormatDescription,
                      ]}
                    >
                      {info.description}
                    </Text>
                  </View>
                  {selectedFormat === format && (
                    <Feather
                      name="check"
                      size={20}
                      color="#FFFFFF"
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>

            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Include Metadata</Text>
                <Text style={styles.optionDescription}>
                  Add story theme and creation date
                </Text>
              </View>
              <Switch
                value={includeMetadata}
                onValueChange={setIncludeMetadata}
              />
            </View>

            <View style={styles.optionItem}>
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>Include Inspirations</Text>
                <Text style={styles.optionDescription}>
                  Export story inspirations alongside chapters
                </Text>
              </View>
              <Switch
                value={includeInspiration}
                onValueChange={setIncludeInspiration}
              />
            </View>
          </View>

          {/* Preview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.preview}>
              <Text style={styles.previewText}>
                {chapters.length} chapter{chapters.length !== 1 ? 's' : ''} included
                {includeInspiration && inspirations.length > 0 && ` • ${inspirations.length} inspiration${inspirations.length !== 1 ? 's' : ''}`}
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <Button
            variant="ghost"
            onPress={onClose}
            style={styles.actionButton}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onPress={handleExport}
            style={styles.actionButton}
            isLoading={isExporting}
            disabled={isExporting}
          >
            Export {FORMAT_INFO[selectedFormat].label}
          </Button>
        </View>
      </View>
    </Modal>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  modal: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#212121',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    marginBottom: 24,
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  formats: {
    gap: 8,
  },
  formatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
    marginBottom: 8,
  },
  selectedFormat: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  formatIcon: {
    marginRight: 12,
  },
  formatText: {
    flex: 1,
  },
  formatLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
  },
  selectedFormatLabel: {
    color: '#FFFFFF',
  },
  formatDescription: {
    fontSize: 14,
    color: '#757575',
  },
  selectedFormatDescription: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#212121',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: '#757575',
  },
  preview: {
    backgroundColor: '#F5F5F5',
    padding: 16,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});

export default ExportDialog;
