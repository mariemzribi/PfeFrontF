#partie 1: partie de build application angular
FROM node:22.14.0 AS built

WORKDIR /app
EXPOSE 4200
COPY package.json package.json
RUN npm i -g @angular/cli
RUN npm install
COPY . .
RUN npm run build --configuration=production

#parie 2: partie serveur web : bech nhostiw aliha l'application front 
FROM nginx:latest
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=built /app/dist/auth-ecclient/browser /usr/share/nginx/html
#hhtp:80 https:443
EXPOSE 80 443
CMD [ "nginx", "-g", "daemon off;" ]