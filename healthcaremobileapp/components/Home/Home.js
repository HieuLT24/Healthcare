import Apis, { authApi, endpoints } from "../../configs/Apis"
import { useEffect, useState } from "react"
import MyStyles from "../../styles/MyStyles"
import { ActivityIndicator, ScrollView, View, Text } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"


const Home = () => {
    const [statistic, setStatistic] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const loadStatistic = async () => {
            try {
                const token = await AsyncStorage.getItem('token')
                if(!token) {
                    setError("Chưa đăng nhập");
                    return;
                }

                let res = await authApi(token).get(endpoints['my-statistics'])
                setStatistic(res.data)
            } catch (err) {
                setError("Lỗi tải dữ liệu")
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        loadStatistic()

    }, [])
    
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
            <Text style={MyStyles.header}>Cá nhân</Text>

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




export default Home;





















