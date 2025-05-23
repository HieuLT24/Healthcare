import axios from "axios"

export const BASE_URL = "http://192.168.100.179:8000"


export const endpoints = {
    'login': 'o/token/',
    'google-login': 'api/auth/google/',
    'register': 'api/auth/register/',
    'reminders': 'reminders/',
    'my-statistics': 'api/my-statistics/',
    'current-user': `users/current-user/`,
    'health-stats': 'healthstat/',
    'health-stats-track-changes': 'healthstat/track-changes/'
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
