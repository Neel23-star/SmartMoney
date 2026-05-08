#!/usr/bin/env python3
"""
AI Approval Assistant - Python Setup Script
Run from Command Prompt: python execute.py
"""
import subprocess
import os
import sys

BASE = r"C:\Users\ngadewar\Desktop\Hackathon"
os.chdir(BASE)

print("\n" + "="*60)
print("  AI Approval Assistant - Full Setup")
print("="*60 + "\n")

# Step 1: Generate all project files
print("[1/3] Generating all project files via node run.js ...")
r1 = subprocess.run(["node", "run.js"], text=True)
if r1.returncode != 0:
    print("ERROR: node run.js failed. Is Node.js installed?")
    sys.exit(1)
print()

# Step 2: Install backend dependencies
print("[2/3] Installing backend dependencies ...")
os.chdir(os.path.join(BASE, "backend"))
r2 = subprocess.run(["npm", "install"], text=True)
if r2.returncode != 0:
    print("ERROR: npm install failed in backend/")
    sys.exit(1)
print()

# Step 3: Install frontend dependencies
print("[3/3] Installing frontend dependencies ...")
os.chdir(os.path.join(BASE, "frontend"))
r3 = subprocess.run(["npm", "install"], text=True)
if r3.returncode != 0:
    print("ERROR: npm install failed in frontend/")
    sys.exit(1)

print("\n" + "="*60)
print("  ✅ Setup Complete!")
print("="*60)
print()
print("Now start the servers:")
print()
print("  Terminal 1 (Backend):")
print(f"    cd {BASE}\\backend")
print("    node server.js")
print()
print("  Terminal 2 (Frontend):")
print(f"    cd {BASE}\\frontend")
print("    npm run dev")
print()
print("  Open browser: http://localhost:5173")
print()

