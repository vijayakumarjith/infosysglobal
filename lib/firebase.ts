import { initializeApp } from 'firebase/app';
import { getApps, getApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, query, orderBy, updateDoc, increment } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyD7WbCEqrM6nkO-HPHBlHLa3BMQg5N42ZQ",
  authDomain: "edcrec-1b825.firebaseapp.com",
  databaseURL: "https://edcrec-1b825-default-rtdb.firebaseio.com",
  projectId: "edcrec-1b825",
  storageBucket: "edcrec-1b825.appspot.com",
  messagingSenderId: "448340287337",
  appId: "1:448340287337:web:a7ca1e2e481fc4fd8767f8",
  measurementId: "G-70D7XRKLQZ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  createdAt: Date;
  postsCount: number;
  followersCount: number;
  followingCount: number;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  caption: string;
  images: string[];
  location: string;
  category: string;
  rating: number;
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
}

export interface Place {
  id: string;
  name: string;
  location: string;
  description: string;
  category: string;
  rating: number;
  reviewsCount: number;
  images: string[];
  createdBy: string;
  createdAt: Date;
}

// Auth functions
export const signUp = async (email: string, password: string, displayName: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      displayName,
      createdAt: new Date(),
      postsCount: 0,
      followersCount: 0,
      followingCount: 0
    });
    
    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const logOut = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// User profile functions
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Posts functions
export const createPost = async (postData: Omit<Post, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'posts'), {
      ...postData,
      createdAt: new Date()
    });
    
    // Update user's post count
    const userRef = doc(db, 'users', postData.userId);
    await updateDoc(userRef, {
      postsCount: increment(1)
    });
    
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getPosts = async (): Promise<Post[]> => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('User not authenticated, returning empty posts array');
      return [];
    }
    
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    };
    }) as Post[];
    
    return posts;
  } catch (error) {
    console.error('Error getting posts:', error);
    return [];
  }
};

// Places functions
export const createPlace = async (placeData: Omit<Place, 'id' | 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'places'), {
      ...placeData,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getPlaces = async (): Promise<Place[]> => {
  try {
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('User not authenticated, returning empty places array');
      return [];
    }
    
    const q = query(collection(db, 'places'), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const places = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
    };
    }) as Place[];
    
    return places;
  } catch (error) {
    console.error('Error getting places:', error);
    return [];
  }
};

// Image upload function
export const uploadImage = async (file: File, path: string): Promise<string | null> => {
  try {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};