# syntax=docker/dockerfile:1
#
# Sentrix dashboard — production image.
#
# A pure static SPA (see SENTRIX_INTEGRATION_AND_DEPLOYMENT.md — "it holds no
# business logic and no data, it renders the backend"). Vite bakes VITE_*
# values into the JS bundle AT BUILD TIME, so — unlike the backend, where env
# is injected at container start — this image must be (re)built per
# environment. CI passes these as --build-arg from repo/environment variables
# (see .github/workflows/deploy.yml); nothing here is a real secret, they're
# all public URLs the browser calls directly.

FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Baked at build time — one image per target environment (staging/prod), not
# swappable at container-run time. Defaults point at the production API
# domain agreed for this deployment; override per-environment in CI.
ARG VITE_API_URL=https://api.sentrixglobaltech.com/api/v1
ARG VITE_DEVICE_NAME="Sentrix Console (web)"
ARG VITE_REVERB_APP_KEY
ARG VITE_REVERB_HOST=api.sentrixglobaltech.com
ARG VITE_REVERB_PORT=443
ARG VITE_REVERB_SCHEME=https
ENV VITE_API_URL=${VITE_API_URL} \
    VITE_DEVICE_NAME=${VITE_DEVICE_NAME} \
    VITE_REVERB_APP_KEY=${VITE_REVERB_APP_KEY} \
    VITE_REVERB_HOST=${VITE_REVERB_HOST} \
    VITE_REVERB_PORT=${VITE_REVERB_PORT} \
    VITE_REVERB_SCHEME=${VITE_REVERB_SCHEME}

RUN npm run build

FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

# nginx:alpine already ships an `nginx` user; just own the static files.
RUN chown -R nginx:nginx /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -fsS http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
