import React, { useState } from "react";
import { View, TextInput, StyleSheet, Alert } from "react-native";
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
    const [loading, setLoading] = useState(false); // Trạng thái tải dữ liệu
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

            const userId = await AsyncStorage.getItem("userId");
            if (!userId) {
                throw new Error("Không tìm thấy userId. Vui lòng đăng nhập lại.");
            }

            // Dữ liệu gửi lên API User
            const data = {
                height: parseFloat(height),
                weight: parseFloat(weight),
                age,
                health_goals: healthGoals,
            };

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
                    heart_rate: heartRate ? parseInt(heartRate) : null
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
            // Hiển thị lỗi chi tiết từ backend nếu có
            console.error("Lỗi khi cập nhật thông tin cá nhân:", error?.response?.data || error);
            Alert.alert("Lỗi", "Không thể cập nhật thông tin cá nhân.");
        } finally {
            setLoading(false);
        }
    };
    return (
        <View style={styles.container}>
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
                loading={loading} // Hiển thị trạng thái loading
                disabled={loading} // Vô hiệu hóa khi đang tải
            >
                Lưu
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    input: {
        height: 40,
        borderColor: "gray",
        borderWidth: 1,
        marginBottom: 10,
        paddingHorizontal: 10,
    },
    button: {
        marginTop: 15,
        width: "100%",
    },
});

export default UserInfoForm;