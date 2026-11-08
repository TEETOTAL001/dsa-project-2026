// src/domain/ids.js

export function generateId() {
    return 'id-' + Math.random().toString(36).substring(2, 11);
}

export function generateReferenceCode() {
    return 'REF-' + Math.random().toString(36).substring(2, 9).toUpperCase();
}
