# Feature Showcase

This document provides an overview of all features available in Discord Web Selfbot.

## 📊 Dashboard Features

### Status Management
- **Online Status Control**: Switch between Online, Idle, DND, and Invisible
- **Custom Status**: Set emoji and text with optional expiration time
- **Rich Presence (RPC)**: Create custom gaming activities with:
  - Application name and details
  - Activity state
  - Large and small images with hover text
  - Custom buttons (up to 2)
  - Timestamps for elapsed time
- **Spotify RPC**: Display fake Spotify "Now Playing" activity

### Account Statistics
- Total server count
- Friend count
- Active DM count
- Real-time updates

## 🏰 Server Management

### Server Overview
- View all servers with icons and member counts
- Server badges (Verified, Partnered, Owner crown)
- Server descriptions
- Banner display (if available)

### Server Details
- **Channels**: Browse all text, voice, and announcement channels
- **Roles**: View role hierarchy with colors and permissions
- **Emojis**: Browse all server emojis (static and animated)
- **Invites**: Create custom invites with max uses and expiration

### Server Actions
- Leave servers
- Create invite links
- View server webhooks
- Navigate between channels

## 💬 Messaging Features

### Message Management
- **Send Messages**: Type and send text messages
- **Edit Messages**: Edit your own messages
- **Delete Messages**: Delete your own messages
- **File Uploads**: Upload images and files (up to 8MB)
- **Embeds**: Send rich embeds with:
  - Title and description
  - Custom colors
  - Footer text
  - Thumbnail and images
  - Custom fields

### Message Display
- View last 50 messages in channels
- Message timestamps
- Author avatars and usernames
- Attachment previews
- Reaction counts
- Reply references

### Reactions
- Add emoji reactions to messages
- View reaction counts
- See who reacted (including yourself)

## 👥 Friend Management

### Friends List
- View all friends with online status
- See current activities
- Real-time status updates
- Friend avatars

### Friend Actions
- Send friend requests (username#discriminator)
- Accept incoming friend requests
- Decline friend requests
- Remove friends
- Block users
- Unblock users
- View outgoing requests

## 💬 Direct Messages

### DM Features
- View all DM conversations
- Access group DMs
- DM recipient information
- Last message preview
- Navigate to DM channels

## 🔊 Voice Features

### Voice Channels
- View all available voice channels across servers
- See member count and user limits
- Channel type display (Voice/Stage)

### Voice Controls
- Join voice channels
- Leave voice channels
- Self-mute toggle
- Self-deafen toggle
- Current connection status

**Note**: Voice features are limited in selfbots. You can join channels but audio streaming may not work properly.

## 👤 Profile Customization

### User Profile
- View account information:
  - Username and discriminator
  - User ID
  - Email and phone (if available)
  - Verification status
  - 2FA status
  - Nitro type
  - Account creation date

### Profile Editor
- **Bio**: Update profile bio (190 characters)
- **Avatar**: Change avatar via URL
- **Banner**: Set profile banner (Nitro required)
- **Accent Color**: Set profile accent color (Nitro required)
- **Display Name**: Update display name

### HypeSquad Houses
- Join Bravery (Blue) 🔵
- Join Brilliance (Red) 🔴
- Join Balance (Green) 🟢
- Leave current house

## ⚙️ Settings & Configuration

### User Settings
- **Theme**: Dark/Light mode
- **Language**: Multiple language options
- **Message Display**: Compact/Cozy mode
- **Media Settings**:
  - Inline attachments
  - Inline embeds
  - Auto-play GIFs
  - Render embeds
  - Show reactions
  - Animate emoji
- **Privacy Settings**:
  - Display current activity
  - Enable TTS command

## 🔗 Invite Management

### Invite Features
- View all server invites you have permission to see
- Invite details:
  - Invite code and URL
  - Server and channel name
  - Usage statistics (uses/max uses)
  - Expiration date
  - Inviter information
- Copy invite links
- Create new invites

## 🪝 Webhook Management

### Webhook Features
- View all webhooks in servers
- Webhook details:
  - Name and avatar
  - Channel location
  - Webhook URL (with token if available)
- Create new webhooks
- Delete webhooks
- Copy webhook URLs

## 📝 User Notes

### Notes Features
- Add notes to any user
- View all saved notes
- Edit existing notes
- User information with note
- Quick note management

## 🎯 Applications & Billing

### Applications
- View your Discord applications
- Application details and IDs
- Bot token access (if available)

### Billing
- View Nitro subscription type
- Nitro start date
- Premium guild count

**Note**: Full billing information is restricted for security.

## 🔄 Real-Time Features

### WebSocket Updates
- Live message notifications
- Real-time status changes
- Instant friend updates
- Activity broadcasts

### Auto-Refresh
- Message lists auto-scroll
- Status indicators update
- Friend list refreshes
- Activity updates

## 🛡️ Security Features

### Token Protection
- Environment variable support
- .env file configuration
- No token logging
- Secure token storage

### Error Handling
- Graceful error messages
- API error responses
- User-friendly notifications
- Fallback mechanisms

## 📱 Responsive Design

### Device Support
- Desktop optimization
- Tablet compatibility
- Mobile responsive layouts
- Touch-friendly controls

### UI Features
- Discord-themed interface
- Dark mode by default
- Smooth animations
- Hover effects
- Loading indicators

## 🔍 Search & Navigation

### Navigation Features
- Quick server access
- Channel browsing
- Friend search
- DM navigation
- Breadcrumb trails

## 📊 API Endpoints

### Health Check
- `/health` - Server health status
- Uptime monitoring
- Memory usage stats
- Bot ready status

## ⚡ Performance

### Optimization
- Efficient message loading
- Cached server data
- Minimized API calls
- Fast page loads
- Responsive interactions

## 🎨 Customization

### Theme Support
- Custom CSS variables
- Discord color scheme
- Modifiable styles
- Extensible components

## 🚀 Advanced Features

### Coming Soon
- Voice streaming support
- Advanced embed builder
- Bulk message operations
- Server cloning tools
- Automated responses
- Scheduled messages
- Custom commands

## 💡 Tips & Tricks

1. **Status Management**: Use custom status with expiration for temporary messages
2. **Rich Presence**: Create impressive custom activities with buttons
3. **File Uploads**: Share files directly from the web interface
4. **Friend Management**: Keep notes on friends for easy reference
5. **Voice Channels**: Join voice channels for presence without audio
6. **Profile Customization**: Update your profile regularly to keep it fresh
7. **Webhook Management**: Use webhooks for automated messages

## ⚠️ Limitations

- Some features require Discord Nitro
- Voice streaming is limited
- Rate limits apply to all actions
- Selfbots violate Discord ToS
- Account ban risk exists

## 🔗 Useful Links

- [Discord.js Selfbot v13 Docs](https://github.com/aiko-chan-ai/discord.js-selfbot-v13)
- [Discord Developer Portal](https://discord.com/developers/docs)
- [Project Repository](https://github.com/Tanmayop9/a-discord-web-selfbot-)

---

**Remember**: This project is for educational purposes only. Using selfbots violates Discord's Terms of Service!
