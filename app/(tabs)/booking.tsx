import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Alert,
} from 'react-native';
import { MapPin, Car, Bus, Bike, Clock, DollarSign, Navigation } from 'lucide-react-native';
import { onAuthStateChange, auth } from '@/lib/firebase';
import { User } from 'firebase/auth';
import * as Location from 'expo-location';

const vehicleTypes = [
  { id: 'bike', name: 'Bike', icon: Bike, rate: 5, color: '#22C55E' },
  { id: 'car', name: 'Car', icon: Car, rate: 12, color: '#3B82F6' },
  { id: 'bus', name: 'Bus', icon: Bus, rate: 8, color: '#F59E0B' },
];

export default function BookingScreen() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('bike');
  const [distance, setDistance] = useState(0);
  const [estimatedFare, setEstimatedFare] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      if (authUser) {
        getCurrentLocation();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    calculateFare();
  }, [selectedVehicle, distance]);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant location permissions to auto-fill your location.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const address = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (address[0]) {
        const locationString = `${address[0].city || address[0].district}, ${address[0].region}`;
        setFromLocation(locationString);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const calculateFare = () => {
    if (distance > 0) {
      const vehicle = vehicleTypes.find(v => v.id === selectedVehicle);
      if (vehicle) {
        const fare = distance * vehicle.rate;
        setEstimatedFare(fare);
        
        // Calculate estimated time based on vehicle type
        let speed = 30; // default speed in km/h
        if (selectedVehicle === 'bike') speed = 40;
        if (selectedVehicle === 'car') speed = 50;
        if (selectedVehicle === 'bus') speed = 35;
        
        setEstimatedTime(Math.round((distance / speed) * 60)); // in minutes
      }
    }
  };

  const handleBooking = () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Error', 'Please enter both pickup and destination locations');
      return;
    }

    if (distance === 0) {
      Alert.alert('Error', 'Please calculate the distance first');
      return;
    }

    Alert.alert(
      'Booking Confirmed',
      `Your ${vehicleTypes.find(v => v.id === selectedVehicle)?.name} has been booked!\n\nFrom: ${fromLocation}\nTo: ${toLocation}\nDistance: ${distance} km\nFare: ₹${estimatedFare}\nEstimated Time: ${estimatedTime} minutes`,
      [{ text: 'OK' }]
    );
  };

  const simulateDistanceCalculation = () => {
    if (!fromLocation || !toLocation) {
      Alert.alert('Error', 'Please enter both locations');
      return;
    }

    // Simulate distance calculation (in real app, use Google Maps API)
    const randomDistance = Math.floor(Math.random() * 50) + 5; // 5-55 km
    setDistance(randomDistance);
    Alert.alert('Distance Calculated', `Distance: ${randomDistance} km`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🚗 Booking</Text>
          <Text style={styles.headerSubtitle}>Book your ride</Text>
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
          <Text style={styles.headerTitle}>🚗 Booking</Text>
          <Text style={styles.headerSubtitle}>Book your ride</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateTitle}>Please log in</Text>
          <Text style={styles.emptyStateText}>
            Log in to book rides to rural destinations
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 Booking</Text>
        <Text style={styles.headerSubtitle}>Book your ride to rural destinations</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Location Input Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trip Details</Text>
            
            <View style={styles.locationContainer}>
              <View style={styles.locationInputWrapper}>
                <View style={styles.locationIcon}>
                  <View style={styles.fromDot} />
                </View>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Pickup location"
                  value={fromLocation}
                  onChangeText={setFromLocation}
                  placeholderTextColor="#9CA3AF"
                />
                <TouchableOpacity 
                  style={styles.currentLocationButton}
                  onPress={getCurrentLocation}
                >
                  <Navigation size={16} color="#22C55E" />
                </TouchableOpacity>
              </View>

              <View style={styles.locationLine} />

              <View style={styles.locationInputWrapper}>
                <View style={styles.locationIcon}>
                  <MapPin size={16} color="#EF4444" />
                </View>
                <TextInput
                  style={styles.locationInput}
                  placeholder="Destination"
                  value={toLocation}
                  onChangeText={setToLocation}
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <TouchableOpacity 
              style={styles.calculateButton}
              onPress={simulateDistanceCalculation}
            >
              <Text style={styles.calculateButtonText}>Calculate Distance</Text>
            </TouchableOpacity>

            {distance > 0 && (
              <View style={styles.distanceInfo}>
                <Text style={styles.distanceText}>Distance: {distance} km</Text>
              </View>
            )}
          </View>

          {/* Vehicle Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose Vehicle</Text>
            <View style={styles.vehicleContainer}>
              {vehicleTypes.map((vehicle) => {
                const IconComponent = vehicle.icon;
                const isSelected = selectedVehicle === vehicle.id;
                
                return (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleCard,
                      isSelected && styles.selectedVehicleCard,
                      { borderColor: vehicle.color }
                    ]}
                    onPress={() => setSelectedVehicle(vehicle.id)}
                  >
                    <View style={[styles.vehicleIcon, { backgroundColor: vehicle.color }]}>
                      <IconComponent size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.vehicleName}>{vehicle.name}</Text>
                    <Text style={styles.vehicleRate}>₹{vehicle.rate}/km</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Fare Estimation */}
          {distance > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fare Estimation</Text>
              <View style={styles.fareCard}>
                <View style={styles.fareRow}>
                  <View style={styles.fareItem}>
                    <DollarSign size={20} color="#22C55E" />
                    <Text style={styles.fareLabel}>Estimated Fare</Text>
                    <Text style={styles.fareValue}>₹{estimatedFare}</Text>
                  </View>
                  <View style={styles.fareItem}>
                    <Clock size={20} color="#3B82F6" />
                    <Text style={styles.fareLabel}>Estimated Time</Text>
                    <Text style={styles.fareValue}>{estimatedTime} min</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Popular Destinations */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Rural Destinations</Text>
            <View style={styles.destinationsContainer}>
              {[
                'Manali, Himachal Pradesh',
                'Rishikesh, Uttarakhand',
                'Coorg, Karnataka',
                'Kutch, Gujarat',
                'Khurja, Uttar Pradesh',
                'Hampi, Karnataka'
              ].map((destination, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.destinationChip}
                  onPress={() => setToLocation(destination)}
                >
                  <MapPin size={14} color="#6B7280" />
                  <Text style={styles.destinationText}>{destination}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Book Button */}
          <TouchableOpacity 
            style={[
              styles.bookButton,
              (!fromLocation || !toLocation || distance === 0) && styles.bookButtonDisabled
            ]}
            onPress={handleBooking}
            disabled={!fromLocation || !toLocation || distance === 0}
          >
            <Text style={styles.bookButtonText}>
              Book {vehicleTypes.find(v => v.id === selectedVehicle)?.name}
              {estimatedFare > 0 && ` - ₹${estimatedFare}`}
            </Text>
          </TouchableOpacity>
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
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  locationContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  locationInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  locationIcon: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  fromDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
  },
  locationInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 8,
  },
  currentLocationButton: {
    padding: 8,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
  },
  locationLine: {
    width: 2,
    height: 20,
    backgroundColor: '#E5E7EB',
    marginLeft: 11,
    marginVertical: 4,
  },
  calculateButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  distanceInfo: {
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#22C55E',
  },
  vehicleContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  vehicleCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedVehicleCard: {
    borderWidth: 2,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  vehicleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  vehicleRate: {
    fontSize: 12,
    color: '#6B7280',
  },
  fareCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  fareRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  fareItem: {
    alignItems: 'center',
    gap: 8,
  },
  fareLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  fareValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  destinationsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destinationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  destinationText: {
    fontSize: 12,
    color: '#6B7280',
  },
  bookButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  bookButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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