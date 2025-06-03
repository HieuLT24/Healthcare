import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert, Platform } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as Notifications from 'expo-notifications';
import { useNavigation } from '@react-navigation/native';
import moment from 'moment';
import { TextInput, Menu, Button, Divider, Provider, Switch } from 'react-native-paper';
import { TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RefreshableScreen from '../../components/RefreshableScreen';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const Reminder = () => {
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const navigation = useNavigation();
  const [action, setAction] = useState('');
  const [visible, setVisible] = React.useState(false);
  const [reminders, setReminders] = useState([]);
  const openMenu = () => setVisible(true);
  const closeMenu = () => setVisible(false);

  useEffect(() => {
    const requestPermission = async () => {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert('Cần quyền thông báo', 'Ứng dụng cần quyền thông báo để hoạt động!');
        return;
      }

      
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    };
    requestPermission();
    loadReminders(); // Load reminders on component mount
  }, []);

  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);

  const handleConfirm = (date) => {
    setSelectedTime(date);
    hideTimePicker();
  };

  const scheduleAlarmNotification = async () => {
    if (!selectedTime) {
      Alert.alert('Lỗi', 'Vui lòng chọn giờ nhắc nhở trước!');
      return;
    }

    if (!action) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại nhắc nhở!');
      return;
    }

    try {
      const reminderId = `reminder_${Date.now()}`;
      
      const now = new Date();
      const trigger = new Date(selectedTime);
      trigger.setSeconds(0);

      if (trigger <= now) {
        trigger.setDate(trigger.getDate() + 1);
      }

      const newReminder = {
        id: reminderId,
        time: trigger,
        action: action,
        enabled: true
      };

      // Cập nhật UI ngay lập tức
      setReminders(prevReminders => [...prevReminders, newReminder]);

      // Reset form ngay lập tức
      setSelectedTime(null);
      setAction('');

      // Hiển thị thông báo thành công ngay lập tức
      Alert.alert(
        'Thành công',
        `Đã đặt nhắc nhở lúc ${moment(trigger).format('HH:mm')}`,
        [{ text: 'OK' }]
      );

      // Lên lịch thông báo sau khi UI đã được cập nhật
      await Notifications.scheduleNotificationAsync({
        identifier: reminderId,
        content: {
          title: 'Nhắc nhở',
          body: `Đã đến giờ ${action}`,
          sound: true,
          vibrate: [0, 250, 250, 250],
          priority: Notifications.AndroidNotificationPriority.HIGH,
        },
        trigger: {
          type: 'date',
          date: trigger,
        }
      });

    } catch (error) {
      setReminders(prevReminders => 
        prevReminders.filter(r => r.id !== reminderId)
      );
      Alert.alert('Lỗi', 'Không thể đặt nhắc nhở: ' + error.message);
      console.error('Error scheduling notification:', error);
    }
  };

  // Kiểm tra thời gian hợp lệ
  const isValidTime = (time) => {
    if (!time) return false;
    const now = new Date();
    const selected = new Date(time);
    return selected > now;
  };

  //  format thời gian hiển thị
  const formatTime = (time) => {
    if (!time) return 'Chọn giờ';
    return moment(time).format('HH:mm');
  };

  const toggleReminder = async (reminder) => {
    try {
      // Cập nhật UI ngay lập tức
      setReminders(prevReminders => 
        prevReminders.map(r => 
          r.id === reminder.id ? { ...r, enabled: !r.enabled } : r
        )
      );

      if (reminder.enabled) {
        // Tắt nhắc nhở
        await Notifications.cancelScheduledNotificationAsync(reminder.id);
      } else {
        // Bật lại nhắc nhở
        const now = new Date();
        const trigger = new Date(reminder.time);
        trigger.setSeconds(0);

        if (trigger <= now) {
          trigger.setDate(trigger.getDate() + 1);
        }

        await Notifications.scheduleNotificationAsync({
          identifier: reminder.id,
          content: {
            title: 'Nhắc nhở',
            body: `Đã đến giờ ${reminder.action}`,
            sound: true,
            vibrate: [0, 250, 250, 250],
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: {
            type: 'date',
            date: trigger,
          }
        });
      }
    } catch (error) {
      // Nếu có lỗi, khôi phục lại trạng thái
      setReminders(prevReminders => 
        prevReminders.map(r => 
          r.id === reminder.id ? { ...r, enabled: !r.enabled } : r
        )
      );
      Alert.alert('Lỗi', 'Không thể thay đổi trạng thái nhắc nhở: ' + error.message);
    }
  };

  // Thêm hàm để lưu trạng thái reminders vào AsyncStorage
  const saveReminders = async (updatedReminders) => {
    try {
      await AsyncStorage.setItem('reminders', JSON.stringify(updatedReminders));
    } catch (error) {
      console.error('Error saving reminders:', error);
    }
  };

  //  lưu reminders khi có thay đổi
  useEffect(() => {
    if (reminders.length > 0) {
      saveReminders(reminders);
    }
  }, [reminders]);

  const loadReminders = async () => {
    try {
      const storedReminders = await AsyncStorage.getItem('reminders');
      if (storedReminders) {
        const parsedReminders = JSON.parse(storedReminders);
        setReminders(parsedReminders);
      }
    } catch (error) {
      console.error('Error loading reminders:', error);
    }
  };

  const handleRefresh = async () => {
    await loadReminders();
  };

  const cancelReminder = async (reminderId) => {
    try {
      // Cập nhật UI ngay lập tức
      setReminders(prevReminders => 
        prevReminders.filter(r => r.id !== reminderId)
      );

      // Hiển thị thông báo thành công ngay lập tức
      Alert.alert('Thành công', 'Đã xóa nhắc nhở', [{ text: 'OK' }]);

      // Hủy thông báo sau khi UI đã được cập nhật
      await Notifications.cancelScheduledNotificationAsync(reminderId);
    } catch (error) {
      // Nếu có lỗi, khôi phục lại nhắc nhở trong danh sách
      const reminder = reminders.find(r => r.id === reminderId);
      if (reminder) {
        setReminders(prevReminders => [...prevReminders, reminder]);
      }
      Alert.alert('Lỗi', 'Không thể xóa nhắc nhở: ' + error.message);
    }
  };

  const reminderOptions = [
    { label: 'Uống nước', value: 'Uống nước' },
    { label: 'Nghỉ ngơi', value: 'Nghỉ ngơi' },
    { label: 'Luyện tập', value: 'Luyện tập' },
  ];

  return (
    <RefreshableScreen onRefreshCallback={handleRefresh}>
      <View style={styles.container}>
        <Text style={styles.title} marginTop='0'>Đặt Nhắc nhở</Text>

        <Button 
          mode="outlined" 
          onPress={showTimePicker} 
          style={[styles.button, selectedTime && styles.buttonSelected]}
          labelStyle={selectedTime ? styles.buttonLabelSelected : styles.buttonLabel}
        >
          {formatTime(selectedTime)}
        </Button>

        <DateTimePickerModal
          isVisible={isTimePickerVisible}
          mode="time"
          onConfirm={handleConfirm}
          onCancel={hideTimePicker}
          locale="vi"
          is24Hour={true}
          minimumDate={new Date()} // Không cho phép chọn thời gian trong quá khứ
        />

        <Menu
          visible={visible}
          onDismiss={closeMenu}
          anchor={
            <TouchableOpacity 
              onPress={openMenu} 
              style={[styles.menuButton, action && styles.menuButtonSelected]}
            >
              <Text style={[styles.menuButtonText, action && styles.menuButtonTextSelected]}>
                {action ? `Đã chọn: ${action}` : 'Chọn loại nhắc nhở'}
              </Text>
            </TouchableOpacity>
          }>
          {reminderOptions.map((option) => (
            <Menu.Item
              key={option.value}
              onPress={() => {
                setAction(option.value);
                closeMenu();
              }}
              title={option.label}
            />
          ))}
        </Menu>

        <View style={styles.buttonContainer}>
          <Button 
            mode="contained" 
            onPress={scheduleAlarmNotification}
            style={[styles.scheduleButton, (!selectedTime || !action) && styles.buttonDisabled]}
            disabled={!selectedTime || !action}
          >
            Đặt nhắc nhở
          </Button>
        </View>

        {reminders.length > 0 && (
          <View style={styles.remindersList}>
            <Text style={styles.remindersTitle}>Danh sách nhắc nhở</Text>
            {reminders.map((reminder) => (
              <View key={reminder.id} style={styles.reminderItem}>
                <View style={styles.reminderInfo}>
                  <Text style={[
                    styles.reminderText,
                    !reminder.enabled && styles.reminderTextDisabled
                  ]}>
                    {moment(reminder.time).format('HH:mm')} - {reminder.action}
                  </Text>
                  <Switch
                    value={reminder.enabled}
                    onValueChange={() => toggleReminder(reminder)}
                    color="#065f46"
                  />
                </View>
                <Button
                  mode="text"
                  onPress={() => cancelReminder(reminder.id)}
                  style={styles.cancelButton}
                >
                  Xóa
                </Button>
              </View>
            ))}
          </View>
        )}
      </View>
    </RefreshableScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#065f46'
  },
  buttonContainer: {
    width: '100%',
    marginTop: 20,
    gap: 10
  },
  button: {
    width: '100%',
    marginVertical: 10
  },
  scheduleButton: {
    backgroundColor: '#065f46'
  },
  backButton: {
    borderColor: '#065f46'
  },
  menuButton: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderColor: '#065f46',
    borderRadius: 4,
    marginVertical: 10
  },
  menuButtonText: {
    color: '#065f46',
    textAlign: 'center'
  },
  remindersList: {
    width: '100%',
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8
  },
  remindersTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 10
  },
  reminderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  reminderInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reminderText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  reminderTextDisabled: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
  cancelButton: {
    marginLeft: 10
  },
  buttonSelected: {
    borderColor: '#065f46',
    backgroundColor: '#f0fdf4',
  },
  buttonLabel: {
    color: '#065f46',
  },
  buttonLabelSelected: {
    color: '#065f46',
    fontWeight: 'bold',
  },
  menuButtonSelected: {
    borderColor: '#065f46',
    backgroundColor: '#f0fdf4',
  },
  menuButtonTextSelected: {
    color: '#065f46',
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

export default Reminder;
