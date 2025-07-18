# Energy Efficiency Retrofit Calculator

A comprehensive web application for calculating energy savings from residential retrofit projects, featuring 13 technology calculators compliant with Iowa Technical Reference Manual (TRM) specifications.

## Features

### Technology Calculators
- **ENERGY STAR® Replacement Windows**: Calculate energy savings from window upgrades
- **ENERGY STAR® Replacement Doors**: Evaluate door efficiency improvements  
- **Air Sealing**: Assess air leakage reduction benefits (10% improvement)
- **Attic Insulation**: Calculate insulation upgrade savings (R-55 minimum)
- **DWHR - Gas/Electric**: Drain Water Heat Recovery systems with 25% minimum recovery
- **Heat Pump Water Heater - Gas/Electric**: ENERGY STAR® certified units (EF 2.0 minimum)
- **Heat Recovery Ventilator**: HVI certified HRV with 75%+ efficiency
- **Smart Thermostat**: ENERGY STAR® certified smart thermostats
- **Ground Source Heat Pump**: ENERGY STAR® GSHP with IGSHPA installer
- **DMSHP**: Ductless Mini-Split Heat Pump (SEER 15, COP 2.72/HSPF 8.2)
- **Solar PV**: Solar photovoltaic systems (1 kW+ capacity requirement)

### Key Features
- **Project Management**: Complete client information collection and project tracking
- **Real-time Calculations**: Iowa TRM-compliant formulas with instant results
- **Data Persistence**: Automatic project saving with cross-calculator navigation
- **Word Document Export**: Professional reports with EERP technology specifications
- **Audio Recording**: Conversation recording and playback for client meetings
- **Professional Dashboard**: Project overview with completion tracking

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** with shadcn/ui components
- **TanStack Query** for server state management
- **React Hook Form** with Zod validation
- **Wouter** for lightweight routing

### Backend
- **Node.js** with Express.js
- **TypeScript** throughout the stack
- **Drizzle ORM** for type-safe database operations
- **PostgreSQL** database (Neon serverless compatible)
- **RESTful API** design with JSON responses

## Deployment

### Environment Variables
Set the following environment variable:

```bash
DATABASE_URL=postgresql://username:password@hostname:port/database_name
```

### Render Deployment
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set build command: `npm install && npm run build`
4. Set start command: `npm start`
5. Add your Neon database URL as `DATABASE_URL` environment variable

### Database Setup
1. Create a Neon database
2. Add the connection string to your environment variables
3. Run database migrations: `npm run db:push`

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database URL

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Production Build
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
├── client/          # React frontend application
├── server/          # Express.js backend server
├── shared/          # Shared types and schemas
├── migrations/      # Database migration files
└── dist/           # Build output directory
```

## API Endpoints

- `GET /api/projects` - List all projects
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PATCH /api/projects/:id` - Update project
- `GET /api/projects/:id/export` - Export project as Word document
- `GET/POST /api/projects/:id/audio` - Audio recording management

## Energy Calculations

All calculators implement Iowa Technical Reference Manual formulas:

- **Gas Savings**: `((Ubaseline - Uupgrade) × Area × HDD × 24 × ADJ × kWhtoGJ × WhTokWh) / HeatingEfficiency`
- **Electricity Savings**: Similar formula incorporating cooling degree days and AC percentage
- **Technology-specific formulas**: Each calculator includes specialized formulas per Iowa TRM

## License

MIT License - See LICENSE file for details.

## Support

For technical support or questions about the Energy Efficiency Retrofits Program (EERP), please contact your program administrator.