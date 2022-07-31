import { DependsOnMethod, Routing, ServeStatic, createConfig, createServer } from 'express-zod-api';
import { OpenAPI } from 'express-zod-api';
import { writeFileSync } from 'fs';
import path from 'path';

import { client, consumer, prisma, producer, verifyToken } from './common';
import { createGuild, deleteGuild, getGuild, updateGuild } from './routes/guild';
import { createGuildChannel } from './routes/guild/channels';
import {
    createUserEndpoint as createUser,
    deleteUserEndpoint as deleteUser,
    getUserTokenEndpoint,
    getUsersMe,
    patchUsersMe as updateUsersMe,
} from './routes/users';

const config = createConfig({
    server: {
        listen: 3000,
    },
    cors: true,
    logger: {
        level: 'debug',
        color: true,
    },
});

const routing: Routing = {
    v1: {
        users: {
            '@me': {
                token: getUserTokenEndpoint,
                '': new DependsOnMethod({
                    get: getUsersMe,
                    post: createUser,
                    patch: updateUsersMe,
                    delete: deleteUser,
                }),
            },
        },
        guilds: {
            '': createGuild,
            ':id': {
                '': new DependsOnMethod({
                    get: getGuild,
                    patch: updateGuild,
                    delete: deleteGuild,
                }),
                channels: new DependsOnMethod({
                    post: createGuildChannel,
                }),
            },
        },
    },
    docs: new ServeStatic(path.join(__dirname, '..', 'public')),
};

const jsonSpec = new OpenAPI({
    routing,
    config,
    version: '0.1.0',
    title: 'tinychat API',
    serverUrl: 'http://localhost:3000',
}).getSpecAsJson();
writeFileSync(path.join(__dirname, '..', 'public/openapi.json'), jsonSpec, { flag: 'w' });

const main = async () => {
    await prisma.$connect();

    await client.connect();
    await producer.connect();
    await consumer.connect();

    await consumer.subscribe('rest', async (rawMessage) => {
        const message = JSON.parse(rawMessage);
        if (message.type === 'confirm_auth') {
            const user = await verifyToken(message.data.token);
            if (!user) {
                await client.publish(
                    'gateway',
                    JSON.stringify({
                        type: 'confirm_auth',
                        data: { id: null, valid: false, token: message.data.token },
                    })
                );
                return;
            }
            await client.publish(
                'gateway',
                JSON.stringify({
                    type: 'confirm_auth',
                    data: { id: user.user.id, valid: true, token: message.data.token },
                })
            );
        }
    });

    createServer(config, routing);

    await prisma.$disconnect();
    await producer.disconnect();
};
main();
