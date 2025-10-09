# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application files
COPY . .

# Create upload directory
RUN mkdir -p /tmp/uploads

# Expose port
EXPOSE 10021

# Set environment variables
ENV NODE_ENV=production
ENV PORT=10021

# Start the application
CMD ["node", "server.js"]
