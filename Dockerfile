# ---- 1) build the website --------------------------------------------------
FROM node:22-alpine AS web
WORKDIR /app/web
COPY web/package*.json ./
RUN npm install --no-audit --no-fund
COPY web/ ./
RUN npm run build

# ---- 2) runtime: API + the built website, one process ----------------------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=4000 TRUST_PROXY=1
COPY backend/package*.json backend/
RUN cd backend && npm install --omit=dev --no-audit --no-fund
COPY backend/ backend/
COPY --from=web /app/web/dist web/dist
RUN mkdir -p backend/data && chown -R node:node /app
USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s \
  CMD wget -qO- http://localhost:4000/health >/dev/null || exit 1
# JWT_SECRET must be provided at run time (the server refuses to boot in
# production with the placeholder). seed.js only fills EMPTY collections, so it
# is safe to run on every start; mount a volume at /app/backend/data to keep data.
CMD ["sh", "-c", "node backend/seed.js && node backend/server.js"]
