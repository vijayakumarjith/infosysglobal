import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { Settings, MapPin, Star, Users, Heart, CreditCard as Edit, Camera, Save, X } from 'lucide-react-native';
import { auth, getUserProfile, updateUserProfile, getPosts, Post, UserProfile } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editProfile, setEditProfile] = useState<Partial<UserProfile>>({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      
      // Load user profile
      const userProfile = await getUserProfile(auth.currentUser.uid);
      if (userProfile) {
        setProfile(userProfile);
        setEditProfile(userProfile);
      } else {
        // Create new profile if doesn't exist
        const newProfile: Partial<UserProfile> = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email || '',
          displayName: auth.currentUser.displayName || '',
          createdAt: new Date(),
          postsCount: 0,
          followersCount: 0,
          followingCount: 0,
        };
        setEditProfile(newProfile);
        setEditMode(true);
      }

      // Load user posts
      const allPosts = await getPosts();
      const myPosts = allPosts.filter(post => post.userId === auth.currentUser?.uid);
      setUserPosts(myPosts);
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      const result = await updateUserProfile(auth.currentUser.uid, editProfile);
      
      if (result.success) {
        setProfile({ ...profile, ...editProfile } as UserProfile);
        setEditMode(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        Alert.alert('Error', result.error || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setEditProfile({
          ...editProfile,
          photoURL: result.assets[0].uri,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].city}, ${address[0].region}`;
        setEditProfile({
          ...editProfile,
          location: locationString,
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const renderEditProfile = () => (
    <Modal visible={editMode} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setEditMode(false)}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSaveProfile} disabled={loading}>
            <Save size={24} color="#22C55E" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Profile Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity style={styles.avatarContainer} onPress={handleImagePicker}>
              {editProfile.photoURL ? (
                <Image source={{ uri: editProfile.photoURL }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Camera size={32} color="#6B7280" />
                </View>
              )}
              <View style={styles.cameraButton}>
                <Camera size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* Form Fields */}
          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Display Name</Text>
              <TextInput
                style={styles.input}
                value={editProfile.displayName || ''}
                onChangeText={(text) => setEditProfile({ ...editProfile, displayName: text })}
                placeholder="Enter your name"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editProfile.bio || ''}
                onChangeText={(text) => setEditProfile({ ...editProfile, bio: text })}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Location</Text>
              <View style={styles.locationRow}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={editProfile.location || ''}
                  onChangeText={(text) => setEditProfile({ ...editProfile, location: text })}
                  placeholder="Enter your location"
                />
                <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                  <MapPin size={20} color="#22C55E" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderUserPosts = () => (
    <View style={styles.postsGrid}>
      {userPosts.map((post) => (
        <TouchableOpacity key={post.id} style={styles.postThumbnail}>
          {post.images && post.images.length > 0 ? (
            <Image source={{ uri: post.images[0] }} style={styles.postImage} />
          ) : (
            <View style={styles.placeholderImage}>
              <Camera size={24} color="#9CA3AF" />
            </View>
          )}
          <View style={styles.postOverlay}>
            <View style={styles.postStats}>
              <View style={styles.postStat}>
                <Heart size={12} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.postStatText}>{post.likesCount}</Text>
              </View>
              <View style={styles.postRating}>
                {Array.from({ length: post.rating }, (_, i) => (
                  <Star key={i} size={10} color="#F59E0B" fill="#F59E0B" />
                ))}
              </View>
            </View>
            <Text style={styles.postLocation} numberOfLines={1}>{post.location}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity style={styles.settingsButton} onPress={() => setEditMode(true)}>
          <Settings size={24} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileSection}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              {profile?.photoURL ? (
                <Image source={{ uri: profile.photoURL }} style={styles.profileAvatar} />
              ) : (
                <View style={styles.profileAvatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {profile?.displayName?.charAt(0)?.toUpperCase() || 
                     profile?.email?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>
                {profile?.displayName || 'Set your name'}
              </Text>
              <Text style={styles.profileEmail}>{profile?.email}</Text>
              {profile?.location && (
                <View style={styles.locationRow}>
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.profileLocation}>{profile.location}</Text>
                </View>
              )}
            </View>
          </View>

          {profile?.bio && (
            <Text style={styles.profileBio}>{profile.bio}</Text>
          )}

          <TouchableOpacity style={styles.editButton} onPress={() => setEditMode(true)}>
            <Edit size={16} color="#22C55E" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{userPosts.length}</Text>
              <Text style={styles.statLabel}>Posts</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{profile?.followersCount || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{profile?.followingCount || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>
        </View>

        {/* Posts Section */}
        <View style={styles.postsSection}>
          <Text style={styles.sectionTitle}>My Posts</Text>
          {userPosts.length === 0 ? (
            <View style={styles.emptyState}>
              <Camera size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateTitle}>No posts yet</Text>
              <Text style={styles.emptyStateText}>Share your first discovery!</Text>
            </View>
          ) : (
            renderUserPosts()
          )}
        </View>
      </ScrollView>

      {renderEditProfile()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  settingsButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    marginBottom: 10,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 15,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#22C55E',
  },
  profileAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileLocation: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  profileBio: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 15,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#22C55E',
    marginBottom: 20,
    gap: 8,
  },
  editButtonText: {
    color: '#22C55E',
    fontWeight: '600',
    fontSize: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  postsSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  postsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  postThumbnail: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
  },
  postStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  postStatText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  postRating: {
    flexDirection: 'row',
    gap: 1,
  },
  postLocation: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#22C55E',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#22C55E',
    borderRadius: 16,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  formSection: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  locationButton: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#22C55E',
    borderRadius: 12,
    padding: 12,
  },
});