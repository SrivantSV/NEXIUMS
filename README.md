# Nexus AI - Team Collaboration Platform

A comprehensive team collaboration and workspace management system with real-time features.

## Features

- **Team Workspace Management**: Create and manage team workspaces with custom branding
- **Real-Time Collaboration**: WebSocket-based real-time collaboration with operational transformation
- **Role-Based Access Control**: Flexible permission system with custom roles
- **Multi-Channel Notifications**: Email, Slack, and in-app notifications
- **Team Member Management**: Invite, manage, and organize team members
- **Project & Channel Organization**: Organize work into projects and channels
- **Activity Feeds & Analytics**: Track team activity and usage insights
- **Workspace Customization**: Custom branding, settings, and configurations

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Radix UI
- **Real-Time**: WebSockets (ws)
- **Database**: Prisma ORM
- **Notifications**: Nodemailer, Slack Web API

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
src/
├── types/              # TypeScript type definitions
├── lib/                # Core libraries and utilities
│   ├── collaboration/  # Real-time collaboration engine
│   ├── notifications/  # Notification system
│   └── team/          # Team management utilities
├── components/         # React components
│   ├── team/          # Team-related components
│   ├── ui/            # Reusable UI components
│   └── collaboration/ # Collaboration features
├── app/               # Next.js app directory
│   ├── api/           # API routes
│   └── team/          # Team pages
└── prisma/            # Database schema
```

## License

Proprietary - Nexus AI
