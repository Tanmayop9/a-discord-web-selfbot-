# Discord Guild Migration Tool

## ⚠️ WARNING: USE AT YOUR OWN RISK ⚠️

**This tool is provided for EDUCATIONAL PURPOSES ONLY.**

### Important Legal Notice

Using this tool violates Discord's Terms of Service. Selfbots and user account automation are **strictly prohibited** by Discord. Using this tool may result in:

- **Account suspension or permanent ban**
- **Rate limiting or API restrictions**
- **Legal consequences**
- **Loss of access to all your Discord servers and messages**

**The authors of this tool assume NO responsibility for any consequences of its use.**

By using this tool, you acknowledge that you understand these risks and accept full responsibility for any outcomes.

---

## What This Tool Does

This repository contains two powerful Discord selfbot tools:

### 1. Message Migration Tool (`migrate.js`)

An advanced Discord guild (server) migration tool that copies messages and content from one Discord server to another.

### 2. Emoji & Sticker Copier (`copy-emojis-stickers.js`)

A specialized tool to copy emojis and stickers between Discord servers. **Emoji copying works without Nitro!** Sticker copying may require server boost level.

---

## Features

### Message Migration Tool

✅ **Message Migration**: Copies all messages from source to target server  
✅ **Attachment Support**: Downloads and re-uploads all message attachments  
✅ **Forwarded Message Detection**: Detects and notes forwarded messages  
✅ **Reply Context**: Preserves information about message replies  
✅ **Edit History**: Notes if messages were edited  
✅ **Embed Information**: Preserves embed content as text  
✅ **Sticker Notation**: Notes which stickers were used (cannot re-upload)  
✅ **Channel Mapping**: Automatically maps channels by name or creates new ones  
✅ **Rate Limiting**: Built-in delays to avoid API rate limits  
✅ **Retry Logic**: Automatic retry for failed operations  
✅ **Progress Logging**: Detailed console output of migration progress

### Emoji & Sticker Copier

✅ **Emoji Copying**: Download and upload all emojis from source to target server  
✅ **No Nitro Required for Emojis**: Regular emojis can be copied without Nitro  
✅ **Sticker Copying**: Attempts to copy stickers (may require server boost level)  
✅ **Duplicate Detection**: Skips emojis/stickers that already exist  
✅ **Format Support**: Handles PNG, APNG, GIF emojis and PNG/Lottie stickers  
✅ **Rate Limiting**: Built-in delays to avoid API restrictions  
✅ **Detailed Logging**: Shows progress and errors for each item

---

## Installation

### Prerequisites

- Node.js 16.0.0 or higher
- A Discord user account token (NOT a bot token)
- Access to both source and target servers

### Setup

1. Clone this repository:
```bash
git clone https://github.com/Tanmayop9/a-discord-web-selfbot-.git
cd a-discord-web-selfbot-
```

2. Install dependencies:
```bash
npm install
```

3. Configure the tool by editing `migrate.js`:
3. Configure the appropriate tool:
   - For message migration: Edit `migrate.js`
   - For emoji/sticker copying: Edit `copy-emojis-stickers.js`
   
   Set your `TOKEN`, `SOURCE_GUILD_ID`, and `TARGET_GUILD_ID`

---

## Configuration

### For Message Migration (`migrate.js`)

```javascript
// ============ CONFIGURATION ============
const TOKEN = 'your-user-token-here'; // Your Discord user token
const SOURCE_GUILD_ID = '123456789012345678'; // Source server ID
const TARGET_GUILD_ID = '876543210987654321'; // Target server ID
```

Advanced Settings:

```javascript
const MESSAGE_BATCH_LIMIT = 100; // Messages to fetch per request
const SEND_DELAY_MS = 1200; // Delay between sending messages (ms)
const ATTACHMENT_DOWNLOAD_DELAY_MS = 300; // Delay between downloads (ms)
const ENABLE_FORWARDED_MESSAGES = true; // Detect forwarded messages
const ENABLE_EMBEDS = true; // Copy embed information
const ENABLE_STICKERS = true; // Note sticker usage
```

### For Emoji & Sticker Copier (`copy-emojis-stickers.js`)

```javascript
// ============ CONFIGURATION ============
const TOKEN = 'your-user-token-here'; // Your Discord user token
const SOURCE_GUILD_ID = '28292'; // Source server ID
const TARGET_GUILD_ID = '29292'; // Target server ID
```

Advanced Settings:

```javascript
const COPY_EMOJIS = true; // Enable emoji copying
const COPY_STICKERS = true; // Enable sticker copying
const DELAY_MS = 1500; // Delay between operations (ms)
```

---

## How to Get Required IDs

### Getting Your User Token

**⚠️ NEVER share your token with anyone! It gives full access to your account.**

1. Open Discord in your web browser
2. Press `F12` to open Developer Tools
3. Go to the "Network" tab
4. Perform any action in Discord (send a message, etc.)
5. Look for a request to `discord.com/api`
6. In the request headers, find `authorization`
7. Copy the token value

### Getting Server IDs

1. Enable Developer Mode in Discord:
   - User Settings → Advanced → Developer Mode (turn ON)
2. Right-click on a server icon
3. Click "Copy ID"

---

## Usage

### Message Migration Tool

Once configured, run the message migration:

```bash
npm start
```

Or directly:

```bash
node migrate.js
```

### Emoji & Sticker Copier

To copy emojis and stickers between servers:

1. Edit `copy-emojis-stickers.js` and set:
   - `TOKEN`: Your Discord user token
   - `SOURCE_GUILD_ID`: Server to copy FROM (e.g., '28292')
   - `TARGET_GUILD_ID`: Server to copy TO (e.g., '29292')

2. Run the copier:

```bash
npm run copy-emojis
```

Or directly:

```bash
node copy-emojis-stickers.js
```

The tool will:
- Display a warning message
- Login to Discord with your token
- Fetch all emojis and stickers from the source server
- Download and upload them to the target server
- Skip duplicates automatically
- Display detailed progress and results

**Note:** 
- ✅ Emojis can be copied **without Nitro**
- ⚠️ Stickers may require server Nitro boost level in the target server
- You need "Manage Emojis and Stickers" permission in the target server

---

## Configuration Examples

### For Message Migration (`migrate.js`)

```javascript
npm start
```

Or directly:

```bash
node migrate.js
```

The tool will:
1. Display a warning message
2. Login to Discord with your token
3. Map all text channels from source to target
4. Create missing channels in the target server
5. Copy all messages with attachments
6. Display progress in the console

### What Gets Copied

- ✅ Message content
- ✅ Attachments (images, files, etc.)
- ✅ Author information (as text)
- ✅ Timestamps
- ✅ Forwarded message metadata
- ✅ Reply information
- ✅ Edit history notes
- ✅ Embed content (as text)
- ✅ Sticker names (as notes)

### What Does NOT Get Copied

- ❌ Actual message authors (messages sent by you)
- ❌ Reactions
- ❌ Pins
- ❌ Threads
- ❌ Voice channels
- ❌ Server settings/roles/permissions
- ❌ Stickers (noted but not re-uploaded)

---

## Example Output

```
================================================================================
⚠️  WARNING: USE AT YOUR OWN RISK ⚠️
================================================================================
This tool automates a user account, which violates Discord Terms of Service.
[...]
================================================================================

✅ Logged in as YourUsername#1234
Starting migration process...

📥 Source: My Old Server
📤 Target: My New Server

Found 5 text channels in source guild.

📋 Mapping channels...
  ✓ Mapped #general
  ✓ Mapped #announcements
  Creating channel: #memes
  ✓ Mapped #memes

📨 Starting message migration...

🔄 Processing: #general → #general
  Fetching messages...
  Found 150 message(s) to copy
  ⬇️  Downloading 2 attachment(s)...
  ✓ Copied message 1/150
  [...]
  ✅ Channel complete: 148 copied, 2 failed
```

---

## Troubleshooting

### "Invalid guild IDs"
- Make sure you have access to both servers
- Verify the IDs are correct
- Ensure Developer Mode is enabled

### "Failed to login"
- Check that your token is correct
- Make sure the token hasn't expired
- Your account may be banned or restricted

### "Rate limited" or "429 errors"
- Increase `SEND_DELAY_MS` to slow down the migration
- Wait and try again later
- Discord may have rate limited your account

### Messages not copying
- Check that you have permission to send messages in the target server
- Ensure the channels exist and are accessible
- Some content may be blocked by Discord's filters

---

## Technical Details

### Dependencies

- `discord.js-selfbot-v13`: Modified Discord.js library for selfbot usage
- `node-fetch@2`: HTTP client for downloading attachments

### Architecture

The tool works by:
1. Connecting to Discord as your user account
2. Fetching all messages from source channels (in batches)
3. Downloading attachments to temporary storage
4. Formatting messages with metadata
5. Sending messages to target channels
6. Cleaning up temporary files

---

## Limitations

- **Discord API rate limits**: The tool includes delays but you may still hit limits
- **Large attachments**: Files over 8MB (or 50MB with Nitro) cannot be uploaded
- **Message history**: Can only fetch messages you have access to
- **Deleted content**: Cannot recover deleted messages
- **Account restrictions**: Your account needs proper permissions in both servers

---

## Disclaimer

This tool is provided "as is" without warranty of any kind. The authors and contributors are not liable for any damages, account bans, legal issues, or other consequences resulting from the use of this tool.

**Use at your own risk. You have been warned.**

---

## License

See the [LICENSE](LICENSE) file for details.

---

## Support

This is an educational tool with no official support. Use at your own discretion.

**Remember: Using selfbots violates Discord's Terms of Service.**
