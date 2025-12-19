# CANFAR Science Portal

A modern web application providing a user interface for the [CANFAR](https://www.canfar.net/) (Canadian Advanced Network for Astronomical Research) platform. Science Portal enables researchers to access and manage JupyterLab notebooks, CARTA, Desktop (VNC), and other interactive sessions backed by CANFAR resources.

Platform load information is available, including current CPU usage and counts of running instances.

## Description

This CANFAR service provides the ability to access and manage Jupyter notebook, desktop (VNC), and CARTA sessions that back onto CANFAR resources. Using container images and current system resource values (context) provided by [Skaha](https://ws-uv.canfar.net/skaha), you can launch and manage sessions using the container image you select. Contextualization is provided for some session types, allowing the amount of memory, number of cores, and GPU resources you designate to power your session.

## Features

- **Session Management** - Launch, monitor, renew, and delete computational sessions
- **Container Applications** - Access JupyterLab notebooks, CARTA, Desktop (VNC), and other research tools
- **Resource Selection** - Configure memory, CPU cores, and GPU resources with interactive controls
- **Platform Monitoring** - Real-time metrics for platform load and resource usage
- **Storage Management** - View and manage user storage quota
- **Session Logs & Events** - View logs and events for running sessions
- **Dual Authentication** - Supports both CANFAR and OIDC authentication modes
- **Responsive Design** - Mobile-friendly interface with light/dark theme support

## Endpoint Locations

All endpoints require authentication with CANFAR, and authorization to access Skaha resource allocations.

| Service | URL |
|---------|-----|
| Science Portal | https://www.canfar.net/science-portal |
| Skaha Web Service | https://ws-uv.canfar.net/skaha |

### OIDC Configuration

The Science Portal UI is configurable to work with an OpenID Connect provider. See the `oidc` settings in the [org.opencadc.science-portal.properties](./org.opencadc.science-portal.properties) file.

## User Workflows

All workflows assume you are logged in with a CADC account.

### Connecting to Existing Sessions

1. From the main page: https://www.canfar.net/science-portal
2. Science Portal will display any sessions you currently have, including session metadata
3. Clicking on a session card will connect to and forward you to the session

### Launch a New Session

1. From the main page: https://www.canfar.net/science-portal
2. Science Portal will poll for and display any sessions you currently have
3. After the form has loaded, scroll down to access the launch form
4. Select the type of session you want to launch (default is 'notebook')
5. The container image list will be updated for the session type
6. Optionally change the name of the session, and any available context values (memory, cores, or GPU)
7. Select 'Launch'
8. Science Portal will request the session be started
9. The new session will be added to the list at the top of the page

### Delete an Existing Session

1. From the main page: https://www.canfar.net/science-portal
2. Science Portal will display any sessions you currently have
3. Clicking on the trash can icon on a session card will bring up a confirmation box
4. Continue to delete or cancel
5. Science Portal will request the session be deleted, and will remove it from your session list

### Renew Session Time Frame

1. From the main page: https://www.canfar.net/science-portal
2. Science Portal will display any sessions you currently have
3. Click on the clock icon on a session card
4. Science Portal will request the session time frame be renewed (this is a 4-day extension from the time the request is submitted)
5. Session metadata will be refreshed on the portal

### View and Refresh Platform Load

1. From the main page: https://www.canfar.net/science-portal
2. The Platform Load panel displays current resource usage information
3. Click the refresh button to refresh values
4. A timestamp indicates the time of the last refresh

### View Session Logs and Events

1. From the main page: https://www.canfar.net/science-portal
2. In the Active Sessions panel, each Session Card has buttons for events (flag) and logs (file)
3. Click on either button
4. A new tab is opened displaying the output from the Skaha service with available event list or logs

## Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript 5
- **UI:** Material-UI 7, Tailwind CSS 4
- **State Management:** Zustand, TanStack React Query
- **Authentication:** NextAuth 5 (CANFAR/OIDC modes)
- **Runtime:** Node.js 22+

## Building

Dependencies for building are:

- Node.js 22.11 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone git@github.com:opencadc/science-portal.git
cd science-portal

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local
```

### Environment Variables

Configure the following environment variables in `.env.local`:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_LOGIN_API` | Authentication API endpoint |
| `NEXT_PUBLIC_SKAHA_API` | Session/compute API endpoint |
| `NEXT_PUBLIC_API_TIMEOUT` | API request timeout (default: 30000ms) |
| `AUTH_SECRET` | NextAuth secret key |
| `NEXT_USE_CANFAR` | Toggle between CANFAR/OIDC auth mode |

### Development

```bash
# Start development server with Turbopack
npm run dev

# Run linting
npm run lint

# Format code
npm run format
```

The application will be available at `http://localhost:3000`.

### Production Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── app/                  # Next.js App Router
│   ├── api/              # API routes (auth, sessions, storage)
│   ├── components/       # UI components (Material-UI based)
│   ├── science-portal/   # Main portal pages
│   ├── providers/        # React context providers
│   └── contexts/         # Shared state contexts
├── lib/                  # Shared libraries
│   ├── api/              # API client functions
│   ├── auth/             # Authentication helpers
│   ├── config/           # Configuration files
│   ├── hooks/            # Custom React hooks
│   ├── stores/           # Zustand state stores
│   └── utils/            # Utility functions
└── types/                # TypeScript definitions
```

## Deployment

### Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

### Kubernetes

Helm charts are provided for Kubernetes deployment. See the [Helm documentation](./helm/README.md) for detailed instructions.

```bash
# Quick start with Helm
helm install science-portal ./helm/science-portal
```

For deployment mode details (CANFAR vs OIDC), refer to [DEPLOYMENT-MODES.md](./helm/DEPLOYMENT-MODES.md).

## Documentation

- [Development Guide](./DEVELOPMENT_GUIDE.md) - Local development setup and testing
- [Helm Deployment](./helm/README.md) - Kubernetes deployment with Helm
- [Kubernetes Guide](./helm/KUBERNETES-DEPLOYMENT-GUIDE.md) - Complete K8s deployment instructions

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is part of the [OpenCADC](https://github.com/opencadc) initiative and is licensed under GPL-3.0.
