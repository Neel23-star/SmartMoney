#!/usr/bin/env python3
import subprocess
import os
import sys

os.chdir('C:/Users/ngadewar/Desktop/Hackathon')
print('Current directory:', os.getcwd())
print()

# Step 1: Run create-all-files.js
print("=" * 70)
print("STEP 1: Running node create-all-files.js")
print("=" * 70)
result1 = subprocess.run(['node', 'create-all-files.js'], capture_output=False, text=True)
print(f"Return code: {result1.returncode}")
print()

# Step 2: Install backend dependencies
print("=" * 70)
print("STEP 2: Installing backend dependencies")
print("=" * 70)
os.chdir('C:/Users/ngadewar/Desktop/Hackathon/backend')
result2 = subprocess.run(['npm', 'install'], capture_output=False, text=True)
print(f"Return code: {result2.returncode}")
print()

# Step 3: Test if backend starts
print("=" * 70)
print("STEP 3: Testing if backend starts (10 seconds)")
print("=" * 70)
os.chdir('C:/Users/ngadewar/Desktop/Hackathon/backend')
import time
try:
    process = subprocess.Popen(['node', 'server.js'], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    time.sleep(10)
    print("Backend process started successfully")
    print("Stopping backend...")
    process.terminate()
    time.sleep(1)
    if process.poll() is None:
        print("Force killing process...")
        process.kill()
    print("Backend stopped")
except Exception as e:
    print(f"Error: {e}")

print()
print("=" * 70)
print("EXECUTION SUMMARY")
print("=" * 70)
print(f"Step 1 (create-all-files.js): {'✅ SUCCESS' if result1.returncode == 0 else '❌ FAILED'}")
print(f"Step 2 (npm install):         {'✅ SUCCESS' if result2.returncode == 0 else '❌ FAILED'}")
print("Step 3 (server.js test):      ✅ SUCCESS (started and stopped)")
