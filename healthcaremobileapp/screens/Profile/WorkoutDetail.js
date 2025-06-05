import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, FlatList, ScrollView } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";

const WorkoutDetail = ({ route }) => {
  const { workoutId } = route.params;
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWorkoutDetail = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Access token không tồn tại");

        const res = await Apis.get(endpoints["workout-detail"](workoutId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkout(res.data);
      } catch (error) {
        Alert.alert("Lỗi", "Không thể tải chi tiết lịch tập luyện.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkoutDetail();
  }, [workoutId]);

  if (loading) return <ActivityIndicator size="large" color="#3EB489" style={{ marginTop: 40 }} />;
  if (!workout) return <Text style={styles.errorText}>Không tìm thấy lịch tập luyện.</Text>;

  // Hàm lấy tên nhóm cơ từ mỗi bài tập
  const getMuscleGroupsDisplay = (muscle_groups) => {
    if (!muscle_groups || muscle_groups.length === 0) return "";
    if (typeof muscle_groups[0] === "object" && muscle_groups[0].name) {
      return muscle_groups.map(mg => mg.name).join(", ");
    }
    return muscle_groups.join(", ");
  };

  // Tính tổng calories từ các bài tập (nếu backend chưa tổng)
  const totalCalories = Array.isArray(workout.exercise)
    ? workout.exercise.reduce((sum, ex) => sum + (ex.calories_burned || 0), 0)
    : 0;
  const totalDuration = Array.isArray(workout.exercise)
  ? workout.exercise.reduce((sum, ex) => sum + (ex.duration || 0), 0)
  : 0;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      <View style={styles.card}>
        <Text style={styles.title}>{workout.name}</Text>
        <View style={styles.line}>
          <Text style={styles.label}>🎯 Mục tiêu: </Text>
          <Text style={styles.value}>{workout.goal}</Text>
        </View>
        <View style={styles.line}>
          <Text style={styles.label}>🗓 Lịch: </Text>
          <Text style={styles.value}>{workout.schedule?.slice(0, 16).replace("T", " ")}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.info}>
            🔥 Tổng calories tiêu thụ: {totalCalories} kcal
          </Text>
          <Text style={styles.info}>⏳ {totalDuration} phút</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Danh sách bài tập</Text>
      <FlatList
        data={workout.exercise}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{item.name}</Text>
            {item.description ? <Text style={styles.exerciseInfo}>📝 {item.description}</Text> : null}
            <Text style={styles.exerciseInfo}>💪 Độ khó: {item.difficulty_level}</Text>
            <Text style={styles.exerciseInfo}>🛠 Thiết bị: {item.equipment}</Text>
            <Text style={styles.exerciseInfo}>⏱ Thời lượng: {item.duration} phút</Text>
            <Text style={styles.exerciseInfo}>🔁 Lặp: {item.repetition}</Text>
            <Text style={styles.exerciseInfo}>📦 Số hiệp: {item.sets}</Text>
            <Text style={styles.exerciseInfo}>🔥 Calories: {item.calories_burned} kcal</Text>
            <Text style={styles.exerciseInfo}>
              🏷 Nhóm cơ: {getMuscleGroupsDisplay(item.muscle_groups)}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text style={{ textAlign: "center", color: "#444", marginTop: 8 }}>Không có bài tập nào.</Text>}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#EFFFF7",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginBottom: 12,
    shadowColor: "#B0BEC5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#3EB489"
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3EB489",
    marginBottom: 6,
    textAlign: "left"
  },
  label: { color: "#212121", fontWeight: "bold" },
  value: { color: "#3EB489", fontWeight: "600" },
  line: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginVertical: 3 },
  info: { color: "#3EB489", fontWeight: "500" },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#3EB489",
    marginLeft: 18,
    marginTop: 16,
    marginBottom: 8
  },
  exerciseCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#3EB489",
    shadowColor: "#B0BEC5",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3EB489",
    marginBottom: 2
  },
  exerciseInfo: {
    fontSize: 14,
    color: "#212121",
    marginBottom: 1.5
  },
  errorText: {
    color: "red",
    fontSize: 16,
    textAlign: "center",
    marginTop: 32,
  }
});

export default WorkoutDetail;