import axios, { AxiosInstance } from "axios"

const pistonBaseUrl = "https://ce.judge0.com"

const instance: AxiosInstance = axios.create({
    baseURL: pistonBaseUrl,
    headers: {
        "Content-Type": "application/json",
    },
})

export default instance
