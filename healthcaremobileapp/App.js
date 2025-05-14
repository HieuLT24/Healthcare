import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useContext, useReducer } from 'react';
import { MyDispatchContext, MyUserContext } from './configs/Contexts';
import MyUserReducer from './reducers/MyUserReducers';
import React from 'react';

import { createDrawerNavigator } from '@react-navigation/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import Login from './screens/Auth/Login';
import Register from './screens/Auth/Register';
import Profile from './screens/Profile/Profile';
import Home from './screens/Home/Home';
import Reminder from './screens/Reminder/Reminder';
import RefreshableScreen from './components/RefreshableScreen';
import { PaperProvider } from 'react-native-paper';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppDrawer = () => (
  <Drawer.Navigator screenOptions={{ headerShown: true }}>
    <Drawer.Screen name="Trang chủ" component={HomeTabs} />
    <Drawer.Screen name="Workout" component={HomeTabs} />
    <Drawer.Screen name="Reminder" component={Reminder} />
    <Drawer.Screen name="Nutrition" component={HomeTabs} />

    <Drawer.Screen name="Hồ sơ" component={Profile} />
  </Drawer.Navigator>
);

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

const HomeTabs = () => (
  <Tab.Navigator screenOptions={{ headerShown: false }}>
    <Tab.Screen
      name="Lịch sử tập luyện"
      component={Home}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="chart-line" size={size} color={color} />
        )
      }}
    />
    <Tab.Screen
      name="Chỉ số cá nhân"
      component={Profile}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="arm-flex" size={size} color={color} />
        )
      }}
    />


  </Tab.Navigator>
);

const AppNavigator = () => {
  const user = useContext(MyUserContext);
  return (
    <Drawer.Navigator screenOptions={{ headerShown: false }} >
      {user ? (
        <Drawer.Screen name="AppDrawer" component={AppDrawer} />
      ) : (
        <Drawer.Screen name="AuthStack" component={AuthTabs} />
      )}
    </Drawer.Navigator>
  );
};


const App = () => {
  const [user, dispatch] = useReducer(MyUserReducer, null);

  return (
    <PaperProvider>
      <MyUserContext.Provider value={user}>
        <MyDispatchContext.Provider value={dispatch}>
          <RefreshableScreen>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </RefreshableScreen>
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </PaperProvider>
  );
}

export default App;
