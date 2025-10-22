"""
Discord Selfbot Script
WARNING: Using selfbots violates Discord's Terms of Service.
This script is for educational purposes only.

This script loads multiple Discord tokens and runs selfbots that can execute
the .say command to send messages to specified channels.
"""

import asyncio
import os
import sys
from typing import List, Optional
import discord
from discord.ext import commands


class SelfBot(commands.Bot):
    """A custom selfbot class for handling commands."""
    
    def __init__(self, token: str, *args, **kwargs):
        super().__init__(command_prefix='.', self_bot=True, *args, **kwargs)
        self.token = token
        
    async def on_ready(self):
        """Called when the bot is ready."""
        print(f'Logged in as {self.user.name} ({self.user.id})')
        
    async def on_message(self, message):
        """Handle incoming messages."""
        # Only respond to own messages
        if message.author.id != self.user.id:
            return
            
        # Process commands
        await self.process_commands(message)
        
    async def on_command_error(self, ctx, error):
        """Handle command errors."""
        if isinstance(error, commands.CommandNotFound):
            return
        elif isinstance(error, commands.MissingRequiredArgument):
            await ctx.send(f'Missing required argument: {error.param.name}')
        else:
            await ctx.send(f'Error: {str(error)}')
            print(f'Error in command: {error}')


def load_tokens(filename: str = 'tokens.txt') -> List[str]:
    """
    Load Discord tokens from a file.
    
    Args:
        filename: Path to the file containing tokens (one per line)
        
    Returns:
        List of token strings
    """
    if not os.path.exists(filename):
        print(f"Error: {filename} not found!")
        print(f"Please create a {filename} file with one token per line.")
        return []
        
    tokens = []
    with open(filename, 'r') as f:
        for line in f:
            token = line.strip()
            if token and not token.startswith('#'):  # Skip empty lines and comments
                tokens.append(token)
                
    if not tokens:
        print(f"Warning: No tokens found in {filename}")
        
    return tokens


async def setup_bot(token: str) -> Optional[SelfBot]:
    """
    Set up a selfbot instance with the given token.
    
    Args:
        token: Discord token string
        
    Returns:
        Configured SelfBot instance or None if setup fails
    """
    bot = SelfBot(token)
    
    @bot.command(name='say')
    async def say(ctx, channel_id: str, message: str, times: int = 2):
        """
        Send a message to a specified channel multiple times.
        
        Usage: .say <channel_id> <message> [times]
        
        Args:
            channel_id: ID of the channel to send the message to
            message: The message to send
            times: Number of times to send the message (default: 2)
        """
        try:
            # Validate times parameter
            if times < 1:
                await ctx.send("Error: times must be at least 1")
                return
                
            if times > 100:
                await ctx.send("Error: times cannot exceed 100 (rate limit protection)")
                return
            
            # Try to get the channel
            try:
                channel_id_int = int(channel_id)
            except ValueError:
                await ctx.send(f"Error: Invalid channel ID '{channel_id}'. Must be a number.")
                return
                
            channel = bot.get_channel(channel_id_int)
            
            if channel is None:
                # Try to fetch the channel if not in cache
                try:
                    channel = await bot.fetch_channel(channel_id_int)
                except discord.NotFound:
                    await ctx.send(f"Error: Channel with ID {channel_id} not found.")
                    return
                except discord.Forbidden:
                    await ctx.send(f"Error: No access to channel {channel_id}.")
                    return
                except discord.HTTPException as e:
                    await ctx.send(f"Error fetching channel: {str(e)}")
                    return
            
            # Check if we can send messages to this channel
            if isinstance(channel, discord.TextChannel):
                permissions = channel.permissions_for(channel.guild.get_member(bot.user.id))
                if not permissions.send_messages:
                    await ctx.send(f"Error: Missing permission to send messages in channel {channel.name}")
                    return
            
            # Send the message multiple times with a small delay to avoid rate limiting
            success_count = 0
            for i in range(times):
                try:
                    await channel.send(message)
                    success_count += 1
                    
                    # Add delay to avoid rate limiting (except for the last message)
                    if i < times - 1:
                        await asyncio.sleep(1)
                        
                except discord.Forbidden:
                    await ctx.send(f"Error: Missing permissions to send messages (sent {success_count}/{times})")
                    break
                except discord.HTTPException as e:
                    if e.status == 429:  # Rate limited
                        await ctx.send(f"Error: Rate limited. Successfully sent {success_count}/{times} messages.")
                        break
                    else:
                        await ctx.send(f"Error sending message: {str(e)}")
                        break
                except Exception as e:
                    await ctx.send(f"Unexpected error: {str(e)}")
                    break
            
            # Report success
            if success_count == times:
                print(f"Successfully sent '{message}' {times} times to channel {channel_id}")
            
        except Exception as e:
            await ctx.send(f"Unexpected error in say command: {str(e)}")
            print(f"Error in say command: {e}")
    
    return bot


async def run_bot(token: str):
    """
    Run a single selfbot instance.
    
    Args:
        token: Discord token string
    """
    bot = await setup_bot(token)
    if bot is None:
        print(f"Failed to set up bot for token {token[:10]}...")
        return
        
    try:
        await bot.start(token)
    except discord.LoginFailure:
        print(f"Error: Invalid token {token[:10]}...")
    except Exception as e:
        print(f"Error running bot: {e}")
    finally:
        if not bot.is_closed():
            await bot.close()


async def main():
    """Main function to run all selfbots concurrently."""
    print("=" * 60)
    print("Discord Selfbot Script")
    print("WARNING: Using selfbots violates Discord's Terms of Service")
    print("This is for educational purposes only")
    print("=" * 60)
    print()
    
    # Load tokens
    tokens = load_tokens('tokens.txt')
    
    if not tokens:
        print("No tokens found. Exiting.")
        return
    
    print(f"Loaded {len(tokens)} token(s)")
    print()
    
    # Create tasks for all bots
    tasks = [run_bot(token) for token in tokens]
    
    # Run all bots concurrently
    try:
        await asyncio.gather(*tasks)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    # Check Python version
    if sys.version_info < (3, 8):
        print("Error: Python 3.8 or higher is required")
        sys.exit(1)
    
    # Run the main function
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nShutdown complete.")
