# ---------- Stage 1: build ---------- 
FROM node:20-alpine AS build WORKDIR /app 
COPY package*.json ./ 
RUN npm install	# full install, devDependencies included COPY . .
RUN npm prune --omit=dev	# strip devDependencies back out 

# ---------- Stage 2: runtime ---------- FROM node:20-alpine AS runtime 
WORKDIR /app 
ENV NODE_ENV=production PORT=3000 

# Never run as root - Week 14 covers why in depth 
RUN addgroup --system portal & & adduser --system --ingroup portal portal 

# Copy only what the application needs in order to run COPY --from=build /app/node_modules ./node_modules 
COPY --from=build /app/package.json ./package.json COPY --from=build /app/server.js	./server.js 
COPY --from=build /app/web	./web 

USER portal EXPOSE 3000 

ENTRYPOINT ["node"]	# the fixed executable 
CMD ["server.js"]	# the default argument, overridable 