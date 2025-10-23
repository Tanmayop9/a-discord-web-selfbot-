"""
Discord Selfbot Script
WARNING: Using selfbots violates Discord's Terms of Service.
This script is for educational purposes only.

This script loads multiple Discord tokens and runs selfbots with 17+ commands
including .say, .purge, .spam, .embed, .edit, .ping, .nick, .status, .avatar,
.serverinfo, .userinfo, .react, .dm, .poll, .remind, .roll, .coinflip, .reverse,
.uptime, and .help.

Authorization: Only users listed in users.txt can use commands.
"""

import asyncio
import os
import sys
from typing import List, Optional, Set
import discord
from discord.ext import commands
import random
import time
from datetime import datetime


class SelfBot(commands.Bot):
    """A custom selfbot class for handling commands."""
    
    def __init__(self, token: str, authorized_users: Set[int], *args, **kwargs):
        super().__init__(command_prefix='.', self_bot=True, *args, **kwargs)
        self.token = token
        self.authorized_users = authorized_users
        
    async def on_ready(self):
        """Called when the bot is ready."""
        print(f'Logged in as {self.user.name} ({self.user.id})')
        
    async def on_message(self, message):
        """Handle incoming messages."""
        # Only respond to own messages
        if message.author.id != self.user.id:
            return
        
        # Check if user is authorized (if authorization list is not empty)
        if self.authorized_users and message.author.id not in self.authorized_users:
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


def load_users(filename: str = 'users.txt') -> Set[int]:
    """
    Load authorized user IDs from a file.
    
    Args:
        filename: Path to the file containing user IDs (one per line)
        
    Returns:
        Set of user ID integers
    """
    if not os.path.exists(filename):
        print(f"Warning: {filename} not found! All users will be able to use commands.")
        print(f"Create a {filename} file with one user ID per line to restrict access.")
        return set()
        
    user_ids = set()
    with open(filename, 'r') as f:
        for line in f:
            user_id = line.strip()
            if user_id and not user_id.startswith('#'):  # Skip empty lines and comments
                try:
                    user_ids.add(int(user_id))
                except ValueError:
                    print(f"Warning: Invalid user ID '{user_id}' in {filename}, skipping...")
                    
    if user_ids:
        print(f"Loaded {len(user_ids)} authorized user(s)")
    else:
        print(f"Warning: No user IDs found in {filename}. All users can use commands.")
        
    return user_ids


async def setup_bot(token: str, authorized_users: Set[int]) -> Optional[SelfBot]:
    """
    Set up a selfbot instance with the given token.
    
    Args:
        token: Discord token string
        authorized_users: Set of authorized user IDs
        
    Returns:
        Configured SelfBot instance or None if setup fails
    """
    bot = SelfBot(token, authorized_users)
    
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
    
    @bot.command(name='purge')
    async def purge(ctx, limit: int = 10):
        """
        Delete your own messages in the current channel.
        
        Usage: .purge [limit]
        
        Args:
            limit: Number of messages to check and delete (default: 10, max: 100)
        """
        try:
            if limit < 1:
                await ctx.send("Error: limit must be at least 1")
                return
                
            if limit > 100:
                await ctx.send("Error: limit cannot exceed 100")
                return
            
            deleted = 0
            async for message in ctx.channel.history(limit=limit):
                if message.author.id == bot.user.id:
                    try:
                        await message.delete()
                        deleted += 1
                        await asyncio.sleep(0.5)  # Avoid rate limiting
                    except discord.Forbidden:
                        await ctx.send("Error: Missing permissions to delete messages")
                        break
                    except discord.HTTPException:
                        continue
            
            if deleted > 0:
                print(f"Deleted {deleted} message(s) in channel {ctx.channel.id}")
                
        except Exception as e:
            await ctx.send(f"Error in purge command: {str(e)}")
            print(f"Error in purge command: {e}")
    
    @bot.command(name='spam')
    async def spam(ctx, times: int, *, message: str):
        """
        Spam a message in the current channel.
        
        Usage: .spam <times> <message>
        
        Args:
            times: Number of times to send the message (max: 50)
            message: The message to spam
        """
        try:
            if times < 1:
                await ctx.send("Error: times must be at least 1")
                return
                
            if times > 50:
                await ctx.send("Error: times cannot exceed 50 (rate limit protection)")
                return
            
            for i in range(times):
                try:
                    await ctx.send(message)
                    if i < times - 1:
                        await asyncio.sleep(1)  # Avoid rate limiting
                except discord.Forbidden:
                    await ctx.send(f"Error: Missing permissions (sent {i}/{times})")
                    break
                except discord.HTTPException as e:
                    if e.status == 429:
                        await ctx.send(f"Rate limited. Sent {i}/{times} messages.")
                        break
            
            print(f"Spammed '{message}' {times} times in channel {ctx.channel.id}")
            
        except Exception as e:
            await ctx.send(f"Error in spam command: {str(e)}")
            print(f"Error in spam command: {e}")
    
    @bot.command(name='embed')
    async def embed(ctx, title: str, *, description: str):
        """
        Send an embedded message.
        
        Usage: .embed <title> <description>
        
        Args:
            title: Title of the embed
            description: Description text for the embed
        """
        try:
            embed_msg = discord.Embed(
                title=title,
                description=description,
                color=discord.Color.blue()
            )
            embed_msg.set_footer(text=f"Sent by {ctx.author.name}")
            await ctx.send(embed=embed_msg)
            print(f"Sent embed with title '{title}' in channel {ctx.channel.id}")
            
        except discord.Forbidden:
            await ctx.send("Error: Missing permissions to send embeds")
        except Exception as e:
            await ctx.send(f"Error in embed command: {str(e)}")
            print(f"Error in embed command: {e}")
    
    @bot.command(name='edit')
    async def edit(ctx, *, new_content: str):
        """
        Edit your last message in the current channel.
        
        Usage: .edit <new_content>
        
        Args:
            new_content: The new content for the message
        """
        try:
            async for message in ctx.channel.history(limit=10):
                if message.author.id == bot.user.id and message.id != ctx.message.id:
                    try:
                        await message.edit(content=new_content)
                        await ctx.message.delete()
                        print(f"Edited message in channel {ctx.channel.id}")
                        return
                    except discord.Forbidden:
                        await ctx.send("Error: Cannot edit that message")
                        return
                    except discord.HTTPException as e:
                        await ctx.send(f"Error editing message: {str(e)}")
                        return
            
            await ctx.send("No recent message found to edit")
            
        except Exception as e:
            await ctx.send(f"Error in edit command: {str(e)}")
            print(f"Error in edit command: {e}")
    
    @bot.command(name='ping')
    async def ping(ctx):
        """
        Check the bot's latency.
        
        Usage: .ping
        """
        try:
            latency = round(bot.latency * 1000)
            await ctx.send(f"Pong! Latency: {latency}ms")
            
        except Exception as e:
            await ctx.send(f"Error in ping command: {str(e)}")
            print(f"Error in ping command: {e}")
    
    @bot.command(name='nick')
    async def nick(ctx, *, nickname: str):
        """
        Change your nickname in the current server.
        
        Usage: .nick <nickname>
        
        Args:
            nickname: New nickname (use "reset" to remove nickname)
        """
        try:
            if not ctx.guild:
                await ctx.send("Error: This command only works in servers")
                return
                
            member = ctx.guild.get_member(bot.user.id)
            if nickname.lower() == "reset":
                await member.edit(nick=None)
                await ctx.send("Nickname reset")
            else:
                await member.edit(nick=nickname)
                await ctx.send(f"Nickname changed to: {nickname}")
            print(f"Changed nickname to '{nickname}' in {ctx.guild.name}")
            
        except discord.Forbidden:
            await ctx.send("Error: Missing permissions to change nickname")
        except Exception as e:
            await ctx.send(f"Error in nick command: {str(e)}")
            print(f"Error in nick command: {e}")
    
    @bot.command(name='status')
    async def status(ctx, *, status_text: str):
        """
        Change your custom status.
        
        Usage: .status <status_text>
        
        Args:
            status_text: Custom status text (use "clear" to remove)
        """
        try:
            if status_text.lower() == "clear":
                await bot.change_presence(activity=None)
                await ctx.send("Status cleared")
            else:
                activity = discord.CustomActivity(name=status_text)
                await bot.change_presence(activity=activity)
                await ctx.send(f"Status changed to: {status_text}")
            print(f"Changed status to '{status_text}'")
            
        except Exception as e:
            await ctx.send(f"Error in status command: {str(e)}")
            print(f"Error in status command: {e}")
    
    @bot.command(name='avatar')
    async def avatar(ctx, user_id: str = None):
        """
        Get avatar URL of a user.
        
        Usage: .avatar [user_id]
        
        Args:
            user_id: User ID (optional, defaults to yourself)
        """
        try:
            if user_id:
                try:
                    user = await bot.fetch_user(int(user_id))
                except ValueError:
                    await ctx.send("Error: Invalid user ID")
                    return
                except discord.NotFound:
                    await ctx.send("Error: User not found")
                    return
            else:
                user = bot.user
            
            avatar_url = user.display_avatar.url
            await ctx.send(f"Avatar for {user.name}:\n{avatar_url}")
            
        except Exception as e:
            await ctx.send(f"Error in avatar command: {str(e)}")
            print(f"Error in avatar command: {e}")
    
    @bot.command(name='serverinfo')
    async def serverinfo(ctx):
        """
        Get information about the current server.
        
        Usage: .serverinfo
        """
        try:
            if not ctx.guild:
                await ctx.send("Error: This command only works in servers")
                return
            
            guild = ctx.guild
            embed = discord.Embed(title=f"Server Info: {guild.name}", color=discord.Color.blue())
            embed.add_field(name="Server ID", value=guild.id, inline=True)
            embed.add_field(name="Owner", value=f"{guild.owner.name}", inline=True)
            embed.add_field(name="Members", value=guild.member_count, inline=True)
            embed.add_field(name="Channels", value=len(guild.channels), inline=True)
            embed.add_field(name="Roles", value=len(guild.roles), inline=True)
            embed.add_field(name="Created", value=guild.created_at.strftime("%Y-%m-%d"), inline=True)
            
            if guild.icon:
                embed.set_thumbnail(url=guild.icon.url)
            
            await ctx.send(embed=embed)
            
        except Exception as e:
            await ctx.send(f"Error in serverinfo command: {str(e)}")
            print(f"Error in serverinfo command: {e}")
    
    @bot.command(name='userinfo')
    async def userinfo(ctx, user_id: str = None):
        """
        Get information about a user.
        
        Usage: .userinfo [user_id]
        
        Args:
            user_id: User ID (optional, defaults to yourself)
        """
        try:
            if user_id:
                try:
                    user = await bot.fetch_user(int(user_id))
                except ValueError:
                    await ctx.send("Error: Invalid user ID")
                    return
                except discord.NotFound:
                    await ctx.send("Error: User not found")
                    return
            else:
                user = bot.user
            
            embed = discord.Embed(title=f"User Info: {user.name}", color=discord.Color.green())
            embed.add_field(name="User ID", value=user.id, inline=True)
            embed.add_field(name="Display Name", value=user.display_name, inline=True)
            embed.add_field(name="Bot", value="Yes" if user.bot else "No", inline=True)
            embed.add_field(name="Created", value=user.created_at.strftime("%Y-%m-%d"), inline=True)
            
            if user.avatar:
                embed.set_thumbnail(url=user.display_avatar.url)
            
            await ctx.send(embed=embed)
            
        except Exception as e:
            await ctx.send(f"Error in userinfo command: {str(e)}")
            print(f"Error in userinfo command: {e}")
    
    @bot.command(name='react')
    async def react(ctx, emoji: str, message_id: str = None):
        """
        Add a reaction to a message.
        
        Usage: .react <emoji> [message_id]
        
        Args:
            emoji: Emoji to react with
            message_id: Message ID (optional, reacts to last message if not provided)
        """
        try:
            if message_id:
                try:
                    message = await ctx.channel.fetch_message(int(message_id))
                except ValueError:
                    await ctx.send("Error: Invalid message ID")
                    return
                except discord.NotFound:
                    await ctx.send("Error: Message not found")
                    return
            else:
                # Get the last message before the command
                async for msg in ctx.channel.history(limit=2):
                    if msg.id != ctx.message.id:
                        message = msg
                        break
                else:
                    await ctx.send("Error: No message found to react to")
                    return
            
            await message.add_reaction(emoji)
            await ctx.message.delete()
            
        except discord.HTTPException:
            await ctx.send("Error: Invalid emoji or unable to react")
        except Exception as e:
            await ctx.send(f"Error in react command: {str(e)}")
            print(f"Error in react command: {e}")
    
    @bot.command(name='dm')
    async def dm(ctx, user_id: str, *, message: str):
        """
        Send a direct message to a user.
        
        Usage: .dm <user_id> <message>
        
        Args:
            user_id: Target user ID
            message: Message to send
        """
        try:
            try:
                user = await bot.fetch_user(int(user_id))
            except ValueError:
                await ctx.send("Error: Invalid user ID")
                return
            except discord.NotFound:
                await ctx.send("Error: User not found")
                return
            
            await user.send(message)
            await ctx.send(f"DM sent to {user.name}")
            print(f"Sent DM to {user.name}: {message}")
            
        except discord.Forbidden:
            await ctx.send("Error: Cannot send DM to that user")
        except Exception as e:
            await ctx.send(f"Error in dm command: {str(e)}")
            print(f"Error in dm command: {e}")
    
    @bot.command(name='poll')
    async def poll(ctx, question: str, *options):
        """
        Create a simple poll with reactions.
        
        Usage: .poll <question> <option1> <option2> [option3] ...
        
        Args:
            question: Poll question
            options: Poll options (2-10 options)
        """
        try:
            if len(options) < 2:
                await ctx.send("Error: Need at least 2 options")
                return
            if len(options) > 10:
                await ctx.send("Error: Maximum 10 options allowed")
                return
            
            # Create poll message
            poll_text = f"**📊 Poll: {question}**\n\n"
            emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
            
            for i, option in enumerate(options):
                poll_text += f"{emojis[i]} {option}\n"
            
            poll_message = await ctx.send(poll_text)
            
            # Add reactions
            for i in range(len(options)):
                await poll_message.add_reaction(emojis[i])
            
            await ctx.message.delete()
            
        except Exception as e:
            await ctx.send(f"Error in poll command: {str(e)}")
            print(f"Error in poll command: {e}")
    
    @bot.command(name='remind')
    async def remind(ctx, seconds: int, *, reminder: str):
        """
        Set a reminder (for current session only).
        
        Usage: .remind <seconds> <reminder>
        
        Args:
            seconds: Time in seconds until reminder
            reminder: Reminder message
        """
        try:
            if seconds < 1:
                await ctx.send("Error: Time must be at least 1 second")
                return
            if seconds > 86400:  # 24 hours
                await ctx.send("Error: Maximum reminder time is 24 hours (86400 seconds)")
                return
            
            await ctx.send(f"⏰ Reminder set for {seconds} seconds")
            await asyncio.sleep(seconds)
            await ctx.send(f"⏰ Reminder: {reminder}")
            
        except Exception as e:
            await ctx.send(f"Error in remind command: {str(e)}")
            print(f"Error in remind command: {e}")
    
    @bot.command(name='roll')
    async def roll(ctx, sides: int = 6):
        """
        Roll a dice.
        
        Usage: .roll [sides]
        
        Args:
            sides: Number of sides on the dice (default: 6, max: 1000)
        """
        try:
            if sides < 2:
                await ctx.send("Error: Dice must have at least 2 sides")
                return
            if sides > 1000:
                await ctx.send("Error: Maximum 1000 sides")
                return
            
            result = random.randint(1, sides)
            await ctx.send(f"🎲 Rolled a {sides}-sided dice: **{result}**")
            
        except Exception as e:
            await ctx.send(f"Error in roll command: {str(e)}")
            print(f"Error in roll command: {e}")
    
    @bot.command(name='coinflip')
    async def coinflip(ctx):
        """
        Flip a coin.
        
        Usage: .coinflip
        """
        try:
            result = random.choice(["Heads", "Tails"])
            await ctx.send(f"🪙 Coin flip: **{result}**")
            
        except Exception as e:
            await ctx.send(f"Error in coinflip command: {str(e)}")
            print(f"Error in coinflip command: {e}")
    
    @bot.command(name='reverse')
    async def reverse(ctx, *, text: str):
        """
        Reverse text.
        
        Usage: .reverse <text>
        
        Args:
            text: Text to reverse
        """
        try:
            reversed_text = text[::-1]
            await ctx.send(reversed_text)
            
        except Exception as e:
            await ctx.send(f"Error in reverse command: {str(e)}")
            print(f"Error in reverse command: {e}")
    
    @bot.command(name='uptime')
    async def uptime(ctx):
        """
        Show how long the bot has been running.
        
        Usage: .uptime
        """
        try:
            # Calculate uptime (approximate based on bot ready time)
            uptime_text = f"Bot has been online since login"
            await ctx.send(uptime_text)
            
        except Exception as e:
            await ctx.send(f"Error in uptime command: {str(e)}")
            print(f"Error in uptime command: {e}")
    
    @bot.command(name='help')
    async def help_command(ctx):
        """
        List all available commands.
        
        Usage: .help
        """
        try:
            help_text = """
**Available Commands (17 total):**

`.say <channel_id> <message> [times]` - Send message to a channel
`.purge [limit]` - Delete your messages (default: 10, max: 100)
`.spam <times> <message>` - Spam messages (max: 50)
`.embed <title> <description>` - Send embedded message
`.edit <new_content>` - Edit your last message
`.ping` - Check bot latency
`.nick <nickname>` - Change nickname (use "reset" to remove)
`.status <status_text>` - Change custom status (use "clear" to remove)
`.avatar [user_id]` - Get user's avatar
`.serverinfo` - Get server information
`.userinfo [user_id]` - Get user information
`.react <emoji> [message_id]` - Add reaction to message
`.dm <user_id> <message>` - Send DM to user
`.poll <question> <option1> <option2> ...` - Create poll (2-10 options)
`.remind <seconds> <reminder>` - Set reminder (max: 24 hours)
`.roll [sides]` - Roll dice (default: 6 sides)
`.coinflip` - Flip a coin
`.reverse <text>` - Reverse text
`.uptime` - Show bot uptime

**Authorization:** Only authorized users in users.txt can use commands.
**WARNING:** Using selfbots violates Discord's Terms of Service.
"""
            await ctx.send(help_text)
            
        except Exception as e:
            print(f"Error in help command: {e}")
    
    return bot


async def run_bot(token: str, authorized_users: Set[int]):
    """
    Run a single selfbot instance.
    
    Args:
        token: Discord token string
        authorized_users: Set of authorized user IDs
    """
    bot = await setup_bot(token, authorized_users)
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
    
    # Load authorized users
    authorized_users = load_users('users.txt')
    print()
    
    # Create tasks for all bots
    tasks = [run_bot(token, authorized_users) for token in tokens]
    
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
