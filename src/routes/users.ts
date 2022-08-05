import argon2 from 'argon2';
import { createHttpError, defaultEndpointsFactory, withMeta, z } from 'express-zod-api';
import jwt from 'jsonwebtoken';

import { AuthenticatedOptions, client, snowflake, verifyAuthMiddleware } from '../common';
import { PublicUserZod, User, UserZod } from '../models/user';

export const createUserEndpoint = defaultEndpointsFactory.build({
    method: 'post',
    description: 'Create a new user',
    input: withMeta(
        z.object({
            username: z.string().min(1).max(32),
            password: z.string().min(1).max(128),
            email: z.string().min(1),
        })
    ).example({
        username: 'teaishealthy',
        password: 'youshallnotpass',
        email: 'teaishealthy@protonmail.com',
    }),
    output: withMeta(
        z.object({
            email: z.string().min(1),
            username: z.string().min(1),
            discriminator: z.string().min(1),
            id: z.string().min(1),
            
        })
    ).example({
        username: 'teaishealthy',
        email: 'teaishealthy@protonmail.com',
        id: '915047329042434',
        discriminator: '0001',
    }),
    handler: async ({ input: { username, password, email }, logger }) => {
        const exists = await User.exists({ email });

        if (exists) {
            logger.debug(`Rejecting POST /users/me because '${email}' is already in use`);
            throw createHttpError(400, 'Email already in use');
        }

        const count = await User.count({ username });
        if (count + 1000 >= 9999) {
            logger.debug(`Rejecting POST /users/me because '${username}' is used too many times`);
            throw createHttpError(400, 'Username is used too many times');
        }
        const discriminator = (count + 1000).toString().padStart(4, '0');

        const hash = await argon2.hash(password, { type: argon2.argon2id });
        const id = snowflake.generate().toString();
        await User.create({ username, email, id, hash, discriminator } );

        logger.info(`Created user '${username}' with id '${id}'`);
        return { username, email, id, discriminator };
    },
});

export const patchUsersMe = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'patch',
    description: 'Update your user',

    input: withMeta(
        z.object({
            username: z.string().min(1).max(32).optional(),
            password: z.string().min(1).max(128).optional(),
            email: z.string().min(1).optional(),
        })
    ).example({
        username: 'teaishealthy',
        password: 'youshallnotpass',
    }),
    output: UserZod,
    handler: async ({ input: { username, password, email }, options }) => {
        const { user } = options as AuthenticatedOptions;
        await User.updateOne(
            { id: user.id },
            {
                username: username !== undefined ? username : user.username,
                email: email !== undefined ? email : user.email,
                hash: password !== undefined ? await argon2.hash(password, { type: argon2.argon2id }) : user.hash,
            }
        );
        const updatedUser = await User.findOne({ id: user.id });
        if (!updatedUser) {
            throw createHttpError(500, 'User not found');
        }

        if (password !== undefined) {
            await client.publish(
                'gateway',
                JSON.stringify({
                    type: 'internal',
                    data: {
                        type: 'disconnect',
                        id: user.id,
                    },
                })
            );
        }
        return {
            username: updatedUser.username,
            email: updatedUser.email,
            id: updatedUser.id,
            discriminator: updatedUser.discriminator,
        };
    },
});

export const getUsersMe = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'get',
    description: 'Get your user info',
    input: z.object({}),
    output: UserZod,
    handler: async ({ options }) => {
        const { user } = options as AuthenticatedOptions;
        return {
            username: user.username,
            email: user.email,
            id: user.id,
            discriminator: user.discriminator,
        };
    },
});

export const deleteUserEndpoint = defaultEndpointsFactory.addMiddleware(verifyAuthMiddleware).build({
    method: 'delete',
    description: 'Delete your user',
    input: z.object({}),
    output: z.object({ message: z.string().optional() }),
    handler: async ({ options, logger }) => {
        const { user } = options as AuthenticatedOptions;
        await User.deleteOne( { id: user.id });
        logger.info(`Deleted user '${user.username}' with id '${user.id}'`);
        if (user.username === 'ooliver1') {
            return { message: 'sucessfully forgor' };
        }
        return {};
    },
});

export const getUserTokenEndpoint = defaultEndpointsFactory.build({
    method: 'post',
    description: 'Get a user token. This is comparable to a login',
    input: withMeta(
        z.object({
            password: z.string().min(1).max(128),
            email: z.string().min(1),
        })
    ).example({
        email: 'teaishealthy@protonmail.com',
        password: 'youshallnotpass',
    }),
    output: withMeta(
        z.object({
            token: z.string().min(1),
        })
    ).example({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjkxNTQyMTM1MTkwNzMyOCIsImlhdCI6MTY1ODgzOTA1NX0.Vu5MqJ_F_2rAHbcICvOGqxXoaqYiFYvRb9w0c7vHIlc',
    }),
    handler: async ({ input: { password, email }, logger }) => {
        const user = await User.findOne({ email: email });
        if (!user) {
            logger.debug(`Rejecting GET /users/me/token because '${email}' was not found`);
            throw createHttpError(401, 'Unauthorized');
        }

        const valid = await argon2.verify(user.hash, password);

        if (!valid) {
            logger.debug(`Rejecting GET /users/me/token because '${email}' password was invalid`);
            throw createHttpError(401, 'Unauthorized');
        }
        const token = jwt.sign({ id: user.id }, user.hash);
        logger.debug(`Created token for user '${user.username}' with id '${user.id}'`);
        return { token };
    },
});
