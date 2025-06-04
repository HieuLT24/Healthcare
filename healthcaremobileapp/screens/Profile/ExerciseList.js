import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, Alert, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const ExerciseList = () => {
  const navigation = useNavigation();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [])
  );

  const fetchExercises = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Access token không tồn tại. Vui lòng đăng nhập lại.");
      }
      let exerciseResponse = await Apis.get(endpoints.exercises, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setExercises(exerciseResponse.data);
    } catch (error) {
      Alert.alert("Lỗi", "Không thể tải danh sách bài tập. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchExercises();
    setRefreshing(false);
  };

  const handleDeleteExercise = async (id) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa bài tập này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await Apis.delete(endpoints["exercise-detail"](id), {
                headers: { Authorization: `Bearer ${token}` }
              });
              setExercises((prev) => prev.filter((item) => item.id !== id));
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa bài tập.");
            }
          }
        }
      ]
    );
  };

  const handleSelectExercise = (exercise) => {
    navigation.navigate('ExerciseDetail', { exerciseId: exercise.id });
  };

  const handleAddExercise = () => {
    navigation.navigate('CreateExercise');
  };

  // Hàm lấy tên nhóm cơ (nếu là object có name thì lấy name, nếu là id thì hiển thị id)
  const getMuscleGroupsDisplay = (muscle_groups) => {
    if (!muscle_groups || muscle_groups.length === 0) return "";
    if (typeof muscle_groups[0] === "object" && muscle_groups[0].name) {
      return muscle_groups.map(mg => mg.name).join(", ");
    }
    return muscle_groups.join(", ");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Danh sách bài tập</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3EB489" style={{ marginTop: 40 }} />
      ) : exercises.length === 0 ? (
        <Text style={styles.empty}>Chưa có bài tập nào.</Text>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteExercise(item.id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => handleSelectExercise(item)}
                activeOpacity={0.85}
              >
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{item.description}</Text>
                <View style={styles.row}>
                  <Text style={styles.cardInfo}>💪 Độ khó: {item.difficulty_level}</Text>
                  {item.equipment ? (
                    <Text style={styles.cardInfo}>🛠 {item.equipment}</Text>
                  ) : null}
                </View>
                <View style={styles.row}>
                  {item.duration && <Text style={styles.cardInfo}>⏱ {item.duration} phút</Text>}
                  {item.muscle_groups && item.muscle_groups.length > 0 && (
                    <Text style={styles.cardInfo}>🏷 {getMuscleGroupsDisplay(item.muscle_groups)}</Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          )}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListEmptyComponent={<Text style={styles.empty}>Không có bài tập nào.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 0,
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#3EB489",
    textAlign: "left",
  },
  addButton: {
    backgroundColor: "#3EB489",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },
  card: {
    backgroundColor: "#EFFFF7",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#B0BEC5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#3EB489",
    position: "relative"
  },
  deleteButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 2,
    backgroundColor: "#ff6666",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  deleteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
    lineHeight: 20
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#212121"
  },
  cardSub: {
    fontSize: 15,
    color: "#444",
    marginVertical: 2
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 8
  },
  cardInfo: {
    fontSize: 14,
    color: "#3EB489",
    fontWeight: "600"
  },
  empty: {
    fontSize: 16,
    color: "#444",
    textAlign: "center",
    marginTop: 32,
  }
});

export default ExerciseList;