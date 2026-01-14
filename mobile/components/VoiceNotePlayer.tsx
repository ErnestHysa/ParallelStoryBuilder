import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Audio } from 'expo-av';

interface VoiceNotePlayerProps {
  uri: string;
  duration?: number;
  title?: string;
  onDelete?: () => void;
  waveform?: number[];
  speed?: number;
  onSpeedChange?: (speed: number) => void;
}

export function VoiceNotePlayer({
  uri,
  duration: initialDuration = 0,
  title,
  onDelete,
  waveform = [],
  speed = 1.0,
  onSpeedChange,
}: VoiceNotePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(initialDuration);

  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const loadAndPlay = async () => {
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    setIsLoading(true);

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { progressUpdateIntervalMillis: 100 },
        (status) => {
          if (status.isLoaded) {
            if (status.isPlaying) {
              setProgress(
                (status.positionMillis || 0) / (status.durationMillis || 1)
              );
            }
            if (status.didJustFinish) {
              setIsPlaying(false);
              setProgress(0);
            }
          }
        }
      );

      soundRef.current = sound;

      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.durationMillis) {
        setDuration(status.durationMillis);
      }

      await sound.playAsync();
      setIsPlaying(true);
    } catch (error) {
      console.error('Error playing audio:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeek = async (value: number) => {
    if (soundRef.current) {
      const position = value * duration;
      await soundRef.current.setPositionAsync(position);
      setProgress(value);
    }
  };

  const handleSpeedChange = async (newSpeed: number) => {
    if (soundRef.current) {
      await soundRef.current.setRateAsync(newSpeed, true);
    }
    onSpeedChange?.(newSpeed);
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentTime = progress * duration;

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Waveform Visualization */}
      <View style={styles.waveform}>
        {waveform.length > 0 ? (
          waveform.map((value, i) => (
            <View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: Math.max(4, value * 60),
                  opacity: i / waveform.length < progress ? 1 : 0.3,
                },
              ]}
            />
          ))
        ) : (
          [...Array(40)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.waveformBar,
                {
                  height: 20 + Math.random() * 40,
                  opacity: i / 40 < progress ? 1 : 0.3,
                },
              ]}
            />
          ))
        )}
      </View>

      {/* Time Display */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(currentTime)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* Progress Slider */}
      <View style={styles.sliderContainer}>
        <View style={styles.sliderTrack}>
          <View style={[styles.sliderFill, { width: `${progress * 100}%` }]} />
          <View
            style={[
              styles.sliderThumb,
              { left: `${Math.max(0, Math.min(100, progress * 100))}%` },
            ]}
          />
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        {/* Speed Control */}
        <View style={styles.speedContainer}>
          {[0.5, 1.0, 1.5, 2.0].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.speedButton,
                speed === s && styles.speedButtonActive,
              ]}
              onPress={() => handleSpeedChange(s)}
            >
              <Text
                style={[
                  styles.speedButtonText,
                  speed === s && styles.speedButtonTextActive,
                ]}
              >
                {s}x
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Play/Pause */}
        <TouchableOpacity
          style={styles.playButton}
          onPress={loadAndPlay}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather
              name={isPlaying ? 'pause' : 'play'}
              size={24}
              color="#FFFFFF"
            />
          )}
        </TouchableOpacity>

        {/* Delete */}
        {onDelete && (
          <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
            <Feather name="trash-2" size={20} color="#F44336" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212121',
    marginBottom: 12,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    gap: 2,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#9C27B0',
    borderRadius: 2,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  timeText: {
    fontSize: 12,
    color: '#757575',
  },
  sliderContainer: {
    marginTop: 12,
  },
  sliderTrack: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    position: 'relative',
  },
  sliderFill: {
    height: '100%',
    backgroundColor: '#9C27B0',
    borderRadius: 2,
  },
  sliderThumb: {
    position: 'absolute',
    top: -6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#9C27B0',
    transform: [{ translateX: -8 }],
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  speedContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  speedButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F5F5F5',
  },
  speedButtonActive: {
    backgroundColor: '#9C27B0',
  },
  speedButtonText: {
    fontSize: 12,
    color: '#757575',
    fontWeight: '500',
  },
  speedButtonTextActive: {
    color: '#FFFFFF',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#9C27B0',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#9C27B0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButton: {
    padding: 8,
  },
});

export default VoiceNotePlayer;
