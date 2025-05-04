import { authApi, endpoints } from "../../configs/Apis"
import { useEffect, useState } from "react"
import MyStyles from "../../styles/MyStyles"
import { ActivityIndicator, ScrollView, View, Text } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Button } from "react-native-paper"

const Health = () => {
    const [statistic, setStatistic] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [period, setPeriod] = useState('weekly')
    
    const loadStatistic = async (period) => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('token')
            if(!token) {
                setError("Chưa đăng nhập");
                return;
            }   
            let url = `${endpoints['my-statistics']}?period=${period}`
            let res = await authApi(token).get(url)
            setStatistic(res.data)
        } catch (err) {
            setError("Lỗi tải dữ liệu")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadStatistic(period)
    },[period])  
   

    if (loading) {
        return (
            <View style={[MyStyles.container, MyStyles.center]}>
                <ActivityIndicator size='large' color='#0000ff' />
            </View>
        )
    }

    if (error) {
        return (
            <View style={[MyStyles.container, MyStyles.center]}>
                <Text style={MyStyles.errorText}>{error}</Text>
            </View>
        )
    }

    return (
        <ScrollView style={[MyStyles.container]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                
                <Button mode={period === 'weekly' ? "contained" : "outlined"}
                    onPress={() => setPeriod("weekly")}>
                    Tuần
                </Button>

                <Button mode={period === 'monthly' ? "contained" : "outlined"}
                    onPress={() => setPeriod("monthly")}>
                    Tháng
                </Button>


            </View>
            <View>
                <Text style={MyStyles.label}>Số buổi tập:</Text>
                <Text style={MyStyles.value}>{statistic.total_sessions}</Text>
            </View>
            <View>
                <Text style={MyStyles.label}>Tổng thời gian tập luyện:</Text>
                <Text style={MyStyles.value}>{statistic.total_time}</Text>
            </View>
            <View>
                <Text style={MyStyles.label}>Lượng Calo tiêu thụ:</Text>
                <Text style={MyStyles.value}>{statistic.total_calories_burned}</Text>
            </View>
        </ScrollView>

    )
}

export default Health;