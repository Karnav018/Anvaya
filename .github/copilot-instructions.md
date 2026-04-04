# Anvaya - Visual API Builder

Anvaya is a full-stack application that allows users to visually design APIs through a drag-and-drop canvas interface, then generate working code in multiple languages/frameworks.

## Architecture Overview

### Backend (`/backend/`)
- **FastAPI** Python backend with PostgreSQL database
- **Visual-to-Code Pipeline**: Canvas blueprints → AST generation → Code bundling
- **Authentication**: JWT-based auth with user quotas and rate limiting
- **Code Generation**: Supports multiple target frameworks (FastAPI, Node.js, etc.)

### Frontend (`/frontend/`)
- **React + TypeScript + Vite** with React Flow for canvas visualization
- **State Management**: Zustand stores (`authStore`, `canvasStore`, `uiStore`)
- **Styling**: Tailwind CSS with Framer Motion for animations
- **Monaco Editor**: Integrated for code preview/editing

### Key Data Flow
1. User designs API visually on React Flow canvas
2. Canvas state saved as `AnvayaBlueprint` (nodes + edges JSON)
3. Blueprint parsed into AST using `ast_builder.py`
4. AST transformed to target framework code via `bundler.py`
5. Generated code returned as downloadable ZIP

## Build & Development Commands

### Backend
```bash
cd backend
# Install dependencies
pip install -r requirements.txt

# Run development server
python run.py  # Starts on http://localhost:8000

# Run comprehensive test suite
python test_anvaya.py  # Tests all API endpoints + quota system

# Database setup
# Copy .env.example to .env and configure DATABASE_URL
# Migrations run automatically on startup via run_migrations()
```

### Frontend
```bash
cd frontend
# Install dependencies
npm install

# Development server
npm run dev  # Starts on http://localhost:5173

# Build for production
npm run build

# Lint TypeScript/React code
npm run lint

# Preview production build
npm run preview
```

## Canvas Node Types & Data Models

The visual canvas uses strongly-typed node definitions in `/backend/app/models/blueprint.py`:

### Core Node Types
- **route**: HTTP endpoints (`RouteData` - method, path, description)
- **auth**: Authentication strategies (`AuthData` - jwt/api_key/none)
- **database**: Data operations (`DatabaseData` - provider, model, action)
- **middleware**: Request processing (`MiddlewareData` - cors/logger/rate_limit)
- **response**: HTTP responses (`ResponseData` - status_code, body format)

### Extended Node Types
- **schema**: Database models (`SchemaData` - fields, relationships, constraints)
- **validation**: Input validation (`ValidationData` - rules, locations)
- **error_handler**: Error management (`ErrorHandlerData` - strategies, custom types)
- **response_schema**: Response formatting (`ResponseSchemaData` - structure, metadata)

### Blueprint Structure
```typescript
AnvayaBlueprint {
  version: "1.0.0"
  nodes: CanvasNode[]  // id, type, position, data
  edges: CanvasEdge[]  // id, source, target, handles
  viewport?: object    // canvas view state
}
```

## Key Conventions

### Backend Patterns
- **Environment Config**: Use `settings` from `app.config` - validates required vars on startup
- **Database**: AsyncPG pool with automatic SSL for Neon.tech URLs
- **Authentication**: JWT tokens with user quotas tracked in database
- **API Structure**: Routers in `/routers/`, models in `/models/`, services in `/services/`
- **Error Handling**: FastAPI exception handlers with consistent JSON responses
- **Rate Limiting**: SlowAPI with Redis backend for production

### Frontend Patterns
- **Component Organization**: `/components/` split by domain (canvas, blocks, panels, ui)
- **State Management**: Zustand stores with TypeScript interfaces
- **API Calls**: Axios with auth interceptors in `/lib/`
- **Routing**: React Router v7 with nested layouts
- **Styling**: Tailwind with `cn()` utility from `tailwind-merge`

### Canvas Development
- **Node Components**: Custom React Flow nodes in `/components/blocks/CustomNodes.tsx`
- **Canvas State**: Managed via `canvasStore.ts` with undo/redo support
- **Data Validation**: Zod schemas for runtime type checking
- **Visual Feedback**: Toast notifications via `react-hot-toast`

## Testing Strategy

### Backend Testing
- **Full Integration Test**: `test_anvaya.py` covers complete user journey
- **Test Coverage**: Auth, CRUD operations, quota enforcement, code generation
- **Test Data**: Creates/cleans up test projects automatically
- **Validation**: ZIP content inspection, quota header verification

### Development Workflow
1. Start backend: `cd backend && python run.py`
2. Start frontend: `cd frontend && npm run dev`
3. Run tests: `cd backend && python test_anvaya.py`
4. Both services auto-reload on file changes

## Environment Configuration

### Required Variables (`.env`)
```bash
DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
JWT_SECRET=openssl-rand-hex-32  # Generate with: openssl rand -hex 32
APP_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

### Security Notes
- JWT secrets validated for minimum 32-character length
- Database URLs must be PostgreSQL format
- CORS configured for specified frontend URL only
- Rate limiting applied to auth and generation endpoints

## Code Generation Pipeline

### Generator Architecture (`/backend/app/services/generator/`)
1. **Parser** (`parser.py`): Validates blueprint, extracts node relationships
2. **AST Builder** (`ast_builder.py`): Converts nodes to intermediate representation
3. **Bundler** (`bundler.py`): Generates framework-specific code files

### Adding New Target Frameworks
1. Extend `ast_builder.py` with new AST node types
2. Add framework templates to `bundler.py`
3. Update `GenerateRequest` model to accept framework parameter
4. Test with comprehensive blueprint covering all node types