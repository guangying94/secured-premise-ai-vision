# Stage 1: Build the React application
FROM node:18 as build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . ./
RUN npm run build

# Stage 2: Set up the Express server
FROM node:18
WORKDIR /app
COPY --from=build /app/build ./build
COPY package*.json ./
RUN npm install --only=production
COPY ./server/server.js ./

# Expose port 3000 for the server
EXPOSE 3000

# Start the server
CMD [ "node", "server.js" ]