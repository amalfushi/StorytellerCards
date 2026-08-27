# syntax=docker/dockerfile:1

FROM node:24-alpine AS ui-build
WORKDIR /src/UI
COPY UI/package.json UI/package-lock.json ./
RUN npm ci
COPY UI/ ./
RUN npm exec vite build

FROM golang:1.25-alpine AS api-build
WORKDIR /src/API
COPY API/go.mod API/go.sum ./
RUN go mod download
COPY API/ ./
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/storyteller-api ./cmd/server

FROM alpine:3.22
ARG APP_VERSION=dev
ARG VCS_REF=unknown
RUN addgroup -S storyteller \
    && adduser -S -G storyteller storyteller \
    && mkdir -p /app/ui /home/data \
    && chown -R storyteller:storyteller /app /home/data
COPY --from=api-build /out/storyteller-api /app/storyteller-api
COPY --from=ui-build /src/UI/dist /app/ui
COPY API/data/scripts /app/seed-data/scripts

ENV HOST=0.0.0.0 \
    PORT=8080 \
    STORYTELLER_DATA_DIR=/home/data \
    STORYTELLER_SEED_DATA_DIR=/app/seed-data \
    STATIC_DIR=/app/ui \
    APP_VERSION=$APP_VERSION

LABEL org.opencontainers.image.title="Storyteller Cards" \
    org.opencontainers.image.version=$APP_VERSION \
    org.opencontainers.image.revision=$VCS_REF \
    org.opencontainers.image.source="https://github.com/amalfushi/StorytellerCards"

USER storyteller
EXPOSE 8080
ENTRYPOINT ["/app/storyteller-api"]
