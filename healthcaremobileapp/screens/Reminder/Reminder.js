import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert, TextInput, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';


const Reminder = () => {
    const [time, setTime] = useState('');
    const [notificationId, setNotificationId] = useState(null);
    const navigation = useNavigation();
  
    // Yêu cầu quyền gửi thông báo
    useEffect(() => {
      const requestPermission = async () => {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Cần quyền thông báo', 'Ứng dụng cần quyền thông báo để hoạt động!');
        }
      };
  
      requestPermission();
    }, []);
  
    // Đặt thông báo báo thức
    const scheduleAlarmNotification = async () => {
      const [hour, minute] = time.split(':').map(Number);
  
      if (isNaN(hour) || isNaN(minute) || hour < 0 || hour >= 24 || minute < 0 || minute >= 60) {
        Alert.alert('Lỗi', 'Vui lòng nhập giờ hợp lệ (HH:MM)');
        return;
      }
  
      const trigger = {
        hour: hour,
        minute: minute,
        repeats: false, // Không lặp lại
      };
  
      // Đặt thông báo báo thức
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Báo thức',
          body: 'Đã đến giờ dậy!',
          sound: 'default',
          vibrate: [0, 250, 250, 250], // Lặp lại rung
        },
        trigger: trigger,
      });
  
      // Cập nhật ID thông báo để hủy sau 15 giây
      setNotificationId(id);
  
      // Hủy thông báo sau 15 giây
      setTimeout(async () => {
        await Notifications.dismissNotificationAsync(id);
        Alert.alert('Thông báo hủy', 'Thông báo đã bị hủy sau 15 giây.');
      }, 15000);
  
      Alert.alert('Đặt báo thức thành công', `Báo thức đã được đặt vào ${time}`);
    };
  
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Đặt báo thức</Text>
  
        <TextInput
          style={styles.input}
          value={time}
          onChangeText={setTime}
          placeholder="Nhập giờ báo thức (HH:MM)"
          keyboardType="numeric"
        />
  
        <Button title="Đặt báo thức" onPress={scheduleAlarmNotification} />
  
        <Button
          title="Trở lại"
          onPress={() => navigation.goBack()}
          color="#065f46" // Màu tương tự màu nền mà bạn đã sử dụng
        />
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f3f4f6', // Màu nền nhẹ
      padding: 20,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 20,
      color: '#065f46', // Màu tiêu đề tương tự màu nền bạn đã dùng
    },
    input: {
      height: 50,
      width: '100%',
      borderColor: '#ccc',
      borderWidth: 1,
      borderRadius: 10,
      paddingLeft: 10,
      marginBottom: 20,
    },
  });
  
  export default Reminder;