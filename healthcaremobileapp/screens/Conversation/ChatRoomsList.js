import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    RefreshControl,
    SafeAreaView,
    Dimensions,
    StatusBar,
    TextInput
} from 'react-native';
import { Avatar, Appbar, Searchbar, Card } from 'react-native-paper';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';


// Import Firebase services
import { 
    getUserChatRooms, 
    getUserInfo, 
    ensureCurrentUserId, 
    findOrCreateDirectChat,
    getUnreadCount,
    updateLastReadTime
} from '../../utils/chatService';
import { authApi, endpoints } from '../../configs/Apis';

const { width } = Dimensions.get('window');

const ChatRoomsList = ({ route }) => {
    const { showExperts = false } = route?.params || {};
    
    const [chatRooms, setChatRooms] = useState([]);
    const [experts, setExperts] = useState([]);
    const [users, setUsers] = useState([]); // Danh sách users cho coach/expert
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);
    const [currentUserRole, setCurrentUserRole] = useState(null); // Track user role
    const [unsubscribeChatRooms, setUnsubscribeChatRooms] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showExpertsList, setShowExpertsList] = useState(false);
    const [unreadCounts, setUnreadCounts] = useState({});
    const navigation = useNavigation();

    const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User';

    // Function to toggle between views
    const toggleExpertsView = () => {
        setShowExpertsList(!showExpertsList);
    };

    // Load current user role
    const loadCurrentUserRole = async () => {
        try {
            // Lấy role từ key riêng biệt
            const savedRole = await AsyncStorage.getItem('role');
            // console.log('🔑 Saved role:', savedRole);
            
            if (savedRole) {
                const role = savedRole;
                setCurrentUserRole(role);
                // console.log('✅ Current user role from saved role:', role);
                return role;
            }
            
            // Fallback: lấy từ current-user object nếu không có role riêng
            const cachedUser = await AsyncStorage.getItem('current-user');
            // console.log('📦 Cached user data:', cachedUser);
            
            if (cachedUser) {
                const parsedUser = JSON.parse(cachedUser);
                // console.log('👤 Parsed user:', parsedUser);
                const role = parsedUser.role || 'user';
                setCurrentUserRole(role);
                // console.log('✅ Current user role from cached user:', role);
                return role;
            } else {
                // console.log('❌ No cached user data found');
                
                // Fallback: try to get from API if no cached data
                const token = await AsyncStorage.getItem('token');
                if (token) {
                    // console.log('🔄 Trying to get current user from API...');
                    try {
                        const res = await authApi(token).get(endpoints['current-user']);
                        if (res.data) {
                            // console.log('👤 Current user from API:', res.data);
                            const role = res.data.role || 'user';
                            setCurrentUserRole(role);
                            
                            // Save role to separate key
                            await AsyncStorage.setItem('role', role);
                            // console.log('✅ Current user role from API:', role);
                            return role;
                        }
                    } catch (apiError) {
                        console.error('❌ Failed to get current user from API:', apiError);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading current user role:', error);
        }
        
        const defaultRole = 'user';
        setCurrentUserRole(defaultRole);
        // console.log('🔄 Using default role:', defaultRole);
        return defaultRole;
    };

    useFocusEffect(
        React.useCallback(() => {
            const initializeData = async () => {
                const userRole = await loadCurrentUserRole();
                
                if (showExpertsList) {
                    // Nếu user role = 'user' → load experts
                    // Nếu user role = 'coach'/'expert' → load users
                    if (userRole === 'user') {
                        await loadExperts();
                    } else {
                        await loadUsers();
                    }
                } else {
                    await initializeChatRooms();
                }
            };
            
            initializeData();
            
            return () => {
                // Clean up subscription khi component unmount hoặc unfocus
                if (unsubscribeChatRooms) {
                    unsubscribeChatRooms();
                }
            };
        }, [showExpertsList])
    );

    const loadExperts = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            // console.log('🔄 Loading experts...');
            
            const res = await authApi(token).get(endpoints['experts']);
            // console.log('✅ Experts API response:', res.data);
            
            if (res.data && Array.isArray(res.data)) {
                setExperts(res.data);
                // console.log('✅ Experts loaded:', res.data.length);
            } else {
                // console.log('⚠️ Experts response is not an array:', res.data);
            }
        } catch (error) {
            console.error("❌ Failed to fetch experts:", error);
            console.error("❌ Error details:", error.response?.data);
            Alert.alert("Lỗi", "Không thể tải danh sách chuyên gia: " + (error.response?.data?.detail || error.message));
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            // console.log('🔄 Loading users...');
            // console.log('🔑 Token:', token ? 'exists' : 'null');
            // console.log('🌐 Endpoint:', endpoints['user-info']);
            // console.log('🔗 Full URL:', `${BASE_URL}/${endpoints['user-info']}`);
            
            // Sử dụng endpoint users hoặc tương tự để lấy danh sách user
            const res = await authApi(token).get(endpoints['user-info']);
            // console.log('✅ Users API response:', res.data);
            // console.log('📊 Response type:', typeof res.data);
            // console.log('📊 Is array:', Array.isArray(res.data));
            
            // If response is not array, try to see what it contains
            // if (!Array.isArray(res.data)) {
            //     console.log('📊 Response keys:', Object.keys(res.data || {}));
            //     console.log('📊 Has results?', res.data?.results);
            //     console.log('📊 Has data?', res.data?.data);
            //     console.log('📊 Has users?', res.data?.users);
            // }
            
            if (res.data) {
                let userData = res.data;
                
                // Kiểm tra xem response có phải là object chứa array không
                if (!Array.isArray(userData)) {
                    if (userData.results && Array.isArray(userData.results)) {
                        userData = userData.results;
                        // console.log('📊 Using results array:', userData.length, 'items');
                    } else if (userData.data && Array.isArray(userData.data)) {
                        userData = userData.data;
                        // console.log('📊 Using data array:', userData.length, 'items');
                    } else if (userData.users && Array.isArray(userData.users)) {
                        userData = userData.users;
                        // console.log('📊 Using users array:', userData.length, 'items');
                    } else {
                        // console.log('❌ Response is not an array and has no results/data/users array');
                        // console.log('📊 Response structure:', Object.keys(userData));
                        
                        // Thử fallback: sử dụng endpoint experts và filter role='user'
                        // console.log('🔄 Trying fallback: using experts endpoint and filtering users...');
                        const expertRes = await authApi(token).get(endpoints['experts']);
                        if (expertRes.data && Array.isArray(expertRes.data)) {
                            const allUsers = expertRes.data.filter(user => user.role === 'user');
                            setUsers(allUsers);
                            // console.log('✅ Users loaded from experts endpoint:', allUsers.length);
                            return;
                        }
                        
                        Alert.alert("Lỗi", "Định dạng dữ liệu không đúng");
                        return;
                    }
                }
                
                // console.log('📊 Total users received:', userData.length);
                
                // Lọc users theo role
                const regularUsers = userData.filter(user => {
                    // console.log('👤 User:', user.first_name, user.last_name, 'Role:', user.role);
                    return user.role === 'user';
                });
                
                // console.log('✅ Regular users filtered:', regularUsers.length);
                setUsers(regularUsers);
            } else {
                // console.log('❌ No data in response');
                Alert.alert("Lỗi", "Không có dữ liệu");
            }
        } catch (error) {
            console.error("❌ Failed to fetch users:", error);
            console.error("❌ Error status:", error.response?.status);
            console.error("❌ Error data:", error.response?.data);
            console.error("❌ Error message:", error.message);
            
            // Fallback khi có lỗi: thử sử dụng experts endpoint
            if (error.response?.status === 404 || error.response?.status === 405) {
                // console.log('🔄 user-info endpoint failed, trying experts endpoint as fallback...');
                try {
                    const token = await AsyncStorage.getItem('token');
                    const expertRes = await authApi(token).get(endpoints['experts']);
                    if (expertRes.data && Array.isArray(expertRes.data)) {
                        const allUsers = expertRes.data.filter(user => user.role === 'user');
                        setUsers(allUsers);
                        // console.log('✅ Users loaded from experts endpoint fallback:', allUsers.length);
                        return;
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback also failed:', fallbackError);
                }
            }
            
            Alert.alert("Lỗi", `Không thể tải danh sách người dùng: ${error.response?.status} - ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const initializeChatRooms = async () => {
        try {
            setLoading(true);
            const userId = await ensureCurrentUserId();
            
            if (!userId) {
                Alert.alert('Lỗi', 'Không thể xác định người dùng. Vui lòng đăng nhập lại.');
                return;
            }

            setCurrentUserId(userId);
            setupChatRoomsListener(userId);
        } catch (error) {
            console.error('Error initializing chat rooms:', error);
            Alert.alert('Lỗi', 'Không thể tải danh sách cuộc trò chuyện');
        } finally {
            setLoading(false);
        }
    };

    const setupChatRoomsListener = (userId) => {
        const unsubscribe = getUserChatRooms(userId, async (snapshot) => {
            const roomsData = [];
            const newUnreadCounts = {};
            
            for (const doc of snapshot.docs) {
                const roomData = doc.data();
                const room = {
                    id: doc.id,
                    ...roomData
                };

                // Lấy thông tin người dùng khác trong cuộc trò chuyện
                if (!room.isGroup && room.participants) {
                    const otherUserId = room.participants.find(id => id !== userId);
                    // console.log('🔄 Other user ID:', otherUserId);
                    if (otherUserId) {
                        try {
                            // Thử lấy từ Firebase trước
                            let otherUserInfo = await getUserInfo(otherUserId);
                            
                            // Nếu không có trong Firebase, thử API
                            if (!otherUserInfo) {
                                try {
                                    const token = await AsyncStorage.getItem('token');
                                    // console.log('🔄 Token:', token);
                                    const res = await authApi(token).get(`${endpoints['user-info']}${otherUserId}/`);
                                    if (res.data) {
                                        otherUserInfo = res.data;
                                    }
                                } catch (apiError) {
                                    console.warn('Could not fetch user from API:', apiError);
                                }
                            }
                            
                            room.otherUser = otherUserInfo;
                        } catch (error) {
                            console.warn('Could not fetch other user info:', error);
                        }
                    }
                }

                // Lấy unread count cho room này
                try {
                    const unreadCount = await getUnreadCount(room.id, userId);
                    newUnreadCounts[room.id] = unreadCount;
                } catch (error) {
                    console.warn('Could not get unread count for room:', room.id, error);
                    newUnreadCounts[room.id] = 0;
                }

                roomsData.push(room);
            }
            
            setChatRooms(roomsData);
            setUnreadCounts(newUnreadCounts);
        });
        
        setUnsubscribeChatRooms(() => unsubscribe);
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        if (showExpertsList) {
            // Load theo role của user
            if (currentUserRole === 'user') {
                await loadExperts();
            } else {
                await loadUsers();
            }
        } else {
            await initializeChatRooms();
        }
        setRefreshing(false);
    };

    const handleChatPress = async (room) => {
        // console.log('🔄 Room data:', room);
        
        // Helper function để xử lý avatar URL
        const getAvatarUrl = (avatar) => {
            if (!avatar) return null;
            
            // Nếu đã là URL đầy đủ (bắt đầu với http/https)
            if (avatar.startsWith('http')) {
                return avatar;
            }
            
            // Nếu là path Cloudinary (chưa có domain)
            if (avatar.includes('image/upload/') || avatar.includes('cloudinary')) {
                return `https://res.cloudinary.com/dsfghzlat/${avatar}`;
            }
            
            // Fallback
            return avatar;
        };
        
        // Cập nhật lastReadTime khi user mở chat
        if (currentUserId) {
            try {
                await updateLastReadTime(room.id, currentUserId);
                // Cập nhật unread count về 0 cho room này
                setUnreadCounts(prev => ({
                    ...prev,
                    [room.id]: 0
                }));
            } catch (error) {
                console.warn('Could not update lastReadTime:', error);
            }
        }
        
        if (room.isGroup) {
            // Navigate to group chat
            navigation.navigate('FirebaseChatScreen', {
                existingChatRoomId: room.id,
                roomInfo: room
            });
        } else {
            // Navigate to direct chat với thông tin user chính xác
            navigation.navigate('FirebaseChatScreen', {
                existingChatRoomId: room.id,
                otherUserId: room.otherUser?.id,
                otherUserInfo: {
                    id: room.otherUser?.id,
                    first_name: room.otherUser?.first_name,
                    last_name: room.otherUser?.last_name,
                    avatar: getAvatarUrl(room.otherUser?.avatar || room.otherUser?.avatar_url),
                    role: room.otherUser?.role
                }
            });
        }
    };

    const handleExpertPress = async (expert) => {
        try {
            const userId = await ensureCurrentUserId();
            
            if (!userId) {
                Alert.alert("Lỗi", "Vui lòng đăng nhập lại để bắt đầu trò chuyện");
                return;
            }

            setLoading(true);

            // Tạo hoặc tìm chat room với chuyên gia
            const roomId = await findOrCreateDirectChat(userId, expert.id.toString());

            if (!roomId) {
                throw new Error("Không thể tạo cuộc trò chuyện");
            }

            // Helper function để xử lý avatar URL
            const getAvatarUrl = (avatar) => {
                if (!avatar) return null;
                
                // Nếu đã là URL đầy đủ (bắt đầu với http/https)
                if (avatar.startsWith('http')) {
                    return avatar;
                }
                
                // Nếu là path Cloudinary (chưa có domain)
                if (avatar.includes('image/upload/') || avatar.includes('cloudinary')) {
                    return `https://res.cloudinary.com/dsfghzlat/${avatar}`;
                }
                
                // Fallback
                return avatar;
            };

            // Navigate to chat screen với chuyên gia
            navigation.navigate('FirebaseChatScreen', {
                existingChatRoomId: roomId,
                otherUserId: expert.id.toString(),
                otherUserInfo: {
                    id: expert.id,
                    first_name: expert.first_name,
                    last_name: expert.last_name,
                    avatar: getAvatarUrl(expert.avatar || expert.avatar_url),
                    role: expert.role
                }
            });

        } catch (error) {
            console.error("Error starting chat with expert:", error);
            Alert.alert("Lỗi", "Không thể bắt đầu trò chuyện với chuyên gia");
        } finally {
            setLoading(false);
        }
    };

    const handleUserPress = async (user) => {
        try {
            const userId = await ensureCurrentUserId();
            
            if (!userId) {
                Alert.alert("Lỗi", "Vui lòng đăng nhập lại để bắt đầu trò chuyện");
                return;
            }

            setLoading(true);

            // Tạo hoặc tìm chat room với user
            const roomId = await findOrCreateDirectChat(userId, user.id.toString());

            if (!roomId) {
                throw new Error("Không thể tạo cuộc trò chuyện");
            }

            // Helper function để xử lý avatar URL
            const getAvatarUrl = (avatar) => {
                if (!avatar) return null;
                
                // Nếu đã là URL đầy đủ (bắt đầu với http/https)
                if (avatar.startsWith('http')) {
                    return avatar;
                }
                
                // Nếu là path Cloudinary (chưa có domain)
                if (avatar.includes('image/upload/') || avatar.includes('cloudinary')) {
                    return `https://res.cloudinary.com/dsfghzlat/${avatar}`;
                }
                
                // Fallback
                return avatar;
            };

            // Navigate to chat screen với user
            navigation.navigate('FirebaseChatScreen', {
                existingChatRoomId: roomId,
                otherUserId: user.id.toString(),
                otherUserInfo: {
                    id: user.id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    avatar: getAvatarUrl(user.avatar || user.avatar_url),
                    role: user.role
                }
            });

        } catch (error) {
            console.error("Error starting chat with user:", error);
            Alert.alert("Lỗi", "Không thể bắt đầu trò chuyện với người dùng");
        } finally {
            setLoading(false);
        }
    };

    const formatLastMessageTime = (timestamp) => {
        if (!timestamp) return '';

        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const now = new Date();
            const diffInMs = now - date;
            const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
            const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
            const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

            if (diffInMinutes < 60) {
                return diffInMinutes <= 1 ? 'Vừa xong' : `${diffInMinutes} phút`;
            } else if (diffInHours < 24) {
                return `${diffInHours}h`;
            } else if (diffInDays === 1) {
                return 'Hôm qua';
            } else if (diffInDays < 7) {
                return date.toLocaleDateString([], { weekday: 'short' });
            } else {
                return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            }
        } catch (e) {
            return '';
        }
    };

    const calculateAge = (birthDate) => {
        if (!birthDate) return 'N/A';
        
        try {
            if (/^\d{4}$/.test(birthDate)) {
                const birthYear = parseInt(birthDate);
                const currentYear = new Date().getFullYear();
                return currentYear - birthYear;
            }
            
            const yearMatch = birthDate.match(/\d{4}/);
            if (yearMatch) {
                const birthYear = parseInt(yearMatch[0]);
                const currentYear = new Date().getFullYear();
                return currentYear - birthYear;
            }
            
            return 'N/A';
        } catch (error) {
            return 'N/A';
        }
    };

    const extractYear = (dateString) => {
        if (!dateString) return 'N/A';
        
        try {
            if (/^\d{4}$/.test(dateString)) {
                return dateString;
            }
            
            const yearMatch = dateString.match(/\d{4}/);
            if (yearMatch) {
                return yearMatch[0];
            }
            
            return dateString;
        } catch (error) {
            return 'N/A';
        }
    };

    const renderChatRoom = ({ item }) => {
        // console.log('🔄 Room data:', item); // Debug log
        
        // Lấy thông tin user chính xác
        const userName = item.isGroup ? 
            item.roomName : 
            `${item.otherUser?.first_name || ''} ${item.otherUser?.last_name || ''}`.trim();
        
        // Xử lý avatar URL
        const getAvatarUrl = (avatar) => {
            if (!avatar) return DEFAULT_AVATAR;
            
            // Nếu đã là URL đầy đủ (bắt đầu với http/https)
            if (avatar.startsWith('http')) {
                return avatar;
            }
            
            // Nếu là path Cloudinary (chưa có domain)
            if (avatar.includes('image/upload/') || avatar.includes('cloudinary')) {
                return `https://res.cloudinary.com/dsfghzlat/${avatar}`;
            }
            
            // Fallback
            return avatar;
        };
        
        // Avatar của user đang chat
        const userAvatar = item.isGroup ? 
            { uri: DEFAULT_AVATAR } : 
            { uri: getAvatarUrl(item.otherUser?.avatar || item.otherUser?.avatar_url) };

        // Status online (giả lập)
        const isOnline = Math.random() > 0.5; // Có thể thay bằng logic thực

        return (
            <TouchableOpacity
                style={styles.chatRoomItem}
                onPress={() => handleChatPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.avatarContainer}>
                    <Avatar.Image
                        source={userAvatar}
                        size={56}
                        style={styles.avatar}
                    />
                    {!item.isGroup && isOnline && (
                        <View style={styles.onlineIndicator} />
                    )}
                </View>
                
                <View style={styles.chatContent}>
                    <View style={styles.chatHeader}>
                        <Text style={styles.chatName} numberOfLines={1}>
                            {userName || 'Người dùng'}
                        </Text>
                        <Text style={styles.timeText}>
                            {formatLastMessageTime(item.lastMessageTime)}
                        </Text>
                    </View>
                    
                    <View style={styles.chatFooter}>
                        <Text style={styles.lastMessage} numberOfLines={1}>
                            {item.lastMessage || 'Bắt đầu cuộc trò chuyện...'}
                        </Text>
                        {item.isGroup && (
                            <MaterialIcons
                                name="group"
                                size={16}
                                color="#65676b"
                                style={styles.groupIcon}
                            />
                        )}
                        {/* Unread badge thật */}
                        {unreadCounts[item.id] > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadText}>
                                    {unreadCounts[item.id] > 99 ? '99+' : unreadCounts[item.id]}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderExpertItem = ({ item }) => {
        // Xử lý avatar URL cho expert
        const getAvatarUrl = (avatar) => {
            if (!avatar) return DEFAULT_AVATAR;
            
            // Nếu đã là URL đầy đủ (bắt đầu với http/https)
            if (avatar.startsWith('http')) {
                return avatar;
            }
            
            // Nếu là path Cloudinary (chưa có domain)
            if (avatar.includes('image/upload/') || avatar.includes('cloudinary')) {
                return `https://res.cloudinary.com/dsfghzlat/${avatar}`;
            }
            
            // Fallback
            return avatar;
        };

        // Function to handle viewing expert's health status
        const handleViewExpertHealthStatus = () => {
            navigation.navigate('Trang chủ', {
                screen: 'Lịch sử tập luyện',
                params: {
                    targetUserId: item.id,
                    targetUserName: `${item.first_name} ${item.last_name}`,
                    isViewingOtherUser: true,
                    initialRouteName: 'Lịch sử tập luyện'
                }
            });
        };

        return (
            <TouchableOpacity onPress={() => handleExpertPress(item)} activeOpacity={0.8}>
                <View style={styles.expertCard}>
                    <View style={styles.expertContent}>
                        <View style={styles.expertAvatarContainer}>
                            <Avatar.Image 
                                source={{ uri: getAvatarUrl(item.avatar_url || item.avatar) }} 
                                size={64} 
                                style={styles.expertAvatar}
                            />
                        </View>
                        <View style={styles.expertInfo}>
                            <Text style={styles.expertName}>
                                {item.first_name} {item.last_name}
                            </Text>
                            <Text style={styles.expertRole}>
                                {item.role}
                            </Text>
                            
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.chatButton}>
                                    <Ionicons name="chatbubble" size={16} color="#065f46" />
                                    <Text style={styles.chatButtonText}>Nhắn tin</Text>
                                </TouchableOpacity>
                                
                                {/* Chỉ hiển thị nút xem tình trạng sức khỏe cho expert/coach và không phải chính mình */}
                                {(currentUserRole === 'expert' || currentUserRole === 'coach') && (
                                    <TouchableOpacity 
                                        style={styles.healthButton}
                                        onPress={handleViewExpertHealthStatus}
                                    >
                                        <Ionicons name="fitness" size={16} color="#0369a1" />
                                        <Text style={styles.healthButtonText}>Xem sức khỏe</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderUserItem = ({ item }) => {
        // Xử lý avatar URL cho user
        const getAvatarUrl = (avatar) => {
            if (!avatar) return DEFAULT_AVATAR;
            
            // Nếu đã là URL đầy đủ (bắt đầu với http/https)
            if (avatar.startsWith('http')) {
                return avatar;
            }
            
            // Nếu là path Cloudinary (chưa có domain)
            if (avatar.includes('image/upload/') || avatar.includes('cloudinary')) {
                return `https://res.cloudinary.com/dsfghzlat/${avatar}`;
            }
            
            // Fallback
            return avatar;
        };

        // Function to handle viewing user's health status
        const handleViewHealthStatus = () => {
            navigation.navigate('Trang chủ', {
                screen: 'Lịch sử tập luyện',
                params: {
                    targetUserId: item.id,
                    targetUserName: `${item.first_name} ${item.last_name}`,
                    isViewingOtherUser: true,
                    initialRouteName: 'Lịch sử tập luyện'
                }
            },
            {
                screen: 'Chỉ số cá nhân',
                params: {
                    targetUserId: item.id,
                    targetUserName: `${item.first_name} ${item.last_name}`,
                    isViewingOtherUser: true,
                }
            },
        );
        };

        return (
            <TouchableOpacity onPress={() => handleUserPress(item)} activeOpacity={0.8}>
                <View style={styles.expertCard}>
                    <View style={styles.expertContent}>
                        <View style={styles.expertAvatarContainer}>
                            <Avatar.Image 
                                source={{ uri: getAvatarUrl(item.avatar_url || item.avatar) }} 
                                size={64} 
                                style={styles.expertAvatar}
                            />
                        </View>
                        <View style={styles.expertInfo}>
                            <Text style={styles.expertName}>
                                {item.first_name} {item.last_name}
                            </Text>
                            <Text style={styles.expertRole}>
                                Thành viên
                            </Text>
                            
                            <View style={styles.actionButtons}>
                                <TouchableOpacity style={styles.chatButton}>
                                    <Ionicons name="chatbubble" size={16} color="#065f46" />
                                    <Text style={styles.chatButtonText}>Nhắn tin</Text>
                                </TouchableOpacity>
                                
                                {/* Chỉ hiển thị nút xem tình trạng sức khỏe cho expert/coach */}
                                {(currentUserRole === 'expert' || currentUserRole === 'coach') && (
                                    <TouchableOpacity 
                                        style={styles.healthButton}
                                        onPress={handleViewHealthStatus}
                                    >
                                        <Ionicons name="fitness" size={16} color="#0369a1" />
                                        <Text style={styles.healthButtonText}>Xem sức khỏe</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    // Loading state
    if (loading) {
        const loadingTitle = showExpertsList ? 
            (currentUserRole === 'user' ? "Chuyên gia tư vấn" : "Danh sách thành viên") : 
            "Tin nhắn";
        const loadingText = showExpertsList ? 
            (currentUserRole === 'user' ? 'Đang tải danh sách chuyên gia...' : 'Đang tải danh sách thành viên...') : 
            'Đang tải cuộc trò chuyện...';
            
        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#065f46" barStyle="light-content" />
                <View style={styles.header}>
                    {showExpertsList && (
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('ChatRoomsList')}
                            style={styles.headerBackButton}
                        >
                            <Ionicons name="arrow-back" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.headerTitle}>
                        {loadingTitle}
                    </Text>
                    {!showExpertsList && (
                        <TouchableOpacity onPress={toggleExpertsView} style={styles.headerAction}>
                            <Ionicons name="people" size={24} color="white" />
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065f46" />
                    <Text style={styles.loadingText}>
                        {loadingText}
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    // Experts/Users list view
    if (showExpertsList) {
        // Lấy data và title phù hợp
        const listData = currentUserRole === 'user' ? experts : users;
        const listTitle = currentUserRole === 'user' ? "Chuyên gia tư vấn" : "Danh sách thành viên";
        const renderItem = currentUserRole === 'user' ? renderExpertItem : renderUserItem;
        const emptyText = currentUserRole === 'user' ? "Không tìm thấy chuyên gia" : "Không tìm thấy thành viên";
        
        const filteredData = listData.filter(item => {
            const fullName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
            const specialty = (item.role || '').toLowerCase();
            const query = searchQuery.toLowerCase();
            
            return fullName.includes(query) || specialty.includes(query);
        });

        return (
            <SafeAreaView style={styles.container}>
                <StatusBar backgroundColor="#065f46" barStyle="light-content" />
                <View style={styles.header}>
                    <TouchableOpacity onPress={toggleExpertsView} style={styles.headerBackButton}>
                        <Ionicons name="arrow-back" size={24} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{listTitle}</Text>
                    <View style={styles.headerAction} />
                </View>

                <View style={styles.searchContainer}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search" size={20} color="#65676b" style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={currentUserRole === 'user' ? "Tìm chuyên gia..." : "Tìm thành viên..."}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            placeholderTextColor="#65676b"
                        />
                    </View>
                </View>

                <FlatList
                    data={filteredData}
                    renderItem={renderItem}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.expertsList}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={['#065f46']}
                            tintColor="#065f46"
                        />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons 
                                name={currentUserRole === 'user' ? "medical-outline" : "people-outline"} 
                                size={80} 
                                color="#ccc" 
                            />
                            <Text style={styles.emptyText}>
                                {emptyText}
                            </Text>
                        </View>
                    }
                />
            </SafeAreaView>
        );
    }

    // Chat rooms list view (Messenger-like)
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#065f46" barStyle="light-content" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Tin nhắn</Text>
                <TouchableOpacity onPress={toggleExpertsView} style={styles.headerAction}>
                    <Ionicons name="people" size={24} color="white" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={chatRooms}
                renderItem={renderChatRoom}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#065f46']}
                        tintColor="#065f46"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubbles-outline" size={80} color="#ccc" />
                        <Text style={styles.emptyText}>
                            Chưa có cuộc trò chuyện nào
                        </Text>
                        <Text style={styles.emptySubText}>
                            Nhấn biểu tượng {currentUserRole === 'user' ? 'chuyên gia' : 'thành viên'} ở trên để bắt đầu
                        </Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    header: {
        backgroundColor: '#065f46',
        elevation: 4,
        height: 64,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    headerBackButton: {
        padding: 8,
        marginRight: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        flex: 1,
    },
    headerAction: {
        padding: 8,
        marginLeft: 8,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        color: '#065f46',
        fontSize: 16,
    },
    searchContainer: {
        padding: 16,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e4e6ea',
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
        paddingHorizontal: 4,
    },
    searchIcon: {
        marginLeft: 12,
    },
    searchInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
        color: '#1c1e21',
    },
    listContainer: {
        flexGrow: 1,
    },
    expertsList: {
        padding: 16,
        flexGrow: 1,
    },
    chatRoomItem: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 16,
        alignItems: 'center',
        borderBottomWidth: 0.5,
        borderBottomColor: '#e4e6ea',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        backgroundColor: '#f0f2f5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#42D392',
        borderWidth: 2,
        borderColor: 'white',
    },
    chatContent: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    chatName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1c1e21',
        flex: 1,
    },
    timeText: {
        fontSize: 13,
        color: '#65676b',
        marginLeft: 8,
        fontWeight: '400',
    },
    chatFooter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    lastMessage: {
        fontSize: 14,
        color: '#65676b',
        flex: 1,
        lineHeight: 18,
    },
    groupIcon: {
        marginLeft: 8,
    },
    unreadBadge: {
        backgroundColor: '#065f46',
        borderRadius: 12,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    unreadText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: 'white',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 120,
        paddingHorizontal: 40,
    },
    emptyText: {
        fontSize: 18,
        color: '#65676b',
        marginTop: 16,
        textAlign: 'center',
        fontWeight: '500',
    },
    emptySubText: {
        fontSize: 14,
        color: '#8a8d91',
        marginTop: 8,
        textAlign: 'center',
        lineHeight: 20,
    },
    // Expert list styles
    expertCard: {
        marginVertical: 8,
        borderRadius: 16,
        backgroundColor: '#ffffff',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        padding: 16,
    },
    expertContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    expertAvatarContainer: {
        position: 'relative',
        marginRight: 16,
    },
    expertAvatar: {
        backgroundColor: '#f0f2f5',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    expertBadge: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: '#065f46',
        borderRadius: 12,
        width: 24,
        height: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    expertInfo: {
        flex: 1,
    },
    expertName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1c1e21',
        marginBottom: 4,
    },
    expertRole: {
        fontSize: 15,
        color: '#65676b',
        marginBottom: 8,
    },
    expertStats: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    ratingText: {
        fontSize: 14,
        color: '#1c1e21',
        marginLeft: 4,
        fontWeight: '600',
    },
    reviewsText: {
        fontSize: 13,
        color: '#65676b',
        marginLeft: 4,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    chatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        alignSelf: 'flex-start',
    },
    chatButtonText: {
        fontSize: 14,
        color: '#065f46',
        marginLeft: 6,
        fontWeight: '600',
    },
    healthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0f2fe',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginLeft: 8,
        alignSelf: 'flex-start',
    },
    healthButtonText: {
        fontSize: 14,
        color: '#0369a1',
        marginLeft: 6,
        fontWeight: '600',
    },
});

export default ChatRoomsList; 