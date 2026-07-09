# 🚀 ApnaVideoCall - Deployment Journey

This document contains the complete deployment journey of **ApnaVideoCall**, including all major configuration changes, debugging steps, and important Linux/Nginx/PM2/Git commands for future reference.

---

# 🛠 Tech Stack

- React (Vite)
- Node.js
- Express
- MongoDB Atlas
- Socket.IO
- WebRTC
- PM2
- Nginx
- AWS EC2 (Ubuntu)
- DuckDNS
- Let's Encrypt (Certbot)

---

# 📌 Deployment Architecture

```
                    Internet
                         │
                         ▼
        https://apnavideocall.duckdns.org
                         │
                  Elastic IP (AWS)
                         │
                         ▼
                     Nginx (443)
               ┌─────────┴─────────┐
               │                   │
               ▼                   ▼
         React Frontend       Express Backend
          (dist folder)         (PM2 Process)
                                     │
                                     ▼
                               MongoDB Atlas
```

---

# ✅ What Was Completed

## 1. EC2 Setup

- Created Ubuntu EC2 instance
- Configured Security Groups
- Opened ports

```
22
80
443
```

---

## 2. Elastic IP

Allocated Elastic IP

Associated it with the EC2 instance

Benefit:

- IP never changes after restarting EC2.

---

## 3. Frontend Deployment

Build frontend

```bash
npm run build
```

Output

```
frontend/dist
```

Configured Nginx to serve

```
frontend/dist
```

---

## 4. Backend Deployment

Installed PM2

```bash
npm install -g pm2
```

Started backend

```bash
pm2 start index.js --name backend
```

Useful Commands

```bash
pm2 list
pm2 logs backend
pm2 restart backend
pm2 stop backend
pm2 delete backend
```

Save PM2 processes

```bash
pm2 save
```

Auto start after reboot

```bash
pm2 startup
```

---

# 5. Nginx Configuration

Frontend

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

Backend Proxy

```nginx
location /api {
    proxy_pass http://localhost:8000;

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Socket.IO Proxy

```nginx
location /socket.io/ {
    proxy_pass http://localhost:8000;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

Test nginx

```bash
sudo nginx -t
```

Reload nginx

```bash
sudo systemctl reload nginx
```

Restart nginx

```bash
sudo systemctl restart nginx
```

Status

```bash
sudo systemctl status nginx
```

---

# 6. Linux Permission Issue

Problem

```
Permission denied

frontend/dist/index.html
```

Solved using

```bash
sudo chmod 755 /home/ubuntu

sudo chmod 755 /home/ubuntu/testing_depolyemnt_apnavideocall

sudo chmod 755 /home/ubuntu/testing_depolyemnt_apnavideocall/frontend

sudo chmod -R 755 /home/ubuntu/testing_depolyemnt_apnavideocall/frontend/dist
```

---

# 7. CORS Configuration

Allowed Origins

```js
const allowedOrigins = [
    "https://apnavideocall.duckdns.org",
    "http://localhost:5173"
];
```

Remember

Whenever domain changes

Update

```
allowedOrigins
```

Restart backend

```bash
pm2 restart backend
```

---

# 8. HTTPS

Installed

```bash
sudo apt install certbot python3-certbot-nginx
```

Generated certificate

```bash
sudo certbot --nginx -d apnavideocall.duckdns.org
```

Renewal check

```bash
sudo certbot renew --dry-run
```

---

# 9. DuckDNS

Configured

```
apnavideocall.duckdns.org
```

Mapped

```
Elastic IP
```

---

# 10. Socket.IO

Important Learning

Socket.IO automatically creates

```
/socket.io/
```

No Express route is required.

Nginx must proxy it.

---

# 11. API Calls

Frontend

Instead of

```js
http://localhost:8000/api
```

Use

```js
/api
```

Axios

```js
const client = axios.create({
    baseURL: "/api/users"
});
```

Nginx forwards

```
/api
```

to

```
localhost:8000
```

---

# 12. Camera Permission

Camera only works on

```
HTTPS
```

or

```
localhost
```

HTTP blocks camera access.

---

# 13. Major Bugs Fixed

### Permission Denied

Solved using chmod.

---

### Internal Server Error

Solved by fixing permissions.

---

### CORS Error

Updated

```
allowedOrigins
```

Restarted backend.

---

### Login Failed

Updated frontend API URL.

---

### Chat Not Working

Added

```
location /socket.io/
```

in nginx.

---

### Camera Not Working

Enabled HTTPS.

---

### Elastic IP Change

Updated

```
DuckDNS
```

Updated

```
allowedOrigins
```

---

# Important Commands

## SSH

```bash
ssh -i key.pem ubuntu@Elastic-IP
```

---

## Git

```bash
git status

git pull origin main

git add .

git commit -m "message"

git push origin main
```

---

## Frontend

```bash
npm install

npm run build
```

---

## Backend

```bash
npm install

pm2 restart backend
```

---

## Nginx

```bash
sudo nginx -t

sudo systemctl reload nginx

sudo systemctl restart nginx

sudo systemctl status nginx
```

---

## Logs

Backend

```bash
pm2 logs backend
```

Nginx

```bash
sudo tail -f /var/log/nginx/error.log
```

---

## Certbot

Renew

```bash
sudo certbot renew
```

Check

```bash
sudo certbot renew --dry-run
```

---

# Deployment Flow (Current)

Whenever frontend changes

```bash
git pull origin main

cd frontend

npm install

npm run build
```

---

Whenever backend changes

```bash
git pull origin main

cd backend

npm install

pm2 restart backend
```

---

# Current Status

✅ EC2 Running

✅ Elastic IP

✅ DuckDNS

✅ HTTPS

✅ React Frontend

✅ Express Backend

✅ MongoDB Atlas

✅ PM2

✅ Nginx

✅ Socket.IO

✅ WebRTC

✅ Login

✅ Chat

✅ Camera

✅ Video Calling

---

# Next Goal

## CI/CD

Configure

- GitHub Actions
- Self Hosted Runner

So that

```
git push origin main
```

automatically

- Pulls latest code
- Installs dependencies
- Builds frontend
- Restarts backend
- Deploys latest version

No manual deployment required.

---

# Lessons Learned

- AWS EC2 deployment
- Elastic IPs
- Nginx Reverse Proxy
- PM2 Process Management
- Linux File Permissions
- CORS Configuration
- HTTPS using Let's Encrypt
- DuckDNS
- Socket.IO Reverse Proxy
- Production Deployment Workflow
- Debugging Nginx & Express
- React Production Build
- WebRTC HTTPS Requirements

---

**Project:** ApnaVideoCall

**Deployment Date:** July 2026

**Status:** Successfully deployed in production with HTTPS, Nginx, PM2, Socket.IO, MongoDB Atlas, and AWS EC2.
