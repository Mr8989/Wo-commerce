#!/bin/bash
set -e

echo "🎀 Cropped By Ayerkie — local setup 🎀"
echo "======================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20 or higher."
    exit 1
fi

NODE_MAJOR=$(node -p "process.versions.node.split('.')[0]")
if [ "$NODE_MAJOR" -lt 20 ]; then
    echo "❌ Node.js $NODE_MAJOR is too old. Please install Node.js 20 or higher."
    exit 1
fi

echo "✅ Node.js $(node -v)"
echo ""

echo "📦 Backend (Express + Prisma)..."
cd backend-node
npm install

if [ ! -f .env ]; then
    cp .env.example .env
    echo ""
    echo "📝 Created backend-node/.env from the example."
    echo "   Fill in DATABASE_URL and the EMAIL_* / AFRICAS_TALKING_* values before continuing."
    NEEDS_ENV=1
fi
cd ..

echo ""
echo "📦 Frontend (React + Vite)..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Dependencies installed."
echo ""

if [ -n "$NEEDS_ENV" ]; then
    echo "Next, edit backend-node/.env, then run:"
else
    echo "Next steps:"
fi
echo ""
echo "  cd backend-node"
echo "  npm run migrate:baseline   # database already has the Django tables"
echo "  npm run migrate:deploy     # ...or this, for a brand new database"
echo "  npm run create-admin       # create a dashboard login"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend-node && npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "📱 Access the application:"
echo "  Frontend:    http://localhost:5173"
echo "  Backend API: http://localhost:8000/api"
echo "  Dashboard:   http://localhost:5173/admin/login"
echo ""
echo "Happy coding! 💻✨"
