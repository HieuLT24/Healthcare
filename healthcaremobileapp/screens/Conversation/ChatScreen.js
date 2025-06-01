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
    Image,
    Alert
} from 'react-native';
// import Icon from '../../components/IconComponents';
import { Avatar } from 'react-native-paper';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute, useNavigation } from '@react-navigation/native';


const ChatScreen = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [unsubscribeMessages, setUnsubscribeMessages] = useState(null);
    const flatListRef = useRef(null);
    const route = useRoute();
    const navigation = useNavigation();
    const params = route.params || {};
    const conversationId = params.conversationId;
    const otherUser = params.otherUser;
    
    const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=0D8ABC&color=fff&name=User';

    useEffect(() => {
        if (!otherUser) {
            console.error("Error: Không thể xác định người dùng trong cuộc trò chuyện");
            Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
            navigation.goBack();
            return;
        }
        
        navigation.setOptions({
            title: `${otherUser.first_name} ${otherUser.last_name}`,
            headerTitleStyle: { color: '#065f46' }
        });

        loadCurrentUser();

        return () => {
            // Clean up subscription when component unmounts
            if (unsubscribeMessages) {
                unsubscribeMessages();
            }
        };
    }, []);




    const loadCurrentUser = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                console.error("No authentication token found");
                Alert.alert("Lỗi", "Bạn chưa đăng nhập. Vui lòng đăng nhập lại.");
                return;
            }
            
            const res = await authApi(token).get(endpoints['current-user']);
            if (!res.data || !res.data.id) {
                console.error("Invalid user data received:", res.data);
                Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
                return;
            }
            
            setCurrentUser(res.data);
        } catch (ex) {
            console.error("Failed to load current user:", ex);
            Alert.alert("Lỗi", "Không thể tải thông tin người dùng");
        }
    };

    const formatTime = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    const formatDate = (dateString) => {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString();
        } catch (e) {
            return '';
        }
    };

    const shouldShowDate = (message, index) => {
        if (index === 0) return true;
        
        const prevMessage = messages[index - 1];
        const messageDate = new Date(message.createdAt).toDateString();
        const prevMessageDate = new Date(prevMessage.createdAt).toDateString();
        
        return messageDate !== prevMessageDate;
    };

    const renderDateSeparator = (date) => (
        <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(date)}</Text>
        </View>
    );

    const renderMessage = ({ item, index }) => {
        const isCurrentUser = currentUser && item.senderId === currentUser.id.toString();
        
        // Kiểm tra và sử dụng avatar mặc định nếu không có
        const userAvatar = currentUser && currentUser.avatar ? 
            { uri: currentUser.avatar } : { uri: DEFAULT_AVATAR };
        const otherUserAvatar = otherUser && otherUser.avatar ? 
            { uri: otherUser.avatar } : { uri: DEFAULT_AVATAR };
        
        return (
            <View>
                {shouldShowDate(item, index) && renderDateSeparator(item.createdAt)}
                
                <View style={[
                    styles.messageContainer,
                    isCurrentUser ? styles.rightMessage : styles.leftMessage
                ]}>
                    {!isCurrentUser && (
                        <Avatar.Image 
                            source={otherUserAvatar}
                            size={30} 
                            style={styles.avatar}
                        />
                    )}
                    
                    <View style={[
                        styles.messageBubble,
                        isCurrentUser ? styles.sentBubble : styles.receivedBubble,
                        item.temp && styles.tempMessage
                    ]}>
                        <Text style={[
                            styles.messageText,
                            isCurrentUser ? styles.sentMessageText : styles.receivedMessageText
                        ]}>
                            {item.content}
                        </Text>
                        <Text style={[
                            styles.timeText,
                            isCurrentUser ? styles.sentTimeText : styles.receivedTimeText
                        ]}>
                            {formatTime(item.createdAt)}
                        </Text>
                    </View>
                    
                    {isCurrentUser && (
                        <Avatar.Image 
                            source={userAvatar}
                            size={30} 
                            style={styles.avatar}
                        />
                    )}
                </View>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
            keyboardVerticalOffset={150}
        >
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#065f46" />
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={styles.messagesList}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>
                                Bắt đầu cuộc trò chuyện
                            </Text>
                        </View>
                    }
                />
            )}

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder="Nhập tin nhắn..."
                    multiline
                />
                <TouchableOpacity 
                    style={styles.sendButton} 
                    onPress={handleSendMessage}
                    disabled={!inputText.trim()}
                >
                    <Icon 
                        name="send" 
                        size={24} 
                        color={inputText.trim() ? "#065f46" : "#ccc"} 
                    />
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    messagesList: {
        paddingHorizontal: 10,
        paddingBottom: 10,
    },
    messageContainer: {
        flexDirection: 'row',
        marginVertical: 4,
        alignItems: 'flex-end',
    },
    leftMessage: {
        justifyContent: 'flex-start',
    },
    rightMessage: {
        justifyContent: 'flex-end',
    },
    avatar: {
        marginHorizontal: 4,
        backgroundColor: '#e2f8f0',
    },
    messageBubble: {
        maxWidth: '70%',
        borderRadius: 18,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginHorizontal: 4,
    },
    sentBubble: {
        backgroundColor: '#065f46',
        borderBottomRightRadius: 4,
    },
    receivedBubble: {
        backgroundColor: '#e2f8f0',
        borderBottomLeftRadius: 4,
    },
    tempMessage: {
        opacity: 0.7,
    },
    messageText: {
        fontSize: 16,
    },
    sentMessageText: {
        color: 'white',
    },
    receivedMessageText: {
        color: '#333',
    },
    timeText: {
        fontSize: 10,
        alignSelf: 'flex-end',
        marginTop: 2,
    },
    sentTimeText: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    receivedTimeText: {
        color: 'rgba(0, 0, 0, 0.7)',
    },
    dateSeparator: {
        alignItems: 'center',
        marginVertical: 10,
    },
    dateText: {
        fontSize: 12,
        color: '#888',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
        backgroundColor: 'white',
        alignItems: 'center',
        marginBottom: 50,
    },
    input: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        maxHeight: 100,
        fontSize: 16,
    },
    sendButton: {
        marginLeft: 10,
        padding: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyText: {
        color: '#888',
        fontSize: 16,
        textAlign: 'center',
    }
});

export default ChatScreen; 