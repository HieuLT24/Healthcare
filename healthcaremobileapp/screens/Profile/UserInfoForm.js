import React, { useState } from "react";
import { ScrollView, TextInput, StyleSheet, Alert } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, endpoints } from "../../configs/Apis";

const UserInfoForm = () => {
    const navigation = useNavigation();

    const [height, setHeight] = useState("");
    const [weight, setWeight] = useState("");
    const [age, setAge] = useState("");
    const [healthGoals, setHealthGoals] = useState("");
    const [loading, setLoading] = useState(false);
    const [waterIntake, setWaterIntake] = useState("");
    const [stepCount, setStepCount] = useState("");
    const [heartRate, setHeartRate] = useState("");

    const handleSave = async () => {
        try {
            setLoading(true);

            // Kiểm tra dữ liệu nhập vào
            if (!height || isNaN(parseFloat(height)) || !weight || isNaN(parseFloat(weight))) {
                Alert.alert("Lỗi", "Vui lòng nhập chiều cao và cân nặng hợp lệ!");
                setLoading(false);
                return;
            }

            const token = await AsyncStorage.getItem("token");
            if (!token) {
                throw new Error("Access token không tồn tại. Vui lòng đăng nhập lại.");
            }

            const userId = await AsyncStorage.getItem("currentUserId");
            if (!userId) {
                throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
            }

            // Dữ liệu gửi lên API User
            const currentDate = new Date().toISOString().split('T')[0];
            const data = {
                height: parseFloat(height),
                weight: parseFloat(weight),
                health_goals: healthGoals,
                date: currentDate,
            };
            if (age && !isNaN(Number(age))) {
                data.age = Number(age);
            }

            // Cập nhật thông tin User
            const api = authApi(token);
            await api.patch(
                endpoints["user-infor"](userId),
                data,
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                }
            );

            // Tạo mới bản ghi HealthStat cho ngày hôm nay
            await api.post(
                endpoints["health-stats"],
                {
                    user: userId,
                    height: parseFloat(height),
                    weight: parseFloat(weight),
                    water_intake: waterIntake ? parseFloat(waterIntake) : 0,
                    step_count: stepCount ? parseInt(stepCount) : 0,
                    heart_rate: heartRate ? parseInt(heartRate) : null,
                    date: currentDate,
                },
                {
                    headers: {
                        "Content-Type": "application/json"
                    },
                }
            );

            Alert.alert("Thành công", "Thông tin đã được cập nhật!");
            navigation.goBack();
        } catch (error) {
            console.error("Lỗi khi cập nhật thông tin cá nhân:", error?.response?.data || error);
            Alert.alert("Lỗi", "Không thể cập nhật thông tin cá nhân.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
            <TextInput
                style={styles.input}
                placeholder="Chiều cao (m)"
                value={height}
                onChangeText={setHeight}
                keyboardType="decimal-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Cân nặng (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="decimal-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Tuổi"
                value={age}
                onChangeText={setAge}
                keyboardType="number-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Lượng nước uống (lít)"
                value={waterIntake}
                onChangeText={setWaterIntake}
                keyboardType="decimal-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Số bước đi"
                value={stepCount}
                onChangeText={setStepCount}
                keyboardType="number-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Nhịp tim (bpm)"
                value={heartRate}
                onChangeText={setHeartRate}
                keyboardType="number-pad"
            />
            <TextInput
                style={styles.input}
                placeholder="Mục tiêu sức khỏe"
                value={healthGoals}
                onChangeText={setHealthGoals}
            />
            <Button
                mode="contained"
                style={styles.button}
                onPress={handleSave}
                loading={loading}
                disabled={loading}
            >
                Lưu
            </Button>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingBottom: 40,
    },
    input: {
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
        borderRadius: 6,
        backgroundColor: "#fff"
    },
    button: {
        marginTop: 15,
        width: "100%",
        borderRadius: 8,
    },
});

export default UserInfoForm;