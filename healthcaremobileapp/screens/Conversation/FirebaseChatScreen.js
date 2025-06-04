import React, { useState, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    FlatList, 
    TextInput, 
    TouchableOpacity, 
    StyleSheet, 
    KeyboardAvoidingView, 
    Platform, 
    ActivityIndicator,
    Alert,
    SafeAreaView,
    StatusBar,
    Animated,
    Dimensions
} from 'react-native';
import { Avatar } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';


// Import Firebase services
import { 
    listenToMessages, 
    sendMessage, 
    markMessagesAsRead,
    findOrCreateDirectChat,
    getUserInfo,
    ensureCurrentUserId,
    updateLastReadTime
} from '../../utils/chatService';
import { authApi, endpoints } from '../../configs/Apis';

const { width } = Dimensions.get('window');

const FirebaseChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [chatRoomId, setChatRoomId] = useState(null);
    const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);
    const route = useRoute();
    const navigation = useNavigation();
    
    // Animation values
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    
    // Params từ navigation
    const { otherUserId, otherUserInfo, existingChatRoomId } = route.params || {};
    
    const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User';

    useEffect(() => {
        // console.log('🚀 FirebaseChatScreen route params:', route.params);
        // console.log('🔍 otherUserId:', otherUserId);
        // console.log('🔍 otherUserInfo:', otherUserInfo);
        // console.log('🔍 existingChatRoomId:', existingChatRoomId);
        
        initializeChat();
        
        // Fade in animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
        
        return () => {
            // Clean up subscription khi component unmount
            if (unsubscribeMessages) {
                unsubscribeMessages();
            }
        };
    }, []);

    // Set navigation header
    useEffect(() => {
        if (otherUserInfo) {
            navigation.setOptions({
                headerShown: true,
                headerTitle: () => (
                    <View style={styles.headerTitle}>
                        <Avatar.Image 
                            source={otherUserInfo.avatar ? { uri: otherUserInfo.avatar } : { uri: DEFAULT_AVATAR }}
                            size={35}
                            style={styles.headerAvatar}
                        />
                        <View style={styles.headerTextContainer}>
                            <Text style={styles.headerName}>
                                {otherUserInfo.first_name} {otherUserInfo.last_name}
                            </Text>
                            <Text style={styles.headerStatus}>Đang hoạt động</Text>
                        </View>
                    </View>
                ),
                headerStyle: {
                    backgroundColor: '#065f46',
                },
                headerTintColor: 'white',
                // headerLeft: () => (
                //     <TouchableOpacity 
                //         onPress={() => navigation.goBack()}
                //         style={styles.headerBackButton}
                //     >
                //         <Ionicons name="arrow-back" size={24} color="white" />
                //     </TouchableOpacity>
                // ),
                // headerRight: () => (
                //     <View style={styles.headerRightButtons}>
                //         <TouchableOpacity style={styles.headerButton}>
                //             <Ionicons name="videocam" size={24} color="white" />
                //         </TouchableOpacity>
                //         <TouchableOpacity style={styles.headerButton}>
                //             <Ionicons name="call" size={24} color="white" />
                //         </TouchableOpacity>
                //         <TouchableOpacity style={styles.headerButton}>
                //             <MaterialIcons name="info-outline" size={24} color="white" />
                //         </TouchableOpacity>
                //     </View>
                // )
            });
        }
    }, [otherUserInfo, navigation]);

    const initializeChat = async () => {
        // console.log('🚀 Initializing chat...');
        // console.log('📝 Route params:', { existingChatRoomId, otherUserId, otherUserInfo });
        
        try {
            setLoading(true);

            // Load current user first
            await loadCurrentUser();

            // If otherUserInfo is missing but we have otherUserId, try to load it
            if (otherUserId && !otherUserInfo) {
                // console.log('⚠️ otherUserInfo missing, trying to load from API...');
                try {
                    const token = await AsyncStorage.getItem('token');
                    if (token) {
                        const res = await authApi(token).get(`${endpoints['hieu-user-infor']}${otherUserId}/`);
                        if (res.data) {
                            // console.log('✅ Loaded otherUserInfo from API:', res.data);
                            // Set navigation params với otherUserInfo đã load
                            navigation.setParams({ 
                                ...route.params, 
                                otherUserInfo: res.data 
                            });
                        }
                    }
                } catch (error) {
                    console.warn('Could not load otherUserInfo from API:', error);
                }
            }

            if (existingChatRoomId) {
                // console.log('💬 Using existing chat room:', existingChatRoomId);
                setChatRoomId(existingChatRoomId);
                setupMessageListener(existingChatRoomId);
            } else if (otherUserId) {
                // console.log('👥 Creating/finding direct chat with user:', otherUserId);
                const currentUserId = await getCurrentUserId();
                
                if (!currentUserId) {
                    throw new Error('Cannot identify current user');
                }

                const roomId = await findOrCreateDirectChat(currentUserId, otherUserId);
                // console.log('✅ Chat room ID:', roomId);
                setChatRoomId(roomId);
                setupMessageListener(roomId);
            } else {
                // console.log('❌ No chat room ID or other user ID provided');
                throw new Error('Thiếu thông tin để tạo cuộc trò chuyện');
            }

        } catch (error) {
            console.error('❌ Error initializing chat:', error);
            Alert.alert('Lỗi', error.message || 'Không thể khởi tạo cuộc trò chuyện');
        } finally {
            setLoading(false);
            // console.log('🏁 Initialize chat finished');
        }
    };

    const getCurrentUserId = async () => {
        try {
            // Ưu tiên lấy từ currentUserId được lưu khi login
            let userId = await AsyncStorage.getItem('currentUserId');
            // console.log('🆔 getCurrentUserId from currentUserId key:', userId);
            
            if (!userId) {
                // Fallback: sử dụng ensureCurrentUserId
                userId = await ensureCurrentUserId();
                // console.log('🆔 getCurrentUserId from ensureCurrentUserId:', userId);
            }
            
            return userId;
        } catch (error) {
            console.error('❌ Error getting current user ID:', error);
            return null;
        }
    };

    const loadCurrentUser = async () => {
        try {
            // console.log('🔄 Loading current user...');
            const userId = await getCurrentUserId();
            // console.log('🆔 Retrieved user ID:', userId);
            
            if (userId) {
                // Thử lấy từ Firebase users collection trước
                const userInfo = await getUserInfo(userId);
                // console.log('👤 User info from Firebase:', userInfo);
                
                if (userInfo) {
                    setCurrentUser(userInfo);
                    // console.log('✅ Current user set from Firebase:', userInfo);
                } else {
                    // console.log('⚠️ No user info in Firebase, creating fallback user...');
                    
                    // Fallback: tạo user object với ĐÚNG current user ID
                    let fallbackUser = {
                        id: userId, // Use CURRENT user ID, not cached ID
                        name: 'User',
                        avatar: null
                    };
                    
                    try {
                        const cachedUser = await AsyncStorage.getItem('current-user');
                        if (cachedUser) {
                            const parsedUser = JSON.parse(cachedUser);
                            
                            // CHỈ sử dụng cached data nếu ID khớp với current user
                            if (parsedUser.id && parsedUser.id.toString() === userId.toString()) {
                                fallbackUser = {
                                    id: userId, // FORCE current user ID
                                    name: parsedUser.first_name ? 
                                        `${parsedUser.first_name} ${parsedUser.last_name || ''}`.trim() : 
                                        parsedUser.username || parsedUser.name || 'User',
                                    avatar: parsedUser.avatar || null,
                                    // Include other fields but override ID
                                    ...parsedUser,
                                    id: userId // Override ID again to ensure it's current user ID
                                };
                                // console.log('✅ Enhanced fallback user with MATCHING cached data:', fallbackUser);
                            } else {
                                // console.log('⚠️ Cached user ID mismatch. Cached:', parsedUser.id, 'Current:', userId);
                                // console.log('🔄 Using minimal fallback user without cached data');
                                
                                // Try to get current user data from API
                                try {
                                    const token = await AsyncStorage.getItem('token');
                                    if (token) {
                                        const res = await authApi(token).get(endpoints['current-user']);
                                        if (res.data) {
                                            fallbackUser = {
                                                id: userId,
                                                name: res.data.first_name ? 
                                                    `${res.data.first_name} ${res.data.last_name || ''}`.trim() : 
                                                    res.data.username || 'User',
                                                avatar: res.data.avatar || null,
                                                ...res.data,
                                                id: userId // Override ID to ensure consistency
                                            };
                                            // console.log('✅ Fallback user from API:', fallbackUser);
                                            
                                            // Update AsyncStorage with correct user data
                                            await AsyncStorage.setItem('current-user', JSON.stringify(res.data));
                                        }
                                    }
                                } catch (apiError) {
                                    console.error('Could not get current user from API:', apiError);
                                }
                            }
                        }
                    } catch (parseError) {
                        console.error('Error parsing cached user, using minimal fallback:', parseError);
                    }
                    
                    setCurrentUser(fallbackUser);
                    // console.log('✅ Final current user set:', fallbackUser);
                }
            } else {
                // console.log('❌ No user ID found');
                Alert.alert('Lỗi', 'Không thể xác định người dùng. Vui lòng đăng nhập lại.');
            }
        } catch (error) {
            // console.error('❌ Error loading current user:', error);
            // Tạo user tối thiểu để không block gửi tin nhắn
            const userId = await getCurrentUserId();
            if (userId) {
                const minimalUser = {
                    id: userId,
                    name: 'User',
                    avatar: null
                };
                setCurrentUser(minimalUser);
                // console.log('✅ Set minimal user as last resort:', minimalUser);
            }
        }
    };

    const setupMessageListener = (roomId) => {
        const unsubscribe = listenToMessages(roomId, async (snapshot) => {
            const messagesData = [];
            snapshot.forEach((doc) => {
                const messageData = doc.data();
                messagesData.push({
                    id: doc.id,
                    senderId: messageData.senderId,
                    message: messageData.message,
                    timestamp: messageData.timestamp,
                    messageType: messageData.messageType || 'text',
                    isRead: messageData.isRead
                });
            });
            
            // Debug: Show all messages and their senderIds
            // console.log('📨 ALL MESSAGES DEBUG:');
            // messagesData.forEach((msg, index) => {
            //     console.log(`Message ${index}: "${msg.message}" from senderId: "${msg.senderId}"`);
            // });
            // console.log('👤 Current user ID:', currentUser?.id);
            
            setMessages(messagesData);
            
            // Cập nhật lastReadTime khi có tin nhắn mới
            if (currentUser?.id) {
                try {
                    await updateLastReadTime(roomId, currentUser.id);
                } catch (error) {
                    console.warn('Could not update lastReadTime:', error);
                }
            }
            
            // Scroll to bottom với animation mượt
            setTimeout(() => {
                if (flatListRef.current && messagesData.length > 0) {
                    flatListRef.current.scrollToEnd({ animated: true });
                }
            }, 100);
        });
        
        setUnsubscribeMessages(() => unsubscribe);
    };

    const handleSendMessage = async () => {
        // console.log('🚀 Send button pressed');
        // console.log('📝 Input text:', inputText);
        // console.log('🏠 Chat room ID:', chatRoomId);
        // console.log('👤 Current user:', currentUser);
        
        if (!inputText.trim()) {
            // console.log('❌ Empty message, returning');
            return;
        }
        
        if (!chatRoomId) {
            // console.log('❌ No chat room ID, returning');
            Alert.alert('Lỗi', 'Phòng chat chưa được tạo');
            return;
        }
        
        if (!currentUser?.id) {
            // console.log('❌ No current user ID, returning');
            Alert.alert('Lỗi', 'Không thể xác định người dùng');
            return;
        }

        const messageText = inputText.trim();
        setInputText('');
        
        // console.log('✅ All checks passed, sending message:', messageText);

        try {
            await sendMessage(chatRoomId, currentUser.id.toString(), messageText);
            // console.log('✅ Message sent successfully');
        } catch (error) {
            console.error('❌ Error sending message:', error);
            Alert.alert('Lỗi', 'Không thể gửi tin nhắn: ' + error.message);
            setInputText(messageText); // Restore text if failed
        }
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            // Convert Firebase timestamp to Date
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            const today = new Date();
            const messageDate = new Date(date);
            
            if (messageDate.toDateString() === today.toDateString()) {
                return 'Hôm nay';
            }
            
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (messageDate.toDateString() === yesterday.toDateString()) {
                return 'Hôm qua';
            }
            
            return date.toLocaleDateString('vi-VN');
        } catch (e) {
            return '';
        }
    };

    const shouldShowDate = (message, index) => {
        if (index === 0) return true;
        
        const prevMessage = messages[index - 1];
        if (!message.timestamp || !prevMessage.timestamp) return false;
        
        const messageDate = message.timestamp.toDate ? 
            message.timestamp.toDate().toDateString() : 
            new Date(message.timestamp).toDateString();
        const prevMessageDate = prevMessage.timestamp.toDate ? 
            prevMessage.timestamp.toDate().toDateString() : 
            new Date(prevMessage.timestamp).toDateString();
        
        return messageDate !== prevMessageDate;
    };

    const shouldShowAvatar = (message, index) => {
        if (index === messages.length - 1) return true;
        
        const nextMessage = messages[index + 1];
        return !nextMessage || nextMessage.senderId !== message.senderId;
    };

    const renderDateSeparator = (timestamp) => (
        <View style={styles.dateSeparator}>
            <View style={styles.dateSeparatorLine} />
            <Text style={styles.dateText}>{formatDate(timestamp)}</Text>
            <View style={styles.dateSeparatorLine} />
        </View>
    );

    const renderMessage = ({ item, index }) => {
        // Fix: Convert both IDs to string for comparison
        const isCurrentUser = currentUser && item.senderId.toString() === currentUser.id.toString();
        
        // console.log(`💬 Message "${item.message}": senderId="${item.senderId}" vs currentUserId="${currentUser?.id}" → isCurrentUser=${isCurrentUser}`);
        
        const showAvatar = shouldShowAvatar(item, index);
        
        // Debug avatar logic
        // console.log('🖼️ Avatar debug:', {
        //     currentUserId: currentUser?.id,
        //     currentUserAvatar: currentUser?.avatar,
        //     otherUserInfoId: otherUserInfo?.id,
        //     otherUserInfoAvatar: otherUserInfo?.avatar,
        //     messageSenderId: item.senderId
        // });
        
        // Dynamic avatar selection based on message sender
        let messageAvatar;
        if (isCurrentUser) {
            // Message từ current user → dùng current user avatar
            messageAvatar = currentUser?.avatar ? { uri: currentUser.avatar } : { uri: DEFAULT_AVATAR };
        } else {
            // Message từ user khác → dùng other user avatar
            messageAvatar = otherUserInfo?.avatar ? { uri: otherUserInfo.avatar } : { uri: DEFAULT_AVATAR };
        }
        
        // console.log('🖼️ Selected avatar for message:', messageAvatar);
        
        const userAvatar = currentUser && currentUser.avatar ? 
            { uri: currentUser.avatar } : { uri: DEFAULT_AVATAR };
        const otherUserAvatar = otherUserInfo && otherUserInfo.avatar ? 
            { uri: otherUserInfo.avatar } : { uri: DEFAULT_AVATAR };
        
        return (
            <Animated.View style={{
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
            }}>
                {shouldShowDate(item, index) && renderDateSeparator(item.timestamp)}
                
                <View style={[
                    styles.messageContainer,
                    isCurrentUser ? styles.rightMessage : styles.leftMessage
                ]}>
                    {!isCurrentUser && (
                        <Avatar.Image 
                            source={messageAvatar}
                            size={32} 
                            style={[
                                styles.avatar,
                                { opacity: showAvatar ? 1 : 0 }
                            ]}
                        />
                    )}
                    
                    <View style={[
                        styles.messageBubble,
                        isCurrentUser ? styles.sentBubble : styles.receivedBubble,
                        !showAvatar && isCurrentUser && styles.consecutiveSentBubble,
                        !showAvatar && !isCurrentUser && styles.consecutiveReceivedBubble
                    ]}>
                        <Text style={[
                            styles.messageText,
                            isCurrentUser ? styles.sentMessageText : styles.receivedMessageText
                        ]}>
                            {item.message}
                        </Text>
                        {showAvatar && (
                            <Text style={[
                                styles.timeText,
                                isCurrentUser ? styles.sentTimeText : styles.receivedTimeText
                            ]}>
                                {formatTime(item.timestamp)}
                            </Text>
                        )}
                    </View>
                    
                    {isCurrentUser && (
                        <Avatar.Image 
                            source={messageAvatar}
                            size={32} 
                            style={[
                                styles.avatar,
                                { opacity: showAvatar ? 1 : 0 }
                            ]}
                        />
                    )}
                </View>
            </Animated.View>
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="white" />
                <Text style={styles.loadingText}>Đang tải cuộc trò chuyện...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#065f46" barStyle="light-content" />
            
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={styles.messagesList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Avatar.Image 
                                source={otherUserInfo?.avatar ? { uri: otherUserInfo.avatar } : { uri: DEFAULT_AVATAR }}
                                size={80}
                                style={styles.emptyAvatar}
                            />
                            <Text style={styles.emptyTitle}>
                                {otherUserInfo ? `${otherUserInfo.first_name} ${otherUserInfo.last_name}` : 'Cuộc trò chuyện'}
                            </Text>
                            <Text style={styles.emptyText}>
                                Bắt đầu cuộc trò chuyện
                            </Text>
                        </View>
                    }
                />

                {isTyping && (
                    <View style={styles.typingContainer}>
                        <View style={styles.typingBubble}>
                            <View style={styles.typingDots}>
                                <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
                                <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
                                <Animated.View style={[styles.typingDot, { opacity: fadeAnim }]} />
                            </View>
                        </View>
                    </View>
                )}

                <View style={styles.inputContainer}>
                    <View style={styles.inputWrapper}>
                        <TouchableOpacity style={styles.attachButton}>
                            <Ionicons name="add" size={24} color="#065f46" />
                        </TouchableOpacity>
                        
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Aa"
                            multiline
                            maxLength={500}
                            placeholderTextColor="#999"
                        />
                        
                        <TouchableOpacity style={styles.emojiButton}>
                            <MaterialIcons name="emoji-emotions" size={24} color="#065f46" />
                        </TouchableOpacity>
                    </View>
                    
                    <TouchableOpacity 
                        style={[
                            styles.sendButton,
                            { 
                                opacity: inputText.trim() ? 1 : 0.5,
                                transform: [{ scale: inputText.trim() ? 1 : 0.8 }]
                            }
                        ]} 
                        onPress={handleSendMessage}
                        disabled={!inputText.trim()}
                    >
                        <View style={styles.sendButtonGradient}>
                            <Ionicons name="send" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#065f46',
    },
    loadingText: {
        marginTop: 10,
        color: 'white',
        fontSize: 16,
        fontWeight: '500',
    },
    messagesList: {
        paddingHorizontal: 12,
        paddingBottom: 10,
        flexGrow: 1,
        paddingTop: 10,
    },
    messageContainer: {
        flexDirection: 'row',
        marginVertical: 2,
        alignItems: 'flex-end',
        paddingHorizontal: 4,
    },
    leftMessage: {
        justifyContent: 'flex-start',
    },
    rightMessage: {
        justifyContent: 'flex-end',
    },
    avatar: {
        marginHorizontal: 4,
        backgroundColor: '#f0f0f0',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    messageBubble: {
        maxWidth: width * 0.75,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        marginHorizontal: 4,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
    },
    sentBubble: {
        backgroundColor: '#065f46',
        borderBottomRightRadius: 6,
    },
    receivedBubble: {
        backgroundColor: '#f1f3f4',
        borderBottomLeftRadius: 6,
    },
    consecutiveSentBubble: {
        borderBottomRightRadius: 20,
        marginTop: 2,
    },
    consecutiveReceivedBubble: {
        borderBottomLeftRadius: 20,
        marginTop: 2,
    },
    messageText: {
        fontSize: 16,
        lineHeight: 22,
        fontWeight: '400',
    },
    sentMessageText: {
        color: 'white',
    },
    receivedMessageText: {
        color: '#1c1e21',
    },
    timeText: {
        fontSize: 11,
        alignSelf: 'flex-end',
        marginTop: 4,
        fontWeight: '400',
    },
    sentTimeText: {
        color: 'rgba(255, 255, 255, 0.8)',
    },
    receivedTimeText: {
        color: 'rgba(0, 0, 0, 0.6)',
    },
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
        paddingHorizontal: 20,
    },
    dateSeparatorLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e4e6ea',
    },
    dateText: {
        fontSize: 13,
        color: '#65676b',
        backgroundColor: 'white',
        paddingHorizontal: 12,
        paddingVertical: 4,
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        backgroundColor: 'white',
        alignItems: 'flex-end',
        borderTopWidth: 1,
        borderTopColor: '#e4e6ea',
        minHeight: 60,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        backgroundColor: '#f0f2f5',
        borderRadius: 20,
        paddingHorizontal: 4,
        minHeight: 40,
    },
    attachButton: {
        padding: 8,
        borderRadius: 20,
    },
    input: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 8,
        maxHeight: 100,
        fontSize: 16,
        color: '#1c1e21',
        lineHeight: 20,
    },
    emojiButton: {
        padding: 8,
        borderRadius: 20,
    },
    sendButton: {
        marginLeft: 8,
        borderRadius: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    sendButtonGradient: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#065f46',
    },
    typingContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: 'white',
    },
    typingBubble: {
        backgroundColor: '#f0f2f5',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
        alignSelf: 'flex-start',
        marginLeft: 48,
    },
    typingDots: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    typingDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#65676b',
        marginHorizontal: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 80,
        paddingHorizontal: 40,
    },
    emptyAvatar: {
        marginBottom: 16,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1c1e21',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyText: {
        color: '#65676b',
        fontSize: 16,
        textAlign: 'center',
        lineHeight: 22,
    },
    headerTitle: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerAvatar: {
        marginRight: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
    },
    headerTextContainer: {
        flexDirection: 'column',
        flex: 1,
    },
    headerName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: 'white',
    },
    headerStatus: {
        fontSize: 13,
        color: 'rgba(255, 255, 255, 0.8)',
        marginTop: 1,
    },
    headerBackButton: {
        padding: 8,
        marginRight: 8,
    },
    headerRightButtons: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
        marginLeft: 4,
    },
});

export default FirebaseChatScreen; 