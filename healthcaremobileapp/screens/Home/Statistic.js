import { authApi, endpoints } from "../../configs/Apis"
import { useEffect, useState } from "react"
import MyStyles from "../../styles/MyStyles"
import { ActivityIndicator, ScrollView, View, Text } from "react-native"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { Button, Card, useTheme, Menu, Divider } from "react-native-paper"
import RefreshableScreen from "../../components/RefreshableScreen"
import { useNavigation, useRoute } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import { TouchableOpacity } from 'react-native'

import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import moment from 'moment';

const Statistic = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { targetUserId, targetUserName, isViewingOtherUser } = route.params || {};
    
    const [statistic, setStatistic] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [period, setPeriod] = useState('weekly')
    const [selectedDate, setSelectedDate] = useState(moment())
    const [menuVisible, setMenuVisible] = useState(false)
    const [healthStats, setHealthStats] = useState([]);
    const [loadingHealth, setLoadingHealth] = useState(true);

    const loadStatistic = async (period, date) => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('token')
            if (!token) {
                setError("Chưa đăng nhập");
                return;
            }
            
            let url = `${endpoints['my-statistics']}?period=${period}`
            
            // Thêm user_id parameter nếu đang xem dữ liệu của người khác
            if (isViewingOtherUser && targetUserId) {
                url += `&user_id=${targetUserId}`;
            }
            
            if (period === 'weekly') {
                url += `&week=${date.format('YYYY-[W]WW')}`
            } else if (period === 'monthly') {
                url += `&month=${date.format('YYYY-MM')}`
            } else if (period === 'yearly') {
                url += `&year=${date.format('YYYY')}`
            }
            let res = await authApi(token).get(url)
            setStatistic(res.data)
        } catch (err) {
            setError("Lỗi tải dữ liệu")
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    // Load lại dữ liệu khi period hoặc selectedDate thay đổi
    useEffect(() => {
        loadStatistic(period, selectedDate)
    }, [period, selectedDate])

    const handleRefresh = async () => {
        // Force reset to personal view
        if (route.params) {
            navigation.setParams({
                ...route.params,
                targetUserId: undefined,
                targetUserName: undefined,
                isViewingOtherUser: false
            });
        }
        await loadStatistic(period, selectedDate);
    };

    const getDateOptions = () => {
        const today = moment();
        const options = [];

        if (period === 'weekly') {
            // Tạo danh sách 4 tuần gần nhất
            for (let i = 0; i < 4; i++) {
                const weekDate = today.clone().subtract(i, 'weeks');
                const weekStart = weekDate.clone().startOf('isoWeek');
                const weekEnd = weekDate.clone().endOf('isoWeek');
                options.push({
                    label: `Tuần ${weekDate.format('WW')} (${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM')})`,
                    value: weekDate
                });
            }
        } else if (period === 'monthly') {
            // Tạo danh sách các tháng từ đầu năm đến tháng hiện tại
            const currentYear = today.year();
            const currentMonth = today.month(); // 0-11
            
            for (let i = 0; i <= currentMonth; i++) {
                const monthDate = moment().year(currentYear).month(i).date(1);
                options.push({
                    label: monthDate.format('MMMM YYYY'),
                    value: monthDate
                });
            }
        } else if (period === 'yearly') {
            // Tạo danh sách nhiều năm (từ 2020 đến năm hiện tại)
            const currentYear = today.year();
            for (let year = 2020; year <= currentYear; year++) {
                const yearDate = moment().year(year).startOf('year');
                options.push({
                    label: yearDate.format('YYYY'),
                    value: yearDate
                });
            }
        }

        return options;
    };

    const getCurrentDateLabel = () => {
        if (period === 'weekly') {
            const weekStart = selectedDate.clone().startOf('isoWeek');
            const weekEnd = selectedDate.clone().endOf('isoWeek');
            return `Tuần ${selectedDate.format('WW')} (${weekStart.format('DD/MM')} - ${weekEnd.format('DD/MM')})`;
        } else if (period === 'monthly') {
            return selectedDate.format('MMMM YYYY');
        } else {
            return selectedDate.format('YYYY');
        }
    };

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

    const screenWidth = Dimensions.get('window').width;

    const chartConfig = {
        backgroundGradientFrom: "#f0fdf4",
        backgroundGradientTo: "#f0fdf4",
        decimalPlaces: 0,
        color: (opacity = 1) => `rgba(6, 95, 70, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(6, 95, 70, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: "#34d399"
        }
    };

    const healthChartConfig = {
        backgroundGradientFrom: "#f0fdf4",
        backgroundGradientTo: "#f0fdf4",
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        style: {
            borderRadius: 16
        },
        propsForDots: {
            r: "5",
            strokeWidth: "2",
            stroke: "#3b82f6"
        }
    };

    const showStatisticData = (statistic, period = 'weekly') => {
        const date = selectedDate.clone();
        let dateRange;
        
        if (period === 'weekly') {
            // Đảm bảo hiển thị đủ 7 ngày trong tuần
            const monday = date.clone().startOf('isoWeek');
            dateRange = Array.from({ length: 7 }).map((_, i) =>
                monday.clone().add(i, 'days'))
        } else if (period === 'yearly') {
            const startOfYear = date.clone().startOf('year');
            dateRange = Array.from({ length: 12 }).map((_, i) =>
                startOfYear.clone().add(i, 'months')
            );
            // Chỉ lọc tính đến tháng hiện tại nếu đang xem năm hiện tại
            if (date.year() === moment().year()) {
                dateRange = dateRange.filter(d => d.isSameOrBefore(moment(), 'month'));
            }
        } else {
            // Tháng: Lấy tất cả các ngày trong tháng
            const startOfMonth = date.clone().startOf('month');
            const endOfMonth = date.clone().endOf('month');
            const daysInMonth = endOfMonth.date();
            
            dateRange = Array.from({ length: daysInMonth }).map((_, i) =>
                startOfMonth.clone().add(i, 'days')
            );
            
            // Chỉ lọc tính đến ngày hiện tại nếu đang xem tháng hiện tại
            if (date.isSame(moment(), 'month')) {
                dateRange = dateRange.filter(d => d.isSameOrBefore(moment(), 'day'));
            }
        }

        const labels = dateRange.map((d, i) => {
            if (period === 'weekly') {
                return d.format('ddd');
            } else if (period === 'yearly') {
                return d.format('MMM');
            } else {
                return (i % 5 === 0) ? d.format('DD') : '';
            }
        });

        const total_sessions = statistic?.total_sessions || 0;

        // lọc dữ liệu 
        const total_calories_burned = Array.isArray(statistic?.total_calories_burned)
            ? statistic.total_calories_burned.slice(0, dateRange.length)
            : new Array(dateRange.length).fill(0);

        const total_time = Array.isArray(statistic?.total_time)
            ? statistic.total_time.slice(0, dateRange.length)
            : new Array(dateRange.length).fill(0);

        // Lấy dữ liệu sức khỏe
        const weight_data = Array.isArray(statistic?.weight_data)
            ? statistic.weight_data.slice(0, dateRange.length)
            : new Array(dateRange.length).fill(null);

        const bmi_data = Array.isArray(statistic?.bmi_data)
            ? statistic.bmi_data.slice(0, dateRange.length)
            : new Array(dateRange.length).fill(null);

        const water_intake_data = Array.isArray(statistic?.water_intake_data)
            ? statistic.water_intake_data.slice(0, dateRange.length)
            : new Array(dateRange.length).fill(null);

        const step_count_data = Array.isArray(statistic?.step_count_data)
            ? statistic.step_count_data.slice(0, dateRange.length)
            : new Array(dateRange.length).fill(null);

        const heart_rate_data = Array.isArray(statistic?.heart_rate_data)
            ? statistic.heart_rate_data.slice(0, dateRange.length)
            : new Array(dateRange.length).fill(null);

        // Lọc bỏ các giá trị null
        const filtered_weight_data = weight_data.map(val => val === null ? 0 : val);
        const filtered_bmi_data = bmi_data.map(val => val === null ? 0 : val);
        const filtered_water_intake_data = water_intake_data.map(val => val === null ? 0 : val);
        const filtered_step_count_data = step_count_data.map(val => val === null ? 0 : val);
        const filtered_heart_rate_data = heart_rate_data.map(val => val === null ? 0 : val);

        return { 
            labels, 
            total_sessions, 
            total_calories_burned, 
            total_time,
            weight_data: filtered_weight_data,
            bmi_data: filtered_bmi_data,
            water_intake_data: filtered_water_intake_data,
            step_count_data: filtered_step_count_data,
            heart_rate_data: filtered_heart_rate_data
        };
    }

    const { 
        labels, 
        total_sessions, 
        total_calories_burned, 
        total_time,
        weight_data,
        bmi_data,
        water_intake_data,
        step_count_data,
        heart_rate_data
    } = showStatisticData(statistic, period);

    // Lấy thông tin tổng hợp từ thống kê
    const health_summary = statistic?.health_summary || {};
    const weight_change = statistic?.weight_change || 0;

    return (
        <RefreshableScreen onRefreshCallback={handleRefresh}>
            {/* Header khi xem dữ liệu của người khác */}
            {isViewingOtherUser && (
                <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#065f46',
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    elevation: 4,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                }}>
                    <TouchableOpacity 
                        onPress={() => navigation.navigate('Tư vấn trực tuyến')}
                        style={{ marginRight: 16 }}
                    >
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={{
                        color: 'white',
                        fontSize: 18,
                        fontWeight: 'bold',
                        flex: 1
                    }}>
                        Thống kê sức khỏe - {targetUserName || 'Người dùng'}
                    </Text>
                </View>
            )}
            
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 16 }}>
                <Button
                    mode={period === 'weekly' ? 'contained' : 'outlined'}
                    onPress={() => {
                        setPeriod('weekly');
                        setSelectedDate(moment());
                    }}
                    style={{ marginHorizontal: 8 }}
                    buttonColor="#a7f3d0"
                    textColor="#065f46"
                >
                    Tuần
                </Button>
                <Button
                    mode={period === 'monthly' ? 'contained' : 'outlined'}
                    onPress={() => {
                        setPeriod('monthly');
                        setSelectedDate(moment().startOf('month'));
                    }}
                    style={{ marginHorizontal: 8 }}
                    buttonColor="#a7f3d0"
                    textColor="#065f46"
                >
                    Tháng
                </Button>
                <Button
                    mode={period === 'yearly' ? 'contained' : 'outlined'}
                    onPress={() => {
                        setPeriod('yearly');
                        setSelectedDate(moment().startOf('year'));
                    }}
                    style={{ marginHorizontal: 8 }}
                    buttonColor="#a7f3d0"
                    textColor="#065f46"
                >
                    Năm
                </Button>
            </View>

            <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <Menu
                    visible={menuVisible}
                    onDismiss={() => setMenuVisible(false)}
                    anchor={
                        <Button
                            mode="outlined"
                            onPress={() => setMenuVisible(true)}
                            style={{ borderColor: '#065f46' }}
                            textColor="#065f46"
                        >
                            {getCurrentDateLabel()}
                        </Button>
                    }
                >
                    {getDateOptions().map((option, index) => (
                        <Menu.Item
                            key={index}
                            onPress={() => {
                                setSelectedDate(option.value);
                                setMenuVisible(false);
                            }}
                            title={option.label}
                        />
                    ))}
                </Menu>
            </View>

            {/* Thông tin tổng hợp */}
            <Card style={{ margin: 16, backgroundColor: '#f0fdf4' }}>
                <Card.Content>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#065f46', fontWeight: 'bold' }}>Số buổi tập:</Text>
                        <Text style={{ color: '#065f46', fontSize: 16 }}>{total_sessions}</Text>
                    </View>
                </Card.Content>
            </Card>

            {/* Thống kê tập luyện */}
            <View style={{ marginVertical: 16 }}>
                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Lượng Calo tiêu thụ</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: total_calories_burned }]
                    }}
                    width={screenWidth - 24}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    style={{ borderRadius: 12, marginHorizontal: 12 }}
                    formatYLabel={() => ''}
                    withInnerLines={false}
                    withOuterLines={false}
                    renderDotContent={({ x, y, index, indexData }) => {
                        if (indexData > 0) {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: y - 24,
                                        left: x - 10,
                                        fontSize: 12,
                                        color: '#065f46',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {indexData}
                                </Text>
                            );
                        }
                        return null;
                    }}
                />

                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Thời gian luyện tập (phút)</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: total_time }]
                    }}
                    width={screenWidth - 24}
                    height={220}
                    chartConfig={chartConfig}
                    bezier
                    formatYLabel={() => ''}
                    withInnerLines={false}
                    withOuterLines={false}
                    style={{ borderRadius: 12, marginHorizontal: 12 }}
                    renderDotContent={({ x, y, index, indexData }) => {
                        if (indexData > 0) {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: y - 24,
                                        left: x - 10,
                                        fontSize: 12,
                                        color: '#065f46',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {indexData}
                                </Text>
                            );
                        }
                        return null;
                    }}
                />
            </View>

            {/* Thống kê sức khỏe */}
            {/* <View style={{ marginVertical: 16 }}>
                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24, fontSize: 18, fontWeight: 'bold', color: '#065f46' }]}>
                    Chỉ số sức khỏe
                </Text>
                
                
                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 16 }]}>Cân nặng (kg)</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: weight_data }]
                    }}
                    width={screenWidth - 24}
                    height={220}
                    chartConfig={healthChartConfig}
                    bezier
                    style={{ borderRadius: 12, marginHorizontal: 12 }}
                    formatYLabel={() => ''}
                    withInnerLines={false}
                    withOuterLines={false}
                    renderDotContent={({ x, y, index, indexData }) => {
                        if (indexData > 0) {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: y - 24,
                                        left: x - 15,
                                        fontSize: 12,
                                        color: '#3b82f6',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {indexData.toFixed(1)}
                                </Text>
                            );
                        }
                        return null;
                    }}
                />

                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Chỉ số BMI</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: bmi_data }]
                    }}
                    width={screenWidth - 24}
                    height={220}
                    chartConfig={healthChartConfig}
                    bezier
                    style={{ borderRadius: 12, marginHorizontal: 12 }}
                    formatYLabel={() => ''}
                    withInnerLines={false}
                    withOuterLines={false}
                    renderDotContent={({ x, y, index, indexData }) => {
                        if (indexData > 0) {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: y - 24,
                                        left: x - 15,
                                        fontSize: 12,
                                        color: '#3b82f6',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {indexData.toFixed(1)}
                                </Text>
                            );
                        }
                        return null;
                    }}
                />

                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Lượng nước uống (lít)</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: water_intake_data }]
                    }}
                    width={screenWidth - 24}
                    height={220}
                    chartConfig={healthChartConfig}
                    bezier
                    style={{ borderRadius: 12, marginHorizontal: 12 }}
                    formatYLabel={() => ''}
                    withInnerLines={false}
                    withOuterLines={false}
                    renderDotContent={({ x, y, index, indexData }) => {
                        if (indexData > 0) {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: y - 24,
                                        left: x - 15,
                                        fontSize: 12,
                                        color: '#3b82f6',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {indexData.toFixed(1)}
                                </Text>
                            );
                        }
                        return null;
                    }}
                />

                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Số bước chân</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: step_count_data }]
                    }}
                    width={screenWidth - 24}
                    height={220}
                    chartConfig={healthChartConfig}
                    bezier
                    style={{ borderRadius: 12, marginHorizontal: 12 }}
                    formatYLabel={() => ''}
                    withInnerLines={false}
                    withOuterLines={false}
                    renderDotContent={({ x, y, index, indexData }) => {
                        if (indexData > 0) {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: y - 24,
                                        left: x - 20,
                                        fontSize: 12,
                                        color: '#3b82f6',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {Math.round(indexData)}
                                </Text>
                            );
                        }
                        return null;
                    }}
                />

                <Text style={[MyStyles.label, { marginLeft: 12, marginTop: 24 }]}>Nhịp tim (bpm)</Text>
                <LineChart
                    data={{
                        labels: labels,
                        datasets: [{ data: heart_rate_data }]
                    }}
                    width={screenWidth - 24}
                    height={220}
                    chartConfig={healthChartConfig}
                    bezier
                    style={{ borderRadius: 12, marginHorizontal: 12 }}
                    formatYLabel={() => ''}
                    withInnerLines={false}
                    withOuterLines={false}
                    renderDotContent={({ x, y, index, indexData }) => {
                        if (indexData > 0) {
                            return (
                                <Text
                                    key={index}
                                    style={{
                                        position: 'absolute',
                                        top: y - 24,
                                        left: x - 15,
                                        fontSize: 12,
                                        color: '#3b82f6',
                                        fontWeight: 'bold',
                                    }}
                                >
                                    {Math.round(indexData)}
                                </Text>
                            );
                        }
                        return null;
                    }}
                />
            </View> */}

            {/* Thông tin tổng hợp sức khỏe */}
            <Card style={{ margin: 16, backgroundColor: '#f0f9ff' }}>
                <Card.Content>
                    <Text style={{ color: '#0369a1', fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>
                        Tổng hợp sức khỏe
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#0369a1' }}>Chiều cao trung bình:</Text>
                        <Text style={{ color: '#0369a1', fontWeight: 'bold' }}>
                            {health_summary.avg_height ? `${health_summary.avg_height.toFixed(1)} cm` : 'N/A'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#0369a1' }}>Cân nặng trung bình:</Text>
                        <Text style={{ color: '#0369a1', fontWeight: 'bold' }}>
                            {health_summary.avg_weight ? `${health_summary.avg_weight.toFixed(1)} kg` : 'N/A'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#0369a1' }}>BMI trung bình:</Text>
                        <Text style={{ color: '#0369a1', fontWeight: 'bold' }}>
                            {health_summary.avg_bmi ? health_summary.avg_bmi.toFixed(1) : 'N/A'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#0369a1' }}>Nước uống TB:</Text>
                        <Text style={{ color: '#0369a1', fontWeight: 'bold' }}>
                            {health_summary.avg_water_intake ? `${health_summary.avg_water_intake.toFixed(1)} lít` : 'N/A'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#0369a1' }}>Bước chân TB:</Text>
                        <Text style={{ color: '#0369a1', fontWeight: 'bold' }}>
                            {health_summary.avg_step_count ? Math.round(health_summary.avg_step_count).toLocaleString() : 'N/A'}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#0369a1' }}>Nhịp tim TB:</Text>
                        <Text style={{ color: '#0369a1', fontWeight: 'bold' }}>
                            {health_summary.avg_heart_rate ? `${Math.round(health_summary.avg_heart_rate)} bpm` : 'N/A'}
                        </Text>
                    </View>
                    {weight_change !== 0 && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#bfdbfe' }}>
                            <Text style={{ color: '#0369a1' }}>Thay đổi cân nặng:</Text>
                            <Text style={{ 
                                color: weight_change > 0 ? '#dc2626' : '#16a34a', 
                                fontWeight: 'bold' 
                            }}>
                                {weight_change > 0 ? '+' : ''}{weight_change.toFixed(1)} kg
                            </Text>
                        </View>
                    )}
                </Card.Content>
            </Card>
        </RefreshableScreen>
    );
};

export default Statistic;