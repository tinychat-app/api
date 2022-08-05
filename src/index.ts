import { createConfig, createServer } from 'express-zod-api';
import { OpenAPI } from 'express-zod-api';
import { writeFileSync } from 'fs';
import path from 'path';
import { config, routing } from './server';

import { client, consumer, producer, verifyToken } from './common';
import mongoose from 'mongoose';


const main = async () => {

    await client.connect();
    await producer.connect();
    await consumer.connect();
    await mongoose.connect('mongodb://localhost:27017/dev', );

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

    await producer.disconnect();
    await consumer.disconnect();
};
main();
