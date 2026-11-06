# VideoTube API

Backend for VideoTube. Full documentation (architecture, API reference, setup, testing, deployment) lives in the
[root README](../README.md). Interactive API docs are served at `http://localhost:8000/api-docs` when the server runs.

```bash
cp .env.example .env   # fill in MongoDB + Cloudinary credentials
npm install
npm run dev            # http://localhost:8000
npm test               # integration tests against an in-memory MongoDB
```
