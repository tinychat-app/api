import { createServer } from 'express-zod-api';
import mongoose from 'mongoose';

import { client, consumer, producer, verifyToken } from './common';
import { config, routing } from './server';

const main = async () => {
    await client.connect();
    await producer.connect();
    await consumer.connect();

    if (process.env.NODE_ENV === 'production') {
        await mongoose.connect('mongodb://mongo:27017/dev');
    } else {
        await mongoose.connect('mongodb://localhost:27017/dev');
    }
    

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
