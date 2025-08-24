#!/bin/bash

# AI Trading System Setup Script
# This script sets up the complete AI algorithmic trading system

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18+ first."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check Python
    if ! command_exists python3; then
        print_error "Python 3.8+ is not installed. Please install Python 3.8+ first."
        exit 1
    fi
    
    PYTHON_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
    PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d'.' -f1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    
    if [ "$PYTHON_MAJOR" -lt 3 ] || ([ "$PYTHON_MAJOR" -eq 3 ] && [ "$PYTHON_MINOR" -lt 8 ]); then
        print_error "Python 3.8+ is required. Current version: $PYTHON_VERSION"
        exit 1
    fi
    
    # Check Docker (optional)
    if command_exists docker; then
        print_success "Docker is available"
    else
        print_warning "Docker is not installed. You can install it for containerized deployment."
    fi
    
    # Check Git
    if ! command_exists git; then
        print_error "Git is not installed. Please install Git first."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs
    mkdir -p uploads
    mkdir -p data
    mkdir -p models/saved
    mkdir -p models/checkpoints
    mkdir -p database/migrations
    mkdir -p database/seeds
    
    print_success "Directories created successfully"
}

# Function to setup frontend
setup_frontend() {
    print_status "Setting up frontend..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f .env.local ]; then
        cp env.example .env.local
        print_success "Frontend environment file created"
    fi
    
    cd ..
    print_success "Frontend setup completed"
}

# Function to setup backend
setup_backend() {
    print_status "Setting up backend..."
    
    cd backend
    
    # Install dependencies
    print_status "Installing backend dependencies..."
    npm install
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "Backend environment file created"
    fi
    
    # Build TypeScript
    print_status "Building backend..."
    npm run build
    
    cd ..
    print_success "Backend setup completed"
}

# Function to setup AI models
setup_ai_models() {
    print_status "Setting up AI models..."
    
    cd ai-models
    
    # Create virtual environment
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install dependencies
    print_status "Installing AI models dependencies..."
    pip install -r requirements.txt
    
    # Create environment file if it doesn't exist
    if [ ! -f .env ]; then
        cp env.example .env
        print_success "AI models environment file created"
    fi
    
    cd ..
    print_success "AI models setup completed"
}

# Function to setup database
setup_database() {
    print_status "Setting up database..."
    
    # Check if PostgreSQL is installed
    if ! command_exists psql; then
        print_warning "PostgreSQL is not installed. Please install PostgreSQL first."
        print_warning "You can use Docker to run PostgreSQL:"
        print_warning "docker run --name postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=ai_trading_db -p 5432:5432 -d postgres:15"
        return
    fi
    
    # Check if Redis is installed
    if ! command_exists redis-server; then
        print_warning "Redis is not installed. Please install Redis first."
        print_warning "You can use Docker to run Redis:"
        print_warning "docker run --name redis -p 6379:6379 -d redis:7"
        return
    fi
    
    print_success "Database setup completed"
}

# Function to create Docker files
create_docker_files() {
    print_status "Creating Docker files..."
    
    # Frontend Dockerfile
    cat > frontend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

    # Backend Dockerfile
    cat > backend/Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
EOF

    # AI Models Dockerfile
    cat > ai-models/Dockerfile << 'EOF'
FROM python:3.9-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

EXPOSE 8000

CMD ["python", "main.py"]
EOF

    print_success "Docker files created"
}

# Function to create startup scripts
create_startup_scripts() {
    print_status "Creating startup scripts..."
    
    # Development startup script
    cat > start-dev.sh << 'EOF'
#!/bin/bash

echo "Starting AI Trading System in development mode..."

# Start Redis (if not running)
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    redis-server --daemonize yes
fi

# Start PostgreSQL (if not running)
if ! pgrep -x "postgres" > /dev/null; then
    echo "PostgreSQL is not running. Please start it manually."
fi

# Start AI Models
echo "Starting AI Models service..."
cd ai-models
source venv/bin/activate
python main.py &
AI_PID=$!
cd ..

# Start Backend
echo "Starting Backend service..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Start Frontend
echo "Starting Frontend service..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "All services started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "AI Models: http://localhost:8000"

# Wait for user to stop
echo "Press Ctrl+C to stop all services"
trap "kill $AI_PID $BACKEND_PID $FRONTEND_PID; exit" INT
wait
EOF

    # Production startup script
    cat > start-prod.sh << 'EOF'
#!/bin/bash

echo "Starting AI Trading System in production mode..."

# Start with Docker Compose
docker-compose up -d

echo "All services started!"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "AI Models: http://localhost:8000"
EOF

    # Stop script
    cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping AI Trading System..."

# Stop Docker services
docker-compose down

# Kill any remaining processes
pkill -f "python main.py" || true
pkill -f "npm run dev" || true
pkill -f "next dev" || true

echo "All services stopped"
EOF

    # Make scripts executable
    chmod +x start-dev.sh start-prod.sh stop.sh
    
    print_success "Startup scripts created"
}

# Function to display next steps
display_next_steps() {
    echo ""
    echo "=========================================="
    echo "AI Trading System Setup Completed!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo ""
    echo "1. Configure environment variables:"
    echo "   - Edit frontend/.env.local"
    echo "   - Edit backend/.env"
    echo "   - Edit ai-models/.env"
    echo ""
    echo "2. Set up your Zerodha API credentials:"
    echo "   - Get API key from Zerodha developer console"
    echo "   - Update backend/.env with your credentials"
    echo ""
    echo "3. Start the services:"
    echo "   - Development: ./start-dev.sh"
    echo "   - Production: ./start-prod.sh"
    echo ""
    echo "4. Access the application:"
    echo "   - Frontend: http://localhost:3000"
    echo "   - Backend API: http://localhost:5000"
    echo "   - AI Models API: http://localhost:8000"
    echo ""
    echo "5. Deploy to production:"
    echo "   - Frontend: Deploy to Vercel"
    echo "   - Backend: Deploy to Render"
    echo "   - AI Models: Deploy to your preferred platform"
    echo ""
    echo "For more information, see the README.md file."
    echo ""
}

# Main setup function
main() {
    echo "=========================================="
    echo "AI Trading System Setup"
    echo "=========================================="
    echo ""
    
    # Check requirements
    check_requirements
    
    # Create directories
    create_directories
    
    # Setup frontend
    setup_frontend
    
    # Setup backend
    setup_backend
    
    # Setup AI models
    setup_ai_models
    
    # Setup database
    setup_database
    
    # Create Docker files
    create_docker_files
    
    # Create startup scripts
    create_startup_scripts
    
    # Display next steps
    display_next_steps
}

# Run main function
main "$@"
