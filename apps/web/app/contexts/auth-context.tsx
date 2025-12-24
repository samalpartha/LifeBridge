"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (name: string, email: string, password: string) => Promise<void>;
    socialLogin: (provider: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for logged-in user on mount
        const storedUser = localStorage.getItem("lb_user");
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error("Failed to parse stored user", e);
                localStorage.removeItem("lb_user");
            }
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        // For demo purposes, we accept any "registered" user from local storage
        // effectively mimicking a backend database check
        const storedUsersJson = localStorage.getItem("lb_users_db") || "[]";
        const storedUsers: any[] = JSON.parse(storedUsersJson);

        const foundUser = storedUsers.find(
            (u) => u.email === email && u.password === password
        );

        if (foundUser) {
            const userData = { name: foundUser.name, email: foundUser.email };
            setUser(userData);
            localStorage.setItem("lb_user", JSON.stringify(userData));
            setLoading(false);
            router.push("/");
        } else {
            setLoading(false);
            throw new Error("Invalid email or password");
        }
    };

    const signup = async (name: string, email: string, password: string) => {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Save to our "mock database" in local storage
        const storedUsersJson = localStorage.getItem("lb_users_db") || "[]";
        const storedUsers: any[] = JSON.parse(storedUsersJson);

        // Check if user exists
        if (storedUsers.some((u) => u.email === email)) {
            setLoading(false);
            throw new Error("User already exists");
        }

        const newUser = { name, email, password }; // Note: storing plain text password for demo only!
        storedUsers.push(newUser);
        localStorage.setItem("lb_users_db", JSON.stringify(storedUsers));

        // Auto login
        const userData = { name, email };
        setUser(userData);
        localStorage.setItem("lb_user", JSON.stringify(userData));

        setLoading(false);
        router.push("/");
    };

    const socialLogin = async (provider: string) => {
        setLoading(true);
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Mock social user
        const socialUser = {
            name: `Test User (${provider})`,
            email: `test.${provider}@example.com`,
        };

        setUser(socialUser);
        localStorage.setItem("lb_user", JSON.stringify(socialUser));
        setLoading(false);
        router.push("/");
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("lb_user");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, signup, socialLogin, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
