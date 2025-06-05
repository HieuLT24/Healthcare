import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { Button } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Apis, { endpoints } from "../../configs/Apis";
import MyStyles from "../../styles/MyStyles";
import { useFocusEffect } from "@react-navigation/native";



const Profile = () => {
    const navigation = useNavigation();
    const [firstname, setFirstname] = useState("");
    const [loading, setLoading] = useState(false);

    // Thêm state cho chỉ số sức khỏe
    const [latestHealth, setLatestHealth] = useState(null);
    const [loadingHealth, setLoadingHealth] = useState(true);

    // Hàm tải thông tin người dùng
    const fetchUserInfo = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) throw new Error("Access token không tồn tại. Vui lòng đăng nhập lại.");
            let userResponse = await Apis.get(endpoints["current-user"], {
                headers: { Authorization: `Bearer ${token}` }
            });
            setFirstname(userResponse.data.first_name || "");
        } catch (error) {
            Alert.alert("Lỗi", "Không thể tải thông tin người dùng. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    // Hàm lấy chỉ số sức khỏe mới nhất
    const fetchHealthStat = async () => {
        try {
            setLoadingHealth(true);
            const token = await AsyncStorage.getItem("token");
            if (!token) return;
            const res = await Apis.get(endpoints["health-stats"], {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = res.data.results ? res.data.results : res.data;
            console.log("HealthStat data:", data);
            let latest = null;
            if (data.length > 0) {
                latest = data.reduce((a, b) => (a.id > b.id ? a : b));
            }
            setLatestHealth(latest);
        } catch (err) {
            setLatestHealth(null);
        } finally {
            setLoadingHealth(false);
        }
    };

// Luôn reload dữ liệu khi vào lại trang hồ sơ
    useFocusEffect(
        React.useCallback(() => {
            fetchUserInfo();
            fetchHealthStat();
        }, [])
    );
    const logout = async () => {
        try {
            await AsyncStorage.removeItem("token");
            navigation.navigate("Login");
        } catch (error) {
            Alert.alert("Lỗi", "Không thể đăng xuất. Vui lòng thử lại.");
        }
    };

    return (
        <View style={styles.container}>
            {/* Chào người dùng */}
            <View style={styles.greetingBox}>
                <Text style={styles.greetingText}>
                    👋 Xin chào, <Text style={styles.greetingName}>{firstname || "Người dùng"}</Text>!
                </Text>
            </View>

            {/* Hiển thị chỉ số sức khỏe */}
            <View style={styles.healthBox}>
                <Text style={styles.healthTitle}>Chỉ số sức khỏe gần nhất</Text>
                {loadingHealth ? (
                    <ActivityIndicator size="small" color="#3EB489" />
                ) : latestHealth ? (
                    <View style={styles.healthGrid}>
                        <View style={styles.healthRow}>
                            <Text style={styles.icon}>📏</Text>
                            <Text style={styles.healthItem}>BMI</Text>
                            <Text style={styles.healthValue}>{latestHealth.bmi ?? "?"}</Text>
                        </View>
                        <View style={styles.healthRow}>
                            <Text style={styles.icon}>💧</Text>
                            <Text style={styles.healthItem}>Lượng nước</Text>
                            <Text style={styles.healthValue}>{latestHealth.water_intake ?? "?"} lít</Text>
                        </View>
                        <View style={styles.healthRow}>
                            <Text style={styles.icon}>👣</Text>
                            <Text style={styles.healthItem}>Số bước đi</Text>
                            <Text style={styles.healthValue}>{latestHealth.step_count ?? "?"}</Text>
                        </View>
                        <View style={styles.healthRow}>
                            <Text style={styles.icon}>❤️</Text>
                            <Text style={styles.healthItem}>Nhịp tim</Text>
                            <Text style={styles.healthValue}>{latestHealth.heart_rate ?? "?"} bpm</Text>
                        </View>
                        <View style={styles.healthRow}>
                            <Text style={styles.icon}>📅</Text>
                            <Text style={styles.healthItem}>Ngày ghi nhận</Text>
                            <Text style={styles.healthValue}>{latestHealth.date ?? "?"}</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={{ color: "#444", marginTop: 8 }}>Chưa có dữ liệu sức khỏe</Text>
                )}
            </View>

            {/* Nút cập nhật thông tin cá nhân */}
            <Button
                mode="contained"
                style={styles.button}
                onPress={() => navigation.navigate("UserInfoForm")}
                loading={loading}
                disabled={loading}
                buttonColor="#3EB489"
                textColor="#fff"
            >
                Cập nhật thông tin cá nhân
            </Button>

            <Button
                mode="contained"
                style={styles.logoutButton}
                onPress={logout}
                buttonColor="#ef4444"
                textColor="#fff"
            >
                Đăng xuất
            </Button>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "center",
        padding: 20,
        backgroundColor: "#f6f6f6",
    },
    greetingBox: {
        width: "100%",
        marginTop: 24,
        marginBottom: 10,
        alignItems: "flex-start",
        paddingLeft: 4,
    },
    greetingText: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#065f46",
        letterSpacing: 0.2,
    },
    greetingName: {
        color: "#3EB489",
        fontWeight: "bold",
    },
    button: {
        marginTop: 18,
        width: "100%",
        borderRadius: 10,
        elevation: 2,
    },
    logoutButton: {
        marginTop: 15,
        width: "100%",
        backgroundColor: "#ef4444",
        borderRadius: 10,
        elevation: 2,
    },
    healthBox: {
        marginTop: 18,
        marginBottom: 10,
        padding: 18,
        borderRadius: 16,
        backgroundColor: "#fff",
        width: "100%",
        alignItems: "flex-start",
        shadowColor: "#B0BEC5",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.11,
        shadowRadius: 6,
        elevation: 2,
        borderWidth: 1,
        borderColor: "#3EB489"
    },
    healthTitle: {
        fontWeight: "bold",
        color: "#065f46",
        fontSize: 17,
        marginBottom: 12,
        alignSelf: "center",
        letterSpacing: 0.5,
    },
    healthGrid: {
        width: "100%",
    },
    healthRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        paddingVertical: 4,
        borderBottomWidth: 0.5,
        borderBottomColor: "#e0e0e0",
    },
    icon: {
        fontSize: 20,
        width: 32,
        textAlign: "center",
        marginRight: 8,
    },
    healthItem: {
        fontSize: 15,
        color: "#065f46",
        flex: 1,
    },
    healthValue: {
        fontWeight: "bold",
        color: "#10b981",
        fontSize: 16,
        minWidth: 60,
        textAlign: "right",
    },
});

export default Profile;