import { PrismaClient, User } from '@prisma/client';
import { Snowflake } from '@sapphire/snowflake';
import { createHttpError, createMiddleware, z } from 'express-zod-api';
import jwt from 'jsonwebtoken';
import { createClient } from 'redis';

const prisma = new PrismaClient();
const tinyEpoch = new Date('2022-07-24T00:00:00.000Z');
const snowflake = new Snowflake(tinyEpoch);

const verifyToken = async (token: string): Promise<{ user: User } | undefined> => {
    let decoded;
    try {
        decoded = jwt.decode(token);
    } catch {
        return;
    }
    if (decoded === null || typeof decoded != 'object' || typeof decoded.id !== 'string') {
        return;
    }

    const user = await prisma.user.findFirst({ where: { id: decoded.id } });
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

const verifyAuthMiddleware = createMiddleware({
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

interface AuthenticatedOptions {
    user: User;
}

const client = createClient();
const producer = client.duplicate();
const consumer = client.duplicate();

export {
    snowflake,
    tinyEpoch,
    verifyAuthMiddleware,
    prisma,
    AuthenticatedOptions,
    verifyToken,
    client,
    producer,
    consumer,
};
