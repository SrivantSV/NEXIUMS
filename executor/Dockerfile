FROM node:20-alpine

WORKDIR /app

# Install Docker CLI for container management
RUN apk add --no-cache docker-cli

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Build TypeScript
RUN npm run build

# Create temp directory
RUN mkdir -p /app/temp

EXPOSE 5000

CMD ["npm", "start"]
