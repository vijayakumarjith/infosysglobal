import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Image,
  Dimensions,
} from 'react-native';
import { getPosts, Post, onAuthStateChange, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import * as Location from 'expo-location';
import { Search, Filter, Camera, Heart, MapPin, Star } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const categories = ['All', 'Nature', 'Homestay', 'Food', 'Cultural', 'Adventure', 'Market'];


export default function ExploreScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [userLocation, setUserLocation] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      if (authUser) {
        loadPosts();
        getCurrentLocation();
      } else {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedCategory, userLocation]);

  const loadPosts = async () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }
    
    try {
      const postsData = await getPosts();
      setPosts(postsData);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };
  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
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
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const filterPosts = () => {
    let filtered = posts;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(post => 
        post.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.caption.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(post => post.category === selectedCategory);
    }

    // Sort by proximity to user location if available
    if (userLocation) {
      filtered = filtered.sort((a, b) => {
        const aIsNearby = a.location.toLowerCase().includes(userLocation.toLowerCase());
        const bIsNearby = b.location.toLowerCase().includes(userLocation.toLowerCase());
        
        if (aIsNearby && !bIsNearby) return -1;
        if (!aIsNearby && bIsNearby) return 1;
        return 0;
      });
    }

    setFilteredPosts(filtered);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        size={12}
        color={index < Math.floor(rating) ? '#F59E0B' : '#D1D5DB'}
        fill={index < Math.floor(rating) ? '#F59E0B' : 'none'}
      />
    ));
  };

  const renderPostCard = (post: Post) => (
    <TouchableOpacity key={post.id} style={styles.postCard}>
      <View style={styles.imageContainer}>
        {post.images && post.images.length > 0 ? (
          <Image source={{ uri: post.images[0] }} style={styles.postImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <Camera size={32} color="#9CA3AF" />
          </View>
        )}
        <TouchableOpacity style={styles.favoriteButton}>
          <Heart size={18} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{post.category}</Text>
        </View>
        {userLocation && post.location.toLowerCase().includes(userLocation.toLowerCase()) && (
          <View style={styles.nearbyBadge}>
            <Text style={styles.nearbyText}>Nearby</Text>
          </View>
        )}
      </View>
      
      <View style={styles.postInfo}>
        <Text style={styles.postTitle}>{post.userName}</Text>
        <View style={styles.locationRow}>
          <MapPin size={12} color="#6B7280" />
          <Text style={styles.locationText}>{post.location}</Text>
        </View>
        
        <View style={styles.ratingRow}>
          <View style={styles.stars}>
            {renderStars(post.rating)}
          </View>
          <Text style={styles.ratingText}>{post.rating}/5</Text>
          <Text style={styles.reviewsText}>({post.likesCount} likes)</Text>
        </View>
        
        <Text style={styles.caption} numberOfLines={2}>
          {post.caption}
        </Text>

        <View style={styles.postActions}>
          <TouchableOpacity style={styles.actionButton}>
            <Camera size={16} color="#22C55E" />
            <Text style={styles.actionButtonText}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <MapPin size={16} color="#3B82F6" />
            <Text style={styles.actionButtonText}>Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔍 Explore</Text>
          <Text style={styles.headerSubtitle}>Discover amazing experiences</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Loading posts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🔍 Explore</Text>
          <Text style={styles.headerSubtitle}>Discover amazing experiences</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Please log in</Text>
          <Text style={styles.emptyStateText}>
            Log in to explore posts in your area
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🔍 Explore</Text>
        <Text style={styles.headerSubtitle}>
          {userLocation ? `Near ${userLocation}` : 'Discover amazing experiences'}
        </Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6B7280" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search posts, experiences..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryButton,
                selectedCategory === category && styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text
                style={[
                  styles.categoryButtonText,
                  selectedCategory === category && styles.selectedCategoryButtonText,
                ]}
              >
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.postsContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.postsContent}
      >
        {filteredPosts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No posts found</Text>
            <Text style={styles.emptyStateText}>
              Try adjusting your search or explore different categories
            </Text>
          </View>
        ) : (
          filteredPosts.map(renderPostCard)
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterButton: {
    padding: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesList: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  selectedCategoryButton: {
    backgroundColor: '#22C55E',
  },
  categoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  selectedCategoryButtonText: {
    color: '#FFFFFF',
  },
  postsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  postsContent: {
    paddingBottom: 20,
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
    marginBottom: 15,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: 8,
    borderRadius: 12,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nearbyBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  nearbyText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  postInfo: {
    padding: 16,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 6,
  },
  stars: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '600',
  },
  reviewsText: {
    fontSize: 14,
    color: '#6B7280',
  },
  caption: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  postActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});