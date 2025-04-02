import axios from 'axios';

// Create an instance of axios with a custom config
// This instance will be used to make API calls to the backend
const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000',
});

export default API;
