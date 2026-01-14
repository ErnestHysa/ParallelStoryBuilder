# Performance Optimization System

This document describes the performance optimization system implemented for Parallel Story Builder, including caching, virtualization, and image optimization.

## Architecture Overview

### Core Components

1. **Cache Manager** (`lib/cacheManager.ts`)
   - Intelligent caching layer with TTL and size-based eviction
   - Memory pressure monitoring
   - LRU cache implementation

2. **Query Cache** (`lib/queryCache.ts`)
   - React Query-like cache for Supabase queries
   - Stale-while-revalidate strategy
   - Automatic refetching on network events

3. **Image Optimizer** (`lib/imageOptimizer.ts`)
   - WebP conversion
   - Responsive image generation
   - Thumbnail creation

4. **Virtualized Components** (`components/VirtualizedList.tsx`)
   - FlashList-based virtualization
   - Specialized grids and story lists
   - Memory-efficient rendering

5. **Lazy Loading** (`components/LazyImage.tsx`)
   - Progressive image loading
   - Blur hash placeholders
   - Error handling

6. **React Hooks** (`hooks/useCache.ts`)
   - Cache integration with React
   - Debounced updates
   - Optimistic updates

## Usage Guide

### Cache Manager

```typescript
import { cacheManager } from '@/lib/cacheManager';

// Basic usage
cacheManager.set('user:123', userData, { ttl: 5 * 60 * 1000 });
const user = cacheManager.get('user:123');

// Prefetching
cacheManager.prefetch(/story:.*/, storyIds, fetchStory);

// Batch operations
cacheManager.batchSet([
  { key: 'story:1', data: storyData1 },
  { key: 'story:2', data: storyData2 }
]);
```

### Query Cache

```typescript
import { queryCache } from '@/lib/queryCache';

// Fetch with caching
const result = await queryCache.fetch(
  ['stories', userId],
  fetchStories,
  { staleTime: 5 * 60 * 1000 }
);

// Invalidate cache
queryCache.invalidateQuery(['stories', userId]);
```

### Image Optimization

```typescript
import { ImageUtils } from '@/lib/imageOptimizer';

// For social media
const optimizedUrl = ImageUtils.forSocial(uri, 'instagram');

// For gallery
const galleryUrl = ImageUtils.forGallery(uri, 2);

// Custom optimization
const customUrl = generateOptimizedUrl(uri, {
  width: 400,
  height: 300,
  quality: 80,
  format: 'webp'
});
```

### Virtualized Lists

```typescript
import { VirtualizedList } from '@/components/VirtualizedList';

// Basic list
<VirtualizedList
  data={stories}
  renderItem={({ item, index }) => <StoryCard story={item} />}
  keyExtractor={item => item.id}
  estimatedItemSize={200}
  onEndReached={handleLoadMore}
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
/>

// Image grid
<VirtualizedImageGrid
  data={images}
  columns={2}
  onImagePress={handleImagePress}
/>

// Story list
<VirtualizedStoryList
  data={stories}
  onStoryPress={handleStoryPress}
/>
```

### Lazy Images

```typescript
import { LazyImage, OptimizedImage } from '@/components/LazyImage';

// Basic lazy loading
<LazyImage
  source={{ uri: imageUrl }}
  style={styles.image}
  width={200}
  height={200}
  borderRadius={8}
  blurHash="blurhash_string"
/>

// Optimized with WebP
<OptimizedImage
  source={{ uri: imageUrl }}
  quality={80}
  format="webp"
  maxWidth={400}
  style={styles.image}
/>
```

### Cache Hooks

```typescript
// Basic cache hook
const { data, set, isStale } = useCache('user:123');

// Debounced updates
const { data, set } = useDebouncedCache('stories', 500);

// Optimistic updates
const { updateOptimistically, confirm, revert } = useOptimisticCache('story:123');

// Persistent storage
const { data, set } = usePersistentCache('userPreferences');
```

## Integration with Stories Store

The `storiesStore.ts` has been updated to use the cache system:

- **fetchStories**: Uses cache with 5-minute stale time
- **fetchStory**: Uses cache with 10-minute stale time
- **fetchLatestChapter**: Uses cache with 2-minute stale time
- **Automatic cache invalidation** on real-time updates

### Cache Keys

- Stories: `stories:${userId}`
- Story: `story:${storyId}`
- Latest Chapter: `chapter:${storyId}:latest`

### Performance Metrics

- Cache hit ratio: Improved by using TTL-based caching
- Memory usage: Monitored and cleaned under pressure
- Network requests: Reduced through prefetching
- Rendering performance: Optimized through virtualization

## Best Practices

1. **Cache Strategy**
   - Use appropriate TTL values based on data freshness
   - Invalidate cache on data mutations
   - Use prefetching for likely-next data

2. **Image Optimization**
   - Always specify dimensions
   - Use WebP for better compression
   - Implement lazy loading
   - Provide blur placeholders

3. **List Virtualization**
   - Use estimatedItemSize for smooth scrolling
   - Implement onEndReached for infinite lists
   - Use appropriate windowSize for memory efficiency

4. **Memory Management**
   - Monitor memory pressure
   - Clean up unused caches
   - Use size-based eviction

## Troubleshooting

### Common Issues

1. **Cache not updating**
   - Check cache invalidation logic
   - Verify cache keys are correct
   - Ensure TTL settings are appropriate

2. **Memory warnings**
   - Reduce cache sizes
   - Implement more aggressive cleanup
   - Use size-based eviction

3. **Image loading issues**
   - Verify image URLs are accessible
   - Check blur hash format
   - Ensure network connectivity

### Debug Tools

- Use `cacheManager.getStats()` for cache statistics
- Monitor memory usage in development
- Use React DevTools for performance profiling

## Future Enhancements

1. **Background Sync**
   - Sync cache with server when online
   - Conflict resolution strategies
   - Offline-first caching

2. **Advanced Analytics**
   - Cache hit/miss tracking
   - Performance metrics dashboard
   - User behavior analytics

3. **AI Optimization**
   - Predictive prefetching
   - Dynamic quality adjustment
   - Smart cache eviction

## Migration Guide

### From Direct Supabase Calls

1. Replace direct `supabase.from(...).select()` with query cache
2. Add cache keys and TTL values
3. Implement cache invalidation
4. Add prefetching for better UX

### From FlatList to FlashList

1. Replace `FlatList` with `VirtualizedList`
2. Add `estimatedItemSize` for better performance
3. Implement custom renderers for specialized lists
4. Use specialized components for grids

## Dependencies

The following packages are required:

```json
{
  "dependencies": {
    "lru-cache": "^9.1.1",
    "@shopify/flash-list": "^1.6.3",
    "expo-image": "^1.12.11"
  }
}
```

## Conclusion

The performance optimization system provides a comprehensive solution for:

- **Caching**: Intelligent caching with multiple strategies
- **Image Optimization**: Responsive and optimized images
- **Virtualization**: Memory-efficient list rendering
- **Real-time Updates**: Proper cache synchronization
- **Memory Management**: Automatic cleanup and monitoring

This system significantly improves app performance, especially for large datasets and complex UI components.