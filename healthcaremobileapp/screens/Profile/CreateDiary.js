import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from '../../configs/Apis';

const CreateDiary = ({ navigation, route }) => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const workoutSessionId = route?.params?.workoutSessionId || null;

  const handleSave = async () => {
    if (!name || !content) {
      Alert.alert("Lỗi", "Vui lòng nhập tiêu đề và nội dung nhật ký!");
      return;
    }
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập.");

      const data = {
        name,
        content,
        workout_session: workoutSessionId,
      };

      Object.keys(data).forEach((k) => (data[k] === null || data[k] === "") && delete data[k]);

      await Apis.post(endpoints.diaries, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      Alert.alert("Thành công", "Đã lưu nhật ký!");
      navigation.goBack();
    } catch (error) {
      console.error("Lỗi lưu nhật ký:", error.response?.data || error.message);
      Alert.alert("Lỗi", "Không thể lưu nhật ký.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Tiêu đề *</Text>
      <TextInput
        style={styles.input}
        placeholder="Nhập tiêu đề"
        value={name}
        onChangeText={setName}
      />
      <Text style={styles.label}>Nội dung *</Text>
      <TextInput
        style={[styles.input, { height: 100 }]}
        placeholder="Nhập nội dung nhật ký"
        value={content}
        onChangeText={setContent}
        multiline
      />
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Lưu nhật ký</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  label: { fontWeight: "bold", marginTop: 10, marginBottom: 4, color: "#3EB489" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    backgroundColor: "#F2F2F2"
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

export default CreateDiary;