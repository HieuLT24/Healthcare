import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  Alert
} from 'react-native';
import { TextInput, Avatar, IconButton, Appbar, Button } from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import MyStyles from '../../styles/MyStyles';
import { authApi, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Messages = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { expert, conversationId } = route.params || { expert: null, conversationId: null };
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef();
  const [currentUser, setCurrentUser] = useState(null);

  // Lấy thông tin người dùng hiện tại
  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        if (token) {
          const res = await authApi(token).get(endpoints['current-user']);
          setCurrentUser(res.data);
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };

    getCurrentUser();
  }, []);

  // Lấy tin nhắn dựa theo conversationId
  useEffect(() => {
    if (conversationId) {
      setLoading(true);
      const fetchMessages = async () => {
        try {
          const token = await AsyncStorage.getItem('token');
          const res = await authApi(token).get(`${endpoints['messages']}?conversation_id=${conversationId}`);
          
          if (res.data && Array.isArray(res.data)) {
            // Đảm bảo mỗi tin nhắn có ID
            const messagesWithIds = res.data.map((message, index) => {
              if (message.id === undefined) {
                return { ...message, id: Date.now() + index };
              }
              return message;
            });
            setMessages(messagesWithIds);
          }
        } catch (ex) {
          console.error("Failed to fetch messages:", ex);
          Alert.alert(
            "Lỗi",
            "Không thể tải tin nhắn. Vui lòng thử lại sau.",
            [{ text: "OK" }]
          );
        } finally {
          setLoading(false);
        }
      };
      
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || !conversationId) return;

    setSending(true);
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Tạo tin nhắn mới để hiển thị ngay lập tức (lạc quan)
      const optimisticMessage = {
        id: Date.now(),
        content: inputMessage.trim(),
        sender: currentUser?.id,
        conversation: conversationId,
        created_date: new Date().toISOString(),
        is_active: true
      };

      // Cập nhật UI ngay lập tức
      setMessages(prev => [...prev, optimisticMessage]);
      setInputMessage('');

      // Gửi tin nhắn lên server
      const response = await authApi(token).post(endpoints['messages'], {
        content: optimisticMessage.content,
        conversation_id: conversationId
      });

      // Nếu thành công, cập nhật ID tin nhắn từ server
      if (response.data && response.data.id) {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === optimisticMessage.id 
              ? { ...response.data } 
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      Alert.alert(
        "Lỗi",
        "Không thể gửi tin nhắn. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
      
      // Xóa tin nhắn lạc quan nếu gửi thất bại
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    return date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit'
    });
  };

  const renderMessage = ({ item }) => {
    // Kiểm tra xem tin nhắn có phải của người dùng hiện tại hay không
    const isCurrentUser = item.sender === currentUser?.id;
    
    return (
      <View style={[
        styles.messageContainer, 
        isCurrentUser ? styles.userMessage : styles.expertMessage
      ]}>
        {!isCurrentUser && expert && (
          <Avatar.Image
            size={36}
            source={{ uri: expert?.avatar }}
            style={styles.avatar}
          />
        )}
        <View style={[
          styles.messageBubble,
          isCurrentUser ? styles.userBubble : styles.expertBubble
        ]}>
          <Text style={[
            styles.messageText,
            isCurrentUser ? styles.userText : styles.expertText
          ]}>{item.content}</Text>
          <Text style={styles.timestamp}>{formatTime(item.created_date)}</Text>
        </View>
      </View>
    );
  };

  if (!expert || !conversationId) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.noExpertTitle}>Chưa chọn chuyên gia</Text>
        <Text style={styles.noExpertText}>Vui lòng chọn một chuyên gia từ danh sách để bắt đầu tư vấn</Text>
        <Button 
          mode="contained" 
          onPress={() => navigation.navigate('Danh sách chuyên gia')}
          style={styles.expertListButton}
          labelStyle={styles.buttonLabel}
        >
          Xem danh sách chuyên gia
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => navigation.navigate('Danh sách chuyên gia')} color="#fff" />
        <Avatar.Image size={40} source={{ uri: expert.avatar }} />
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerName}>
            {expert.first_name} {expert.last_name}
          </Text>
          <Text style={styles.headerRole}>
            {expert.role || 'Chuyên gia'}
          </Text>
        </View>
      </Appbar.Header>

      {loading ? (
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color="#065f46" />
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : null}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          style={styles.keyboardAvoid}
        >
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item && item.id ? item.id.toString() : Math.random().toString()}
            contentContainerStyle={styles.messagesContainer}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện với chuyên gia.
                </Text>
              </View>
            }
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              mode="outlined"
              placeholder="Nhập tin nhắn..."
              value={inputMessage}
              onChangeText={setInputMessage}
              style={styles.input}
              outlineColor="#a7f3d0"
              activeOutlineColor="#065f46"
              multiline
              disabled={sending}
            />
            <IconButton
              icon="send"
              size={24}
              iconColor="#065f46"
              style={styles.sendButton}
              onPress={handleSend}
              disabled={!inputMessage.trim() || sending}
              loading={sending}
            />
          </View>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noExpertTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#065f46',
    marginBottom: 12,
  },
  noExpertText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  expertListButton: {
    backgroundColor: '#065f46',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  buttonLabel: {
    fontSize: 16,
    color: '#fff',
  },
  header: {
    backgroundColor: '#065f46',
    elevation: 4,
    height: 60,
  },
  headerTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  headerName: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  headerRole: {
    color: '#e2e2e2',
    fontSize: 12,
  },
  keyboardAvoid: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  expertMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    backgroundColor: '#e2f8f0',
    alignSelf: 'flex-end',
    marginBottom: 6,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 20,
    maxWidth: '100%',
  },
  userBubble: {
    backgroundColor: '#a7f3d0',
    borderBottomRightRadius: 4,
  },
  expertBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  userText: {
    color: '#333',
  },
  expertText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#777',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#e6f7f1',
    margin: 4,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  emptyText: {
    fontSize: 16,
    color: '#777',
    textAlign: 'center',
  }
});

export default Messages;
