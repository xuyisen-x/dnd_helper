#!/bin/bash
set -e

echo "=== Starting Build Process ==="

# --- Frontend Build ---
echo "--> Building Frontend..."
cd frontend
npm install
npm run build

# --- Backend Build Logic ---
cd ../backend

CARGO_FLAGS="--release"
BIN_SRC_DIR="target/release"

if [[ "$1" == "--musl" ]]; then
    echo "--> Detected '--musl' flag. Building for x86_64-unknown-linux-musl..."
    CARGO_FLAGS="--release --target x86_64-unknown-linux-musl"
    BIN_SRC_DIR="target/x86_64-unknown-linux-musl/release"
else
    echo "--> No cross-compile flag detected. Building for host OS..."
fi

cargo build $CARGO_FLAGS

echo "--> Packaging..."

cd ../
mkdir -p artifacts
mkdir -p artifacts/server
cp "backend/$BIN_SRC_DIR/backend" ./artifacts/server
cp backend/config.toml ./artifacts/server
cp -r frontend/dist ./artifacts

echo "=== Build Success! Artifacts are in ./artifacts ==="
