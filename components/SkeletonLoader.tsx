import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  height = 20,
  width: customWidth = '100%',
  borderRadius = 4,
  style,
}) => {
  const animatedValue = new Animated.Value(0);

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, []);

  const backgroundColor = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['#374151', '#6B7280'],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          height,
          width: customWidth,
          borderRadius,
          backgroundColor,
        },
        style,
      ]}
    />
  );
};

export const PostSkeleton: React.FC = () => {
  return (
    <View style={styles.postSkeleton}>
      <View style={styles.postHeader}>
        <SkeletonLoader width={45} height={45} borderRadius={22.5} />
        <View style={styles.userInfo}>
          <SkeletonLoader width={120} height={16} />
          <SkeletonLoader width={80} height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonLoader width="100%" height={250} borderRadius={0} />
      <View style={styles.postContent}>
        <SkeletonLoader width="100%" height={16} />
        <SkeletonLoader width="80%" height={16} style={{ marginTop: 8 }} />
        <SkeletonLoader width="60%" height={16} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
};

export const PlaceSkeleton: React.FC = () => {
  return (
    <View style={styles.placeSkeleton}>
      <SkeletonLoader width="100%" height={140} borderRadius={16} />
      <View style={styles.placeInfo}>
        <SkeletonLoader width="80%" height={16} />
        <SkeletonLoader width="60%" height={12} style={{ marginTop: 4 }} />
        <SkeletonLoader width="40%" height={12} style={{ marginTop: 4 }} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#374151',
  },
  postSkeleton: {
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
    alignItems: 'center',
    padding: 15,
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  postContent: {
    padding: 15,
  },
  placeSkeleton: {
    width: (width - 40) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  placeInfo: {
    padding: 12,
  },
});