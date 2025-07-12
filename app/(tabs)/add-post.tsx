import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { Camera, MapPin, Star, X, Plus } from 'lucide-react-native';
import { auth, createPost } from '@/lib/firebase';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');
const categories = ['Homestay', 'Food', 'Market', 'Nature Spot', 'Activity', 'Cultural'];

export default function AddPostScreen() {
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleImagePicker = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5 - selectedImages.length,
        quality: 0.8,
      });

      if (!result.canceled) {
        const newImages = result.assets.map(asset => asset.uri);
        setSelectedImages([...selectedImages, ...newImages]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const handleCameraCapture = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedImages([...selectedImages, result.assets[0].uri]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions to tag your location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].city || address[0].district || address[0].subregion}, ${address[0].region || address[0].country}`;
        setLocation(locationString);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current location');
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(selectedImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!selectedImages.length || !caption || !location || !selectedCategory || rating === 0) {
      Alert.alert('Error', 'Please fill in all fields and select at least one image');
      return;
    }

    if (!auth.currentUser) {
      Alert.alert('Error', 'You must be logged in to create a post');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const postData = {
        userId: auth.currentUser.uid,
        userName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'Anonymous',
        userPhoto: auth.currentUser.photoURL,
        caption,
        images: selectedImages,
        location,
        category: selectedCategory,
        rating,
        likesCount: 0,
        commentsCount: 0,
      };

      const result = await createPost(postData);
      
      if (result.success) {
        Alert.alert('Success', 'Your discovery has been shared!', [
          { text: 'OK', onPress: () => {
            setSelectedImages([]);
            setCaption('');
            setLocation('');
            setSelectedCategory('');
            setRating(0);
          }}
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to create post');
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => (
      <TouchableOpacity
        key={index}
        onPress={() => setRating(index + 1)}
        style={styles.starButton}
      >
        <Star
          size={28}
          color={index < rating ? '#F59E0B' : '#D1D5DB'}
          fill={index < rating ? '#F59E0B' : 'none'}
        />
      </TouchableOpacity>
    ));
  };

  if (isSubmitting) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LoadingSpinner />
        <Text style={styles.loadingText}>Sharing your discovery...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Share Your Discovery</Text>
        <TouchableOpacity
          style={[styles.submitButton, (!selectedImages.length || !caption || !location || !selectedCategory || rating === 0) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!selectedImages.length || !caption || !location || !selectedCategory || rating === 0}
        >
          <Text style={styles.submitButtonText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Image Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos *</Text>
            <View style={styles.imageContainer}>
              <TouchableOpacity style={styles.addImageButton} onPress={handleImagePicker}>
                <Plus size={24} color="#6B7280" />
                <Text style={styles.addImageText}>Gallery</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addImageButton} onPress={handleCameraCapture}>
                <Camera size={24} color="#6B7280" />
                <Text style={styles.addImageText}>Camera</Text>
              </TouchableOpacity>
            </View>
            
            {selectedImages.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedImagesContainer}>
                {selectedImages.map((image, index) => (
                  <View key={index} style={styles.selectedImage}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <TouchableOpacity
                      style={styles.removeImageButton}
                      onPress={() => removeImage(index)}
                    >
                      <X size={16} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location *</Text>
            <View style={styles.locationInput}>
              <TextInput
                style={styles.locationText}
                placeholder="Add location"
                value={location}
                onChangeText={setLocation}
                placeholderTextColor="#9CA3AF"
              />
              <TouchableOpacity style={styles.locationButton} onPress={getCurrentLocation}>
                <MapPin size={20} color="#22C55E" />
                <Text style={styles.locationButtonText}>Current</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category *</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <TouchableOpacity
                  key={category}
                  style={[
                    styles.categoryChip,
                    selectedCategory === category && styles.selectedCategoryChip,
                  ]}
                  onPress={() => setSelectedCategory(category)}
                >
                  <Text
                    style={[
                      styles.categoryChipText,
                      selectedCategory === category && styles.selectedCategoryChipText,
                    ]}
                  >
                    {category}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rate Your Experience *</Text>
            <View style={styles.ratingContainer}>
              {renderStars()}
            </View>
            <Text style={styles.ratingText}>
              {rating > 0 ? `${rating}/5 stars` : 'Tap stars to rate'}
            </Text>
          </View>

          {/* Caption */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Share Your Story *</Text>
            <TextInput
              style={styles.captionInput}
              placeholder="Tell us about your experience... What made this place special?"
              value={caption}
              onChangeText={setCaption}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Tips for a Great Post</Text>
            <Text style={styles.tipsText}>• Share authentic experiences and honest reviews</Text>
            <Text style={styles.tipsText}>• Include helpful details for other travelers</Text>
            <Text style={styles.tipsText}>• Tag the exact location to help others find it</Text>
            <Text style={styles.tipsText}>• Use good lighting for better photos</Text>
          </View>
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  submitButton: {
    backgroundColor: '#22C55E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  addImageButton: {
    flex: 1,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  addImageText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    fontWeight: '500',
  },
  selectedImagesContainer: {
    marginTop: 12,
  },
  selectedImage: {
    position: 'relative',
    marginRight: 12,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#EF4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  locationButtonText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  selectedCategoryChip: {
    backgroundColor: '#22C55E',
    borderColor: '#22C55E',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedCategoryChipText: {
    color: '#FFFFFF',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  starButton: {
    padding: 4,
  },
  ratingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontWeight: '500',
  },
  captionInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontSize: 16,
    color: '#1F2937',
    minHeight: 100,
  },
  tipsContainer: {
    backgroundColor: '#F0F9FF',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 12,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0369A1',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 12,
    color: '#075985',
    lineHeight: 18,
    marginBottom: 2,
  },
});