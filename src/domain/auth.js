// src/domain/auth.js
import crypto from 'node:crypto';

const SECRET_KEY = 'das-2026-super-secret-key-layer';

// Securely hash passwords using Node's native SHA256 hashing algorithm
export function hashPassword(password) {
    return crypto.createHmac('sha256', SECRET_KEY).update(password).digest('hex');
}

// Generate a signed, secure base64 token string containing user data layers
export function generateToken(payload) {
    const stringifiedPayload = JSON.stringify({ ...payload, exp: Date.now() + 2 * 60 * 60 * 1000 }); // 2 hour expiry
    const base64Payload = Buffer.from(stringifiedPayload).toString('base64');
    
    // Create a cryptographic signature to prevent tampering or alteration
    const signature = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('hex');
    return `${base64Payload}.${signature}`;
}

// Verify a token signature and return the embedded user attributes securely
export function verifyToken(token) {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [base64Payload, signature] = parts;
    const expectedSignature = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('hex');

    if (signature !== expectedSignature) return null; // Rejects tampered/bad tokens!

    const decodedPayload = JSON.parse(Buffer.from(base64Payload, 'base64').toString('utf8'));
    
    if (Date.now() > decodedPayload.exp) return null; // Rejects expired sessions
    return decodedPayload;
}
