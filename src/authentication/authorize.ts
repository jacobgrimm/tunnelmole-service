import fs from 'fs';
import { ROOT_DIR } from '../../constants';
import HostipWebSocket from '../websocket/host-ip-websocket';
import InitialiseMessage from '../messages/initialise-message';
import InvalidSubscriptionMessage from '../messages/invalid-subscription-message';
import initialise from '../message-handlers/initialise';
import config from '../../config';

const authorize = async(message: InitialiseMessage, websocket: HostipWebSocket, randomSubdomain: string) : Promise<boolean> => {
    // Skip API key validation in local development
    if (config.environment === 'local') {
        console.log('Local development mode: Skipping API key validation');
        return true;
    }

    const { apiKey } = message;
    const apiKeys = JSON.parse(fs.readFileSync(ROOT_DIR + "/src/authentication/apiKeys.json").toString());

    const apiKeyRecord = apiKeys.find((record: any) => {
        return record.apiKey == apiKey;
    });

    if (process.env.LOG_CONNECTION_INFO) {
        console.info(JSON.stringify(message.connectionInfo));
    }

    // No API key record. Send back a message, close the connection and return false 
    if (typeof apiKeyRecord == 'undefined') {
        const invalidSubscriptionMessage : InvalidSubscriptionMessage = {
            type: "invalidSubscription",
            apiKey: apiKey
        }

        websocket.sendMessage(invalidSubscriptionMessage);
        websocket.close();
        return false;
    }

    return true;
}

export {
    authorize
}