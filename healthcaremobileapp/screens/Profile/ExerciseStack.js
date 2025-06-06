import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExerciseList from "./ExerciseList";
import CreateExercise from "./CreateExercise";
import ExerciseDetail from "./ExerciseDetail";



const Stack = createNativeStackNavigator();

const ExerciseStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="ExerciseList"
        component={ExerciseList}
        options={{ title: "Danh sách bài tập" }}
      />
      <Stack.Screen
        name="CreateExercise"
        component={CreateExercise}
        options={{ title: "Thêm bài tập" }}
      />
      <Stack.Screen
        name="ExerciseDetail"
        component={ExerciseDetail}
        options={{ title: "Chi tiết bài tập" }}
      />
    </Stack.Navigator>
  );
};

export default ExerciseStack;