import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from '../../configs/Apis';
import { useFocusEffect } from '@react-navigation/native';

const DiaryList = ({ navigation }) => {
  const [diaries, setDiaries] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDiaries = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      if (!token) throw new Error("Chưa đăng nhập.");
      let res = await Apis.get(endpoints.diaries, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDiaries(res.data.results || res.data); // Nếu backend dùng pagination
    } catch (err) {
      alert("Không thể tải danh sách nhật ký!");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDiaries();
    }, [])
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.diaryItem}
      onPress={() => navigation.navigate("DiaryDetail", { diaryId: item.id })}
    >
      <Text style={styles.diaryTitle}>{item.name}</Text>
      <Text numberOfLines={2} style={styles.diaryContent}>{item.content}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Nhật ký của bạn</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate("CreateDiary")}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#3EB489" />
      ) : (
        <FlatList
          data={diaries}
          keyExtractor={item => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f6f6f6"
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#3EB489"
  },
  addButton: {
    backgroundColor: "#3EB489",
    borderRadius: 20,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center"
  },
  addButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold"
  },
  diaryItem: {
    backgroundColor: "#F2F2F2",
    borderRadius: 10,
    padding: 16,
    marginBottom: 12
  },
  diaryTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#3EB489"
  },
  diaryContent: {
    color: "#333",
    marginTop: 4
  }
});

export default DiaryList;