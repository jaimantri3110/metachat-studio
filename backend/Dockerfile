FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY tsconfig.json ./

# Install all dependencies including dev dependencies
RUN npm install

# Copy source code
COPY src ./src

# Expose port
EXPOSE 4000

# Run in development mode to avoid build issues
CMD ["npm", "run", "dev"]