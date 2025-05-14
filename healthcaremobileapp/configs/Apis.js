import axios from "axios"

// dùng cho máy khác trong cùng mạng
export const BASE_URL = "http://192.168.1.15:8000"

// dùng cho máy chủ trên máy tính
// export const BASE_URL = "http://10.0.2.2:8000"

export const endpoints = {
    'login': 'o/token/',
    'google-login': 'api/auth/google/',
    'register': 'api/auth/register/',
    'reminders': 'reminders/',
    'my-statistics': 'api/my-statistics/',
    'current-user': `users/current-user/`,
}

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
