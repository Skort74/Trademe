// src/utils/auth.js
// Storage helper for TradeMe user accounts and active session

const STORAGE_KEY_USERS = "treadme_registered_users";
const STORAGE_KEY_CURRENT_USER = "treadme_current_user";

// Default seed accounts for testing out-of-the-box
export const DEFAULT_USERS = [
  {
    fullName: "Admin TradeMe",
    email: "admin@treadme.com",
    username: "admin",
    password: "admin123",
    role: "admin",
  },
  {
    fullName: "Budi Santoso",
    email: "budi@treadme.com",
    username: "budi",
    password: "password123",
    role: "user",
  },
  {
    fullName: "Siti Rahma",
    email: "siti@gmail.com",
    username: "siti",
    password: "password123",
    role: "user",
  },
];

/**
 * Retrieve list of registered users from localStorage (or fallback to defaults)
 */
export function getRegisteredUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    if (raw) {
      let parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure admin user exists in list even if previously cached
        const adminIdx = parsed.findIndex(
          (u) => u.username === "admin" || u.email === "admin@treadme.com"
        );
        if (adminIdx === -1) {
          parsed.unshift(DEFAULT_USERS[0]);
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(parsed));
        } else if (parsed[adminIdx].role !== "admin") {
          parsed[adminIdx].role = "admin";
          localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch (err) {
    console.error("Error reading registered users from localStorage:", err);
  }

  // Initialize with default users if empty
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(DEFAULT_USERS));
  } catch (e) {}
  return DEFAULT_USERS;
}

/**
 * Register a new user into localStorage
 */
export function registerUser({ fullName, email, password }) {
  const users = getRegisteredUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const derivedUsername = normalizedEmail.includes("@")
    ? normalizedEmail.split("@")[0]
    : normalizedEmail;

  // Check if already exists
  const existing = users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail ||
      (u.username && u.username.toLowerCase() === derivedUsername)
  );

  if (existing) {
    return {
      success: false,
      message: "Email atau username ini sudah terdaftar. Silakan langsung masuk.",
    };
  }

  const newUser = {
    fullName: fullName.trim(),
    email: normalizedEmail,
    username: derivedUsername,
    password: password,
    createdAt: new Date().toISOString(),
  };

  const updatedUsers = [...users, newUser];
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(updatedUsers));
  } catch (err) {
    console.error("Error saving new user:", err);
  }

  return {
    success: true,
    user: newUser,
  };
}

/**
 * Perbarui data user (dipakai Panel Admin: ubah role / status)
 */
export function updateRegisteredUser(username, patch) {
  const users = getRegisteredUsers().map((u) =>
    u.username === username ? { ...u, ...patch } : u
  );
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {}
  return users;
}

/**
 * Hapus user dari daftar terdaftar
 */
export function deleteRegisteredUser(username) {
  const users = getRegisteredUsers().filter((u) => u.username !== username);
  try {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  } catch (e) {}
  return users;
}

/**
 * Attempt to find a user by username or email
 */
export function findUserByLoginIdentifier(identifier) {
  if (!identifier) return null;
  const clean = identifier.trim().toLowerCase();
  const users = getRegisteredUsers();

  return (
    users.find(
      (u) =>
        u.email.toLowerCase() === clean ||
        (u.username && u.username.toLowerCase() === clean)
    ) || null
  );
}

/**
 * Save current active logged in session
 */
export function setCurrentSession(user) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
    }
  } catch (err) {}
}

/**
 * Get currently logged-in user (if any)
 */
export function getCurrentSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

/**
 * Clear session (logout)
 */
export function clearCurrentSession() {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } catch (e) {}
}

