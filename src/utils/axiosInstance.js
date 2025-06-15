// import axios from 'axios';
// import { backendurl } from '../../config';
// import { REFRESH_TOKEN } from '../components/api/apiDetails';

// // const axiosInstance = axios.create({
// //     baseURL: backendurl,
// //     withCredentials: true
// // });

// const axiosInstance = axios.create({
//     baseURL: backendurl,
//     withCredentials: true,
//     headers: {
//         'Content-Type': 'application/json',
//         'Accept': 'application/json',
//     },
//     xsrfCookieName: 'XSRF-TOKEN',
//     xsrfHeaderName: 'X-XSRF-TOKEN',
// });

// let isRefreshing = false;
// let refreshQueue = [];
// window.isLoggingOut = false;

// axiosInstance.interceptors.response.use(
//     (response) => response,
//     async (error) => {
//         const originalRequest = error.config;

//         if (originalRequest.skipAuthRefresh) {
//             return Promise.reject(error);
//         }

//         if (originalRequest.url && originalRequest.url.includes(REFRESH_TOKEN)) {
//             if (window.logoutUser && typeof window.logoutUser === "function" && !window.isLoggingOut) {
//                 window.isLoggingOut = true;
//                 window.logoutUser();
//                 setTimeout(() => (window.isLoggingOut = false), 3000);
//             }
//             return Promise.reject(error);
//         }

//         if (window.isLoggingOut) {
//             return Promise.reject(error);
//         }

//         if (error.response?.status === 401 && !originalRequest._retry) {
//             originalRequest._retry = true;

//             if (isRefreshing) {
//                 return new Promise((resolve, reject) => {
//                     refreshQueue.push({ resolve, reject });
//                 })
//                   .then(() => axiosInstance(originalRequest))
//                   .catch((err) => Promise.reject(err));
//             }

//             isRefreshing = true;

//             try {
//                 await axiosInstance.post(REFRESH_TOKEN);
//                 refreshQueue.forEach(({ resolve }) => resolve());
//                 refreshQueue = [];
//                 isRefreshing = false;

//                 return axiosInstance(originalRequest);
//             } catch (refreshError) {
//                 console.error("Token refresh failed, logging out...");
//                 refreshQueue.forEach(({ reject }) => reject(refreshError));
//                 refreshQueue = [];
//                 isRefreshing = false;

//                 if (window.logoutUser && typeof window.logoutUser === "function" && !window.isLoggingOut) {
//                     window.isLoggingOut = true;
//                     window.logoutUser();
//                     setTimeout(() => (window.isLoggingOut = false), 3000);
//                 }
//                 return Promise.reject(refreshError);
//             }
//         }

//         return Promise.reject(error);
//     }
// );

// export default axiosInstance;



import axios from 'axios';
import { backendurl } from '../../config';
import { REFRESH_TOKEN } from '../components/api/apiDetails';

const axiosInstance = axios.create({
    baseURL: backendurl,
    withCredentials: false // Changed from true since we're not using cookies
});

let isRefreshing = false;
let refreshQueue = [];
window.isLoggingOut = false;

// Add a request interceptor to add the token to every request
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (originalRequest.skipAuthRefresh) {
            return Promise.reject(error);
        }

        if (originalRequest.url && originalRequest.url.includes(REFRESH_TOKEN)) {
            if (window.logoutUser && typeof window.logoutUser === "function" && !window.isLoggingOut) {
                window.isLoggingOut = true;
                window.logoutUser();
                setTimeout(() => (window.isLoggingOut = false), 3000);
            }
            return Promise.reject(error);
        }

        if (window.isLoggingOut) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    refreshQueue.push({ resolve, reject });
                })
                    .then(() => axiosInstance(originalRequest))
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token available');
                }

                const response = await axiosInstance.post(REFRESH_TOKEN, {
                    refreshToken: refreshToken
                });

                const { accessToken } = response.data;
                localStorage.setItem('accessToken', accessToken);

                refreshQueue.forEach(({ resolve }) => resolve());
                refreshQueue = [];
                isRefreshing = false;

                return axiosInstance(originalRequest);
            } catch (refreshError) {
                console.error("Token refresh failed, logging out...");
                refreshQueue.forEach(({ reject }) => reject(refreshError));
                refreshQueue = [];
                isRefreshing = false;

                // Clear tokens from localStorage
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                if (window.logoutUser && typeof window.logoutUser === "function" && !window.isLoggingOut) {
                    window.isLoggingOut = true;
                    window.logoutUser();
                    setTimeout(() => (window.isLoggingOut = false), 3000);
                }
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;