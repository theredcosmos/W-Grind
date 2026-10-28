// Vercel serverless entry: every /api/* request (see vercel.json rewrites) is handled by the
// Express app in server/. Deploying from the repository root serves the website and the API
// from one address.
export { default } from '../server/index.js';
