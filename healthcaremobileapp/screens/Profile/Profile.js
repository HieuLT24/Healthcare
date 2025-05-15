import { useContext, useState, useEffect } from "react";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { Text, View, ScrollView } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, Card, ActivityIndicator } from "react-native-paper";
import { useNavigation } from "@react-navigation/native";
import { getLatestHealthStat, fetchHealthStats } from "../../utils/healthStatService";

const Profile = () => {
    const user = useContext(MyUserContext);
    const dispatch = useContext(MyDispatchContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [healthStat, setHealthStat] = useState(null);
    const [healthChanges, setHealthChanges] = useState(null);

    const logout = () => {
        dispatch({
            "type": "logout"
        });
    }

    useEffect(() => {
        const loadHealthData = async () => {
            try {
                setLoading(true);
                // Fetch latest health stat
                const latestStat = await getLatestHealthStat();
                setHealthStat(latestStat);

                // Fetch weekly changes
                const weeklyStats = await fetchHealthStats('weekly');
                setHealthChanges(weeklyStats.changes);
            } catch (err) {
                console.error("Error loading health data:", err);
                setError("Không thể tải dữ liệu sức khỏe");
            } finally {
                setLoading(false);
            }
        };

        loadHealthData();
    }, []);

    const renderHealthStats = () => {
        if (loading) {
            return <ActivityIndicator size="small" />;
        }

        if (error) {
            return <Text style={MyStyles.errorText}>{error}</Text>;
        }

        if (!healthStat) {
            return <Text>Chưa có dữ liệu sức khỏe</Text>;
        }

        return (
            <Card style={MyStyles.m}>
                <Card.Title title="Chỉ số sức khỏe hiện tại" />
                <Card.Content>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text>Cân nặng:</Text>
                        <Text>{healthStat.weight} kg</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text>Chiều cao:</Text>
                        <Text>{healthStat.height} cm</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text>BMI:</Text>
                        <Text>{healthStat.bmi?.toFixed(1)}</Text>
                    </View>
                    {healthStat.water_intake && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text>Nước uống:</Text>
                            <Text>{healthStat.water_intake} ml</Text>
                        </View>
                    )}
                    {healthStat.step_count && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text>Số bước chân:</Text>
                            <Text>{healthStat.step_count}</Text>
                        </View>
                    )}
                    {healthStat.heart_rate && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text>Nhịp tim:</Text>
                            <Text>{healthStat.heart_rate} bpm</Text>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    const renderHealthChanges = () => {
        if (loading || !healthChanges) return null;

        return (
            <Card style={MyStyles.m}>
                <Card.Title title="Sự thay đổi trong tuần" />
                <Card.Content>
                    {healthChanges.weight_change !== null && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text>Cân nặng:</Text>
                            <Text style={{ color: healthChanges.weight_change > 0 ? 'green' : 'red' }}>
                                {healthChanges.weight_change > 0 ? '+' : ''}{healthChanges.weight_change?.toFixed(1)} kg
                            </Text>
                        </View>
                    )}
                    {healthChanges.height_change !== null && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text>Chiều cao:</Text>
                            <Text style={{ color: healthChanges.height_change > 0 ? 'green' : 'red' }}>
                                {healthChanges.height_change > 0 ? '+' : ''}{healthChanges.height_change?.toFixed(1)} cm
                            </Text>
                        </View>
                    )}
                    {healthChanges.bmi_change !== null && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text>BMI:</Text>
                            <Text style={{ color: healthChanges.bmi_change > 0 ? 'green' : 'red' }}>
                                {healthChanges.bmi_change > 0 ? '+' : ''}{healthChanges.bmi_change?.toFixed(1)}
                            </Text>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    return (
        <ScrollView>
            <Text style={MyStyles.subject}>Chào {user.username}!</Text>
            
            {renderHealthStats()}
            {renderHealthChanges()}
            
            <Button onPress={logout} mode="contained" style={MyStyles.m}>Đăng xuất</Button>
        </ScrollView>
    );
}

export default Profile;