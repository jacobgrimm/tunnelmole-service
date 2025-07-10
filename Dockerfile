FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Create config file from example if it doesn't exist
RUN if [ ! -f config-instance.toml ]; then cp config-instance.example.toml config-instance.toml; fi

# Expose ports
EXPOSE 8000 8080

# Start the service
CMD ["node", "dist/srv/index.js"]