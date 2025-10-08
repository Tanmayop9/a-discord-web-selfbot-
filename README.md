# Discord Web Selfbot Dashboard

A comprehensive web-based dashboard for Discord selfbots using discord.js-selfbot-v13. This project provides a user-friendly interface to manage your Discord account with advanced features.

## ⚠️ Warning

**Using selfbots violates Discord's Terms of Service. This project is for educational purposes only. Use at your own risk. Your account may be suspended or banned.**

## ✨ Features

### Core Features
- 🏰 **Server Management**: View, navigate, and leave servers
- 💬 **Messaging**: Send, edit, and delete messages
- 📎 **File Uploads**: Upload images and files to channels
- 👥 **Friend Management**: Add, remove, accept, and block users
- 🔊 **Voice Channels**: Join/leave voice channels with mute/deafen controls
- 📝 **Direct Messages**: Access and manage DMs and group DMs

### Ultra Advanced Features (Original)
- 📊 **Analytics Dashboard**: Comprehensive message statistics and activity tracking
- 🤖 **Auto-Responder System**: Create automated responses with custom triggers and match types
- ⏰ **Message Scheduler**: Schedule messages for future delivery with date/time picker
- 🌙 **AFK Mode**: Automatically respond to mentions when away with custom messages
- 🎯 **Message Sniper**: Capture and view deleted/edited messages in real-time
- ⚡ **Custom Commands**: Create command shortcuts that auto-delete and replace with responses
- 🎨 **Advanced Embed Builder**: Visual embed creator with live preview
- 📬 **Mass DM System**: Send bulk DMs with rate limiting protection
- 🔐 **Token Checker**: Validate and check Discord token information
- ⚔️ **Slash Commands Viewer**: View all available application commands
- 📜 **Activity Logger**: Comprehensive logging of all Discord interactions

### NEW Ultra Advanced Features
- 📝 **Message Templates**: Save and reuse frequently used messages with categories
- 🔍 **Advanced Search**: Search messages across all servers and channels with filters
- 👥 **Multi-Account Manager**: Manage and switch between multiple Discord tokens
- 🛡️ **Raid Protection**: Anti-raid tools with configurable thresholds and actions
- 💾 **Backup Manager**: Create, restore, and manage settings backups
- 📊 **Server Statistics**: Detailed server analytics with boost tracking and growth metrics
- 🎨 **Theme Switcher**: 5 beautiful themes (Dark, Light, AMOLED, Purple, Nord)
- 🔔 **Notification Center**: Real-time notification system
- ⚡ **Floating Action Button**: Quick access menu to all features
- 🎭 **Glassmorphism UI**: Modern glass effect with smooth animations
- 🌈 **Enhanced Cards**: Gradient cards with hover effects and animations

### Advanced Features
- ✨ **Custom Status**: Set custom status with emoji and expiration
- 🎮 **Rich Presence (RPC)**: Create custom Rich Presence activities
- 🎵 **Spotify RPC**: Display fake Spotify activity
- 🏠 **HypeSquad**: Join HypeSquad houses (Bravery, Brilliance, Balance)
- 🎨 **Profile Customization**: Update bio, avatar, banner, and accent color
- 🔗 **Invite Management**: View and create server invites
- 🎭 **Roles & Emojis**: View server roles and emojis
- 📊 **User Settings**: Configure Discord settings via web interface
- 📝 **User Notes**: Add and manage notes on users
- 🪝 **Webhooks**: View and manage server webhooks
- 💎 **Nitro Features**: Access to Nitro-exclusive customization options

### Real-time Features
- 🔄 **WebSocket Support**: Real-time message updates via Socket.IO
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🌙 **Discord-like UI**: Familiar Discord-themed interface with modern enhancements

## 🚀 Installation

### Prerequisites
- Node.js 16.0.0 or higher
- A Discord user account token
- (Optional) Docker for containerized deployment

### Setup

#### Method 1: Standard Installation

1. Clone the repository:
```bash
git clone https://github.com/Tanmayop9/a-discord-web-selfbot-.git
cd a-discord-web-selfbot-
```

2. Install dependencies:
```bash
npm install
```

3. Set your Discord token:
```bash
export DISCORD_TOKEN="your_discord_token_here"
```

Or create a `.env` file:
```
DISCORD_TOKEN=your_discord_token_here
PORT=10021
```

4. Start the server:
```bash
npm start
```

For development with auto-restart:
```bash
npm run dev
```

5. Open your browser and navigate to:
```
http://localhost:10021
```

#### Method 2: Docker Installation

1. Clone the repository:
```bash
git clone https://github.com/Tanmayop9/a-discord-web-selfbot-.git
cd a-discord-web-selfbot-
```

2. Create a `.env` file with your token:
```
DISCORD_TOKEN=your_discord_token_here
```

3. Run with Docker Compose:
```bash
docker-compose up -d
```

4. Open your browser and navigate to:
```
http://localhost:10021
```

To view logs:
```bash
docker-compose logs -f
```

To stop:
```bash
docker-compose down
```

## 🔑 Getting Your Discord Token

⚠️ **Never share your token with anyone!**

1. Open Discord in your browser (not the desktop app)
2. Press `F12` to open Developer Tools
3. Go to the `Network` tab
4. Type a message in any channel
5. Look for requests starting with "messages"
6. In the request headers, find `authorization` - that's your token

## 📖 Usage

### Dashboard
The main dashboard shows:
- Account statistics (servers, friends, DMs)
- Quick status controls
- Custom status editor
- Rich Presence (RPC) editor

### Servers
- View all servers you're in
- Click on a server to see channels, roles, and emojis
- Leave servers
- Create invites

### Channels
- View channel messages
- Send text messages
- Upload files
- Edit/delete your messages
- Add reactions

### Friends
- View all friends with their status
- Send friend requests
- Accept/decline friend requests
- Remove friends
- Block/unblock users

### Voice
- View all available voice channels
- Join/leave voice channels
- Mute/unmute yourself
- Deafen/undeafen yourself

### Profile
- View account information
- Update bio
- Change avatar and banner (Nitro required for banner)
- Set accent color (Nitro required)
- Join HypeSquad houses

### Settings
- Configure Discord settings
- Theme preferences
- Language settings
- Display options

## 🛠️ Available Routes

### Main Routes
- `/` - Dashboard
- `/servers` - Server list
- `/server/:id` - Server details
- `/channel/:serverId/:channelId` - Channel messages
- `/dms` - Direct messages
- `/friends` - Friends management
- `/voice` - Voice channels
- `/user-info` - User profile
- `/settings` - User settings

### Ultra Advanced Routes
- `/analytics` - Analytics dashboard with message statistics
- `/auto-responder` - Auto-responder management
- `/scheduler` - Message scheduler
- `/afk` - AFK mode configuration
- `/sniper` - Deleted/edited message viewer
- `/custom-commands` - Custom command shortcuts
- `/embed-builder` - Visual embed creator
- `/mass-dm` - Mass DM sender
- `/token-checker` - Token validator
- `/slash-commands` - Slash commands viewer
- `/activity-logs` - Activity logger

### Classic Routes
- `/invites` - Server invites
- `/applications` - User applications
- `/billing` - Billing information
- `/webhooks/:guildId` - Server webhooks
- `/notes` - User notes

### API Endpoints
- `POST /send-message` - Send a message
- `POST /send-embed` - Send an embed
- `POST /edit-message` - Edit a message
- `POST /delete-message` - Delete a message
- `POST /add-reaction` - Add a reaction
- `POST /update-status` - Update online status
- `POST /update-custom-status` - Update custom status
- `POST /update-rpc` - Update Rich Presence
- `POST /update-spotify` - Update Spotify RPC
- `POST /clear-activities` - Clear all activities

### Ultra Advanced API Endpoints
- `POST /auto-responder/add` - Add auto-responder
- `POST /auto-responder/toggle` - Toggle auto-responder
- `POST /auto-responder/delete` - Delete auto-responder
- `POST /scheduler/add` - Schedule message
- `POST /scheduler/delete` - Cancel scheduled message
- `POST /afk/toggle` - Toggle AFK mode
- `POST /custom-commands/add` - Add custom command
- `POST /custom-commands/delete` - Delete custom command
- `POST /embed-builder/send` - Send custom embed
- `POST /mass-dm/send` - Send mass DM
- `POST /token-checker/validate` - Validate token
- `POST /activity-logs/clear` - Clear activity logs
- `GET /backup/:guildId` - Backup server structure

### Classic API Endpoints
- `POST /send-friend-request` - Send friend request
- `POST /accept-friend-request` - Accept friend request
- `POST /remove-friend` - Remove friend
- `POST /block-user` - Block user
- `POST /unblock-user` - Unblock user
- `POST /join-voice` - Join voice channel
- `POST /leave-voice` - Leave voice channel
- `POST /voice-mute` - Toggle mute
- `POST /voice-deafen` - Toggle deafen
- `POST /leave-server` - Leave server
- `POST /create-invite` - Create invite
- `POST /update-bio` - Update bio
- `POST /update-banner` - Update banner
- `POST /update-accent-color` - Update accent color
- `POST /update-avatar` - Update avatar
- `POST /update-hypesquad` - Join HypeSquad house
- `POST /update-settings` - Update Discord settings
- `POST /set-note` - Set user note
- `POST /create-webhook` - Create webhook
- `POST /delete-webhook` - Delete webhook

## 🎨 Customization

### Styling
The UI uses Discord's color scheme. You can modify `/public/css/style.css` to customize colors:

```css
:root {
  --bg-primary: #36393f;
  --bg-secondary: #2f3136;
  --bg-tertiary: #202225;
  --accent: #5865f2;
  /* ... more colors */
}
```

### Port Configuration
Change the port by setting the `PORT` environment variable:
```bash
export PORT=3000
```

## 🔒 Security

- Never commit your Discord token to version control
- Use environment variables for sensitive data
- Don't share your token with anyone
- Consider using a separate Discord account for testing
- Be aware that selfbots can lead to account termination

## 📋 Requirements

### Dependencies
- `discord.js-selfbot-v13`: ^3.2.0
- `express`: ^4.18.2
- `body-parser`: ^1.20.2
- `cookie-parser`: ^1.4.6
- `ejs`: ^3.1.9
- `multer`: ^1.4.5-lts.1
- `socket.io`: ^4.6.1

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚖️ Legal Disclaimer

This project is for educational purposes only. The developers are not responsible for any misuse of this software. Using selfbots violates Discord's Terms of Service and may result in account termination. Use at your own risk.

## 🙏 Acknowledgments

- [discord.js-selfbot-v13](https://github.com/aiko-chan-ai/discord.js-selfbot-v13) - Discord selfbot library
- Discord - For the amazing platform
- All contributors to this project

## 📞 Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Remember: This is for educational purposes only. Using selfbots violates Discord's ToS!**
