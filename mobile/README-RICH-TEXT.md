# Rich Text Editor & Media Components

This directory contains a comprehensive suite of rich text editing and media management components for Parallel Story Builder.

## Components Overview

### 1. Rich Text Editor (`RichTextEditor.tsx`)

A full-featured rich text editor with:
- **Text formatting**: Bold, italic, underline
- **Headings**: H1, H2, H3
- **Lists**: Bulleted and numbered lists
- **Links**: Create hyperlinks
- **Block quotes**: For quotations and citations
- **Code blocks**: For code snippets
- **Image insertion**: Add images with compression
- **Audio recording**: Record and insert voice notes
- **Clean toolbar**: Collapsible, touch-friendly interface

```tsx
import { RichTextEditor } from '../components';

<RichTextEditor
  initialValue="<p>Start writing...</p>"
  onChange={(content) => console.log(content)}
  placeholder="Start your story..."
  editable={true}
/>
```

### 2. Rich Text Toolbar (`RichTextToolbar.tsx`)

A formatting toolbar that works with the RichTextEditor:
- **Style buttons**: Bold, italic, underline
- **Heading options**: H1, H2, H3
- **List tools**: Bulleted, numbered lists
- **Insert options**: Links, quotes, code
- **Media buttons**: Image picker, audio recorder
- **Active states**: Visual feedback for selected formatting
- **Collapsible**: Expand/collapse functionality
- **Touch-friendly**: Large buttons for mobile use

### 3. Image Picker (`ImagePicker.tsx`)

An image selection component with:
- **Gallery picker**: Browse device photos
- **Camera option**: Take new photos
- **Image preview**: View selected images
- **Crop/rotate**: Basic image editing
- **Compression**: Optimize images for storage
- **Recent images**: Quick access to recent photos
- **Permission handling**: Manages camera/gallery permissions

```tsx
<ImagePicker
  visible={showPicker}
  onClose={() => setShowPicker(false)}
  onImageSelect={(uri) => console.log(uri)}
/>
```

### 4. Audio Recorder (`AudioRecorder.tsx`)

A voice recording component featuring:
- **Record button**: Large, animated button with visual feedback
- **Duration display**: Shows recording length
- **Playback preview**: Listen to recordings before saving
- **Delete option**: Remove unwanted recordings
- **Waveform visualization**: Visual representation of audio
- **Permission handling**: Manages microphone permissions

```tsx
<AudioRecorder
  visible={showRecorder}
  onClose={() => setShowRecorder(false)}
  onRecordComplete={(uri, duration) => console.log(uri, duration)}
/>
```

### 5. Voice Note Player (`VoiceNotePlayer.tsx`)

An audio player component with:
- **Play/pause**: Control playback
- **Progress bar**: Visual progress indication
- **Speed control**: Adjust playback speed (0.5x - 2.0x)
- **Waveform**: Visual representation of audio
- **Time display**: Current time and total duration
- **Delete option**: Remove voice notes

```tsx
<VoiceNotePlayer
  audioUrl="https://example.com/audio.mp3"
  duration={120}
  title="My Voice Note"
  onDelete={() => console.log('Deleted')}
  speed={1.0}
  onSpeedChange={(speed) => console.log(speed)}
/>
```

### 6. Media Gallery (`MediaGallery.tsx`)

A gallery component for managing chapter media:
- **Grid layout**: Responsive grid of media items
- **Lightbox view**: Full-screen preview
- **Delete option**: Remove media items
- **Type indicators**: Icons for images, audio, video
- **Refresh**: Pull-to-refresh functionality
- **Empty state**: Helpful message when no media
- **Metadata display**: Shows file size, duration, dimensions

```tsx
<MediaGallery
  media={mediaItems}
  onDelete={(id) => console.log('Deleted:', id)}
  onRefresh={() => loadMedia()}
  loading={isLoading}
  emptyMessage="No media items in this chapter"
/>
```

## Utilities

### 1. Media Storage (`mediaStorage.ts`)

Supabase Storage integration with:
- **Upload functions**: Images, audio, video
- **Compression**: Automatic image optimization
- **Thumbnail generation**: Create preview images
- **Delete functions**: Remove files from storage
- **Metadata handling**: Extract file information

```tsx
import { uploadImageToStorage, uploadAudioToStorage } from '../lib/mediaStorage';

// Upload image
const result = await uploadImageToStorage(uri, {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.8,
  compress: true,
});

// Upload audio
const audioResult = await uploadAudioToStorage(audioUri, duration);
```

### 2. Rich Text Serializer (`richTextSerializer.ts`)

Convert rich text between different formats:
- **JSON format**: Structured rich text data
- **Markdown conversion**: Export to Markdown
- **HTML conversion**: Import/export HTML
- **Plain text**: Simple text representation
- **Validation**: Ensure data integrity
- **Optimization**: Remove redundant data

```tsx
import { htmlToJson, jsonToHtml, toMarkdown, serialize } from '../lib/richTextSerializer';

// Convert HTML to JSON
const json = htmlToJson('<p>Hello world</p>');

// Convert JSON to HTML
const html = jsonToHtml(json);

// Convert to Markdown
const markdown = toMarkdown(json);

// Serialize for storage
const serialized = serialize(json);
```

## Key Features

### Accessibility
- All components include accessibility labels
- Screen reader support for interactive elements
- Large touch targets for mobile devices
- Focus management for keyboard navigation
- ARIA-compatible structure

### Performance Optimizations
- Image compression reduces file sizes
- Lazy loading for gallery components
- Efficient serialization/deserialization
- Memory management for audio playback
- Cached file metadata

### Security
- Input sanitization for rich text
- Secure file upload handling
- XSS prevention in HTML content
- Permission checks for media access
- Encrypted storage options

### Integration
- Works with Supabase Storage
- Compatible with Expo ecosystem
- TypeScript support throughout
- Modular architecture
- Easy to extend or customize

## Usage Example

Here's a complete example of how to use the rich text editor with media:

```tsx
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { RichTextEditor, ImagePicker, AudioRecorder } from '../components';

export default function StoryEditor() {
  const [content, setContent] = useState('');
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  return (
    <View style={{ flex: 1 }}>
      <RichTextEditor
        initialValue={content}
        onChange={setContent}
        placeholder="Write your story..."
      />

      <Button
        title="Add Image"
        onPress={() => setShowImagePicker(true)}
      />

      <Button
        title="Record Audio"
        onPress={() => setShowAudioRecorder(true)}
      />

      <ImagePicker
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onImageSelect={(uri) => {
          // Handle image insertion
          setShowImagePicker(false);
        }}
      />

      <AudioRecorder
        visible={showAudioRecorder}
        onClose={() => setShowAudioRecorder(false)}
        onRecordComplete={(uri, duration) => {
          // Handle audio insertion
          setShowAudioRecorder(false);
        }}
      />
    </View>
  );
}
```

## Troubleshooting

### Common Issues

1. **WebView not rendering**
   - Ensure `react-native-webview` is installed
   - Check that the HTML content is properly escaped

2. **Image upload failing**
   - Verify Supabase credentials are correct
   - Check network connectivity
   - Ensure proper file permissions

3. **Audio recording not working**
   - Grant microphone permissions
   - Check that `expo-av` is properly configured
   - Verify the device supports audio recording

4. **Rich text formatting lost**
   - Ensure proper HTML structure in initial value
   - Check that the WebView content is properly maintained
   - Verify serialization/deserialization functions

### Performance Tips

- Compress large images before upload
- Use lazy loading for galleries with many items
- Limit audio duration to reasonable lengths
- Cache frequently accessed media files
- Use thumbnails for gallery previews

## Future Enhancements

- Video recording and playback support
- Advanced image editing capabilities
- Rich text undo/redo functionality
- Collaborative editing features
- Rich text templates
- Export to multiple formats (PDF, DOCX)
- Speech-to-text integration
- AI-powered text suggestions