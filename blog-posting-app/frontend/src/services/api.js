import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const registerUser = async (userData) => {
    const response = await axios.post(`${API_URL}/register`, userData);
    return response.data;
};

export const loginUser = async (credentials) => {
    const response = await axios.post(`${API_URL}/login`, credentials);
    return response.data;
};

export const fetchBlogPosts = async () => {
    const response = await axios.get(`${API_URL}/posts`);
    return response.data;
};

export const fetchBlogPost = async (postId) => {
    const response = await axios.get(`${API_URL}/posts/${postId}`);
    return response.data;
};

export const createBlogPost = async (postData, token) => {
    const response = await axios.post(`${API_URL}/posts`, postData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const updateBlogPost = async (postId, postData, token) => {
    const response = await axios.put(`${API_URL}/posts/${postId}`, postData, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};

export const deleteBlogPost = async (postId, token) => {
    const response = await axios.delete(`${API_URL}/posts/${postId}`, {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });
    return response.data;
};