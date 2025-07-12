import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { Trophy, Medal, Star, MapPin, TrendingUp, Users } from 'lucide-react-native';

import { onAuthStateChange, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';

interface LeaderboardUser {
  id: string;
  name: string;
  avatar: string;
  score: number;
  posts: number;
  followers: number;
  badge: string;
  location: string;
  trend: 'up' | 'down' | 'stable';
}

const mockLeaderboard: LeaderboardUser[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=400',
    score: 2847,
    posts: 156,
    followers: 3420,
    badge: 'Eco-Traveler',
    location: 'Mumbai, Maharashtra',
    trend: 'up',
  },
  {
    id: '2',
    name: 'Rahul Patel',
    avatar: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=400',
    score: 2634,
    posts: 142,
    followers: 2890,
    badge: 'Local Guide',
    location: 'Bengaluru, Karnataka',
    trend: 'up',
  },
  {
    id: '3',
    name: 'Anita Desai',
    avatar: 'https://images.pexels.com/photos/1102341/pexels-photo-1102341.jpeg?auto=compress&cs=tinysrgb&w=400',
    score: 2456,
    posts: 89,
    followers: 4120,
    badge: 'Foodie',
    location: 'Delhi, India',
    trend: 'stable',
  },
  {
    id: '4',
    name: 'Vikram Singh',
    avatar: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=400',
    score: 2298,
    posts: 234,
    followers: 1890,
    badge: 'Adventure Seeker',
    location: 'Jaipur, Rajasthan',
    trend: 'down',
  },
  {
    id: '5',
    name: 'Kavya Nair',
    avatar: 'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=400',
    score: 2156,
    posts: 98,
    followers: 2340,
    badge: 'Cultural Explorer',
    location: 'Kochi, Kerala',
    trend: 'up',
  },
];

const timeframes = ['This Week', 'This Month', 'All Time'];
const categories = ['Overall', 'Posts', 'Reviews', 'Followers'];

export default function LeaderboardScreen() {
  const [selectedTimeframe, setSelectedTimeframe] = useState('This Week');
  const [selectedCategory, setSelectedCategory] = useState('Overall');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankIcon = (position: number) => {
    if (position === 1) return <Trophy size={24} color="#F59E0B" />;
    if (position === 2) return <Medal size={24} color="#6B7280" />;
    if (position === 3) return <Medal size={24} color="#CD7C2F" />;
    return <Text style={styles.rankNumber}>{position}</Text>;
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    if (trend === 'up') return <TrendingUp size={16} color="#22C55E" />;
    if (trend === 'down') return <TrendingUp size={16} color="#EF4444" style={{ transform: [{ rotate: '180deg' }] }} />;
    return <View style={styles.stableTrend} />;
  };

  const renderTopThree = () => (
    <View style={styles.topThreeContainer}>
      {/* Second Place */}
      <View style={styles.secondPlace}>
        <Image source={{ uri: mockLeaderboard[1].avatar }} style={styles.topAvatar} />
        <View style={styles.silverCrown}>
          <Medal size={20} color="#6B7280" />
        </View>
        <Text style={styles.topName}>{mockLeaderboard[1].name}</Text>
        <Text style={styles.topScore}>{mockLeaderboard[1].score}</Text>
      </View>

      {/* First Place */}
      <View style={styles.firstPlace}>
        <Image source={{ uri: mockLeaderboard[0].avatar }} style={styles.topAvatarLarge} />
        <View style={styles.goldCrown}>
          <Trophy size={24} color="#F59E0B" />
        </View>
        <Text style={styles.topNameLarge}>{mockLeaderboard[0].name}</Text>
        <Text style={styles.topScoreLarge}>{mockLeaderboard[0].score}</Text>
      </View>

      {/* Third Place */}
      <View style={styles.thirdPlace}>
        <Image source={{ uri: mockLeaderboard[2].avatar }} style={styles.topAvatar} />
        <View style={styles.bronzeCrown}>
          <Medal size={20} color="#CD7C2F" />
        </View>
        <Text style={styles.topName}>{mockLeaderboard[2].name}</Text>
        <Text style={styles.topScore}>{mockLeaderboard[2].score}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Top Village Explorers</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
          <Text style={styles.headerSubtitle}>Top Village Explorers</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Please log in</Text>
          <Text style={styles.emptyStateText}>
            Log in to see the leaderboard
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderLeaderboardItem = (user: LeaderboardUser, index: number) => (
    <TouchableOpacity key={user.id} style={styles.leaderboardItem}>
      <View style={styles.rankContainer}>
        {getRankIcon(index + 1)}
      </View>
      
      <Image source={{ uri: user.avatar }} style={styles.avatar} />
      
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{user.name}</Text>
          {getTrendIcon(user.trend)}
        </View>
        
        <View style={styles.locationRow}>
          <MapPin size={12} color="#6B7280" />
          <Text style={styles.location}>{user.location}</Text>
        </View>
        
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{user.badge}</Text>
        </View>
      </View>
      
      <View style={styles.stats}>
        <Text style={styles.score}>{user.score}</Text>
        <Text style={styles.scoreLabel}>points</Text>
        
        <View style={styles.miniStats}>
          <View style={styles.miniStat}>
            <Star size={12} color="#F59E0B" />
            <Text style={styles.miniStatText}>{user.posts}</Text>
          </View>
          <View style={styles.miniStat}>
            <Users size={12} color="#6B7280" />
            <Text style={styles.miniStatText}>{user.followers}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🏆 Leaderboard</Text>
        <Text style={styles.headerSubtitle}>Top Village Explorers</Text>
      </View>

      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        >
          {timeframes.map((timeframe) => (
            <TouchableOpacity
              key={timeframe}
              style={[
                styles.filterButton,
                selectedTimeframe === timeframe && styles.selectedFilterButton,
              ]}
              onPress={() => setSelectedTimeframe(timeframe)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  selectedTimeframe === timeframe && styles.selectedFilterButtonText,
                ]}
              >
                {timeframe}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderTopThree()}
        
        <View style={styles.leaderboardContainer}>
          <Text style={styles.sectionTitle}>Full Rankings</Text>
          {mockLeaderboard.map(renderLeaderboardItem)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  selectedFilterButton: {
    backgroundColor: '#22C55E',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedFilterButtonText: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 30,
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  firstPlace: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  secondPlace: {
    alignItems: 'center',
    marginBottom: 20,
  },
  thirdPlace: {
    alignItems: 'center',
    marginBottom: 20,
  },
  topAvatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  topAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  goldCrown: {
    position: 'absolute',
    top: -10,
    backgroundColor: '#FEF3C7',
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#F59E0B',
  },
  silverCrown: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#F3F4F6',
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#6B7280',
  },
  bronzeCrown: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#FEF3C7',
    padding: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CD7C2F',
  },
  topNameLarge: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 15,
  },
  topName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  topScoreLarge: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F59E0B',
    marginTop: 4,
  },
  topScore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 4,
  },
  leaderboardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 15,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 15,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  badge: {
    marginTop: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    color: '#22C55E',
    fontWeight: '600',
  },
  stats: {
    alignItems: 'center',
  },
  score: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  miniStats: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  miniStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  miniStatText: {
    fontSize: 12,
    color: '#6B7280',
  },
  stableTrend: {
    width: 16,
    height: 2,
    backgroundColor: '#9CA3AF',
    borderRadius: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});