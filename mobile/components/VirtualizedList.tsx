import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { LazyImage, OptimizedImage, ImageSizes } from './LazyImage';

// Simple theme instead of using @shopify/flash-list theme
const defaultTheme = {
  backgroundColor: '#f0f0f0',
  color: '#007AFF',
};

// Types
export interface VirtualizedListProps<T> {
  data: T[];
  renderItem: ({ item, index }: { item: T; index: number }) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  getItemLayout?: (data: T[], index: number) => {
    length: number;
    offset: number;
    index: number;
  };
  onEndReached?: (info: { distanceFromEnd: number }) => void;
  onEndReachedThreshold?: number;
  refreshing?: boolean;
  onRefresh?: () => void;
  ListEmptyComponent?: React.ComponentType | React.ReactElement | null;
  ListFooterComponent?: React.ComponentType | React.ReactElement | null;
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  initialNumToRender?: number;
  maxToRenderPerBatch?: number;
  updateCellsBatchingPeriod?: number;
  windowSize?: number;
  horizontal?: boolean;
  numColumns?: number;
  columnWrapperStyle?: any;
  contentContainerStyle?: any;
  style?: any;
  estimatedItemSize?: number;
  viewabilityConfig?: any;
  onViewableItemsChanged?: (info: any) => void;
  removeClippedSubviews?: boolean;
  scrollIndicatorInsets?: any;
  indicatorStyle?: 'default' | 'black' | 'white';
  stickyHeaderIndices?: number[];
  stickySectionHeadersEnabled?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  overScrollMode?: 'auto' | 'always' | 'never';
  inverted?: boolean;
  pagingEnabled?: boolean;
  scrollEnabled?: boolean;
  maintainVisibleContentPosition?: {
    minIndexForVisible: number;
    autoscrollToTopThreshold: number;
  };
}

// Image-based virtualization types
export interface VirtualizedImageItem {
  id: string;
  uri: string;
  title?: string;
  description?: string;
  width?: number;
  height?: number;
  blurHash?: string;
}

// Hook for tracking visible items
export const useVisibleItems = <T,>() => {
  const [visibleItems, setVisibleItems] = useState<Array<{ item: T; index: number }>>([]);

  const onViewableItemsChanged = useCallback(({ changed, viewableItems }: any) => {
    const visible = viewableItems.map((v: any) => ({
      item: v.item,
      index: v.index,
    }));
    setVisibleItems(visible);
  }, []);

  return { visibleItems, onViewableItemsChanged };
};

// Virtualized List Component
function VirtualizedListImpl<T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<FlashList<T>> }
): React.ReactElement | null {
  const {
    data,
    renderItem,
    keyExtractor,
    getItemLayout,
    onEndReached,
    onEndReachedThreshold = 0.5,
    refreshing = false,
    onRefresh,
    ListEmptyComponent,
    ListFooterComponent,
    ListHeaderComponent,
    initialNumToRender = 10,
    maxToRenderPerBatch = 20,
    updateCellsBatchingPeriod = 50,
    windowSize = 10,
    horizontal = false,
    numColumns = 1,
    columnWrapperStyle,
    contentContainerStyle,
    style,
    estimatedItemSize,
    viewabilityConfig,
    onViewableItemsChanged,
    removeClippedSubviews = Platform.OS === 'android',
    scrollIndicatorInsets,
    indicatorStyle = 'default',
    stickyHeaderIndices,
    stickySectionHeadersEnabled = false,
    showsVerticalScrollIndicator = true,
    showsHorizontalScrollIndicator = true,
    overScrollMode = 'auto',
    inverted = false,
    pagingEnabled = false,
    scrollEnabled = true,
    maintainVisibleContentPosition,
    ref,
    ...restProps
  } = props;

  const listRef = useRef<FlashList<T> | null>(null);

  // Forward ref
  useEffect(() => {
    if (ref && typeof ref !== 'function') {
      (ref as any).current = listRef.current;
    }
  }, [ref]);

  // Use FlashList for better performance
  const memoizedRenderItem = useCallback(
    ({ item, index }: { item: T; index: number }) => (
      <View style={styles.itemContainer}>
        {renderItem({ item, index })}
      </View>
    ),
    [renderItem]
  );

  const memoizedKeyExtractor = useCallback(
    (item: T, index: number) => keyExtractor(item, index),
    [keyExtractor]
  );

  const memoizedItemLayout = useMemo(() => {
    if (getItemLayout) return getItemLayout;
    if (estimatedItemSize) {
      return (data: T[], index: number) => ({
        length: estimatedItemSize!,
        offset: estimatedItemSize! * index,
        index,
      });
    }
    return undefined;
  }, [getItemLayout, estimatedItemSize]);

  const memoizedViewabilityConfig = useMemo(
    () => ({
      itemVisiblePercentThreshold: 50,
      minimumViewTime: 300,
      waitForInteraction: true,
      ...viewabilityConfig,
    }),
    [viewabilityConfig]
  );

  // Custom refresh control
  const refreshControl = useMemo(() => (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={defaultTheme.color}
      colors={[defaultTheme.color]}
      progressBackgroundColor={defaultTheme.backgroundColor}
    />
  ), [refreshing, onRefresh]);

  return (
    // @ts-ignore - FlashList props type compatibility issues with restProps
    <FlashList
      ref={listRef}
      data={data}
      renderItem={memoizedRenderItem}
      keyExtractor={memoizedKeyExtractor}
      estimatedItemSize={estimatedItemSize || 100}
      onEndReached={onEndReached ? () => onEndReached({ distanceFromEnd: 0 }) : undefined}
      onEndReachedThreshold={onEndReachedThreshold}
      horizontal={horizontal}
      numColumns={numColumns}
      contentContainerStyle={contentContainerStyle}
      style={style}
      refreshControl={refreshControl}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={ListFooterComponent}
      ListHeaderComponent={ListHeaderComponent}
      viewabilityConfig={memoizedViewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      removeClippedSubviews={removeClippedSubviews}
      scrollIndicatorInsets={scrollIndicatorInsets}
      indicatorStyle={indicatorStyle}
      stickyHeaderIndices={stickyHeaderIndices}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      overScrollMode={overScrollMode}
      inverted={inverted}
      pagingEnabled={pagingEnabled}
      scrollEnabled={scrollEnabled}
      maintainVisibleContentPosition={maintainVisibleContentPosition}
      {...restProps}
    />
  );
}

export const VirtualizedList = forwardRef(VirtualizedListImpl) as <T>(
  props: VirtualizedListProps<T> & { ref?: React.Ref<FlashList<T>> }
) => React.ReactElement | null;

// @ts-ignore - displayName for better debugging
(VirtualizedList as any).displayName = 'VirtualizedList';

// Specialized Virtualized Image Grid
interface VirtualizedImageGridProps {
  data: VirtualizedImageItem[];
  columns?: number;
  imageAspectRatio?: number;
  onImagePress?: (item: VirtualizedImageItem) => void;
  onEndReached?: (info: { distanceFromEnd: number }) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const VirtualizedImageGrid: React.FC<VirtualizedImageGridProps> = ({
  data,
  columns = 2,
  imageAspectRatio = 1,
  onImagePress,
  onEndReached,
  refreshing,
  onRefresh,
}) => {
  const { width } = Dimensions.get('window');
  const itemWidth = (width - 24) / columns - 12; // 12px margin on each side

  const renderItem = useCallback(({ item }: { item: VirtualizedImageItem }) => (
    <View style={[styles.gridItem, { width: itemWidth }]}>
      <OptimizedImage
        source={{ uri: item.uri }}
        style={styles.gridImage}
        width={itemWidth}
        height={itemWidth * imageAspectRatio}
        borderRadius={8}
        blurHash={item.blurHash}
        priority={item.id.startsWith('recent-') ? 'high' : 'normal'}
      />
      {item.title && (
        <View style={styles.imageTitle}>
          <OptimizedImage
            source={{ uri: item.uri }}
            style={styles.titleImage}
            width={20}
            height={20}
            borderRadius={10}
          />
          <View style={styles.titleContainer}>
            <View style={[styles.titleText, { backgroundColor: defaultTheme.backgroundColor }]} />
            <View style={[styles.titleDesc, { backgroundColor: defaultTheme.backgroundColor }]} />
          </View>
        </View>
      )}
    </View>
  ), [itemWidth, imageAspectRatio]);

  return (
    <VirtualizedList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={columns}
      estimatedItemSize={itemWidth * (imageAspectRatio + 0.3)}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={defaultTheme.color} />
          <View style={[styles.emptyText, { backgroundColor: defaultTheme.backgroundColor }]} />
        </View>
      }
      contentContainerStyle={styles.gridContainer}
    />
  );
};

// Specialized Virtualized Story List
interface StoryItem {
  id: string;
  title: string;
  excerpt: string;
  coverImage?: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  isComplete: boolean;
}

interface VirtualizedStoryListProps {
  data: StoryItem[];
  onStoryPress?: (story: StoryItem) => void;
  onEndReached?: (info: { distanceFromEnd: number }) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
}

export const VirtualizedStoryList: React.FC<VirtualizedStoryListProps> = ({
  data,
  onStoryPress,
  onEndReached,
  refreshing,
  onRefresh,
}) => {
  const { width } = Dimensions.get('window');

  const renderItem = useCallback(({ item }: { item: StoryItem }) => (
    <View style={styles.storyCard}>
      {item.coverImage && (
        <View style={styles.storyCardImage}>
          <OptimizedImage
            source={{ uri: item.coverImage }}
            style={styles.storyCardCover}
            borderRadius={12}
            blurHash={item.id}
          />
          <View style={styles.storyCardOverlay}>
            <View style={[styles.storyCardBadge, { backgroundColor: defaultTheme.backgroundColor }]} />
          </View>
        </View>
      )}
      <View style={styles.storyCardContent}>
        <View style={styles.storyCardTitle}>
          <View style={[styles.storyCardTitleText, { backgroundColor: defaultTheme.backgroundColor }]} />
          <View style={[styles.storyCardTitleLine, { backgroundColor: defaultTheme.backgroundColor }]} />
        </View>
        <View style={styles.storyCardAuthor}>
          <View style={[styles.storyCardAvatar, { backgroundColor: defaultTheme.backgroundColor }]} />
          <View style={[styles.storyCardAuthorText, { backgroundColor: defaultTheme.backgroundColor }]} />
        </View>
        <View style={styles.storyCardExcerpt}>
          <View style={[styles.storyCardExcerptText, { backgroundColor: defaultTheme.backgroundColor }]} />
          <View style={[styles.storyCardExcerptText, { backgroundColor: defaultTheme.backgroundColor }]} />
          <View style={[styles.storyCardExcerptLine, { backgroundColor: defaultTheme.backgroundColor }]} />
        </View>
      </View>
    </View>
  ), []);

  return (
    <VirtualizedList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      estimatedItemSize={200}
      onEndReached={onEndReached}
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentContainerStyle={styles.storyListContainer}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={defaultTheme.color} />
          <View style={[styles.emptyText, { backgroundColor: defaultTheme.backgroundColor }]} />
        </View>
      }
    />
  );
};

// Styles
const styles = StyleSheet.create({
  itemContainer: {
    paddingVertical: 8,
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  gridItem: {
    marginHorizontal: 6,
    marginBottom: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gridImage: {
    borderRadius: 8,
  },
  imageTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  titleImage: {
    marginRight: 8,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    height: 16,
    width: 100,
    borderRadius: 4,
    marginBottom: 4,
  },
  titleDesc: {
    height: 12,
    width: 120,
    borderRadius: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    height: 20,
    width: 200,
    borderRadius: 4,
  },
  storyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  storyCardImage: {
    position: 'relative',
    height: 200,
  },
  storyCardCover: {
    width: '100%',
    height: '100%',
  },
  storyCardOverlay: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  storyCardBadge: {
    width: 40,
    height: 20,
    borderRadius: 10,
    padding: 2,
  },
  storyCardContent: {
    padding: 16,
  },
  storyCardTitle: {
    marginBottom: 8,
  },
  storyCardTitleText: {
    height: 20,
    width: '80%',
    borderRadius: 4,
  },
  storyCardTitleLine: {
    height: 12,
    width: '40%',
    borderRadius: 4,
    marginTop: 8,
  },
  storyCardAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storyCardAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  storyCardAuthorText: {
    height: 16,
    width: 100,
    borderRadius: 4,
  },
  storyCardExcerpt: {
    flex: 1,
  },
  storyCardExcerptText: {
    height: 14,
    width: '100%',
    borderRadius: 4,
    marginBottom: 6,
  },
  storyCardExcerptLine: {
    height: 14,
    width: '60%',
    borderRadius: 4,
    marginTop: 6,
  },
  storyListContainer: {
    paddingHorizontal: 0,
  },
});

export default VirtualizedList;
