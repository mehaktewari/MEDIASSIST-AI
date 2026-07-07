# ── MediAssist AI — Frontend (React + Vite, served via Nginx) ───
# Multi-stage build: compile the static site with Node, then serve
# it with a lightweight Nginx image (final image has no Node/npm at all).

# Stage 1: build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]