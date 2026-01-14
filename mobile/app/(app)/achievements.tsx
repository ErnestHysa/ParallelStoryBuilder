import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  SectionList,
  Animated
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../stores/authStore';
import { useGamificationStore } from '../../stores/gamificationStore';
import { useTokenStore } from '../../stores/tokenStore';
import AchievementBadge from '../../components/AchievementBadge';

const AchievementsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthStore();
  const { achievements, fetchAchievements, streak } = useGamificationStore();
  const { balance } = useTokenStore();

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const refreshData = async () => {
    await fetchAchievements();
  };

  const groupedAchievements = achievements.reduce((groups, achievement) => {
    if (!groups[achievement.category]) {
      groups[achievement.category] = [];
    }
    groups[achievement.category].push(achievement);
    return groups;
  }, {} as Record<string, typeof achievements>);

  const categories = {
    writing: { title: 'Writing', icon: '✍️', color: '#E91E63' },
    social: { title: 'Social', icon: '👥', color: '#9C27B0' },
    exploration: { title: 'Exploration', icon: '🔍', color: '#2196F3' },
    special: { title: 'Special', icon: '⭐', color: '#FF9800' },
  };

  const renderSectionHeader = ({ section }: { section: { title: string } }) => {
    const category = categories[section.title as keyof typeof categories];
    return (
      <View style={[
        styles.sectionHeader,
        { backgroundColor: '#FFFFFF' }
      ]}>
        <Text style={[
          styles.sectionTitle,
          { color: category?.color || '#000000' }
        ]}>
          {category?.icon} {category?.title}
        </Text>
        <Text style={styles.sectionCount}>
          {groupedAchievements[section.title]?.length || 0} achievements
        </Text>
      </View>
    );
  };

  const renderAchievement = ({ item }: { item: any }) => (
    <View key={item.id}>
      <AchievementBadge
        achievement={item}
        size="medium"
        onPress={() => {
          // Could navigate to achievement details
        }}
      />
    </View>
  );

  const renderEmptyCategory = () => (
    <View style={styles.emptyCategory}>
      <Text style={styles.emptyCategoryText}>
        No achievements in this category yet
      </Text>
    </View>
  );

  const unlockedCount = achievements.filter(a => a.unlocked_at).length;
  const totalCount = achievements.length;
  const progressPercentage = totalCount > 0 ? (unlockedCount / totalCount) * 100 : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#FAFAFA' }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refreshData}
            tintColor="#E91E63"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: '#000000' }]}>
              Achievements
            </Text>
          </View>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.statValue, { color: '#E91E63' }]}>
                {unlockedCount}/{totalCount}
              </Text>
              <Text style={[styles.statLabel, { color: '#757575' }]}>
                Unlocked
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>
                {balance}
              </Text>
              <Text style={[styles.statLabel, { color: '#757575' }]}>
                Tokens
              </Text>
            </View>

            <View style={[styles.statCard, { backgroundColor: '#FFFFFF' }]}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                {streak.current}
              </Text>
              <Text style={[styles.statLabel, { color: '#757575' }]}>
                Day Streak
              </Text>
            </View>
          </View>

          {/* Progress Overview */}
          <View style={[styles.progressOverview, { backgroundColor: '#FFFFFF' }]}>
            <Text style={[styles.progressTitle, { color: '#000000' }]}>
              Progress Overview
            </Text>

            <View style={styles.progressBarContainer}>
              <View style={[
                styles.progressBar,
                { width: `${progressPercentage}%`, backgroundColor: '#E91E63' }
              ]} />
            </View>

            <Text style={[
              styles.progressText,
              { color: '#757575' }
            ]}>
              {Math.round(progressPercentage)}% Complete
            </Text>
          </View>
        </View>

        {/* Achievements Grid */}
        <View style={styles.achievementsContainer}>
          <SectionList
            sections={Object.entries(groupedAchievements).map(([key, value]) => ({
              title: key,
              data: value,
            }))}
            renderSectionHeader={renderSectionHeader}
            renderItem={renderAchievement}
            renderSectionFooter={() => <View style={styles.sectionFooter} />}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <View>
                <View style={[styles.emptyContainer, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={[styles.emptyText, { color: '#757575' }]}>
                    No achievements unlocked yet.
                  </Text>
                  <Text style={[styles.emptySubtext, { color: '#9E9E9E' }]}>
                    Start writing stories to earn achievements!
                  </Text>
                </View>
              </View>
            }
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <View>
            <Text style={[styles.footerText, { color: '#757575' }]}>
              Keep exploring, writing, and collaborating to unlock more achievements!
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 5,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  progressOverview: {
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  achievementsContainer: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginHorizontal: -20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionCount: {
    fontSize: 14,
    opacity: 0.7,
  },
  sectionFooter: {
    height: 20,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    borderRadius: 12,
    marginVertical: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  emptyCategory: {
    padding: 20,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default AchievementsScreen;