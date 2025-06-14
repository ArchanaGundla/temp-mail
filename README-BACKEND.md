
# TempMail Backend Setup

This backend server provides real IMAP email functionality for the TempMail Pro application.

## Prerequisites

1. Node.js (v14 or higher)
2. npm or yarn
3. Access to your IMAP server (imap.trueelement.in)

## Setup Instructions

### 1. Install Backend Dependencies

```bash
cd server
npm install
```

### 2. Update Configuration

Edit `server/server.js` and update the IMAP configuration with your credentials:

```javascript
const IMAP_CONFIG = {
  user: 'support@trueelement.in',
  password: 'your-password',
  host: 'imap.trueelement.in',
  port: 993,
  tls: true
};
```

### 3. Start the Backend Server

```bash
# For development (with auto-restart)
npm run dev

# For production
npm start
```

The server will start on `http://localhost:3001`

### 4. Start the React Frontend

In a separate terminal, start the React application:

```bash
npm run dev
```

## API Endpoints

- `POST /api/create-temp-email` - Generate a new temporary email
- `GET /api/emails/:emailAddress` - Fetch emails for a specific address
- `GET /api/health` - Check server health

## Features

- Real IMAP email fetching from your domain
- Temporary email generation with auto-expiration (10 minutes)
- CORS enabled for React frontend
- Email parsing with HTML/text content
- Automatic cleanup of expired emails

## Configuration Options

- `TEMP_EMAIL_LIFETIME`: Email expiration time (default: 10 minutes)
- `TEMP_EMAIL_DOMAIN`: Your domain for generating emails
- IMAP settings for your email server

## Troubleshooting

1. **Connection Issues**: Verify IMAP server settings and credentials
2. **CORS Errors**: Ensure the backend is running on port 3001
3. **Email Not Appearing**: Check that emails are being sent to the correct address
4. **Authentication Errors**: Verify your email password and server settings
