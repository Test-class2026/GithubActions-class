FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install # full install, devDependencies included
COPY . .
RUN npm prune --omit=dev # strip devDependencies back out
# ---------- Stage 2: runtime ----------
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
# Never run as root - Week 14 covers why in depth
RUN addgroup --system portal && adduser --system --ingroup portal portal
# Copy the whole prepared app. Stage 1 already pruned devDependencies and
# .dockerignore kept junk out of the context, so /app holds exactly what
# should ship. Do NOT cherry-pick individual files here - see 3.5.
COPY --from=build --chown=portal:portal /app ./
USER portal
EXPOSE 3000
ENTRYPOINT ["node"] # the fixed executable
CMD ["server.js"] # the default argument, overridable