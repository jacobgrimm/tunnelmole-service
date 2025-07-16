import fs from 'fs';
import toml from 'toml';
import path from 'path';

let config: any;

// Try to load config from multiple possible locations
const configPaths = [
    'config-instance.toml',
    './config-instance.toml',
    path.join(__dirname, 'config-instance.toml'),
    path.join(__dirname, '..', 'config-instance.toml'),
    path.join(process.cwd(), 'config-instance.toml'),
    'config-instance.example.toml',
    path.join(__dirname, 'config-instance.example.toml'),
    path.join(__dirname, '..', 'config-instance.example.toml')
];

let configLoaded = false;

for (const configPath of configPaths) {
    try {
        if (fs.existsSync(configPath)) {
            config = toml.parse(fs.readFileSync(configPath).toString());
            configLoaded = true;
            break;
        }
    } catch (error) {
        // Continue to next path
    }
}

// Fallback to default config if no file found (for tests)
if (!configLoaded) {
    config = {
        environment: "test",
        server: {
            httpPort: 8000,
            websocketPort: 8080,
            domain: 'localhost',
            password: 'testpassword'
        },
        mysql: {
            host: 'localhost',
            user: 'root',
            password: 'changeme',
            database: 'tunnelmole'
        },
        runtime: {
            debug: true,
            enableLogging: false,
            connectionTimeout: 43200,
            timeoutCheckFrequency: 5000
        },
        bannedIps: [],
        bannedClientIds: [],
        bannedHostnames: []
    };
}

export default config;