import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Feather } from '@expo/vector-icons';

interface ToolbarButton {
  id: string;
  label: string;
  icon: keyof typeof Feather.glyphMap;
  iconSet: 'ionicons' | 'feather';
  command: string;
  value?: string;
  active?: boolean;
}

interface RichTextToolbarProps {
  onFormat: (command: string, value?: string) => void;
  onImagePick: () => void;
  onRecordAudio: () => void;
  onToggleToolbar: () => void;
}

const { width: screenWidth } = Dimensions.get('window');

const RichTextToolbar: React.FC<RichTextToolbarProps> = ({
  onFormat,
  onImagePick,
  onRecordAudio,
  onToggleToolbar,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());
  const animation = React.useRef(new Animated.Value(1)).current;

  const toolbarButtons: ToolbarButton[] = [
    {
      id: 'bold',
      label: 'Bold',
      icon: 'bold',
      iconSet: 'feather',
      command: 'bold',
      active: activeFormats.has('bold'),
    },
    {
      id: 'italic',
      label: 'Italic',
      icon: 'italic',
      iconSet: 'feather',
      command: 'italic',
      active: activeFormats.has('italic'),
    },
    {
      id: 'underline',
      label: 'Underline',
      icon: 'underline',
      iconSet: 'feather',
      command: 'underline',
      active: activeFormats.has('underline'),
    },
    {
      id: 'heading1',
      label: 'H1',
      icon: 'type',
      iconSet: 'feather',
      command: 'formatBlock',
      value: '<h1>',
      active: activeFormats.has('h1'),
    },
    {
      id: 'heading2',
      label: 'H2',
      icon: 'type',
      iconSet: 'feather',
      command: 'formatBlock',
      value: '<h2>',
      active: activeFormats.has('h2'),
    },
    {
      id: 'heading3',
      label: 'H3',
      icon: 'type',
      iconSet: 'feather',
      command: 'formatBlock',
      value: '<h3>',
      active: activeFormats.has('h3'),
    },
    {
      id: 'ul',
      label: 'Bullet List',
      icon: 'list',
      iconSet: 'feather',
      command: 'insertUnorderedList',
      active: activeFormats.has('ul'),
    },
    {
      id: 'ol',
      label: 'Numbered List',
      icon: 'list',
      iconSet: 'feather',
      command: 'insertOrderedList',
      active: activeFormats.has('ol'),
    },
    {
      id: 'link',
      label: 'Link',
      icon: 'link',
      iconSet: 'feather',
      command: 'createLink',
      value: 'https://',
    },
    {
      id: 'blockquote',
      label: 'Quote',
      icon: 'message-square',
      iconSet: 'feather' as 'feather',
      command: 'formatBlock',
      value: '<blockquote>',
      active: activeFormats.has('blockquote'),
    },
    {
      id: 'code',
      label: 'Code',
      icon: 'code',
      iconSet: 'feather',
      command: 'formatBlock',
      value: '<pre>',
      active: activeFormats.has('code'),
    },
    {
      id: 'image',
      label: 'Image',
      icon: 'image',
      iconSet: 'feather',
      command: 'image',
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: 'mic',
      iconSet: 'feather',
      command: 'audio',
    },
  ];

  const handleButtonPress = (button: ToolbarButton) => {
    if (button.command === 'image') {
      onImagePick();
    } else if (button.command === 'audio') {
      onRecordAudio();
    } else {
      onFormat(button.command, button.value);
    }

    // Toggle active state for formatting commands
    if (['bold', 'italic', 'underline', 'heading1', 'heading2', 'heading3', 'ul', 'ol', 'blockquote', 'code'].includes(button.id)) {
      const newActiveFormats = new Set(activeFormats);
      if (button.id === 'heading1') {
        newActiveFormats.has('h1') ? newActiveFormats.delete('h1') : newActiveFormats.add('h1');
      } else if (button.id === 'heading2') {
        newActiveFormats.has('h2') ? newActiveFormats.delete('h2') : newActiveFormats.add('h2');
      } else if (button.id === 'heading3') {
        newActiveFormats.has('h3') ? newActiveFormats.delete('h3') : newActiveFormats.add('h3');
      } else if (button.id === 'ul') {
        newActiveFormats.has('ul') ? newActiveFormats.delete('ul') : newActiveFormats.add('ul');
      } else if (button.id === 'ol') {
        newActiveFormats.has('ol') ? newActiveFormats.delete('ol') : newActiveFormats.add('ol');
      } else if (button.id === 'blockquote') {
        newActiveFormats.has('blockquote') ? newActiveFormats.delete('blockquote') : newActiveFormats.add('blockquote');
      } else if (button.id === 'code') {
        newActiveFormats.has('code') ? newActiveFormats.delete('code') : newActiveFormats.add('code');
      } else {
        newActiveFormats.has(button.command) ? newActiveFormats.delete(button.command) : newActiveFormats.add(button.command);
      }
      setActiveFormats(newActiveFormats);
    }
  };

  const toggleExpand = () => {
    setExpanded(!expanded);
    Animated.timing(animation, {
      toValue: expanded ? 0.7 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const renderButton = (button: ToolbarButton, index: number) => (
    <TouchableOpacity
      key={button.id}
      style={[
        styles.button,
        button.active && styles.activeButton,
        index > 0 && styles.buttonMargin,
      ]}
      onPress={() => handleButtonPress(button)}
      accessibilityLabel={button.label}
      accessibilityHint={`Apply ${button.label} formatting`}
    >
      <Feather
        name={button.icon}
        size={20}
        color={button.active ? '#fff' : '#333'}
      />
      <Text style={[
        styles.buttonLabel,
        button.active && styles.activeLabel,
      ]}>
        {button.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          height: expanded ? 80 : 48,
          transform: [{ scale: animation }],
        },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.expandButton}
          onPress={toggleExpand}
          accessibilityLabel={expanded ? 'Collapse toolbar' : 'Expand toolbar'}
        >
          <Feather
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#333"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onToggleToolbar}
          accessibilityLabel="Hide toolbar"
        >
          <Feather name="x" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {expanded && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {toolbarButtons.map(renderButton)}
        </ScrollView>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  expandButton: {
    padding: 8,
  },
  closeButton: {
    padding: 8,
  },
  scrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginHorizontal: 2,
    minWidth: 70,
    justifyContent: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
    borderColor: '#0051D5',
  },
  buttonMargin: {
    marginLeft: 4,
  },
  buttonLabel: {
    fontSize: 12,
    color: '#333',
    marginLeft: 4,
    fontWeight: '500',
  },
  activeLabel: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default RichTextToolbar;