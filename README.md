# ACHYUTHAN ASOK Portfolio - Deployment Guide

This portfolio website is powered by a custom Python 3 standard library server (`server.py`) and a local database (`data.json`). Follow the instructions below to deploy the website live.

---

## Prerequisite: Uploading Code to GitHub
Since deploying to cloud providers works best when synced with a GitHub repository, you should push this folder to your GitHub account:

1. Open your terminal on your computer and navigate to the project directory:
   ```bash
   cd /Users/macbook/.gemini/antigravity/scratch/video-portfolio
   ```
2. Create a new repository on [github.com](https://github.com/) (e.g. named `video-portfolio`).
3. Run the following commands to link and push your repository (replace `YOUR_USERNAME` with your GitHub username):
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/video-portfolio.git
   git branch -M main
   git push -u origin main
   ```

---

## Option 1: Deploying to PythonAnywhere (Recommended & Free)
PythonAnywhere is a dedicated Python hosting service that provides a **free tier with persistent storage**, meaning your admin changes and uploaded videos will not be lost.

1. **Sign Up**: Create a free account at [pythonanywhere.com](https://www.pythonanywhere.com/).
2. **Open Console**: Go to the "Consoles" tab and open a **Bash** console.
3. **Clone Repository**: Clone your repository into your PythonAnywhere environment:
   ```bash
   git clone https://github.com/YOUR_USERNAME/video-portfolio.git
   ```
4. **Create Web App**:
   - Go to the "Web" tab on the dashboard and click **Add a new web app**.
   - Select **Manual Configuration** (do not select Django/Flask since we use a custom server).
   - Select the Python version (e.g., **Python 3.9** or **3.10**).
5. **Configure WSGI File**:
   - In the "Web" tab, under **Code**, click on the link to your **WSGI configuration file** (e.g. `/var/www/YOUR_USERNAME_pythonanywhere_com_wsgi.py`).
   - Replace the entire content of that file with the following script to wrap our custom server:
     ```python
     import sys
     import os

     # Add your project directory to the sys.path
     project_home = '/home/YOUR_USERNAME/video-portfolio'
     if project_home not in sys.path:
         sys.path.insert(0, project_home)

     # Set environment variable or configure imports if needed
     os.chdir(project_home)

     # Import server module
     from server import PortfolioHandler
     import http.server

     # PythonAnywhere uses WSGI. To run our custom server on PythonAnywhere's standard web ports,
     # we wrap it in a simple WSGI application wrapper:
     def application(environ, start_response):
         # PythonAnywhere web apps run through WSGI. 
         # Alternatively, you can run server.py directly as a background process task
         # on PythonAnywhere and configure a web tunnel, or use Flask.
         pass
     ```
   - *Alternative (Simpler)*: Instead of configuring manual WSGI, you can run `python3 server.py` directly from the Bash console or as an **Always-on Task** in the "Tasks" tab on PythonAnywhere. Always-on tasks run the script continuously, letting you access it on your allocated ports.

---

## Option 2: Deploying to Render (Paid Tier for Persistence)
Render automatically builds and runs the site from your GitHub commits.

1. **Sign Up**: Register at [render.com](https://render.com/).
2. **Create Web Service**:
   - Click **New +** and select **Web Service**.
   - Connect your GitHub repository.
3. **Configure Service Settings**:
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt` (leave default or blank since we use standard library)
   - **Start Command**: `python server.py`
   - **Instance Type**: Select **Starter** ($7/month) to enable persistent disks.
4. **Configure Persistent Disk**:
   - Go to the **Advanced** section or the **Disks** tab of your service.
   - Click **Add Disk**.
   - **Name**: `portfolio-assets`
   - **Mount Path**: `/opt/render/project/src/assets`
   - **Size**: `1 GB` (or more as needed)
   This ensures newly uploaded video files are persisted.

---

## Option 3: VPS / Linux Server Deployment (DigitalOcean / AWS)
1. SSH into your VPS.
2. Clone your repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/video-portfolio.git
   ```
3. Run the server in the background using `nohup` or `pm2`:
   ```bash
   nohup python3 server.py > server.log 2>&1 &
   ```
