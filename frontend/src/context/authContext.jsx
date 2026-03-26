import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_URL = "http://localhost:8000/api/v1/auth";

    const fetchProfile = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            setLoading(false);
            setUser(null);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/me`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setUser(data);
            } else if (response.status === 401) {
                // Only logout on definite 401
                console.warn("Session expired or invalid token (401)");
                logout();
            } else {
                const errorData = await response.json().catch(() => ({}));
                console.error(`Profile fetch error (${response.status}):`, errorData);
            }
        } catch (err) {
            console.error("Network error fetching profile:", err);
            // Don't logout on network error, just stop loading
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    const login = async (email, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Login failed');

        localStorage.setItem("token", data.access_token);
        await fetchProfile();
        return data;
    };

    const signup = async (email, password, fullName) => {
        const response = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Signup failed');
        return data;
    };

    const verifyOtp = async (email, otp) => {
        const response = await fetch(`${API_URL}/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Verification failed');

        localStorage.setItem("token", data.access_token);
        await fetchProfile();
        return data;
    };

    const googleLogin = async (idToken) => {
        const response = await fetch(`${API_URL}/google-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Google Login failed');

        localStorage.setItem("token", data.access_token);
        await fetchProfile();
        return data;
    };

    const forgotPassword = async (email) => {
        const response = await fetch(`${API_URL}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Request failed');
        return data;
    };

    const resetPassword = async (email, otp, newPassword) => {
        const response = await fetch(`${API_URL}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, otp, new_password: newPassword }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Reset failed');
        return data;
    };

    const updateProfile = async (updateData) => {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/me`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updateData),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || 'Update failed');
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, verifyOtp, googleLogin, forgotPassword, resetPassword, updateProfile, logout }}>
            {children}
        </AuthContext.Provider>
    );
};