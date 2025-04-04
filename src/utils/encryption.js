/**
 * Encryption utilities for securing API keys and sensitive data
 * Uses Web Crypto API for secure encryption
 */

/**
 * Convert a string to a CryptoKey for use with Web Crypto API
 * @param {string} password - Password or key to use for encryption/decryption
 * @returns {Promise<CryptoKey>} - Generated CryptoKey
 */
async function getKeyFromPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  
  // First create a hash of the password
  const hash = await crypto.subtle.digest('SHA-256', data);
  
  // Then create a key from the hash
  return crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt text using AES-GCM
 * @param {string} text - Text to encrypt
 * @param {string} password - Password to use for encryption
 * @returns {Promise<string>} - Base64 encoded encrypted string
 */
export async function encrypt(text, password) {
  try {
    // Generate cryptographic key from password
    const key = await getKeyFromPassword(password);
    
    // Generate a random initialization vector
    const iv = crypto.getRandomValues(new Uint8Array(12));
    
    // Convert text to ArrayBuffer
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    
    // Encrypt the data
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      data
    );
    
    // Create a combined buffer containing the IV and encrypted data
    const encryptedArray = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    encryptedArray.set(iv, 0);
    encryptedArray.set(new Uint8Array(encryptedBuffer), iv.length);
    
    // Convert to Base64 for storage
    return btoa(String.fromCharCode.apply(null, encryptedArray));
  } catch (error) {
    console.error('Encryption error:', error);
    return null;
  }
}

/**
 * Decrypt an encrypted string
 * @param {string} encryptedText - Base64 encoded encrypted string
 * @param {string} password - Password used for encryption
 * @returns {Promise<string>} - Decrypted text
 */
export async function decrypt(encryptedText, password) {
  try {
    // Convert Base64 to ArrayBuffer
    const encryptedArray = new Uint8Array(
      atob(encryptedText).split('').map(char => char.charCodeAt(0))
    );
    
    // Extract IV and encrypted data
    const iv = encryptedArray.slice(0, 12);
    const encryptedData = encryptedArray.slice(12);
    
    // Generate cryptographic key from password
    const key = await getKeyFromPassword(password);
    
    // Decrypt the data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedData
    );
    
    // Convert decrypted ArrayBuffer to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

/**
 * Test if Web Crypto API encryption is available
 * @returns {boolean} - True if encryption is supported
 */
export function isEncryptionSupported() {
  return (
    typeof window !== 'undefined' &&
    window.crypto &&
    window.crypto.subtle &&
    typeof window.crypto.subtle.encrypt === 'function'
  );
}