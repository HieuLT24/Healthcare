// import { authApi, endpoints } from "../../configs/Apis"
// import { useEffect, useState } from "react"
// import MyStyles from "../../styles/MyStyles"
// import { ActivityIndicator, ScrollView, View, Text } from "react-native"
// import AsyncStorage from "@react-native-async-storage/async-storage"
// import { Button, Card, useTheme } from "react-native-paper"

// import { LineChart } from 'react-native-chart-kit';
// import { Dimensions } from 'react-native';
// import moment from 'moment';




// const Health = () => {
//     const [statistic, setStatistic] = useState([])
//     const [loading, setLoading] = useState(true)
//     const [error, setError] = useState(null)
//     const [period, setPeriod] = useState('weekly')

//     const loadStatistic = async (period) => {
//         try {
//             setLoading(true);
//             setError(null);

//             const token = await AsyncStorage.getItem('token')
//             if (!token) {
//                 setError("Chưa đăng nhập");
//                 return;
//             }
//             let url = `${endpoints['my-statistics']}?period=${period}`
//             let res = await authApi(token).get(url)
//             setStatistic(res.data)
//         } catch (err) {
//             setError("Lỗi tải dữ liệu")
//             console.error(err)
//         } finally {
//             setLoading(false)
//         }
//     }

//     // Load lại dữ liệu khi period thay đổi
//     useEffect(() => {
//         loadStatistic(period)
//     }, [period])


//     if (loading) {
//         return (
//             <View style={[MyStyles.container, MyStyles.center]}>
//                 <ActivityIndicator size='large' color='#0000ff' />
//             </View>
//         )
//     }

//     if (error) {
//         return (
//             <View style={[MyStyles.container, MyStyles.center]}>
//                 <Text style={MyStyles.errorText}>{error}</Text>
//             </View>
//         )
//     }

//     const screenWidth = Dimensions.get('window').width;

//     const chartConfig = {
//         backgroundGradientFrom: "#f0fdf4",
//         backgroundGradientTo: "#f0fdf4",
//         decimalPlaces: 0,
//         color: (opacity = 1) => `rgba(6, 95, 70, ${opacity})`,
//         labelColor: (opacity = 1) => `rgba(6, 95, 70, ${opacity})`,
//         style: {
//             borderRadius: 16
//         },
//         propsForDots: {
//             r: "5",
//             strokeWidth: "2",
//             stroke: "#34d399"
//         }
//     };

//     const showStatisticData = (statistic, period = 'weekly') => {
//         const today = moment();
//         let dateRange;
//         const startOfMonth = today.clone().startOf('month');
//         const endOfMonth = today.clone().endOf('month');
//         const daysInMonth = endOfMonth.date();

//         if (period === 'weekly') {
//             const monday = today.clone().startOf('isoWeek');
//             dateRange = Array.from({ length: 7 }).map((_, i) =>
//                 monday.clone().add(i, 'days'))
//         } else {
//             dateRange = Array.from({ length: daysInMonth }).map((_, i) =>
//                 startOfMonth.clone().add(i, 'days')
//             );
//         }

//         const labels = dateRange.map((d, i) => {
//             if (period === 'weekly') {
//                 return d.format('ddd');
//             } else {
//                 return (i % 5 === 0) ? d.format('DD') : '';
//             }
//         }
//         );
//         const total_sessions = statistic?.total_sessions || 0

//         const total_calories_burned = Array.isArray(statistic?.total_calories_burned)
//             ? statistic.total_calories_burned
//             : new Array(labels.length).fill(0);

//         const total_time = Array.isArray(statistic?.total_time)
//             ? statistic.total_time
//             : new Array(labels.length).fill(0);

//         return { labels, total_sessions, total_calories_burned, total_time };
//     }

//     const { labels, total_sessions, total_calories_burned, total_time } = showStatisticData(statistic, period);
//     console.log("showStatistic data: ", showStatisticData(statistic, period))

//     return (

//         <ScrollView >
//             <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 16 }}>
//                 <Button
//                     mode={period === 'weekly' ? 'contained' : 'outlined'}
//                     onPress={() => setPeriod('weekly')}
//                     style={{ marginHorizontal: 8 }}
//                     buttonColor="#a7f3d0"
//                     textColor="#065f46"
//                 >
//                     Tuần
//                 </Button>
//                 <Button
//                     mode={period === 'monthly' ? 'contained' : 'outlined'}
//                     onPress={() => setPeriod('monthly')}
//                     style={{ marginHorizontal: 8 }}
//                     buttonColor="#a7f3d0"
//                     textColor="#065f46"
//                 >
//                     Tháng
//                 </Button>
//             </View>
//             <View style={{ marginVertical: 16 }}>
//                 <Text style={[MyStyles.label, { marginLeft: 12 }]}>Số buổi đã tập luyện</Text>
//                 <Text style={[MyStyles.label, { marginLeft: 12 }, { fontSize: 30 }]}> {total_sessions}</Text>

//                 <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Lượng Calo tiêu thụ</Text>
//                 <LineChart
//                     data={{
//                         labels: labels,
//                         datasets: [{ data: total_calories_burned }]
//                     }}
//                     width={screenWidth - 24}
//                     height={220}
//                     chartConfig={chartConfig}
//                     bezier
//                     style={{ borderRadius: 12, marginHorizontal: 12 }}
//                     formatYLabel={() => ''}
//                     withInnerLines={false}
//                     withOuterLines={false}
//                     renderDotContent={({ x, y, index, indexData }) => {
//                         if (indexData > 0) {
//                             return (
//                                 <Text
//                                     key={index}
//                                     style={{
//                                         position: 'absolute',
//                                         top: y - 24,
//                                         left: x - 10,
//                                         fontSize: 12,
//                                         color: '#065f46',
//                                         fontWeight: 'bold',
//                                     }}
//                                 >
//                                     {indexData}
//                                 </Text>
//                             );
//                         }
//                         return null;
//                     }}
//                 />

//                 <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Thời gian luyện tập (phút)</Text>
//                 <LineChart
//                     data={{
//                         labels: labels,
//                         datasets: [{ data: total_time }]
//                     }}
//                     width={screenWidth - 24}
//                     height={220}
//                     chartConfig={chartConfig}
//                     bezier
//                     formatYLabel={() => ''}
//                     withInnerLines={false}
//                     withOuterLines={false}
//                     style={{ borderRadius: 12, marginHorizontal: 12 }}
//                     renderDotContent={({ x, y, index, indexData }) => {
//                         if (indexData > 0) {
//                             return (
//                                 <Text
//                                     key={index}
//                                     style={{
//                                         position: 'absolute',
//                                         top: y - 24,
//                                         left: x - 10,
//                                         fontSize: 12,
//                                         color: '#065f46',
//                                         fontWeight: 'bold',
//                                     }}
//                                 >
//                                     {indexData}
//                                 </Text>
//                             );
//                         }
//                         return null;
//                     }}
//                 />
//             </View>
//         </ScrollView>
//     );
// };

// export default Health;