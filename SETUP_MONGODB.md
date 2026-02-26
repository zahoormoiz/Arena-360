# MongoDB Atlas Setup Guide

Follow these steps to create a free MongoDB database and get your "Connection String" for "Live Mode".

## 1. Create an Account & Cluster
1.  Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2.  **Sign up** (you can use your Google account).
3.  After logging in, you might be asked to create a "Project". Name it `Arena360`.
4.  Click **Build a Database**.
5.  Select **M0 Sandbox** (Free Tier).
6.  Choose a provider/region close to you (e.g., AWS / N. Virginia or Mumbai).
7.  Click **Create Cluster**.

## 2. Security Setup (Crucial!)
You cannot connect without these two steps:

### A. Create a Database User
1.  Go to **Database Access** (left sidebar).
2.  Click **Add New Database User**.
3.  **Authentication Method**: Password.
4.  **Username**: `admin` (or generic).
5.  **Password**: Create a strong password (alphanumeric). **COPY THIS NOW**. You will need it later.
6.  **Built-in Role**: "Atlas Admin" or "Read and write to any database".
7.  Click **Add User**.

### B. Network Access (IP Whitelist)
1.  Go to **Network Access** (left sidebar).
2.  Click **Add IP Address**.
3.  Click **Allow Access from Anywhere** (0.0.0.0/0).
    *   *Note: For production, you'd limit this, but for this dev stage, this prevents connection errors.*
4.  Click **Confirm**.

## 3. Get Your Connection String
1.  Go back to **Database** (left sidebar).
2.  Click the **Connect** button on your Cluster card.
3.  Select **Drivers**.
4.  **Copy the connection string**. It looks like this:
    ```
    mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
    ```

## 4. Connect Arena360
1.  Open your project's `.env.local` file.
2.  Paste the string you copied into `MONGODB_URI`.
3.  **Replace `<password>`** with the actual password you created in Step 2A.
4.  Restart your app (`npm run dev`).

Done! Your app is now LIVE.
