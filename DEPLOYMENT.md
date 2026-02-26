# How to Deploy Arena360 to Vercel

To make your website public (so anyone can see it), follow these steps to deploy to Vercel.

## Prerequisites
1.  **GitHub Account**: You need to upload your code to GitHub first.
2.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com) (free).

## Step 1: Push Code to GitHub
Since you are working locally, you need to initialize Git and push to a repository.

1.  **Initialize Git** (if not already done):
    ```bash
    git init
    git add .
    git commit -m "Initial commit"
    ```
2.  **Create a Repo on GitHub**:
    - Go to [github.com/new](https://github.com/new).
    - Name it `arena360`.
    - Click **Create Repository**.
3.  **Push your code**:
    - Copy the commands shown by GitHub under *"...or push an existing repository..."*:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/arena360.git
    git branch -M main
    git push -u origin main
    ```

## Step 2: Deploy on Vercel
1.  Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2.  Click **Add New...** -> **Project**.
3.  **Import** your `arena360` GitHub repository.
4.  **Configure Project**:
    - Framework Preset: `Next.js` (Default)
    - **Environment Variables** (IMPORTANT!):
      - Expand the "Environment Variables" section.
      - Add `MONGODB_URI` and paste your connection string.
      - Add `STRIPE_SECRET_KEY` (placeholder or real).
      - Add `NEXT_PUBLIC_BASE_URL` (set to your Vercel URL after deploy, or `https://your-project.vercel.app`).
5.  Click **Deploy**.

## Step 3: View on Phone
Once deployed (takes ~1 minute), Vercel will give you a domain like `https://arena360.vercel.app`.
Send that link to your phone!
