cd frontend
npm install
npm run build
cd ../backend
cargo build --release --target x86_64-unknown-linux-musl

cd ../
mkdir runable
cp backend/target/x86_64-unknown-linux-musl/release/backend ./runable
cp backend/config.yaml ./runable
