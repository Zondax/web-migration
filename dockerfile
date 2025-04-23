   # Use the official Node.js image as the base image
   FROM node:18-alpine

   # Set the working directory
   WORKDIR /app

   # Copy package.json and package-lock.json
   COPY package.json ./
   COPY pnpm-lock.yaml ./

   # Install dependencies
   RUN npm install -g pnpm && pnpm install

   # Copy the rest of the application code
   COPY . .

   # Build the Next.js application
   RUN pnpm build

   # Expose the port the app runs on
   EXPOSE 3000

   # Start the application
   CMD ["pnpm", "dev"]