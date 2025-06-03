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
import Statistic from './screens/Home/Statistic';
import Status from './screens/Home/Status';
import Home from './screens/Home/Home';
import Reminder from './screens/Reminder/Reminder';

import RefreshableScreen from './components/RefreshableScreen';
import { PaperProvider } from 'react-native-paper';
import ProfileStack from './screens/Profile/ProfileStack'; // Import ProfileStack để sử dụng trong AppDrawer
import WorkoutList from './screens/Profile/WorkoutList';
import CreateWorkout from './screens/Profile/CreateWorkout';
import ExerciseStack from './screens/Profile/ExerciseStack';
import WorkoutStack from './screens/Profile/WorkoutStack';
import DiaryStack from './screens/Profile/DiaryStack';
import ChatRoomsList from './screens/Conversation/ChatRoomsList';
import FirebaseChatScreen from './screens/Conversation/FirebaseChatScreen';

const Drawer = createDrawerNavigator();
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AppDrawer = () => (
  <Drawer.Navigator screenOptions={{ headerShown: true }}>
    <Drawer.Screen name="Trang chủ" component={HomeTabs} />
    <Drawer.Screen name="Workout" component={HomeTabs} />
    <Drawer.Screen name="Reminder" component={Reminder} />
    <Drawer.Screen name="Nutrition" component={HomeTabs} />
    <Drawer.Screen name="Lịch tập luyện cá nhân" component={WorkoutStack} />
    <Drawer.Screen name="Bài tập" component={ExerciseStack} />
    <Drawer.Screen name="Nhật ký" component={DiaryStack} />

    {/* Thay Profile bằng ProfileStack để hỗ trợ UserInfoForm */}
    <Drawer.Screen name="Hồ sơ" component={ProfileStack} />
    <Drawer.Screen name="Tư vấn trực tuyến" component={ConversationTabs} />
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
      component={Statistic}
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="chart-line" size={size} color={color} />
        )
      }}
    />
    <Tab.Screen
      name="Chỉ số cá nhân"
      component={ProfileStack} // Thay Profile bằng ProfileStack
      options={{
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="arm-flex" size={size} color={color} />
        )
      }}
    />
  </Tab.Navigator>
);

const ConversationStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ChatRoomsList" component={ChatRoomsList} />
    <Stack.Screen name="FirebaseChatScreen" component={FirebaseChatScreen} />
  </Stack.Navigator>
);

const ConversationTabs = () => (
  <Tab.Navigator>
    <Tab.Screen
      name="Danh sách tin nhắn"
      component={ConversationStack}
      options={{
        tabBarShowLabel: false,
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name="chat" size={size} color={color} />
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
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </MyDispatchContext.Provider>
      </MyUserContext.Provider>
    </PaperProvider>
  );
}

export default App;

