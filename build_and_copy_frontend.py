import subprocess
import shutil
import os
import sys

SRC = os.path.join("frontend", "build")
DEST = os.path.join("backend", "frontend")

def main():
    # Step 1: Run npm run build
    print("Running 'npm run build' in ./frontend ...")
    try:
        subprocess.run(["npm", "run", "build"], cwd="frontend", check=True)
    except subprocess.CalledProcessError:
        print("npm run build failed.")
        sys.exit(1)

    # Step 2: Copy build to backend/frontend
    if not os.path.exists(SRC):
        print(f"Source build directory '{SRC}' does not exist.")
        sys.exit(1)
    if os.path.exists(DEST):
        print(f"Removing existing '{DEST}'...")
        shutil.rmtree(DEST)
    print(f"Copying '{SRC}' to '{DEST}'...")
    shutil.copytree(SRC, DEST)
    print("Done.")

if __name__ == "__main__":
    main()
