"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signToken = signToken;
exports.verifyToken = verifyToken;
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const node_crypto_1 = require("node:crypto");
const jose_1 = require("jose");
const encoder = new TextEncoder();
function secret() {
    const value = process.env.JWT_SECRET;
    if (!value) {
        throw new Error('JWT_SECRET is not defined');
    }
    return encoder.encode(value);
}
async function signToken(payload) {
    return new jose_1.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('8h')
        .sign(secret());
}
async function verifyToken(token) {
    const result = await (0, jose_1.jwtVerify)(token, secret());
    return result.payload;
}
function hashPassword(password) {
    const salt = (0, node_crypto_1.randomBytes)(16).toString('hex');
    const hash = (0, node_crypto_1.pbkdf2Sync)(password, salt, 100000, 64, 'sha512').toString('hex');
    return `${salt}:${hash}`;
}
function verifyPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const nextHash = (0, node_crypto_1.pbkdf2Sync)(password, salt, 100000, 64, 'sha512');
    const storedHash = Buffer.from(hash, 'hex');
    return (0, node_crypto_1.timingSafeEqual)(nextHash, storedHash);
}
