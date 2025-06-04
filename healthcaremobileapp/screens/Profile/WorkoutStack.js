
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WorkoutList from "./WorkoutList";
import CreateWorkout from "./CreateWorkout";
import WorkoutDetail from "./WorkoutDetail";

const Stack = createNativeStackNavigator();

const WorkoutStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="WorkoutList"
      component={WorkoutList}
      options={{ title: "Danh sách lịch tập" }}
    />
    <Stack.Screen
      name="CreateWorkout"
      component={CreateWorkout}
      options={{ title: "Thêm lịch tập" }}
    />
     <Stack.Screen
      name="WorkoutDetail"
      component={WorkoutDetail}
      options={{ title: "Chi tiết lịch tập" }}
    />
  </Stack.Navigator>
);

export default WorkoutStack;