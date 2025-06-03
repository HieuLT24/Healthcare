import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  where,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { db } from '../configs/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, endpoints } from '../configs/Apis';

// Helper function để đảm bảo current user ID có sẵn
export const ensureCurrentUserId = async () => {
  try {
    let userId = await AsyncStorage.getItem('currentUserId');
    
    if (!userId) {
      // Nếu chưa có, lấy từ API
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const res = await authApi(token).get(endpoints['current-user']);
        
        // Xử lý trường hợp API response có thể thiếu id
        if (res.data) {
          const userData = res.data;
          
          // Kiểm tra nhiều trường hợp có thể có id
          const id = userData.id || userData.user_id || userData.pk;
          
          if (id) {
            userId = id.toString();
            await AsyncStorage.setItem('currentUserId', userId);
            console.log('✅ Current user ID retrieved and saved:', userId);
          } else {
            console.log('❌ API response missing user ID. Full response:', userData);
            
            // Thử lấy từ current-user cache trong AsyncStorage
            const cachedUser = await AsyncStorage.getItem('current-user');
            if (cachedUser) {
              try {
                const parsedUser = JSON.parse(cachedUser);
                const cachedId = parsedUser.id || parsedUser.user_id || parsedUser.pk;
                if (cachedId) {
                  userId = cachedId.toString();
                  await AsyncStorage.setItem('currentUserId', userId);
                  console.log('✅ User ID retrieved from cache:', userId);
                }
              } catch (parseError) {
                console.error('Error parsing cached user:', parseError);
              }
            }
          }
        }
      }
    }
    
    return userId;
  } catch (error) {
    console.error('Error ensuring current user ID:', error);
    return null;
  }
};

// Tạo phòng chat mới
export const createChatRoom = async (participants, roomName = null) => {
  try {
    const chatRoomData = {
      participants: participants, // Array of user IDs
      roomName: roomName || `Chat ${participants.join(', ')}`,
      createdAt: serverTimestamp(),
      lastMessage: null,
      lastMessageTime: null,
      isGroup: participants.length > 2
    };

    const docRef = await addDoc(collection(db, 'chatRooms'), chatRoomData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
};

// Lấy danh sách phòng chat của user
export const getUserChatRooms = (userId, callback) => {
  const q = query(
    collection(db, 'chatRooms'),
    where('participants', 'array-contains', userId),
    orderBy('lastMessageTime', 'desc')
  );

  return onSnapshot(q, callback);
};

// Gửi tin nhắn
export const sendMessage = async (chatRoomId, senderId, message, messageType = 'text') => {
  try {
    const messageData = {
      senderId: senderId,
      message: message,
      messageType: messageType, // 'text', 'image', 'file'
      timestamp: serverTimestamp(),
      isRead: false
    };

    // Thêm tin nhắn vào collection messages
    await addDoc(collection(db, 'chatRooms', chatRoomId, 'messages'), messageData);

    // Cập nhật last message trong chat room
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    await updateDoc(chatRoomRef, {
      lastMessage: message,
      lastMessageTime: serverTimestamp()
    });

    return true;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Lắng nghe tin nhắn realtime
export const listenToMessages = (chatRoomId, callback) => {
  const q = query(
    collection(db, 'chatRooms', chatRoomId, 'messages'),
    orderBy('timestamp', 'asc')
  );

  return onSnapshot(q, callback);
};

// Đánh dấu tin nhắn đã đọc
export const markMessagesAsRead = async (chatRoomId, userId) => {
  try {
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    const q = query(messagesRef, where('isRead', '==', false), where('senderId', '!=', userId));
    
    const querySnapshot = await getDocs(q);
    const batch = [];
    
    querySnapshot.forEach((doc) => {
      batch.push(updateDoc(doc.ref, { isRead: true }));
    });
    
    await Promise.all(batch);
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Tìm kiếm hoặc tạo phòng chat 1-1
export const findOrCreateDirectChat = async (user1Id, user2Id) => {
  try {
    // Tìm phòng chat đã tồn tại
    const q = query(
      collection(db, 'chatRooms'),
      where('participants', 'array-contains', user1Id),
      where('isGroup', '==', false)
    );

    const querySnapshot = await getDocs(q);
    let existingRoom = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(user2Id)) {
        existingRoom = { id: doc.id, ...data };
      }
    });

    if (existingRoom) {
      return existingRoom.id;
    }

    // Tạo phòng chat mới nếu chưa tồn tại
    return await createChatRoom([user1Id, user2Id]);
  } catch (error) {
    console.error('Error finding or creating direct chat:', error);
    throw error;
  }
};

// Lấy thông tin user
export const getUserInfo = async (userId) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
};

// Cập nhật lastReadTime cho user trong chat room
export const updateLastReadTime = async (chatRoomId, userId) => {
  try {
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    const updateData = {
      [`lastReadTime.${userId}`]: serverTimestamp()
    };
    
    await updateDoc(chatRoomRef, updateData);
    console.log('✅ Updated lastReadTime for user:', userId, 'in room:', chatRoomId);
  } catch (error) {
    console.error('Error updating lastReadTime:', error);
  }
};

// Đếm số tin nhắn chưa đọc cho user trong chat room
export const getUnreadCount = async (chatRoomId, userId) => {
  try {
    // Lấy lastReadTime của user
    const chatRoomDoc = await getDoc(doc(db, 'chatRooms', chatRoomId));
    if (!chatRoomDoc.exists()) return 0;
    
    const chatRoomData = chatRoomDoc.data();
    const lastReadTime = chatRoomData.lastReadTime?.[userId];
    
    // Nếu chưa có lastReadTime, đếm tất cả tin nhắn không phải của user này
    const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
    let q;
    
    if (lastReadTime) {
      // Đếm tin nhắn sau lastReadTime và không phải của user hiện tại
      q = query(
        messagesRef,
        where('timestamp', '>', lastReadTime),
        where('senderId', '!=', userId)
      );
    } else {
      // Đếm tất cả tin nhắn không phải của user hiện tại
      q = query(
        messagesRef,
        where('senderId', '!=', userId)
      );
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Lắng nghe unread count realtime
export const listenToUnreadCount = (chatRoomId, userId, callback) => {
  try {
    // Listen to chat room để track lastReadTime
    const chatRoomRef = doc(db, 'chatRooms', chatRoomId);
    const unsubscribeChatRoom = onSnapshot(chatRoomRef, async (doc) => {
      if (doc.exists()) {
        const chatRoomData = doc.data();
        const lastReadTime = chatRoomData.lastReadTime?.[userId];
        
        // Listen to messages để đếm unread
        const messagesRef = collection(db, 'chatRooms', chatRoomId, 'messages');
        let q;
        
        if (lastReadTime) {
          q = query(
            messagesRef,
            where('timestamp', '>', lastReadTime),
            where('senderId', '!=', userId)
          );
        } else {
          q = query(
            messagesRef,
            where('senderId', '!=', userId)
          );
        }
        
        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
          callback(snapshot.size);
        });
        
        // Return cleanup function
        return unsubscribeMessages;
      }
    });
    
    return unsubscribeChatRoom;
  } catch (error) {
    console.error('Error listening to unread count:', error);
    return () => {};
  }
}; 