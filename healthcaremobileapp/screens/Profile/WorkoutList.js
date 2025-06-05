import React, { useEffect, useState, useCallback } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const WorkoutList = () => {
  const navigation = useNavigation();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập.");
      let res = await Apis.get(endpoints.workouts, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWorkouts(res.data);
    } catch (err) {
      Alert.alert("Lỗi", "Không thể tải danh sách lịch tập.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorkout = () => {
    navigation.navigate("Lịch tập luyện cá nhân", { screen: "CreateWorkout" });
  };

  const handleDeleteWorkout = async (id) => {
    Alert.alert(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa lịch tập này?",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Xóa",
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem("token");
              await Apis.delete(endpoints["workout-detail"](id), {
                headers: { Authorization: `Bearer ${token}` }
              });
              setWorkouts((prev) => prev.filter((item) => item.id !== id));
            } catch (err) {
              Alert.alert("Lỗi", "Không thể xóa lịch tập.");
            }
          }
        }
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      <View style={styles.headerRow}>
        <Text style={styles.header}>Danh sách lịch tập</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleAddWorkout}>
          <Text style={styles.addButtonText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3EB489" style={{ marginTop: 40 }} />
      ) : workouts.length === 0 ? (
        <Text style={styles.empty}>Chưa có lịch tập nào.</Text>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteWorkout(item.id)}
              >
                <Text style={styles.deleteButtonText}>×</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() => navigation.navigate("WorkoutDetail", { workoutId: item.id })}
              >
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>Ngày: {item.schedule}</Text>
                <Text style={styles.cardInfo}>Số bài tập: {item.exercise?.length || 0}</Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<Text style={styles.empty}>Không có lịch tập nào.</Text>}
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

export default WorkoutList;