import React, {useEffect} from 'react';
import {StatusBar, View, ActivityIndicator, StyleSheet} from 'react-native';
import {Provider} from 'react-redux';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {store} from './src/store';
import {useAppDispatch, useAppSelector} from './src/store/hooks';
import {loadStoredUser} from './src/store/slices/authSlice';
import AppNavigator from './src/navigation/AppNavigator';

// Wrapper component to access Redux hooks
const AppContent = () => {
  const dispatch = useAppDispatch();
  const {isAuthenticated, isLoading} = useAppSelector(state => state.auth);

  useEffect(() => {
    // Load stored user data on app start
    dispatch(loadStoredUser());
  }, [dispatch]);

  // Show splash screen while checking authentication
  if (isLoading) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  return <AppNavigator isAuthenticated={isAuthenticated} />;
};

const App = () => {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#0f172a" />
        <AppContent />
      </SafeAreaProvider>
    </Provider>
  );
};

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
