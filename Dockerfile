FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production PORT=3000
 
RUN addgroup --system portal && adduser --system --ingroup portal portal
 
# Stage 1 already pruned devDependencies and .dockerignore kept junk out of
# the build context, so /app holds exactly what should ship. Copying the
# directory cannot miss a file the way a hand-written list can.
COPY --from=build --chown=portal:portal /app ./
 
USER portal
EXPOSE 3000
 
ENTRYPOINT ["node"]
CMD ["server.js"