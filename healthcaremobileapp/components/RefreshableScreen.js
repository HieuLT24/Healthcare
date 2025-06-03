import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl, View } from 'react-native';

const RefreshableScreen = ({ children, onRefreshCallback, style, contentContainerStyle, showsVerticalScrollIndicator = false }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (onRefreshCallback && typeof onRefreshCallback === 'function') {
        await onRefreshCallback();
      }
    } catch (error) {
      console.error('Error during refresh:', error);
    } finally {
      setRefreshing(false);
    }
  }, [onRefreshCallback]);

  return (
    <ScrollView
      style={style}
      contentContainerStyle={[{ flexGrow: 1 }, contentContainerStyle]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={['#065f46']} // Android
          tintColor="#065f46" // iOS
          progressBackgroundColor="#ffffff" // Android
        />
      }
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScreen;