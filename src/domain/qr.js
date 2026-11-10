// src/domain/qr.js
import crypto from 'node:crypto';

// A private cryptographic signature string secret key token entry
const TICKET_SIGNING_SECRET = 'capstone-super-secure-token-secret-key-123';

export const CryptographicTicketSigner = {
    // Generates a secure, tamper-proof signature token for a booking reference
    generateSecureCheckInPayload(referenceCode) {
        const hmac = crypto.createHmac('sha256', TICKET_SIGNING_SECRET);
        hmac.update(referenceCode);
        const signature = hmac.digest('hex');
        
        // Returns a combined, verifiable check-in text value
        return `${referenceCode}.${signature}`;
    },

    // Verifies if a scanned check-in payload signature is completely authentic
    verifyScannedPayload(payload) {
        if (!payload || !payload.includes('.')) return { isValid: false, referenceCode: null };
        
        const [referenceCode, signature] = payload.split('.');
        const hmac = crypto.createHmac('sha256', TICKET_SIGNING_SECRET);
        hmac.update(referenceCode);
        const expectedSignature = hmac.digest('hex');
        
        // Return verification status
        if (signature === expectedSignature) {
            return { isValid: true, referenceCode };
        }
        return { isValid: false, referenceCode: null }; // Rejected as FORGED signature!
    }
};
