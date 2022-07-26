import { PrismaClient, User } from '@prisma/client';
import { Snowflake } from '@sapphire/snowflake';
import crypto from 'crypto';
import { createHttpError, createMiddleware, z } from 'express-zod-api';
import jwt from 'jsonwebtoken';
import { Logger } from 'winston';

const prisma = new PrismaClient();
const tinyEpoch = new Date('2022-07-24T00:00:00.000Z');
const snowflake = new Snowflake(tinyEpoch);

const verifyAuthMiddleware = createMiddleware({
    input: z.object({}),
    middleware: async ({ request, logger }) => {

        if (!request.headers.authorization) {
            logger.debug(`Rejecting request because no authorization header was provided`);
            throw createHttpError(401, 'Unauthorized');
        }
        const token = request.headers.authorization.split(' ')[1];
        
        const decoded = jwt.decode(token);
        if (!decoded || typeof decoded != 'object' || typeof decoded.id !== 'string') {
            logger.debug(`Rejecting ${request.method} ${request.path} for invalid token`);
            throw createHttpError(401, 'Unauthorized');
        }
        
        const user = await prisma.user.findFirst({ where: { id: decoded.id } });
        if (!user) {
            logger.debug(`Rejecting ${request.method} ${request.path} for an invalid claim`);
            throw createHttpError(401, 'Unauthorized');
        }

        try {
            jwt.verify(token, user.hash);
        } catch (e) {
            logger.debug(`Rejecting ${request.method} ${request.path} for invalid token`);
            throw createHttpError(401, 'Unauthorized');
        }
        return { user };
    },
});

type AuthenticatedOptions = {
    user: User;
};

export { snowflake, tinyEpoch, verifyAuthMiddleware, prisma, AuthenticatedOptions };
