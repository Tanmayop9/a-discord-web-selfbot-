# Discord Web Selfbot

**⚠️ WARNING: Using selfbots violates Discord's Terms of Service. This repository is for educational purposes only. Use at your own risk.**

## Description

This is a Python-based Discord selfbot that allows you to run multiple Discord accounts simultaneously and execute commands from your own account. The selfbot supports multiple commands including `.say`, `.purge`, `.spam`, `.embed`, `.edit`, `.ping`, and `.help`.

## Features

- **Multi-token support**: Load and run multiple Discord accounts concurrently
- **Multiple commands**: 7 useful commands for automation and convenience
  - `.say` - Send messages to specified channels with customizable repetition
  - `.purge` - Delete your own messages in the current channel
  - `.spam` - Spam messages in the current channel
  - `.embed` - Send embedded messages
  - `.edit` - Edit your last message
  - `.ping` - Check bot latency
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

3. Copy the example tokens file and add your Discord tokens:
```bash
cp tokens.txt.example tokens.txt
```

Then edit `tokens.txt` and add your Discord tokens (one per line):
```
# tokens.txt
YOUR_DISCORD_TOKEN_1
YOUR_DISCORD_TOKEN_2
# Add more tokens as needed
```

## Usage

### Running the Selfbot

Run the script:
```bash
python selfbot.py
```

The selfbot will:
1. Load all tokens from `tokens.txt`
2. Log in to Discord with each token
3. Wait for commands from your own messages

### Available Commands

Once the selfbot is running, you can use any of the following commands by sending a message in any Discord channel where you're logged in:

#### `.say` - Send messages to a specific channel

```
.say <channel_id> <message> [times]
```

**Parameters:**
- `channel_id` (required): The ID of the channel to send the message to
- `message` (required): The text message to send
- `times` (optional): Number of times to send the message (default: 2, max: 100)

**Examples:**

Send a message twice (default):
```
.say 1234567890123456789 "Hello, World!"
```

Send a message 5 times:
```
.say 1234567890123456789 "Test message" 5
```

#### `.purge` - Delete your own messages

```
.purge [limit]
```

**Parameters:**
- `limit` (optional): Number of messages to check and delete (default: 10, max: 100)

**Examples:**

Delete your last 10 messages:
```
.purge
```

Delete your last 50 messages:
```
.purge 50
```

#### `.spam` - Spam messages in current channel

```
.spam <times> <message>
```

**Parameters:**
- `times` (required): Number of times to send the message (max: 50)
- `message` (required): The message to spam

**Example:**

```
.spam 5 Hello everyone!
```

#### `.embed` - Send an embedded message

```
.embed <title> <description>
```

**Parameters:**
- `title` (required): Title of the embed
- `description` (required): Description text for the embed

**Example:**

```
.embed "Important Announcement" "This is a test embed message"
```

#### `.edit` - Edit your last message

```
.edit <new_content>
```

**Parameters:**
- `new_content` (required): The new content for your last message

**Example:**

```
.edit This is the edited content
```

#### `.ping` - Check bot latency

```
.ping
```

Shows the bot's latency in milliseconds.

#### `.help` - Show help message

```
.help
```

Displays a list of all available commands with their usage.

### Getting a Channel ID

To get a channel ID in Discord:
1. Enable Developer Mode in Discord (User Settings → Advanced → Developer Mode)
2. Right-click on any channel
3. Click "Copy ID"

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
- **Terms of Service**: Remember that using selfbots violates Discord's ToS and may result in account termination.

## Project Structure

```
.
├── selfbot.py          # Main selfbot script
├── tokens.txt.example  # Example tokens file (copy to tokens.txt)
├── requirements.txt    # Python dependencies
├── README.md          # This file
├── .gitignore         # Git ignore file
└── LICENSE            # MIT License
```

## How It Works

1. **Token Loading**: The script reads Discord tokens from `tokens.txt`
2. **Bot Creation**: For each token, a separate `SelfBot` instance is created
3. **Concurrent Execution**: All bots run concurrently using `asyncio.gather()`
4. **Command Processing**: Each bot monitors messages from its own account
5. **Message Sending**: When `.say` is triggered, the bot sends messages to the specified channel

## Limitations

- Maximum 100 messages per `.say` command (rate limit protection)
- 1-second delay between messages to avoid rate limiting
- Only responds to messages from the account itself
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
