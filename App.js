import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';

// Firebase imports (Web SDK - Expo compatible)
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';

// ==================== FIREBASE CONFIG ====================
// Replace these with your Firebase project credentials
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// ==================== AUTH CONTEXT ====================
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signup = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  const login = async (email, password) => {
    return await signInWithEmailAndPassword(auth, email, password);
  };

  const logout = async () => {
    return await signOut(auth);
  };

  const resetPassword = async (email) => {
    return await sendPasswordResetEmail(auth, email, {
      url: 'https://your-app.com/login',
      handleCodeInApp: false
    });
  };

  const updateUserProfile = async (displayName) => {
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName });
      setUser({ ...auth.currentUser });
    }
  };

  const deleteUserAccount = async (password) => {
    const user = auth.currentUser;
    if (user && user.email) {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
    }
  };

  const value = {
    user,
    signup,
    login,
    logout,
    resetPassword,
    updateUserProfile,
    deleteUserAccount
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// ==================== VALIDATION HELPERS ====================
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const getFirebaseErrorMessage = (errorCode) => {
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return 'This email is already registered';
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/operation-not-allowed':
      return 'Operation not allowed';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/user-disabled':
      return 'This account has been disabled';
    case 'auth/user-not-found':
      return 'No account found with this email';
    case 'auth/wrong-password':
      return 'Incorrect password';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection';
    default:
      return 'An error occurred. Please try again';
  }
};

// ==================== EYE ICON COMPONENT ====================
const EyeIcon = ({ visible }) => (
  <Text style={styles.eyeIcon}>{visible ? '👁️' : '👁️‍🗨️'}</Text>
);

// ==================== LOGIN SCREEN ====================
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    setError('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>ValidMoviez</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="oneTimeCode"
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <EyeIcon visible={showPassword} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('ForgotPassword')}
            disabled={loading}
          >
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don't have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Signup')}
              disabled={loading}
            >
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ==================== SIGNUP SCREEN ====================
const SignupScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();

  const handleSignup = async () => {
    setError('');
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    if (!validatePassword(password)) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password);
    } catch (err) {
      setError(getFirebaseErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>ValidMoviez</Text>
          <Text style={styles.subtitle}>Create your account</Text>
        </View>

        <View style={styles.formContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="oneTimeCode"
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
            >
              <EyeIcon visible={showPassword} />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Confirm Password"
              placeholderTextColor="#999"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoComplete="new-password"
              textContentType="oneTimeCode"
              editable={!loading}
            />
            <TouchableOpacity 
              style={styles.eyeButton}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <EyeIcon visible={showConfirmPassword} />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Already have an account? </Text>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
              <Text style={styles.signupLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ==================== FORGOT PASSWORD SCREEN ====================
const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    setError('');
    setSuccess(false);
    
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
      Alert.alert(
        'Email Sent! 📧',
        `Password reset link has been sent to ${email}. Please check your inbox and spam folder.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (err) {
      console.error('Reset password error:', err);
      setError(getFirebaseErrorMessage(err.code));
      Alert.alert(
        'Error',
        getFirebaseErrorMessage(err.code) + '\n\nMake sure this email is registered and check your internet connection.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>ValidMoviez</Text>
          <Text style={styles.subtitle}>Reset your password</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.infoText}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="off"
            textContentType="none"
            keyboardType="email-address"
            editable={!loading}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {success ? (
            <Text style={styles.successText}>
              ✅ Password reset email sent! Check your inbox.
            </Text>
          ) : null}

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
          >
            <Text style={styles.linkText}>Back to Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ==================== HOME SCREEN (PROTECTED) ====================
const HomeScreen = ({ navigation }) => {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
    } catch (err) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceholderClick = () => {
    Alert.alert('Coming Soon! 🎬', 'Movie features will be added here soon.');
  };

  return (
    <View style={styles.homeContainer}>
      <View style={styles.homeTopBar}>
        <View style={styles.homeHeaderLeft}>
          <Text style={styles.homeLogo}>ValidMoviez</Text>
        </View>
        <TouchableOpacity 
          style={styles.profileIconButton}
          onPress={() => navigation.navigate('Profile')}
        >
          <Text style={styles.profileIconText}>👤 Profile</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.homeWelcome}>
        <Text style={styles.welcomeText}>
          Welcome back{user?.displayName ? `, ${user.displayName}` : ''}!
        </Text>
      </View>

      <View style={styles.homeContent}>
        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>🎬 Your Movie Hub</Text>
          <Text style={styles.infoCardText}>
            You're successfully signed in. This is your protected home screen where you can access all ValidMoviez features.
          </Text>
          
          <TouchableOpacity 
            style={styles.placeholderButton}
            onPress={handlePlaceholderClick}
          >
            <Text style={styles.placeholderButtonText}>Click here to explore movies →</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, loading && styles.buttonDisabled]}
        onPress={handleLogout}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign Out</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

// ==================== PROFILE SCREEN ====================
const ProfileScreen = ({ navigation }) => {
  const { user, updateUserProfile, deleteUserAccount, logout } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdateProfile = async () => {
    setError('');
    if (!displayName.trim()) {
      setError('Please enter a name');
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(displayName.trim());
      Alert.alert('Success! ✅', 'Your profile has been updated.');
    } catch (err) {
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Are you absolutely sure? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Forever',
          style: 'destructive',
          onPress: async () => {
            if (!deletePassword) {
              Alert.alert('Error', 'Please enter your password to confirm deletion.');
              return;
            }

            setDeleteLoading(true);
            try {
              await deleteUserAccount(deletePassword);
              Alert.alert('Account Deleted', 'Your account has been permanently deleted.');
            } catch (err) {
              console.error('Delete account error:', err);
              if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                Alert.alert('Error', 'Incorrect password. Please try again.');
              } else {
                Alert.alert('Error', 'Failed to delete account. Please try again.');
              }
            } finally {
              setDeleteLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.profileHeader}>
          <Text style={styles.profileTitle}>Profile Settings</Text>
          <Text style={styles.profileSubtitle}>{user?.email}</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Profile Information Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            
            <Text style={styles.label}>Display Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name (optional)"
              placeholderTextColor="#999"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
              editable={!loading}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Update Profile</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Account Information */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account Created:</Text>
              <Text style={styles.infoValue}>
                {user?.metadata?.creationTime 
                  ? new Date(user.metadata.creationTime).toLocaleDateString()
                  : 'N/A'}
              </Text>
            </View>
          </View>

          {/* Delete Account Section */}
          <View style={[styles.section, styles.dangerSection]}>
            <Text style={styles.dangerTitle}>⚠️ Danger Zone</Text>
            <Text style={styles.dangerText}>
              Once you delete your account, there is no going back. Please be certain.
            </Text>

            <Text style={styles.label}>Enter Password to Confirm</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Your current password"
                placeholderTextColor="#999"
                value={deletePassword}
                onChangeText={setDeletePassword}
                secureTextEntry={!showDeletePassword}
                autoCapitalize="none"
                autoComplete="new-password"
                textContentType="oneTimeCode"
                editable={!deleteLoading}
              />
              <TouchableOpacity 
                style={styles.eyeButton}
                onPress={() => setShowDeletePassword(!showDeletePassword)}
              >
                <EyeIcon visible={showDeletePassword} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.dangerButton, deleteLoading && styles.buttonDisabled]}
              onPress={handleDeleteAccount}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Delete Account Forever</Text>
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            onPress={() => navigation.navigate('Home')}
            style={styles.backButton}
          >
            <Text style={styles.linkText}>← Back to Home</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ==================== NAVIGATION SETUP ====================
const AppNavigator = () => {
  const { user } = useAuth();

  if (user) {
    return <MainAppNavigator />;
  }

  return <AuthNavigator />;
};

const MainAppNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('Home');

  const navigation = {
    navigate: (screen) => setCurrentScreen(screen)
  };

  switch (currentScreen) {
    case 'Profile':
      return <ProfileScreen navigation={navigation} />;
    default:
      return <HomeScreen navigation={navigation} />;
  }
};

const AuthNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('Login');

  const navigation = {
    navigate: (screen) => setCurrentScreen(screen)
  };

  switch (currentScreen) {
    case 'Signup':
      return <SignupScreen navigation={navigation} />;
    case 'ForgotPassword':
      return <ForgotPasswordScreen navigation={navigation} />;
    default:
      return <LoginScreen navigation={navigation} />;
  }
};

// ==================== MAIN APP ====================
export default function App() {
  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#e50914',
    marginBottom: 8,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#999',
  },
  formContainer: {
    width: '100%',
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
    color: '#fff',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    marginBottom: 16,
  },
  passwordInput: {
    flex: 1,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  eyeButton: {
    padding: 16,
  },
  eyeIcon: {
    fontSize: 20,
  },
  button: {
    backgroundColor: '#e50914',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#ff4444',
    marginBottom: 16,
    fontSize: 14,
  },
  successText: {
    color: '#22c55e',
    marginBottom: 16,
    fontSize: 14,
  },
  linkText: {
    color: '#e50914',
    textAlign: 'center',
    fontSize: 14,
    marginTop: 8,
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  signupText: {
    color: '#999',
    fontSize: 14,
  },
  signupLink: {
    color: '#e50914',
    fontSize: 14,
    fontWeight: '600',
  },
  infoText: {
    color: '#999',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  homeContainer: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    padding: 24,
  },
  homeTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 24,
  },
  homeHeaderLeft: {
    flex: 1,
  },
  homeLogo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#e50914',
    letterSpacing: 1,
  },
  profileIconButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    borderWidth: 2,
    borderColor: '#e50914',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 14,
    color: '#e50914',
    fontWeight: '600',
  },
  homeWelcome: {
    marginBottom: 32,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: '#999',
  },
  homeContent: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  infoCardText: {
    fontSize: 16,
    color: '#999',
    lineHeight: 24,
    marginBottom: 16,
  },
  placeholderButton: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#e50914',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  placeholderButtonText: {
    color: '#e50914',
    fontSize: 14,
    fontWeight: '500',
  },
  logoutButton: {
    backgroundColor: '#e50914',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  profileTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  profileSubtitle: {
    fontSize: 16,
    color: '#999',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: '#999',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    fontSize: 14,
    color: '#999',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  dangerSection: {
    backgroundColor: '#1a0000',
    borderWidth: 1,
    borderColor: '#ff4444',
    borderRadius: 8,
    padding: 16,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ff4444',
    marginBottom: 12,
  },
  dangerText: {
    fontSize: 14,
    color: '#ff9999',
    marginBottom: 16,
    lineHeight: 20,
  },
  dangerButton: {
    backgroundColor: '#ff4444',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
    backButton: {
      marginTop: 16,
    },
  });