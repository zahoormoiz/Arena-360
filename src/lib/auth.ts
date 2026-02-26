import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';

const jwtSecret = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dev-secret-key');

// Note: Critical functions will fail if empty, which is intended for production security
const secret = new TextEncoder().encode(jwtSecret);

if (!jwtSecret && process.env.NODE_ENV === 'production') {
    // We log a warning but don't throw during module evaluation to allow build to pass.
    // The actual sign/verify functions will naturally fail if this is empty.
    console.warn('⚠️ WARNING: JWT_SECRET is not set. Auth features will be disabled.');
}

export async function hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, 10);
}

export async function comparePassword(input: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(input, hash);
}

export async function signToken(payload: any): Promise<string> {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);
}

export async function verifyToken(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}
