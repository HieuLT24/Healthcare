import React, { useState, useEffect } from "react";
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { authApi, endpoints } from "../../configs/Apis";

const CreateExercise = () => {
  const navigation = useNavigation();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [equipment, setEquipment] = useState("");
  const [duration, setDuration] = useState("");
  const [repetition, setRepetition] = useState("");
  const [sets, setSets] = useState("");
  const [calories, setCalories] = useState("");
  const [muscleGroups, setMuscleGroups] = useState([]); // Danh sách nhóm cơ từ API
  const [selectedMuscleGroups, setSelectedMuscleGroups] = useState([]); // ID nhóm cơ đã chọn
  const [loading, setLoading] = useState(false);
  const [loadingMuscle, setLoadingMuscle] = useState(true);

  useEffect(() => {
    const fetchMuscleGroups = async () => {
      try {
        setLoadingMuscle(true);
        const token = await AsyncStorage.getItem("token");
        const api = authApi(token);
        const res = await api.get(endpoints["muscle-groups"]);
        setMuscleGroups(res.data.results || res.data);
      } catch (error) {
        Alert.alert("Lỗi", "Không thể tải danh sách nhóm cơ!");
      } finally {
        setLoadingMuscle(false);
      }
    };
    fetchMuscleGroups();
  }, []);

  const handleSelectMuscleGroup = (id) => {
    setSelectedMuscleGroups((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id]
    );
  };

  const handleCreate = async () => {
    // Kiểm tra các trường bắt buộc không được rỗng hoặc chỉ có dấu cách
    if (
      !name.trim() ||
      !difficulty.trim() ||
      !duration.trim() ||
      !repetition.trim() ||
      !sets.trim() ||
      !calories.trim() ||
      selectedMuscleGroups.length === 0
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin bắt buộc!");
      return;
    }

    // Kiểm tra các trường số phải là số dương
    if (
      isNaN(Number(duration)) || Number(duration) <= 0 ||
      isNaN(Number(repetition)) || Number(repetition) <= 0 ||
      isNaN(Number(sets)) || Number(sets) <= 0 ||
      isNaN(Number(calories)) || Number(calories) <= 0
    ) {
      Alert.alert("Lỗi", "Vui lòng nhập số hợp lệ (lớn hơn 0) cho các trường số!");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");
      }

      const data = {
        name: name.trim(),
        description: description.trim(),
        difficulty_level: difficulty.trim(),
        equipment: equipment.trim(),
        duration: Number(duration),
        repetition: Number(repetition),
        sets: Number(sets),
        calories_burned: Number(calories),
        muscle_groups: selectedMuscleGroups,
        rating: 0,
      };

      Object.keys(data).forEach((k) => (data[k] === "" || data[k] === undefined) && delete data[k]);

      const api = authApi(token);
      await api.post(
        endpoints["exercises"],
        data,
        {
          headers: { "Content-Type": "application/json" }
        }
      );
      Alert.alert("Thành công", "Đã tạo bài tập mới!");
      navigation.goBack();
    } catch (error) {
      console.error("Lỗi tạo bài tập:", error.response?.data || error.message);
      Alert.alert("Lỗi", "Không thể tạo bài tập. Hãy kiểm tra lại dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      <View style={styles.form}>
        <Text style={styles.label}>Tên bài tập *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Nhập tên bài tập"
        />

        <Text style={styles.label}>Mô tả</Text>
        <TextInput
          style={styles.input}
          value={description}
          onChangeText={setDescription}
          placeholder="Mô tả bài tập"
          multiline
        />

        <Text style={styles.label}>Độ khó *</Text>
        <TextInput
          style={styles.input}
          value={difficulty}
          onChangeText={setDifficulty}
          placeholder="Ví dụ: 1, 2, 3 hoặc dễ, trung bình, khó"
        />

        <Text style={styles.label}>Thiết bị</Text>
        <TextInput
          style={styles.input}
          value={equipment}
          onChangeText={setEquipment}
          placeholder="Ví dụ: Không, tạ, dây đàn hồi"
        />

        <Text style={styles.label}>Thời lượng (phút) *</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="Ví dụ: 10"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Số lần lặp (Repetition) *</Text>
        <TextInput
          style={styles.input}
          value={repetition}
          onChangeText={setRepetition}
          placeholder="Ví dụ: 5"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Số hiệp (Sets) *</Text>
        <TextInput
          style={styles.input}
          value={sets}
          onChangeText={setSets}
          placeholder="Ví dụ: 12"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Calories tiêu thụ *</Text>
        <TextInput
          style={styles.input}
          value={calories}
          onChangeText={setCalories}
          placeholder="Ví dụ: 150"
          keyboardType="numeric"
        />

        <Text style={styles.label}>Chọn nhóm cơ *</Text>
        {loadingMuscle ? (
          <ActivityIndicator size="small" color="#3EB489" />
        ) : (
          <View style={{ marginBottom: 10 }}>
            {muscleGroups.map((group) => (
              <TouchableOpacity
                key={group.id}
                style={{
                  padding: 10,
                  marginVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: selectedMuscleGroups.includes(group.id) ? "#3EB489" : "#ccc",
                  backgroundColor: selectedMuscleGroups.includes(group.id) ? "#B2F2E5" : "#fff"
                }}
                onPress={() => handleSelectMuscleGroup(group.id)}
              >
                <Text style={{ color: selectedMuscleGroups.includes(group.id) ? "#00796B" : "#333" }}>
                  {group.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Đang tạo..." : "Tạo bài tập"}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  form: {
    backgroundColor: "#fff",
    borderRadius: 16,
    margin: 16,
    padding: 18,
    shadowColor: "#B0BEC5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.11,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#3EB489"
  },
  label: {
    marginTop: 8,
    marginBottom: 2,
    fontWeight: "600",
    color: "#3EB489"
  },
  input: {
    backgroundColor: "#F2F2F2",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    marginBottom: 6
  },
  button: {
    backgroundColor: "#3EB489",
    borderRadius: 10,
    marginTop: 18,
    paddingVertical: 12,
    alignItems: "center"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16
  }
});

export default CreateExercise;