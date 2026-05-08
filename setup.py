#!/usr/bin/env python3
import os
import json
import sys

base = r"C:\Users\ngadewar\Desktop\Hackathon"

# Create all necessary directories
dirs_to_create = [
    os.path.join(base, "backend", "routes"),
    os.path.join(base, "frontend", "src", "components")
]

print("Creating directories...")
for d in dirs_to_create:
    os.makedirs(d, exist_ok=True)
    print(f"✓ {d}")

# File definitions
files_to_create = {
    os.path.join(base, "backend", "package.json"): '''{
  "name": "ai-approval-backend",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "better-sqlite3": "^9.4.3",
    "multer": "^1.4.5-lts.1",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}''',
    os.path.join(base, "frontend", "package.json"): '''{
  "name": "ai-approval-frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "axios": "^1.6.7",
    "lucide-react": "^0.323.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "vite": "^5.1.4"
  }
}'''
}

print("\nCreating files...")
for fpath, content in files_to_create.items():
    os.makedirs(os.path.dirname(fpath), exist_ok=True)
    with open(fpath, 'w') as f:
        f.write(content)
    print(f"✓ {fpath}")

print("\nSetup complete!")
