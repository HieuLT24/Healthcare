import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { List, Switch, Text, Divider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

const NotificationSettings = () => {
    const [settings, setSettings] = useState({
        medicationReminder: true,
        appointmentReminder: true,
        healthTips: true,
        exerciseReminder: true,
        waterReminder: true
    });

    // Load settings from storage
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const savedSettings = await AsyncStorage.getItem('notificationSettings');
            if (savedSettings) {
                setSettings(JSON.parse(savedSettings));
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    // Save settings to storage
    const saveSettings = async (newSettings) => {
        try {
            await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
            setSettings(newSettings);
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    };

    // Toggle notification setting
    const toggleSetting = async (key) => {
        const newSettings = {
            ...settings,
            [key]: !settings[key]
        };
        await saveSettings(newSettings);

        // Nếu tắt thông báo, hủy tất cả thông báo liên quan
        if (!newSettings[key]) {
            await Notifications.cancelScheduledNotificationAsync(key);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <List.Section>
                <List.Subheader>Thông báo</List.Subheader>
                
                <List.Item
                    title="Nhắc nhở uống thuốc"
                    description="Nhận thông báo khi đến giờ uống thuốc"
                    left={props => <List.Icon {...props} icon="pill" />}
                    right={() => (
                        <Switch
                            value={settings.medicationReminder}
                            onValueChange={() => toggleSetting('medicationReminder')}
                        />
                    )}
                />
                <Divider />

                <List.Item
                    title="Nhắc lịch hẹn"
                    description="Nhận thông báo trước khi có lịch hẹn khám bệnh"
                    left={props => <List.Icon {...props} icon="calendar" />}
                    right={() => (
                        <Switch
                            value={settings.appointmentReminder}
                            onValueChange={() => toggleSetting('appointmentReminder')}
                        />
                    )}
                />
                <Divider />

                <List.Item
                    title="Mẹo sức khỏe"
                    description="Nhận các mẹo và thông tin hữu ích về sức khỏe"
                    left={props => <List.Icon {...props} icon="heart" />}
                    right={() => (
                        <Switch
                            value={settings.healthTips}
                            onValueChange={() => toggleSetting('healthTips')}
                        />
                    )}
                />
                <Divider />

                <List.Item
                    title="Nhắc tập thể dục"
                    description="Nhận thông báo nhắc nhở tập thể dục"
                    left={props => <List.Icon {...props} icon="run" />}
                    right={() => (
                        <Switch
                            value={settings.exerciseReminder}
                            onValueChange={() => toggleSetting('exerciseReminder')}
                        />
                    )}
                />
                <Divider />

                <List.Item
                    title="Nhắc uống nước"
                    description="Nhận thông báo nhắc nhở uống nước"
                    left={props => <List.Icon {...props} icon="water" />}
                    right={() => (
                        <Switch
                            value={settings.waterReminder}
                            onValueChange={() => toggleSetting('waterReminder')}
                        />
                    )}
                />
            </List.Section>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
});

export default NotificationSettings; 