# Deploy Vercel

## 1. Backend

- Create a new Vercel project from this repo.
- Set the Root Directory to `backend`.
- Vercel will use `backend/vercel.json`.

### Backend environment variables

- `MONGO_URL`
- `CLIENT_URL` (URL du frontend Vercel, ex: `https://your-frontend-project.vercel.app`)
- `JWT_SECRET`
- `TOKEN_EXPIRE`
- `STRIPE_SECRET_KEY`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## 2. Frontend

- Create a second Vercel project from the same repo.
- Set the Root Directory to `my-frontend-project`.
- Vercel will use `my-frontend-project/vercel.json`.

### Frontend environment variables

- `REACT_APP_API_BASE_URL=https://your-backend-project.vercel.app`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key`

## 3. Important note

- Product and category image uploads now use Cloudinary in production.
