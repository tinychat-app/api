import { DependsOnMethod, OpenAPI, Routing, ServeStatic, createConfig } from 'express-zod-api';
import { writeFileSync } from 'fs';
import path from 'path';

import { createGuild, deleteGuild, getGuild, updateGuild } from './routes/guild';
import { createGuildChannel, createInvite, getGuildChannels, useInvite } from './routes/guild/channels';
import { createUserEndpoint, deleteUserEndpoint, getUserTokenEndpoint, getUsersMe, patchUsersMe } from './routes/users';

export const config = createConfig({
    server: {
        listen: 3000,
    },
    cors: true,
    logger: {
        level: 'debug',
        color: true,
    },
});

export const routing: Routing = {
    v1: {
        users: {
            '@me': {
                token: getUserTokenEndpoint,
                '': new DependsOnMethod({
                    get: getUsersMe,
                    post: createUserEndpoint,
                    patch: patchUsersMe,
                    delete: deleteUserEndpoint,
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
                channels: {
                    '': new DependsOnMethod({
                        get: getGuildChannels,
                        post: createGuildChannel,
                    }),
                    ':channelId': {
                    invites: new DependsOnMethod({
                        post: createInvite,
                    }),
                },
                },
            },
            'join': useInvite,
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