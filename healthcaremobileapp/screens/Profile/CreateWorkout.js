import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from '../../configs/Apis';
import DateTimePicker from '@react-native-community/datetimepicker';

const CreateWorkout = ({ navigation }) => {
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Chưa đăng nhập.");
        let res = await Apis.get(endpoints.exercises, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setExercises(res.data);
      } catch (err) {
        Alert.alert("Lỗi", "Không thể tải danh sách bài tập.");
      } finally {
        setLoading(false);
      }
    };
    fetchExercises();
  }, []);

  const toggleSelectExercise = (exercise) => {
    setSelectedExercises((prev) => {
      if (prev.some((ex) => ex.id === exercise.id)) {
        return prev.filter((ex) => ex.id !== exercise.id);
      } else {
        return [...prev, exercise];
      }
    });
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) setDate(selectedDate);
  };

  const handleCreateWorkout = async () => {
    if (!workoutName || !date || selectedExercises.length === 0) {
      Alert.alert("Lỗi", "Vui lòng nhập đầy đủ thông tin và chọn ít nhất 1 bài tập!");
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập. Vui lòng đăng nhập lại.");

      // Tính tổng thời lượng từ các bài tập đã chọn (nếu có trường duration)
      const totalDuration = selectedExercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);

      const data = {
        name: workoutName,
        schedule: date.toISOString().slice(0, 10),
        exercise: selectedExercises.map((ex) => ex.id),
        total_duration: totalDuration, // BẮT BUỘC PHẢI CÓ
      };

      // Xóa các trường rỗng/null
      Object.keys(data).forEach((k) => (data[k] === "" || data[k] === undefined) && delete data[k]);

      // Log dữ liệu gửi lên để debug
      console.log("DATA GỬI LÊN:", data);

      await Apis.post(endpoints.workouts, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      Alert.alert("Thành công", "Đã tạo lịch tập!");
      navigation.navigate("Lịch tập luyện cá nhân", { screen: "WorkoutList" });
    } catch (error) {
      console.error("Lỗi tạo lịch tập:", error.response?.data || error.message);
      Alert.alert("Lỗi", "Không thể tạo lịch tập. Hãy kiểm tra lại dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f6f6f6" }}>
      <View style={styles.form}>
        <Text style={styles.label}>Tên lịch tập *</Text>
        <TextInput
          style={styles.input}
          placeholder="Workout Name"
          value={workoutName}
          onChangeText={setWorkoutName}
        />

        <Text style={styles.label}>Chọn ngày *</Text>
        <TouchableOpacity
          style={[styles.input, { justifyContent: 'center' }]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text>{date.toLocaleDateString()}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Text style={styles.label}>Chọn bài tập *</Text>
        {loading ? (
          <ActivityIndicator size="large" color="#3EB489" />
        ) : (
          <View style={styles.exerciseList}>
            {exercises.map((item) => {
              const selected = selectedExercises.some((ex) => ex.id === item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.exerciseBox,
                    selected && styles.selectedExerciseBox
                  ]}
                  onPress={() => toggleSelectExercise(item)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.exerciseName,
                    selected && styles.selectedExerciseName
                  ]}>
                    {item.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleCreateWorkout} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? "Đang tạo..." : "Tạo lịch tập"}</Text>
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
  exerciseList: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  exerciseBox: {
    width: "48%",
    marginBottom: 10,
    padding: 18,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#3EB489",
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60,
    elevation: 2,
  },
  selectedExerciseBox: {
    backgroundColor: "#B2F2E5",
    borderColor: "#00796B",
    elevation: 4,
  },
  exerciseName: {
    color: "#3EB489",
    fontWeight: "bold",
    fontSize: 16,
  },
  selectedExerciseName: {
    color: "#00796B",
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

export default CreateWorkout;