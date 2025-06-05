import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import Profile from "./Profile";
import UserInfoForm from "./UserInfoForm";
import WorkoutDetail from "./WorkoutDetail";



const Stack = createNativeStackNavigator();

const ProfileStack = () => (
    <Stack.Navigator>
        <Stack.Screen name="Profile" component={Profile} options={{ title: "Hồ sơ" }} />
        <Stack.Screen
            name="UserInfoForm"
            component={UserInfoForm}
            options={{ title: "Cập nhật thông tin cá nhân" }}
            
        />
         <Stack.Screen name="WorkoutDetail" component={WorkoutDetail} options={{ title: "Chi tiết lịch tập luyện" }} />
    </Stack.Navigator>
);

export default ProfileStack;