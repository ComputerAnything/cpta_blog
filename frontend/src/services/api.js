import axios from 'axios';

const API = axios.create({
  // baseURL: 'http://localhost:5000/api', // Use absolute path for local development
  baseURL: '/api', // Use relative path
});

export default API;
