import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { Searchbar, Avatar, Card, Divider } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import MyStyles from '../../styles/MyStyles';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getConversationBetweenUsers, createConversation } from '../../utils/FirebaseService';


const ExpertList = () => {
    const [experts, setExperts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const navigation = useNavigation();

    useEffect(() => {
        loadCurrentUser();
        loadExperts();
    }, []);

    const loadCurrentUser = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApi(token).get(endpoints['current-user']);
            setCurrentUser(res.data);
        } catch (ex) {
            console.error("Failed to load current user:", ex);
            Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
        }
    };

    const loadExperts = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            
            const res = await authApi(token).get(endpoints['experts']);
            if (res.data && Array.isArray(res.data)) {
                setExperts(res.data);
                console.log(res.data);
            }
        } catch (ex) {
            console.error("Failed to fetch experts:", ex);
            Alert.alert("Lỗi", "Không thể tải danh sách chuyên gia");
        } finally {
            setLoading(false);
        }
    };

    const handleExpertPress = async (expert) => {
        try {
            if (!currentUser || !currentUser.id) {
                Alert.alert("Lỗi", "Vui lòng đăng nhập để bắt đầu trò chuyện");
                return;
            }

            setLoading(true);
            
            // Chuyển đổi ID người dùng thành chuỗi
            const currentUserId = currentUser.id.toString();
            const expertId = expert.id.toString();

            // Tìm cuộc hội thoại hiện có
            let conversation = await getConversationBetweenUsers(currentUserId, expertId);
            
            // Nếu không tìm thấy, tạo mới
            if (!conversation) {
                console.log("Không tìm thấy cuộc hội thoại, đang tạo mới...");
                conversation = await createConversation(currentUserId, expertId);
            }
            
            // Kiểm tra lần cuối để đảm bảo conversation có giá trị
            if (!conversation) {
                throw new Error("Không thể tạo hoặc tìm cuộc hội thoại");
            }
            
            // Kiểm tra xem có phải cuộc hội thoại tạm thời không
            if (conversation.isTemporary || conversation.isEmergency) {
                console.log(`Sử dụng cuộc hội thoại ${conversation.isTemporary ? 'tạm thời' : 'khẩn cấp'} với ID: ${conversation.id}`);
                Alert.alert(
                    "Thông báo",
                    "Bạn đang sử dụng chế độ trò chuyện tạm thời. Tin nhắn sẽ không được lưu trên máy chủ.",
                    [{ text: "Tiếp tục" }]
                );
            }
            
            // Chuyển đến màn hình chat
            navigation.navigate('ChatScreen', { 
                otherUser: expert,
                conversationId: conversation.id
            });
            
        } catch (error) {
            console.error("Error creating/finding conversation:", error);
            Alert.alert(
                "Lỗi",
                "Không thể kết nối với chuyên gia lúc này. Vui lòng thử lại sau.",
                [{ text: "OK" }]
            );
        } finally {
            setLoading(false);
        }
    };

    const filteredExperts = experts.filter(expert => {
        const fullName = `${expert.first_name || ''} ${expert.last_name || ''}`.toLowerCase();
        const specialty = (expert.role || '').toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query) || specialty.includes(query);
    });

    // Safe key extractor function
    const keyExtractor = (item) => {
        return item && item.id ? item.id.toString() : Math.random().toString();
    };

    // Hàm tính tuổi từ ngày sinh - ưu tiên xử lý định dạng YYYY
    const calculateAge = (birthDate) => {
        if (!birthDate) return 'N/A';
        
        // Xử lý các định dạng ngày tháng khác nhau
        try {
            // Ưu tiên xử lý nếu chỉ là năm (YYYY)
            if (/^\d{4}$/.test(birthDate)) {
                const birthYear = parseInt(birthDate);
                const currentYear = new Date().getFullYear();
                return currentYear - birthYear;
            }
            
            // Trích xuất năm từ chuỗi bằng regex
            const yearMatch = birthDate.match(/\d{4}/);
            if (yearMatch) {
                const birthYear = parseInt(yearMatch[0]);
                const currentYear = new Date().getFullYear();
                return currentYear - birthYear;
            }
            
            // Nếu là chuỗi ngày tháng ISO hoặc định dạng YYYY-MM-DD
            const dob = new Date(birthDate);
            if (!isNaN(dob.getTime())) {
                // Tính tuổi từ ngày sinh đầy đủ
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                
                // Nếu chưa tới tháng sinh nhật hoặc đã qua tháng sinh nhật nhưng chưa tới ngày
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                
                return age;
            }
            
            return 'N/A';
        } catch (error) {
            console.error("Error calculating age:", error);
            return 'N/A';
        }
    };

    // Hàm trích xuất năm từ date_of_birth
    const extractYear = (dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            // Nếu chỉ là năm (YYYY)
            if (/^\d{4}$/.test(dateString)) {
                return dateString;
            }
            
            // Nếu là ngày tháng đầy đủ
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                return date.getFullYear().toString();
            }
            
            // Nếu là chuỗi định dạng khác, thử trích xuất năm bằng regex
            const yearMatch = dateString.match(/\d{4}/);
            if (yearMatch) {
                return yearMatch[0];
            }
            
            return dateString;
        } catch (error) {
            console.error("Error extracting year:", error);
            return 'N/A';
        }
    };

    const renderExpertItem = ({ item }) => (
        <TouchableOpacity onPress={() => handleExpertPress(item)}>
            <Card style={styles.expertCard}>
                <Card.Content style={styles.expertContent}>
                    <View style={styles.avatarContainer}>
                        <Avatar.Image 
                            source={{ uri: item.avatar_url || 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + item.first_name}} 
                            size={60} 
                            style={styles.avatar}
                        />
                        
                    </View>
                    <View style={styles.infoContainer}>
                        <Text style={styles.expertName}>
                            {item.first_name } {item.last_name}
                        </Text>
                        <Text style={styles.expertSpecialty}>
                            {item.role}
                        </Text>
                        <View style={styles.ageContainer}>
                            <Text style={styles.birthDateText}>
                                Năm sinh: {extractYear(item.date_of_birth)}
                            </Text>
                            <Text style={styles.ageText}>
                                Tuổi: {calculateAge(item.date_of_birth)}
                            </Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={MyStyles.container}>
            <Text style={styles.title}>Chuyên gia tư vấn sức khỏe</Text>
            
            <Searchbar
                placeholder="Tìm chuyên gia"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                iconColor="#065f46"
            />
            
            {loading ? (
                <View style={MyStyles.center}>
                    <ActivityIndicator size="large" color="#065f46" />
                </View>
            ) : (
                <FlatList
                    data={filteredExperts}
                    renderItem={renderExpertItem}
                    keyExtractor={keyExtractor}
                    ItemSeparatorComponent={() => <View style={styles.separator} />}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>Không tìm thấy chuyên gia</Text>
                        </View>
                    }
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#065f46',
        textAlign: 'center',
    },
    searchBar: {
        marginBottom: 16,
        backgroundColor: '#e2f8f0',
        borderRadius: 10,
    },
    listContainer: {
        paddingBottom: 20,
    },
    expertCard: {
        marginVertical: 6,
        borderRadius: 12,
        backgroundColor: '#fafafa',
        elevation: 3,
    },
    expertContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        backgroundColor: '#e2f8f0',
    },
    statusIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1.5,
        borderColor: 'white',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 12,
    },
    expertName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    expertSpecialty: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        justifyContent: 'space-between',
    },
    ratingText: {
        fontSize: 14,
        color: '#FFA000',
        fontWeight: 'bold',
    },
    statusText: {
        fontSize: 12,
        color: '#757575',
    },
    separator: {
        height: 8,
    },
    emptyContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#555',
    },
    ageContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    birthDateText: {
        fontSize: 13,
        color: '#666',
    },
    ageText: {
        fontSize: 13,
        color: '#666',
        fontWeight: 'bold',
    },
});

export default ExpertList;
