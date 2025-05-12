import React, { useCallback, useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';

const RefreshableScreen = ({ children, onRefreshCallback }) => {
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (onRefreshCallback && typeof onRefreshCallback === 'function') {
      await onRefreshCallback();
    }
    setRefreshing(false);
  }, [onRefreshCallback]);

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {children}
    </ScrollView>
  );
};

export default RefreshableScreen;