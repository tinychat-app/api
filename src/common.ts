import { Snowflake } from '@sapphire/snowflake';
import { createHttpError, createMiddleware, z } from 'express-zod-api';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { User, UserSchema, UserType } from './models/user';

export const tinyEpoch = new Date('2022-07-24T00:00:00.000Z');
export const snowflake = new Snowflake(tinyEpoch);

let url = 'redis://localhost:6379'
if (process.env.NODE_ENV === 'production') {
    url = 'redis://keydb:6379'
}


export const verifyToken = async (token: string): Promise<{ user: UserType } | undefined> => {
    let decoded;
    try {
        decoded = jwt.decode(token);
    } catch {
        return;
    }
    if (decoded === null || typeof decoded != 'object' || typeof decoded.id !== 'string') {
        return;
    }

    const user = await User.findOne({ id: decoded.id });
    if (!user) {
        return;
    }

    try {
        jwt.verify(token, user.hash);
    } catch (e) {
        return;
    }
    return { user };
};

export const verifyAuthMiddleware = createMiddleware({
    input: z.object({}),
    middleware: async ({ request, logger }) => {
        if (request.headers.authorization === undefined) {
            logger.debug(`Rejecting request because no authorization header was provided`);
            throw createHttpError(401, 'Unauthorized');
        }
        const token = request.headers.authorization.split(' ')[1];
        const user = await verifyToken(token);
        if (!user) {
            logger.debug(`Rejecting request because token was invalid`);
            throw createHttpError(401, 'Unauthorized');
        }
        return user;
    },
});

export interface AuthenticatedOptions {
    user: UserType;
}


export const client = createClient({url});
export const producer = client.duplicate();
export const consumer = client.duplicate();
