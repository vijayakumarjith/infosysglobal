import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  Animated,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Heart, MessageCircle, Share, MapPin, Star, Bookmark } from 'lucide-react-native';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { PostSkeleton } from '@/components/SkeletonLoader';
import { getPosts, Post, onAuthStateChange, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');

export default function FeedScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [userLocation, setUserLocation] = useState<string>('');
  const fadeAnim = new Animated.Value(0);

  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChange((authUser) => {
      console.log('Auth state changed:', authUser ? 'User logged in' : 'User logged out');
      setUser(authUser);
      if (authUser) {
        loadPosts();
        getCurrentLocation();
      } else {
        setPosts([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].city || address[0].district}, ${address[0].region}`;
        setUserLocation(locationString);
        console.log('User location:', locationString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadPosts = async () => {
    if (!auth.currentUser) {
      console.log('No authenticated user, skipping post load');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Loading posts from Firebase for user:', auth.currentUser.uid);
      setLoading(true);
      
      const postsData = await getPosts();
      console.log('Posts loaded successfully:', postsData.length, 'posts found');
      
      if (postsData.length > 0) {
        console.log('Sample post:', postsData[0]);
      }
      
      setPosts(postsData);
      
      // Animate posts in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
      
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    console.log('Refreshing posts...');
    setRefreshing(true);
    loadPosts();
  };

  const toggleLike = async (postId: string) => {
    console.log('Toggling like for post:', postId);
    // Update local state immediately for better UX
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likesCount: post.likesCount + 1 }
        : post
    ));
    // TODO: Implement actual like functionality with Firebase
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={14}
        color={index < rating ? '#F59E0B' : '#D1D5DB'}
        fill={index < rating ? '#F59E0B' : 'none'}
      />
    ));
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = (post: Post, index: number) => (
    <Animated.View
      key={post.id}
      style={[
        styles.postCard,
        {
          opacity: fadeAnim,
          transform: [{
            translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          }],
        },
      ]}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            {post.userPhoto ? (
              <Image source={{ uri: post.userPhoto }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {post.userName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{post.userName || 'Anonymous User'}</Text>
            <View style={styles.locationRow}>
              <MapPin size={12} color="#6B7280" />
              <Text style={styles.location}>{post.location}</Text>
              {userLocation && post.location.toLowerCase().includes(userLocation.toLowerCase()) && (
                <View style={styles.nearbyBadge}>
                  <Text style={styles.nearbyText}>Near you</Text>
                </View>
              )}
            </View>
          </View>
        </View>
        <Text style={styles.timestamp}>
          {formatTimeAgo(post.createdAt)}
        </Text>
      </View>

      {post.images && post.images.length > 0 && (
        <ScrollView 
          horizontal 
          pagingEnabled 
          showsHorizontalScrollIndicator={false}
          style={styles.imageContainer}
        >
          {post.images.map((image: string, imageIndex: number) => (
            <Image 
              key={imageIndex} 
              source={{ uri: image }} 
              style={styles.postImage} 
            />
          ))}
        </ScrollView>
      )}

      <View style={styles.postContent}>
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {renderStars(post.rating)}
          </View>
          <View style={styles.categoryTag}>
            <Text style={styles.categoryText}>{post.category}</Text>
          </View>
        </View>
        
        <Text style={styles.caption}>{post.caption}</Text>

        <View style={styles.postActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => toggleLike(post.id)}
          >
            <Heart size={20} color="#6B7280" />
            <Text style={styles.actionText}>{post.likesCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={20} color="#6B7280" />
            <Text style={styles.actionText}>{post.commentsCount}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Share size={20} color="#6B7280" />
            <Text style={styles.actionText}>Share</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Bookmark size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌾 V.E.D.A.</Text>
          <Text style={styles.headerSubtitle}>Village Exploration & Discovery App</Text>
        </View>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🌾 V.E.D.A.</Text>
          <Text style={styles.headerSubtitle}>Village Exploration & Discovery App</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Please log in</Text>
          <Text style={styles.emptyStateText}>
            Log in to see posts from the community
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🌾 V.E.D.A.</Text>
        <Text style={styles.headerSubtitle}>
          {userLocation ? `Welcome from ${userLocation}` : 'Village Exploration & Discovery App'}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {posts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No posts yet!</Text>
            <Text style={styles.emptyStateText}>
              Be the first to share your rural India experience
            </Text>
          </View>
        ) : (
          <>
            <Text style={styles.postsCount}>
              Showing {posts.length} posts from the community
            </Text>
            {posts.map(renderPost)}
          </>
        )}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  postsCount: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: '500',
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
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
  },
  nearbyBadge: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  nearbyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  imageContainer: {
    height: 250,
  },
  postImage: {
    width: width - 30,
    height: 250,
    resizeMode: 'cover',
  },
  postContent: {
    padding: 15,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stars: {
    flexDirection: 'row',
    gap: 2,
  },
  categoryTag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 14,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  caption: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 15,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
});