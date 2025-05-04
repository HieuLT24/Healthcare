import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useReducer } from 'react';
import { MyDispatchContext, MyUserContext } from './configs/Contexts';

import MyUserReducer from './reducers/MyUserReducers';
import Login from './components/User/Login';
import Register from './components/User/Register';
import Health from './components/User/Health';
import Profile from './components/User/Profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="login" 
      component={Login} 
      options={{ 
        title: "Đăng nhập", 
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account" size={size} color={color} />
        )
      }} 
    />
    <Tab.Screen 
      name="register" 
      component={Register} 
      options={{ 
        title: "Đăng ký", 
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account-plus" size={size} color={color} />
        )
      }} 
    />
  </Tab.Navigator>
);

// 🟢 Tab khi đã đăng nhập
const HomeTabs = () => (
  <Tab.Navigator>
    <Tab.Screen 
      name="health" 
      component={Health} 
      options={{ 
        title: "Sức khỏe", 
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="heart" size={size} color={color} />
        )
      }} 
    />
    <Tab.Screen 
      name="profile" 
      component={Profile} 
      options={{ 
        title: "Tài khoản", 
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="account-circle" size={size} color={color} />
        )
      }} 
    />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const user = useContext(MyUserContext);
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} >
      {user ? (
        <Stack.Screen name="HomeStack" component={HomeTabs} />
      ) : (
        <Stack.Screen name="AuthStack" component={AuthTabs} />
      )}
    </Stack.Navigator>
  );
};

const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <MyUserContext.Provider value={user}>
      <MyDispatchContext.Provider value={dispatch}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </MyDispatchContext.Provider>
    </MyUserContext.Provider>

  );
}

export default App;
