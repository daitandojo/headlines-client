"use server";

import { cookies } from 'next/headers';

const PASSWORD = "stanley";
const COOKIE_NAME = 'headlines-auth';
const COOKIE_SECRET = process.env.COOKIE_SECRET || 'default-secret-for-dev-please-change-in-production';

/**
 * Server action to verify the password and set the authentication cookie.
 * @param {string} password - The password entered by the user.
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function login(password) {
    // Case-insensitive password check
    if (password.toLowerCase() === PASSWORD) {
        // Password is correct. Set the secure, httpOnly cookie.
        cookies().set({
            name: COOKIE_NAME,
            value: COOKIE_SECRET,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
        return { success: true };
    } else {
        // Password is incorrect.
        return { success: false, error: "Incorrect password." };
    }
}