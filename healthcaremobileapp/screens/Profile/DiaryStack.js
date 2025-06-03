import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import DiaryList from "./DiaryList";
import CreateDiary from "./CreateDiary";
import DiaryDetail from "./DiaryDetail";

const Stack = createNativeStackNavigator();

const DiaryStack = () => (
  <Stack.Navigator>
    <Stack.Screen
      name="DiaryList"
      component={DiaryList}
      options={{ title: "Nhật ký" }}
    />
    <Stack.Screen
      name="CreateDiary"
      component={CreateDiary}
      options={{ title: "Viết nhật ký" }}
    />
    <Stack.Screen
      name="DiaryDetail"
      component={DiaryDetail}
      options={{ title: "Chi tiết nhật ký" }}
    />
  </Stack.Navigator>
);

export default DiaryStack;