# ---------- Stage 1: build ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
# Full install, devDependencies included
RUN npm install
COPY . .
# Strip devDependencies back out
RUN npm prune --omit=dev

# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000

# Never run as root - Week 14 covers why in depth
RUN addgroup --system portal && adduser --system --ingroup portal portal

# Copy the whole prepared app. Stage 1 already pruned devDependencies and
# .dockerignore kept junk out of the context, so /app holds exactly what
# should ship. Do NOT cherry-pick individual files here.
COPY --from=build --chown=portal:portal /app ./

USER portal
EXPOSE 3000

# NOTE: a # is only a comment at the START of a line in a Dockerfile.
# A trailing comment after ENTRYPOINT/CMD breaks the JSON exec form, so
# Docker falls back to shell form and tries to run a program called [node].
# Keep these two lines free of trailing comments.
ENTRYPOINT ["node"]
CMD ["server.js"]
