# StudyNest

StudyNest is a full-stack real-time study collaboration platform designed for students preparing for GATE, placements, technical interviews, and competitive programming.
You can create rooms, join topic-based rooms, chat, share files, pin messages, save messages, and get notifications.


## What This Project Does

- Login/signup with auth flow
- Public + private rooms
- Private room join with room code
- Real-time chat with Socket.IO
- File sharing (image/pdf/txt)
- Pinned messages
- Saved messages
- Notification center
- User profiles with activity section
- Mobile-friendly chat UI improvements
- Redis usage for online presence and room cache

## Tech Stack

Frontend:
- React + Vite
- React Router
- Axios
- Socket.IO client

Backend:
- Node.js + Express
- MongoDB + Mongoose
- Socket.IO
- JWT auth
- Cloudinary (file upload)
- Upstash Redis

## Project Structure

- client -> frontend app
- server -> backend API + sockets
- README.md -> full project docs

## Environment Variables

Create a .env file inside server folder.

Use values like this:

```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

UPSTASH_REDIS_URL=your_upstash_redis_url
UPSTASH_REDIS_TOKEN=your_upstash_redis_token

GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
```

## Setup (Local)

Install dependencies:

```bash
# root (already has package-lock, mostly redis dep)
npm install

# frontend
cd client
npm install

# backend
cd ../server
npm install
```

Run backend:

```bash
cd server
npm run dev
```

Run frontend:

```bash
cd client
npm run dev
```

Open app:
- Frontend: http://localhost:5173
- Backend health: http://localhost:5000/api/health

## Main API Areas

Auth:
- /api/auth
- /auth/google

Rooms:
- /api/rooms
- join/leave/private join

Messages:
- /api/messages/:roomId
- upload/save/pin/report

Users:
- /api/users
- /api/users/me/rooms

Notifications:
- /api/notifications

## Socket Features

- Room join/leave events
- Live message receive
- Typing indicators
- Online users in room
- Presence tracking via Redis

## Performance + UX Updates Done

- My Rooms API optimized (lighter payload)
- Redis cache added for paginated room list
- Cache invalidation added on join/leave/favorite/remove
- Rooms API pagination support
- Chat now loads recent messages first and paginates older on scroll
- Day/date separators added in chat (shown once per day)
- Mobile chat input behavior improved (send button flow)
- Mobile viewport/safe-area handling improved
- Explore/Saved/Notifications now cached client-side to avoid reload flash when navigating back

## Deploy Notes

Important:
- CLIENT_URL in backend must be your deployed frontend URL
- Frontend API base URL must point to deployed backend URL (not localhost)

If frontend is on Vercel and backend is somewhere else, both must be configured for CORS correctly.

## Common Problems

1) CORS error
- Check CLIENT_URL in backend env
- Check frontend API URL env

2) Redis cache JSON error
- Fixed in code by handling both string/object cache formats

3) Mobile URL bar overlap
- Fixed with safe-area + viewport handling

4) Slow room reload when returning from chat
- Fixed by server + client caching and reduced payload work

## Future Improvements (Optional)

- Add full text index search for messages
- Add refresh-token based auth
- Add admin moderation dashboard
- Add tests (unit + integration)
- Add CI pipeline


