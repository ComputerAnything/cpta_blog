import React, { createContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import api from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const history = useHistory();

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    const login = async (credentials) => {
        const response = await api.login(credentials);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        history.push('/'); // Redirect to home after login
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        history.push('/login'); // Redirect to login after logout
    };

    const register = async (userData) => {
        const response = await api.register(userData);
        setUser(response.data.user);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        history.push('/'); // Redirect to home after registration
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};