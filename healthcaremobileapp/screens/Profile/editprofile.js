import React, { useEffect, useState, useContext } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { authApi, endpoints } from '../../api';
import { MyUserContext } from '../../configs/Contexts';

const EditProfile = () => {
  const user = useContext(MyUserContext);
  const [form, setForm] = useState({
    height: '',
    weight: '',
    age: '',
    goal: ''
  });

  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        let res = await authApi(user.access_token).get(endpoints['user-info']);
        const data = res.data[0]; // Vì API chỉ trả về 1 user
        setForm({
          height: data.height?.toString() || '',
          weight: data.weight?.toString() || '',
          age: data.age?.toString() || '',
          goal: data.goal || ''
        });
        setUserId(data.id);
      } catch (err) {
        console.error(err);
        Alert.alert('Lỗi', 'Không thể tải thông tin người dùng!');
      } finally {
        setLoading(false);
      }
    };

    loadUserInfo();
  }, []);

  const updateProfile = async () => {
    try {
      await authApi(user.access_token).put(`${endpoints['user-info']}${userId}/`, form);
      Alert.alert('Thành công', 'Cập nhật thông tin thành công!');
    } catch (err) {
      console.error(err);
      Alert.alert('Lỗi', 'Cập nhật thông tin thất bại!');
    }
  };

  if (loading) return <Text style={styles.loading}>Đang tải thông tin...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Chiều cao (cm):</Text>
      <TextInput
        style={styles.input}
        value={form.height}
        keyboardType="numeric"
        onChangeText={text => setForm({ ...form, height: text })}
      />

      <Text style={styles.label}>Cân nặng (kg):</Text>
      <TextInput
        style={styles.input}
        value={form.weight}
        keyboardType="numeric"
        onChangeText={text => setForm({ ...form, weight: text })}
      />

      <Text style={styles.label}>Tuổi:</Text>
      <TextInput
        style={styles.input}
        value={form.age}
        keyboardType="numeric"
        onChangeText={text => setForm({ ...form, age: text })}
      />

      <Text style={styles.label}>Mục tiêu sức khỏe:</Text>
      <TextInput
        style={styles.input}
        value={form.goal}
        placeholder="VD: Giảm cân, Tăng cơ, Giữ sức khỏe..."
        onChangeText={text => setForm({ ...form, goal: text })}
      />

      <Button title="Lưu thông tin" onPress={updateProfile} />
    </ScrollView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    flexGrow: 1
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4
  },
  loading: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16
  }
});
