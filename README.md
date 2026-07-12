# 🚀 Deployment

This project is deployed on **AWS EC2** with an automated **CI/CD pipeline** using **GitHub Actions** and a **self-hosted runner**. The backend is managed by **PM2**, while **Nginx** serves the React (Vite) frontend and acts as a reverse proxy.

## Deployment Stack

* ☁️ **AWS EC2** – Application hosting
* ⚛️ **React (Vite)** – Frontend
* 🟢 **Node.js + Express** – Backend
* 🌐 **Nginx** – Static file serving & reverse proxy
* 🔄 **PM2** – Backend process management
* ⚙️ **GitHub Actions** – CI/CD automation
* 🖥️ **Self-Hosted Runner** – Executes deployment workflows on the EC2 instance

## CI/CD Workflow

```text
                    Developer
                        │
                git push origin main
                        │
                        ▼
             GitHub Repository (main)
                        │
                        ▼
              GitHub Actions Workflow
                        │
                        ▼
          Self-Hosted Runner (AWS EC2)
                        │
        ┌───────────────┼────────────────┐
        │               │                │
        ▼               ▼                ▼
   git pull        npm install      npm run build
    (Latest)       (Dependencies)   (Frontend)
        │                                │
        └───────────────┬────────────────┘
                        ▼
                 pm2 reload backend
                        │
                        ▼
          Nginx serves updated frontend
          PM2 keeps backend running
                        │
                        ▼
              🚀 Live Production Website
```

### Deployment Process

1. Push changes to the `main` branch.
2. GitHub Actions automatically triggers the deployment workflow.
3. The self-hosted runner on the EC2 instance:

   * Pulls the latest source code
   * Installs project dependencies
   * Builds the React frontend
   * Reloads the backend using PM2
4. Nginx immediately serves the updated frontend, while PM2 ensures the backend remains online with minimal downtime.

This setup provides **automated, reliable deployments** without requiring manual SSH access for every code update.


## AWS EC2 Architecture

```text
                     AWS EC2 Instance
┌─────────────────────────────────────────────────────────┐
│                                                         │
│  Self-Hosted GitHub Runner                             │
│          │                                              │
│          ▼                                              │
│  /home/ubuntu/testing_depolyemnt_apnavideocall         │
│          │                                              │
│    ┌─────┴───────────────┐                              │
│    │                     │                              │
│    ▼                     ▼                              │
│ Backend (Node.js)    Frontend (React + Vite)           │
│    │                     │                              │
│    │                 npm run build                     │
│    │                     │                              │
│    ▼                     ▼                              │
│ PM2                frontend/dist                       │
│    │                     │                              │
│    └──────────┬──────────┘                              │
│               ▼                                         │
│            Nginx                                         │
│               │                                          │
└───────────────┼──────────────────────────────────────────┘
                │
                ▼
          Users / Web Browser
```

### Responsibilities

* **Self-Hosted Runner:** Executes the GitHub Actions workflow directly on the EC2 instance.
* **PM2:** Keeps the backend running, automatically restarts it if it crashes, and reloads it during deployments.
* **Nginx:** Serves the built React application (`frontend/dist`) and forwards API requests to the backend.
* **Frontend:** Built using Vite and served as static files.
* **Backend:** Express.js application running continuously under PM2.
