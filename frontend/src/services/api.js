import axios from 'axios';

const API = axios.create({
  baseURL: '/api', // Use relative path
});

export default API;
