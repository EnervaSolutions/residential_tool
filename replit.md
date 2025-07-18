# Window Replacement Calculator

## Overview

This is a full-stack web application for calculating energy savings from window replacement projects. The application allows users to input various window and system parameters to calculate gas and electricity savings from upgrading to more efficient windows.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Tailwind CSS for styling with shadcn/ui components
- **State Management**: React Hook Form for form handling, TanStack Query for server state
- **Router**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon serverless)
- **API Pattern**: RESTful API with JSON responses

### Project Structure
```
├── client/          # React frontend application
├── server/          # Express.js backend server
├── shared/          # Shared types and schemas
├── migrations/      # Database migration files
└── dist/           # Build output directory
```

## Key Components

### Database Schema
- **Users Table**: Basic user authentication (username, password)
- **Window Calculations Table**: Stores calculation parameters and results
  - Window properties (U-values, area)
  - Climate data (heating/cooling degree days)
  - System efficiencies
  - Conversion factors
  - Calculated savings results

### API Endpoints
- `GET /api/calculations` - Retrieve all calculations
- `GET /api/calculations/:id` - Get specific calculation
- `POST /api/calculations` - Create new calculation
- Standard CRUD operations for window calculations

### Frontend Components
- **WindowReplacementCalculator**: Main calculator interface
- **CalculationHistory**: Display and load previous calculations
- **SaveCalculationDialog**: Save calculations with name and notes
- **Form Components**: Shadcn/ui components for consistent UI

## Data Flow

1. **User Input**: Form captures calculation parameters through React Hook Form
2. **Real-time Calculation**: Client-side calculation engine processes inputs immediately
3. **Data Persistence**: Users can save calculations to PostgreSQL via REST API
4. **History Management**: TanStack Query handles caching and synchronization of saved calculations

### Calculation Logic
The application implements the Iowa TRM formula for window replacement energy savings:
- **Gas Savings**: `((Ubaseline - Uupgrade) * AreaWindow * HDD * 24 * ADJwindow * kWhtoGJ * WhTokWh) / HeatingEfficiency`
- **Electricity Savings**: Similar formula incorporating cooling degree days and air conditioning percentage

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **react-hook-form**: Form handling and validation
- **zod**: Runtime type validation

### UI Components
- **@radix-ui/***: Accessible UI primitives
- **tailwindcss**: Utility-first CSS framework
- **shadcn/ui**: Pre-built component library
- **lucide-react**: Icon library

## Deployment Strategy

### Development
- **Dev Server**: `npm run dev` starts both frontend (Vite) and backend (tsx)
- **Hot Reload**: Vite HMR for frontend, tsx for backend TypeScript execution
- **Database**: Drizzle Kit for schema management and migrations

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Database**: Uses connection pooling with Neon serverless PostgreSQL

### Environment Configuration
- **DATABASE_URL**: PostgreSQL connection string (required)
- **NODE_ENV**: Environment detection for development/production features
- **REPL_ID**: Replit-specific configuration for development tools

The application is designed to be deployed on platforms like Replit, Vercel, or any Node.js hosting service with PostgreSQL support.

## Recent Changes

### July 17, 2025
- **Door Replacement Calculator Implementation**: Created complete Door Replacement calculator as second technology
  - Added database schema for door calculations with proper field mapping  
  - Implemented Iowa TRM-compliant formulas for heating and cooling energy savings
  - Fixed calculation accuracy issues with proper heating efficiency handling (decimal vs percentage)
  - Added navigation between Windows and Doors calculators
  - Resolved infinite render loop in form calculations
  - Verified calculation accuracy against Excel reference values:
    - Gas Savings: ~0.493 GJ (matches expected ~0.49)
    - Electricity Savings: ~0.00375 GJ (matches expected ~0.0037)

- **Air Sealing Calculator Implementation**: Created complete Air Sealing calculator as third technology
  - Added database schema for air sealing calculations with exact field mapping from user spreadsheet
  - Implemented Iowa TRM-compliant formula for heating energy savings
  - **Fixed Temperature Difference as Input Field**: Changed from calculated field to direct input parameter
    - Removed thermostat set point and outside temperature fields
    - Temperature difference now accepts direct input (default: 58.7°F)
    - Updated database schema and calculation logic accordingly
  - Corrected calculation formula to match user's exact specification:
    - (1.08 × Volume Rate × Temperature Difference ÷ (Heating Efficiency × BTU Conversion)) × Annual Hours × Savings Fraction × GJ Conversion
  - Current calculation produces 21.89 GJ result with default values
  - Added vertical sidebar navigation for all three calculators (Windows, Doors, Air Sealing)

### July 18, 2025
- **Simplified Calculator Save Functionality**: Streamlined save system based on user requirements
  - **Removed save dialogs and naming requirements**: All calculators now save directly to the project without dialogs
  - **Automatic data persistence**: All inputs and outputs automatically save within the project context
  - **Cross-tab navigation persistence**: Calculator data persists when navigating between technology tabs
  - **Project dashboard status tracking**: Shows completion badges and saved calculation results for each technology
  - **Simplified "Save to Project" buttons**: Replaced complex save dialogs with single-action save buttons
  - **Removed calculation history features**: Eliminated "recent calculations" and calculation naming across all four calculators
  - **Updated export functionality**: Word documents now include saved calculation results in third column when data exists

- **Complete 13-Technology Calculator Suite Implementation**: Expanded beyond original scope with comprehensive calculator platform
  - **DWHR - Gas Calculator**: Drain Water Heat Recovery with Natural Gas water heater efficiency calculations
  - **DWHR - Electric Calculator**: Drain Water Heat Recovery with Electric water heater efficiency calculations  
  - **Heat Pump Water Heater - Gas Calculator**: Heat pump replacing gas water heater with energy factor comparisons
  - **Heat Pump Water Heater - Electric Calculator**: Heat pump replacing electric water heater (EF 0.9 vs 2.0)
  - **Heat Recovery Ventilator Calculator**: HRV with 75% sensible recovery efficiency for gas heated homes
  - **Smart Thermostat Calculator**: Smart programmable thermostat for natural gas space heating (8-year lifetime)
  - **Ground Source Heat Pump Calculator**: GSHP with heating COP 4.18 and cooling EER 22.43 (15-year lifetime)
  - **DMSHP Calculator**: Ductless mini-split heat pump replacing furnace with SEER 15, COP 2.72/HSPF 8.2
  - **Solar PV Calculator**: 1 kW solar photovoltaic system with 1086 kWh/kW annual production
  - **Consistent Iowa TRM Compliance**: All calculators implement proper technical reference manual formulas
  - **Unified Data Architecture**: All 13 calculators integrate with project save/load system
  - **Complete Navigation System**: Sidebar and dashboard navigation covers all technology calculators
  - **Standardized Output Formatting**: 6 decimal place precision maintained across all energy savings results

- **Audio Recording Feature Implementation**: Added comprehensive conversation recording system
  - **Database Integration**: Added audio recordings table with project association, metadata, and base64 audio storage
  - **Recording Interface**: Built full-featured audio recorder with microphone capture, real-time duration tracking
  - **Playback Controls**: Implemented audio playback, pause, and stop functionality within the application
  - **Save Management**: Created naming and description system for organizing project conversations
  - **Download Feature**: Added capability to download recordings as audio files for external use
  - **Project Integration**: Seamlessly integrated with project dashboard and navigation system
  - **Browser Compatibility**: Uses Web Audio API for cross-browser microphone access and recording

- **Enhanced Word Export System**: Updated report generation with complete EERP technology specifications
  - **Comprehensive Technology Database**: Added all 13 official EERP technology specifications from program documentation
  - **Detailed Requirements**: Each technology includes specific certification, efficiency, and installation requirements
  - **Complete Calculations Integration**: All calculator results properly formatted and included in exported reports
  - **Professional Documentation**: Generated reports include project details, technology specs, and energy savings calculations

- **Production-Ready Deployment Configuration**: Completed comprehensive deployment setup for Render with Neon database
  - **Fixed JSX Structure Issues**: Resolved syntax errors in Heat Pump Water Heater and DMSHP calculators
  - **Standardized Layout**: All 13 calculators now have consistent header placement, save button locations, and grid structures
  - **Production Files**: Created render.yaml, Dockerfile, .env.example, and comprehensive README.md
  - **Database Environment**: Configured for Neon serverless PostgreSQL with proper connection string handling
  - **Build Pipeline**: Optimized Vite frontend build and esbuild server bundling for production deployment
  - **Documentation**: Complete deployment instructions with environment variable setup and database configuration