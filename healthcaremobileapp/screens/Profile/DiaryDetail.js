import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from '../../configs/Apis';

const DiaryDetail = ({ route }) => {
  const { diaryId } = route.params;
  const [diary, setDiary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiary = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("token");
        if (!token) throw new Error("Chưa đăng nhập.");
        const res = await Apis.get(`${endpoints.diaries}${diaryId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setDiary(res.data);
      } catch (err) {
        Alert.alert("Lỗi", "Không thể tải chi tiết nhật ký!");
      } finally {
        setLoading(false);
      }
    };
    fetchDiary();
  }, [diaryId]);

  if (loading) return <ActivityIndicator size="large" color="#3EB489" style={{ marginTop: 40 }} />;

  if (!diary) return <Text style={{ margin: 20 }}>Không tìm thấy nhật ký.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{diary.name}</Text>
      <Text style={styles.date}>
        {diary.created_date ? new Date(diary.created_date).toLocaleString() : ""}
      </Text>
      <Text style={styles.content}>{diary.content}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", color: "#3EB489", marginBottom: 8 },
  date: { color: "#888", marginBottom: 12 },
  content: { fontSize: 16, color: "#222" }
});

export default DiaryDetail;