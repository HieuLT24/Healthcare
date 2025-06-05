import axios from "axios"

export const BASE_URL = "http://192.168.1.15:8000";
// export const BASE_URL = "http://192.168.100.179:8000/";


export const endpoints = {
    'login': 'o/token/',
    'google-login': 'api/auth/google/',
    'register': 'api/auth/register/',
    'reminders': 'reminders/',
    'my-statistics': 'api/my-statistics/',
    'current-user': `users/current-user/`,
    'health-statistic': 'health-statistic/',
    'health-stats': '/health-stats/',
    'user-infor': (id) => `user-infor/${id}/`, // Sử dụng hàm để truyền ID
    'exercises': '/exercises/', // Lấy danh sách bài tập hoặc tạo bài tập mới
    'muscle-groups': '/muscle-groups/',
    'exercise-detail': (id) => `/exercises/${id}/`, // Lấy chi tiết bài tập
    'workouts': '/workout-sessions/', // Lấy danh sách hoặc tạo mới lịch tập luyện
    'workout-detail': (id) => `/workout-sessions/${id}/`, // Lấy chi tiết lịch tập luyện
    'diaries': '/diaries/', // endpoint cho nhật ký
    'health-stats-track-changes': 'health-statistic/track-changes/',
    'experts': 'api/experts-coaches',
    'hieu-user-infor': 'hieu-user-infor/'
};

export const authApi = (token) => {
    return axios.create({
        baseURL: BASE_URL,
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
}

export default axios.create({
    baseURL: BASE_URL
})
