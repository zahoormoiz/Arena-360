import User from '@/models/User';
import { comparePassword, signToken, verifyToken } from '@/lib/auth';
import dbConnect from '@/lib/db';

export async function loginUser(email: string, password: string) {
    await dbConnect();
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await comparePassword(password, user.password!);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    // Generate token
    // Important: stringify ObjectId
    const token = await signToken({ userId: user._id.toString(), role: user.role });

    return {
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    };
}

export async function registerUser(data: any) {
    await dbConnect();
    const { name, email, password, phone } = data;

    if (await User.findOne({ email })) {
        throw new Error('User already exists');
    }

    const hashedPassword = await import('@/lib/auth').then(m => m.hashPassword(password));
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        phone,
        role: 'user' // Default role
    });

    const token = await signToken({ userId: user._id.toString(), role: user.role });

    return {
        user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
        },
        token
    };
}

export async function getUserFromToken(token: string) {
    if (!token) return null;
    try {
        const payload: any = await verifyToken(token);
        if (payload && payload.userId) {
            return { userId: payload.userId, role: payload.role };
        }
        return null;
    } catch (error) {
        return null;
    }
}
