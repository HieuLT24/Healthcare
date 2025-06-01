import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    StyleSheet, 
    ActivityIndicator, 
    Image, 
    Alert
} from 'react-native';
import { Avatar, Divider, Searchbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../../configs/Apis';
import MyStyles from '../../styles/MyStyles';
// import { getUserConversations, subscribeToUserConversations, getUserData } from '../../utils/FirebaseService';

const ConversationList = () => {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [unsubscribeConversations, setUnsubscribeConversations] = useState(null);
    const [usersCache, setUsersCache] = useState({});
    const navigation = useNavigation();

    useEffect(() => {
        loadCurrentUser();

        return () => {
            // Clean up subscription when component unmounts
            if (unsubscribeConversations) {
                unsubscribeConversations();
            }
        };
    }, []);

    // useEffect(() => {
    //     if (currentUser) {
    //         initializeFirebaseConversations();
    //     }
    // }, [currentUser]);

    const loadCurrentUser = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            const res = await authApi(token).get(endpoints['current-user']);
            setCurrentUser(res.data);
        } catch (error) {
            console.error("Failed to load current user:", error);
            Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
        }
    };

    const handleConversationPress = (conversation) => {
        if (conversation.otherUser) {
            navigation.navigate('ChatScreen', {
                otherUser: conversation.otherUser, 
                conversationId: conversation.id
            });
        }
    };

    const formatTime = (dateTime) => {
        if (!dateTime) return '';
        
        const date = dateTime instanceof Date ? dateTime : new Date(dateTime);
        const now = new Date();
        
        // Nếu cùng ngày, hiển thị giờ
        if (date.toDateString() === now.toDateString()) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Nếu trong tuần này
        const daysDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        if (daysDiff < 7) {
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            return days[date.getDay()];
        }
        
        // Hiển thị ngày tháng
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    };

    // Tạo nội dung tóm tắt tin nhắn
    const getMessagePreview = (lastMessage) => {
        if (!lastMessage || !lastMessage.content) return 'Bắt đầu cuộc trò chuyện';
        
        // Giới hạn độ dài tin nhắn
        let content = lastMessage.content || '';
        if (content.length > 40) {
            content = content.substring(0, 40) + '...';
        }
        
        // Kiểm tra nếu tin nhắn từ người dùng hiện tại
        if (lastMessage.senderId === currentUser?.id.toString()) {
            return 'Bạn: ' + content;
        }
        
        return content;
    };

    const filteredConversations = conversations.filter(convo => {
        if (!convo.otherUser) return false;
        
        const fullName = `${convo.otherUser.first_name || ''} ${convo.otherUser.last_name || ''}`.toLowerCase();
        const query = searchQuery.toLowerCase();
        
        return fullName.includes(query);
    });

    const renderConversationItem = ({ item }) => {
        if (!item.otherUser) return null;
        
        const otherUser = item.otherUser;
        const lastMessage = item.lastMessage;
        const isUnread = lastMessage && !lastMessage.isRead && lastMessage.senderId !== currentUser?.id.toString();

        // Get the message timestamp or conversation timestamp
        const timestamp = lastMessage?.createdAt || item.updatedAt || item.createdAt;
        
        return (
            <TouchableOpacity onPress={() => handleConversationPress(item)}>
                <View style={styles.conversationItem}>
                    <View style={styles.avatarContainer}>
                        <Avatar.Image 
                            source={{ uri: otherUser.avatar || 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=' + otherUser.first_name }} 
                            size={60} 
                            style={styles.avatar}
                        />
                        {otherUser.is_online && (
                            <View style={styles.onlineIndicator} />
                        )}
                    </View>
                    
                    <View style={styles.infoContainer}>
                        <View style={styles.nameTimeContainer}>
                            <Text style={[
                                styles.userName,
                                isUnread && styles.unreadText
                            ]}>
                                {otherUser.first_name} {otherUser.last_name}
                            </Text>
                            <Text style={styles.timeText}>
                                {formatTime(timestamp)}
                            </Text>
                        </View>
                        
                        <Text 
                            style={[
                                styles.messagePreview,
                                isUnread && styles.unreadText
                            ]}
                            numberOfLines={1}
                        >
                            {getMessagePreview(lastMessage)}
                        </Text>
                        
                        {isUnread && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>1</Text>
                            </View>
                        )}
                    </View>
                </View>
                <Divider style={styles.divider} />
            </TouchableOpacity>
        );
    };

    // const initializeFirebaseConversations = async () => {
    //     try {
    //         setLoading(true);

    //         // Subscribe to user conversations in real-time
    //         const unsubscribe = subscribeToUserConversations(
    //             currentUser.id.toString(),
    //             async (firebaseConversations) => {
    //                 try {
    //                     // Process and enrich conversations with user data
    //                     const enrichedConversations = await Promise.all(
    //                         firebaseConversations.map(async (conv) => {
    //                             try {
    //                                 // Find the other user ID in the conversation
    //                                 const otherUserId = conv.participants.find(
    //                                     id => id !== currentUser.id.toString()
    //                                 );

    //                                 if (!otherUserId) return null;

    //                                 // Get other user details from cache or fetch
    //                                 let otherUser;
    //                                 if (usersCache[otherUserId]) {
    //                                     otherUser = usersCache[otherUserId];
    //                                 } else {
    //                                     // Get user from backend
    //                                     try {
    //                                         const token = await AsyncStorage.getItem('token');
    //                                         console.log(`Fetching user data for ID: ${otherUserId}`);
    //                                         const userRes = await authApi(token).get(`${endpoints['users']}${otherUserId}/`);
    //                                         console.log('User API response:', userRes.status);
    //                                         otherUser = userRes.data;
                                            
    //                                         // Update cache
    //                                         setUsersCache(prev => ({
    //                                             ...prev,
    //                                             [otherUserId]: otherUser
    //                                         }));
    //                                     } catch (error) {
    //                                         console.error("Error fetching user data:", error);
    //                                         console.error("Error response:", error.response ? {
    //                                             status: error.response.status,
    //                                             data: error.response.data
    //                                         } : 'No response');
                                            
    //                                         // Fallback data if we can't get user details
    //                                         otherUser = {
    //                                             id: otherUserId,
    //                                             first_name: "Người dùng",
    //                                             last_name: otherUserId,
    //                                             avatar: null
    //                                         };
    //                                     }
    //                                 }

    //                                 return {
    //                                     ...conv,
    //                                     otherUser,
    //                                     lastMessage: conv.lastMessage || null
    //                                 };
    //                             } catch (err) {
    //                                 console.error("Error processing conversation:", err);
    //                                 return null;
    //                             }
    //                         })
    //                     );

    //                     // Filter out any nulls and sort by most recent
    //                     const validConversations = enrichedConversations
    //                         .filter(Boolean)
    //                         .sort((a, b) => {
    //                             const dateA = a.lastMessage?.createdAt || a.updatedAt || a.createdAt;
    //                             const dateB = b.lastMessage?.createdAt || b.updatedAt || b.createdAt;
                                
    //                             // Convert Firebase timestamps to Date objects if needed
    //                             const timeA = dateA instanceof Date ? dateA : new Date(dateA);
    //                             const timeB = dateB instanceof Date ? dateB : new Date(dateB);
                                
    //                             return timeB - timeA;
    //                         });

    //                     setConversations(validConversations);
    //                     setLoading(false);
    //                 } catch (error) {
    //                     console.error("Error processing conversations:", error);
    //                     Alert.alert("Lỗi", "Không thể xử lý dữ liệu cuộc trò chuyện");
    //                     setLoading(false);
    //                 }
    //             }
    //         );

    //         setUnsubscribeConversations(unsubscribe);
            
    //     } catch (error) {
    //         console.error("Failed to initialize Firebase conversations:", error);
    //         if (error.response) {
    //             console.error("Error status:", error.response.status);
    //             console.error("Error data:", JSON.stringify(error.response.data));
    //             Alert.alert("Lỗi máy chủ", `Lỗi ${error.response.status}: ${JSON.stringify(error.response.data)}`);
    //         } else {
    //             Alert.alert("Lỗi", "Không thể tải cuộc trò chuyện: " + error.message);
    //         }
    //         setLoading(false);
    //     }
    // };

    return (
        <View style={MyStyles.container}>
            <Text style={styles.title}>Tin nhắn của bạn</Text>
            
            <Searchbar
                placeholder="Tìm kiếm cuộc trò chuyện"
                onChangeText={setSearchQuery}
                value={searchQuery}
                style={styles.searchBar}
                iconColor="#065f46"
            />
            
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065f46" />
                </View>
            ) : (
                <FlatList
                    data={filteredConversations}
                    renderItem={renderConversationItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.listContainer}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                Bạn chưa có cuộc trò chuyện nào
                            </Text>
                            <TouchableOpacity
                                style={styles.findUsersButton}
                                onPress={() => navigation.navigate('Danh sách người dùng')}
                            >
                                <Text style={styles.findUsersText}>
                                    Tìm người dùng
                                </Text>
                            </TouchableOpacity>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        flexGrow: 1,
    },
    conversationItem: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        backgroundColor: '#e2f8f0',
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#4CAF50',
        borderWidth: 2,
        borderColor: 'white',
    },
    infoContainer: {
        flex: 1,
        marginLeft: 16,
        position: 'relative',
    },
    nameTimeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    userName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    timeText: {
        fontSize: 14,
        color: '#888',
    },
    messagePreview: {
        fontSize: 14,
        color: '#666',
    },
    unreadText: {
        fontWeight: 'bold',
        color: '#000',
    },
    unreadBadge: {
        position: 'absolute',
        right: 0,
        bottom: 0,
        backgroundColor: '#065f46',
        width: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadBadgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    divider: {
        backgroundColor: '#f0f0f0',
        height: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    findUsersButton: {
        backgroundColor: '#065f46',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 20,
    },
    findUsersText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default ConversationList; 