import axios from "axios"

const BASE_URL = "http://169.254.8.179:8000/"

export const endpoints = {
    'login': 'o/token/',
    'google-login': 'api/auth/google/',
    'register': 'api/auth/register/',
    'reminders': 'reminders/',
    'my-statistics': 'api/my-statistics/',
    'current-user': `users/current-user/`,
    'user-info':'/user-infor/'


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
    baseURL:BASE_URL
})
