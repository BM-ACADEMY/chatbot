# Backend Deployment on Render

Follow these steps to deploy your backend:

1. Create a new "Web Service" on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Select the "Root Directory" as `server`.
4. Build Command: `npm install`
5. Start Command: `npm start`
6. Add the following **Environment Variables** in the Render dashboard:
    - `MONGO_URI`: (Your MongoDB Atlas connection string)
    - `JWT_SECRET`: (A random string)
    - `VAPID_SUBJECT`: (mailto:your-email@example.com)
    - `VAPID_PUBLIC_KEY`: (Your public key from .env)
    - `VAPID_PRIVATE_KEY`: (Your private key from .env)
    - `PORT`: 5000 (Render will usually override this, but it's good practice)

**Note:** Wait for the deployment to finish, copy the Render URL, and use it as `VITE_API_BASE_URL` in your Vercel settings.
