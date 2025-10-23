# Discord Web Selfbot

**⚠️ WARNING: Using selfbots violates Discord's Terms of Service. This repository is for educational purposes only. Use at your own risk.**

## Description

This is a Python-based Discord selfbot that allows you to run multiple Discord accounts simultaneously and execute commands from your own account. The selfbot supports 20 commands with user authorization system.

## Features

- **Multi-token support**: Load and run multiple Discord accounts concurrently
- **User Authorization**: Only users listed in `users.txt` can use commands
- **20+ Commands**: Comprehensive command set for automation and convenience
  - `.say` - Send messages to specified channels with customizable repetition
  - `.purge` - Delete your own messages in the current channel
  - `.spam` - Spam messages in the current channel
  - `.embed` - Send embedded messages
  - `.edit` - Edit your last message
  - `.ping` - Check bot latency
  - `.nick` - Change your nickname in servers
  - `.status` - Change your custom status
  - `.avatar` - Get user's avatar URL
  - `.serverinfo` - Get server information
  - `.userinfo` - Get user information
  - `.react` - Add reactions to messages
  - `.dm` - Send direct messages to users
  - `.poll` - Create polls with reactions
  - `.remind` - Set reminders (session-based)
  - `.roll` - Roll dice
  - `.coinflip` - Flip a coin
  - `.reverse` - Reverse text
  - `.uptime` - Show bot uptime
  - `.help` - List all available commands
- **Error handling**: Comprehensive error handling for invalid channels, missing permissions, and rate limits
- **Rate limit protection**: Built-in delays to prevent hitting Discord's rate limits
- **Concurrent execution**: All selfbots run simultaneously using asyncio
- **Single file**: Everything in one easy-to-use script

## Requirements

- Python 3.8 or higher
- discord.py-self library

## Installation

1. Clone this repository:
```bash
git clone https://github.com/Tanmayop9/a-discord-web-selfbot-.git
cd a-discord-web-selfbot-
```

2. Install the required dependencies:
```bash
pip install -r requirements.txt
```

3. Copy the example files and configure:
```bash
cp tokens.txt.example tokens.txt
cp users.txt.example users.txt
```

Then edit `tokens.txt` and add your Discord tokens (one per line):
```
# tokens.txt
YOUR_DISCORD_TOKEN_1
YOUR_DISCORD_TOKEN_2
# Add more tokens as needed
```

And edit `users.txt` to add authorized user IDs (one per line):
```
# users.txt
123456789012345678  # Your Discord user ID
234567890123456789  # Another authorized user
# Add more user IDs as needed
```

**Note:** If `users.txt` is empty or doesn't exist, ALL users can use commands. Add user IDs to restrict access.

## Usage

### Running the Selfbot

Run the script:
```bash
python selfbot.py
```

The selfbot will:
1. Load all tokens from `tokens.txt`
2. Load authorized users from `users.txt`
2. Log in to Discord with each token
3. Wait for commands from your own messages

### Available Commands

Once the selfbot is running, you can use any of the following 20 commands (only authorized users in `users.txt` can use them):

#### Message Commands
- `.say <channel_id> <message> [times]` - Send message to any channel (default: 2, max: 100)
- `.spam <times> <message>` - Spam messages in current channel (max: 50)
- `.embed <title> <description>` - Send embedded message with custom formatting
- `.edit <new_content>` - Edit your last message in the channel
- `.dm <user_id> <message>` - Send direct message to a user

#### Management Commands
- `.purge [limit]` - Delete your own messages (default: 10, max: 100)
- `.react <emoji> [message_id]` - Add reaction to a message
- `.nick <nickname>` - Change nickname in server (use "reset" to remove)
- `.status <status_text>` - Change custom status (use "clear" to remove)

#### Information Commands
- `.ping` - Check bot latency in milliseconds
- `.avatar [user_id]` - Get user's avatar URL
- `.serverinfo` - Get current server information
- `.userinfo [user_id]` - Get user information

#### Utility Commands
- `.poll <question> <option1> <option2> ...` - Create poll with reactions (2-10 options)
- `.remind <seconds> <reminder>` - Set reminder (max: 24 hours)
- `.roll [sides]` - Roll dice (default: 6 sides, max: 1000)
- `.coinflip` - Flip a coin (Heads or Tails)
- `.reverse <text>` - Reverse text
- `.uptime` - Show bot uptime
- `.help` - Display all commands with usage

**Examples:**

```bash
# Send message to a channel 3 times
.say 1234567890123456789 "Hello World!" 3

# Delete last 20 messages
.purge 20

# Change nickname
.nick CoolName

# Get user info
.userinfo 123456789012345678

# Create a poll
.poll "What's your favorite color?" Red Blue Green

# Set a 60 second reminder
.remind 60 Check the oven!

# Roll a 20-sided dice
.roll 20
```

### Getting Channel/User IDs

To get IDs in Discord:
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on any channel, user, or message
3. Click "Copy ID"

## Authorization System

This selfbot includes a user authorization system:

- **Authorized Users**: Only users listed in `users.txt` can use commands
- **Empty File**: If `users.txt` is empty or doesn't exist, ALL users can use commands
- **Configuration**: Add Discord user IDs (one per line) to restrict access
- **Security**: Keep `users.txt` private and secure

Example `users.txt`:
```
123456789012345678  # Your user ID
234567890123456789  # Friend's user ID
```

## Error Handling

The selfbot includes comprehensive error handling for:

- **Invalid channel IDs**: Reports when a channel ID is not a valid number or doesn't exist
- **Missing permissions**: Alerts when the account doesn't have permission to send messages
- **Rate limiting**: Stops sending and reports when Discord's rate limits are hit
- **Network errors**: Handles connection issues and HTTP errors gracefully

## Security Considerations

- **Never share your tokens**: Your Discord token is like a password. Keep it secure.
- **Private repository**: If you fork this repository, make sure it's private.
- **Token storage**: The `tokens.txt` file should never be committed to version control.
- **User authorization**: Keep `users.txt` private to control who can use your selfbot.
- **Terms of Service**: Remember that using selfbots violates Discord's ToS and may result in account termination.

## Project Structure

```
.
├── selfbot.py          # Main selfbot script (20 commands)
├── tokens.txt.example  # Example tokens file (copy to tokens.txt)
├── users.txt.example   # Example users file (copy to users.txt)
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── .gitignore         # Git ignore file
└── LICENSE            # MIT License
```

## How It Works

1. **Token Loading**: The script reads Discord tokens from `tokens.txt`
2. **User Authorization**: Loads authorized user IDs from `users.txt`
3. **Bot Creation**: For each token, a separate `SelfBot` instance is created
4. **Authorization Check**: Each bot checks if the user is authorized before processing commands
5. **Concurrent Execution**: All bots run concurrently using `asyncio.gather()`
6. **Command Processing**: Each bot monitors messages from its own account
7. **Command Execution**: When a command is triggered, it executes if the user is authorized

## Limitations

- Maximum 100 messages per `.say` command (rate limit protection)
- Maximum 50 messages per `.spam` command (rate limit protection)
- Maximum 100 messages per `.purge` command (rate limit protection)
- Reminders are session-based (cleared on restart)
- 1-second delay between messages to avoid rate limiting
- Only responds to messages from authorized users (if configured)
- Requires the account to have access to the target channel

## Troubleshooting

### "No tokens found" error
- Make sure `tokens.txt` exists in the same directory as `selfbot.py`
- Ensure tokens are not commented out (don't start with `#`)
- Check that there are no empty lines or extra spaces

### "Invalid token" error
- Verify that your Discord token is correct
- Make sure the token hasn't expired or been regenerated
- Check that there are no extra spaces or newlines in the token

### "Channel not found" error
- Verify the channel ID is correct
- Ensure the account has access to that channel (member of the server)
- Try using Developer Mode to copy the ID again

## Disclaimer

This project is created for **educational purposes only**. The authors and contributors are not responsible for any misuse of this software. Using selfbots violates Discord's Terms of Service and may result in account termination. Use at your own risk.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## Support

For questions or issues, please open an issue on GitHub.
