# Quick Start Guide

## 🚀 Get Started in 3 Steps

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Your Discord Token
⚠️ **Important**: Never share your Discord token!

**Option A: Environment Variable (Recommended)**
```bash
export DISCORD_TOKEN="your_discord_token_here"
```

**Option B: Create a .env file**
Create a file named `.env` in the project root:
```
DISCORD_TOKEN=your_discord_token_here
PORT=10021
```

### Step 3: Start the Server
```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

### Step 4: Open the Dashboard
Open your browser and go to:
```
http://localhost:10021
```

## 🔑 How to Get Your Discord Token

1. Open Discord in your web browser (not the desktop app)
2. Press `F12` to open Developer Tools
3. Go to the `Network` tab
4. Type any message in any channel
5. Look for requests starting with "messages"
6. In the request headers, find `authorization` - that's your token!

⚠️ **Security Warning**: 
- Never share your token with anyone
- Don't commit it to version control
- Using selfbots violates Discord's Terms of Service

## 📱 Available Features

Once logged in, you can:
- ✅ View and navigate all your servers
- ✅ Send, edit, and delete messages
- ✅ Upload files and images
- ✅ Manage friends and DMs
- ✅ Join voice channels
- ✅ Set custom status and Rich Presence
- ✅ Customize your profile (bio, avatar, banner)
- ✅ Join HypeSquad houses
- ✅ And much more!

## 🛠️ Troubleshooting

### Server won't start
- Make sure you've run `npm install`
- Check that Node.js version is 16.0.0 or higher: `node --version`
- Make sure port 10021 is not in use

### Can't login to Discord
- Verify your token is correct
- Make sure the token is from a user account (not a bot)
- Check that your account isn't locked or restricted

### Features not working
- Some features require Discord Nitro
- Some features may be restricted based on permissions
- Voice features are limited in selfbots

## ⚠️ Legal Notice

This project is for **educational purposes only**. Using selfbots violates Discord's Terms of Service and may result in account suspension or ban. Use at your own risk.

## 📚 Need More Help?

Check out the full [README.md](README.md) for detailed documentation.
