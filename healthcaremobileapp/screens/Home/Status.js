import { useContext, useState, useEffect } from "react";
import { MyDispatchContext, MyUserContext } from "../../configs/Contexts";
import { Text, View, ScrollView, TextInput, Alert } from "react-native";
import MyStyles from "../../styles/MyStyles";
import { Button, Card, ActivityIndicator, SegmentedButtons, IconButton, Menu } from "react-native-paper";
import { getLatestHealthStat, fetchHealthStats, saveHealthStat, updateHealthStat } from "../../utils/healthStatService";
import moment from "moment";

// Định nghĩa màu sắc chủ đạo cho app
const AppColors = {
    primary: '#065f46',      
    secondary: '#a7f3d0',    
    background: '#f0fdf4',   
    text: '#064e3b',         
    accent: '#34d399',       
    positive: '#059669',     
    negative: '#dc2626',     
};

const Status = () => {
    const user = useContext(MyUserContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [healthStat, setHealthStat] = useState(null);
    const [healthChanges, setHealthChanges] = useState(null);
    const [period, setPeriod] = useState('weekly');
    const [selectedDate, setSelectedDate] = useState(moment());
    const [dateMenuVisible, setDateMenuVisible] = useState(false);
    const [showUpdateForm, setShowUpdateForm] = useState(false);
    const [newHealthData, setNewHealthData] = useState({
        weight: '',
        height: '',
        water_intake: '',
        step_count: '',
        heart_rate: ''
    });

    useEffect(() => {
        loadHealthData();
    }, [period, selectedDate]);

    const loadHealthData = async () => {
        try {
            setLoading(true);
            
            // Fetch latest health stat
            const latestStat = await getLatestHealthStat();
            setHealthStat(latestStat);

            // Initialize new health data form with existing data
            if (latestStat) {
                setNewHealthData({
                    weight: latestStat.weight?.toString() || '',
                    height: latestStat.height?.toString() || '',
                    water_intake: latestStat.water_intake?.toString() || '',
                    step_count: latestStat.step_count?.toString() || '',
                    heart_rate: latestStat.heart_rate?.toString() || ''
                });
            }

            // Fetch changes based on selected period and date
            const periodStats = await fetchHealthStats(period, { date: selectedDate });
            
            // Extract stats data based on period
            let statsData;
            if (period === 'weekly') {
                statsData = periodStats.daily_stats;
            } else if (period === 'monthly') {
                statsData = periodStats.weekly_stats;
            } else {
                statsData = periodStats.monthly_stats;
            }
            
            setHealthChanges(periodStats.changes);
        } catch (err) {
            console.error("Error loading health data:", err);
            setError("Không thể tải dữ liệu sức khỏe");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateHealth = async () => {
        try {
            setLoading(true);

            // Convert string values to numbers
            const dataToSave = {
                weight: newHealthData.weight ? parseFloat(newHealthData.weight) : undefined,
                height: newHealthData.height ? parseFloat(newHealthData.height) : undefined,
                water_intake: newHealthData.water_intake ? parseInt(newHealthData.water_intake) : undefined,
                step_count: newHealthData.step_count ? parseInt(newHealthData.step_count) : undefined,
                heart_rate: newHealthData.heart_rate ? parseInt(newHealthData.heart_rate) : undefined,
                date: new Date().toISOString().split('T')[0] // Add today's date
            };

            if (healthStat?.id) {
                // Update existing record with PATCH
                const result = await updateHealthStat(healthStat.id, dataToSave);
                Alert.alert('Thành công', 'Cập nhật chỉ số sức khỏe thành công');
                
                // Reload data
                loadHealthData();
                setShowUpdateForm(false);
            } else {
                Alert.alert('Lỗi', 'Không tìm thấy bản ghi để cập nhật');
            }
        } catch (err) {
            console.error("Error updating health data:", err);
            Alert.alert('Lỗi', 'Không thể cập nhật chỉ số sức khỏe');
        } finally {
            setLoading(false);
        }
    };

    const handleEditStat = () => {
        if (healthStat) {
            setNewHealthData({
                weight: healthStat.weight?.toString() || '',
                height: healthStat.height?.toString() || '',
                water_intake: healthStat.water_intake?.toString() || '',
                step_count: healthStat.step_count?.toString() || '',
                heart_rate: healthStat.heart_rate?.toString() || ''
            });
            setShowUpdateForm(true);
        }
    };

    const getDateOptions = () => {
        const today = moment();
        const options = [];

        if (period === 'weekly') {
            // Create list of 4 recent weeks
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
            // Create list of months from beginning of year to current month
            const currentYear = today.year();
            const currentMonth = today.month();
            
            for (let i = 0; i <= currentMonth; i++) {
                const monthDate = moment().year(currentYear).month(i).date(1);
                options.push({
                    label: monthDate.format('MMMM YYYY'),
                    value: monthDate
                });
            }
        } else if (period === 'yearly') {
            // Create list of years (from 2020 to current year)
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

    const renderHealthStats = () => {
        if (loading && !healthStat) {
            return <ActivityIndicator size="small" color={AppColors.primary} />;
        }

        if (error && !healthStat) {
            return <Text style={[MyStyles.errorText, {color: AppColors.negative}]}>{error}</Text>;
        }

        if (!healthStat) {
            return <Text style={{color: AppColors.text}}>Chưa có dữ liệu sức khỏe</Text>;
        }

        return (
            <Card style={[MyStyles.m, {backgroundColor: AppColors.background}]}>
                <Card.Title 
                    title="Chỉ số sức khỏe hiện tại" 
                    titleStyle={{color: AppColors.primary}}
                    right={(props) => (
                        <IconButton 
                            {...props} 
                            icon="pencil" 
                            iconColor={AppColors.primary}
                            onPress={handleEditStat}
                        />
                    )}
                />
                <Card.Content>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Ngày cập nhật:</Text>
                        <Text style={{color: AppColors.text, fontWeight: 'bold'}}>{healthStat.date}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Cân nặng hiện tại:</Text>
                        <Text style={{color: AppColors.text, fontWeight: 'bold'}}>{healthStat.weight} kg</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Chiều cao hiện tại:</Text>
                        <Text style={{color: AppColors.text, fontWeight: 'bold'}}>{healthStat.height} cm</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>BMI hiện tại:</Text>
                        <Text style={{color: AppColors.text, fontWeight: 'bold'}}>{healthStat.bmi?.toFixed(1)}</Text>
                    </View>
                    {healthStat.water_intake && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={{color: AppColors.text}}>Nước uống trung bình:</Text>
                            <Text style={{color: AppColors.text, fontWeight: 'bold'}}>{healthStat.water_intake} lít</Text>
                        </View>
                    )}
                    {healthStat.step_count && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={{color: AppColors.text}}>Số bước chân trung bình:</Text>
                            <Text style={{color: AppColors.text, fontWeight: 'bold'}}>{healthStat.step_count}</Text>
                        </View>
                    )}
                    {healthStat.heart_rate && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={{color: AppColors.text}}>Nhịp tim trung bình:</Text>
                            <Text style={{color: AppColors.text, fontWeight: 'bold'}}>{healthStat.heart_rate} bpm</Text>
                        </View>
                    )}
                </Card.Content>
            </Card>
        );
    };

    const renderUpdateForm = () => {
        if (!showUpdateForm) return null;

        return (
            <Card style={[MyStyles.m, {backgroundColor: AppColors.background}]}>
                <Card.Title title="Sửa chỉ số sức khỏe" titleStyle={{color: AppColors.primary}} />
                <Card.Content>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Cân nặng (kg):</Text>
                        <TextInput
                            style={{ 
                                borderWidth: 1, 
                                borderColor: AppColors.secondary, 
                                padding: 8, 
                                borderRadius: 4, 
                                marginTop: 4,
                                color: AppColors.text
                            }}
                            keyboardType="decimal-pad"
                            value={newHealthData.weight}
                            onChangeText={(text) => setNewHealthData({...newHealthData, weight: text})}
                        />
                    </View>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Chiều cao (cm):</Text>
                        <TextInput
                            style={{ 
                                borderWidth: 1, 
                                borderColor: AppColors.secondary, 
                                padding: 8, 
                                borderRadius: 4, 
                                marginTop: 4,
                                color: AppColors.text
                            }}
                            keyboardType="decimal-pad"
                            value={newHealthData.height}
                            onChangeText={(text) => setNewHealthData({...newHealthData, height: text})}
                        />
                    </View>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Lượng nước (ml):</Text>
                        <TextInput
                            style={{ 
                                borderWidth: 1, 
                                borderColor: AppColors.secondary, 
                                padding: 8, 
                                borderRadius: 4, 
                                marginTop: 4,
                                color: AppColors.text
                            }}
                            keyboardType="number-pad"
                            value={newHealthData.water_intake}
                            onChangeText={(text) => setNewHealthData({...newHealthData, water_intake: text})}
                        />
                    </View>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Số bước chân:</Text>
                        <TextInput
                            style={{ 
                                borderWidth: 1, 
                                borderColor: AppColors.secondary, 
                                padding: 8, 
                                borderRadius: 4, 
                                marginTop: 4,
                                color: AppColors.text
                            }}
                            keyboardType="number-pad"
                            value={newHealthData.step_count}
                            onChangeText={(text) => setNewHealthData({...newHealthData, step_count: text})}
                        />
                    </View>
                    <View style={{ marginBottom: 10 }}>
                        <Text style={{color: AppColors.text}}>Nhịp tim (bpm):</Text>
                        <TextInput
                            style={{ 
                                borderWidth: 1, 
                                borderColor: AppColors.secondary, 
                                padding: 8, 
                                borderRadius: 4, 
                                marginTop: 4,
                                color: AppColors.text
                            }}
                            keyboardType="number-pad"
                            value={newHealthData.heart_rate}
                            onChangeText={(text) => setNewHealthData({...newHealthData, heart_rate: text})}
                        />
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                        <Button 
                            mode="outlined" 
                            onPress={() => setShowUpdateForm(false)}
                            style={{ width: '48%' }}
                            textColor={AppColors.primary}
                            buttonColor={AppColors.background}
                        >
                            Hủy
                        </Button>
                        <Button 
                            mode="contained" 
                            onPress={handleUpdateHealth}
                            style={{ width: '48%' }}
                            buttonColor={AppColors.primary}
                            loading={loading}
                        >
                            Cập nhật
                        </Button>
                    </View>
                </Card.Content>
            </Card>
        );
    };

    const renderHealthChanges = () => {
        if (loading && !healthChanges) return <ActivityIndicator size="small" color={AppColors.primary} />;
        if (!healthChanges) return null;

        let title = "";
        switch(period) {
            case 'weekly':
                title = "Sự thay đổi trong tuần";
                break;
            case 'monthly':
                title = "Sự thay đổi trong tháng";
                break;
            case 'yearly':
                title = "Sự thay đổi trong năm";
                break;
        }

        return (
            <Card style={[MyStyles.m, {backgroundColor: AppColors.background}]}>
                <Card.Title title={title} titleStyle={{color: AppColors.primary}} />
                <Card.Content>
                    {healthChanges.weight_change !== null && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={{color: AppColors.text}}>Cân nặng:</Text>
                            <Text style={{ color: healthChanges.weight_change > 0 ? AppColors.positive : AppColors.negative, fontWeight: 'bold' }}>
                                {healthChanges.weight_change > 0 ? '+' : ''}{healthChanges.weight_change?.toFixed(1)} kg
                            </Text>
                        </View>
                    )}
                    {healthChanges.height_change !== null && (
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                            <Text style={{color: AppColors.text}}>Chiều cao:</Text>
                            <Text style={{ color: healthChanges.height_change > 0 ? AppColors.positive : AppColors.negative, fontWeight: 'bold' }}>
                                {healthChanges.height_change > 0 ? '+' : ''}{healthChanges.height_change?.toFixed(1)} cm
                            </Text>
                        </View>
                    )}
                    
                    
                </Card.Content>
            </Card>
        );
    };

    return (
        <ScrollView style={{backgroundColor: '#ffffff'}}>
            <Text style={[MyStyles.subject, {color: AppColors.primary, marginBottom: 12}]}>Thống kê sức khỏe</Text>
            
            {renderHealthStats()}
            {renderUpdateForm()}
            {renderHealthChanges()}
            
            <View style={{ padding: 10 }}>
                <SegmentedButtons
                    value={period}
                    onValueChange={(newPeriod) => {
                        setPeriod(newPeriod);
                        setSelectedDate(moment()); // Reset to current date when changing period
                    }}
                    buttons={[
                        { value: 'weekly', label: 'Tuần' },
                        { value: 'monthly', label: 'Tháng' },
                        { value: 'yearly', label: 'Năm' }
                    ]}
                    style={{backgroundColor: AppColors.background}}
                    theme={{ colors: { primary: AppColors.primary, secondaryContainer: AppColors.secondary } }}
                />
            </View>
            
            <View style={{ marginHorizontal: 16, marginBottom: 16 }}>
                <Menu
                    visible={dateMenuVisible}
                    onDismiss={() => setDateMenuVisible(false)}
                    anchor={
                        <Button
                            mode="outlined"
                            onPress={() => setDateMenuVisible(true)}
                            style={{ borderColor: AppColors.primary }}
                            textColor={AppColors.primary}
                        >
                            {getCurrentDateLabel()}
                        </Button>
                    }
                    contentStyle={{backgroundColor: AppColors.background}}
                >
                    {getDateOptions().map((option, index) => (
                        <Menu.Item
                            key={index}
                            onPress={() => {
                                setSelectedDate(option.value);
                                setDateMenuVisible(false);
                            }}
                            title={option.label}
                            titleStyle={{color: AppColors.text}}
                        />
                    ))}
                </Menu>
            </View>
        </ScrollView>
    );
};

export default Status;