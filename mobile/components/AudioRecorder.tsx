import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

interface AudioRecorderProps {
  visible: boolean;
  onClose: () => void;
  onRecordComplete: (uri: string, duration: number) => void;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  visible,
  onClose,
  onRecordComplete,
}) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [duration, setDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const animationRef = useRef(new Animated.Value(1)).current;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    checkPermissions();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (visible && permissionGranted) {
      setDuration(0);
      setIsRecording(false);
      setAudioUri(null);
      setPlaybackProgress(0);
    }
  }, [visible, permissionGranted]);

  const checkPermissions = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      if (status === 'granted') {
        setPermissionGranted(true);
      } else {
        Alert.alert(
          'Permission Required',
          'Microphone access is required to record audio.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: checkPermissions },
          ]
        );
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const startRecording = async () => {
    if (!permissionGranted) return;

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);

      // Update duration every second
      intervalRef.current = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);

      // Start animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(animationRef, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(animationRef, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } catch (error) {
      console.error('Error starting recording:', error);
      Alert.alert('Error', 'Failed to start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      clearInterval(intervalRef.current!);
      animationRef.stopAnimation();
      animationRef.setValue(1);

      setIsRecording(false);

      const uri = recording.getURI();
      if (uri) {
        setAudioUri(uri);

        // Use the duration state we've been tracking instead of getStatus
        // since getStatus may not be available in all expo-av versions
        setDuration(duration);
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
      Alert.alert('Error', 'Failed to stop recording.');
    }
  };

  const deleteRecording = () => {
    setAudioUri(null);
    setDuration(0);
    setRecording(null);
    setPlaybackProgress(0);
  };

  const playRecording = async () => {
    if (!audioUri) return;

    try {
      const { sound: newSound, status } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { progressUpdateIntervalMillis: 100 },
        (statusUpdate) => {
          if (statusUpdate.isLoaded && statusUpdate.durationMillis && statusUpdate.durationMillis > 0) {
            setPlaybackProgress(
              (statusUpdate.positionMillis || 0) / statusUpdate.durationMillis
            );
          }
        }
      );

      soundRef.current = newSound;
      setIsPlaying(true);

      await newSound.playAsync();

      newSound.setOnPlaybackStatusUpdate((playbackStatus) => {
        if (playbackStatus.isLoaded && playbackStatus.didJustFinish) {
          setIsPlaying(false);
          setPlaybackProgress(0);
        }
      });
    } catch (error) {
      console.error('Error playing recording:', error);
      Alert.alert('Error', 'Failed to play recording.');
    }
  };

  const pausePlayback = async () => {
    if (soundRef.current) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const handleSave = () => {
    if (audioUri && duration > 0) {
      onRecordComplete(audioUri, duration);
      onClose();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Voice Note</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Feather name="x" size={24} color="#212121" />
          </TouchableOpacity>
        </View>

        {!permissionGranted ? (
          <View style={styles.permissionContainer}>
            <Feather name="mic-off" size={48} color="#9E9E9E" />
            <Text style={styles.permissionTitle}>Microphone Access Required</Text>
            <Text style={styles.permissionText}>
              Grant microphone permission to record voice notes.
            </Text>
            <TouchableOpacity style={styles.button} onPress={checkPermissions}>
              <Text style={styles.buttonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Recording Visual */}
            <View style={styles.visualContainer}>
              <Animated.View
                style={[
                  styles.visualizer,
                  {
                    transform: [{ scale: animationRef }],
                    opacity: isRecording ? 1 : 0.3,
                  },
                ]}
              />
              <Feather
                name="mic"
                size={40}
                color={isRecording ? '#F44336' : '#9E9E9E'}
              />
            </View>

            {/* Duration Display */}
            <Text style={styles.duration}>{formatTime(duration)}</Text>
            <Text style={styles.statusText}>
              {isRecording
                ? 'Recording...'
                : audioUri
                  ? 'Recording complete'
                  : 'Tap to start recording'}
            </Text>

            {/* Recording Controls */}
            <View style={styles.controls}>
              {!isRecording && !audioUri && (
                <TouchableOpacity
                  style={[styles.button, styles.recordButton]}
                  onPress={startRecording}
                >
                  <Feather name="mic" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {isRecording && (
                <TouchableOpacity
                  style={[styles.button, styles.stopButton]}
                  onPress={stopRecording}
                >
                  <Feather name="square" size={24} color="#FFFFFF" />
                </TouchableOpacity>
              )}

              {audioUri && !isRecording && (
                <View style={styles.playbackControls}>
                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={deleteRecording}
                  >
                    <Feather name="trash-2" size={20} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.playButton]}
                    onPress={isPlaying ? pausePlayback : playRecording}
                  >
                    <Feather
                      name={isPlaying ? 'pause' : 'play'}
                      size={24}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.saveButton]}
                    onPress={handleSave}
                  >
                    <Feather name="check" size={20} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Progress Bar */}
            {audioUri && !isRecording && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${playbackProgress * 100}%` },
                  ]}
                />
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
};

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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    marginBottom: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  visualContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  visualizer: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFEBEE',
  },
  duration: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 40,
  },
  controls: {
    alignItems: 'center',
    gap: 16,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  recordButton: {
    backgroundColor: '#F44336',
  },
  stopButton: {
    backgroundColor: '#9E9E9E',
  },
  playButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#757575',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  playbackControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
  },
});

export default AudioRecorder;
