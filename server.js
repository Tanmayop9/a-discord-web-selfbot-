const { Client, RichPresence, CustomStatus, SpotifyRPC } = require('discord.js-selfbot-v13');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const http = require('http');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);
const PORT = process.env.PORT || 10021;

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 8 * 1024 * 1024 } });

// Discord selfbot setup
const client = new Client({
  checkUpdate: false,
  ws: { properties: { browser: 'Discord Client' } }
});

const DISCORD_TOKEN = process.env.DISCORD_TOKEN || '';

// Middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Store data
let botReady = false;
let userServers = [];
let currentStatus = 'online';
let currentActivities = [];

// Socket.IO for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected to WebSocket');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Broadcast new messages to all connected clients
client.on('messageCreate', (message) => {
  io.emit('newMessage', {
    channelId: message.channel.id,
    messageData: {
      id: message.id,
      content: message.content,
      author: message.author.tag,
      authorId: message.author.id,
      authorAvatar: message.author.displayAvatarURL(),
      timestamp: message.createdAt.toLocaleString(),
      editable: message.author.id === client.user.id,
      attachments: message.attachments.map(a => ({
        url: a.url,
        name: a.name,
        size: a.size
      })),
      embeds: message.embeds
    }
  });
});

// Routes
app.get('/', (req, res) => {
  res.render('index', {
    botReady,
    user: client.user,
    status: currentStatus,
    activities: currentActivities
  });
});

app.get('/servers', (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  userServers = client.guilds.cache.map(guild => ({
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL() || '/default-icon.png',
    banner: guild.bannerURL() || null,
    memberCount: guild.memberCount,
    owner: guild.ownerId === client.user.id,
    description: guild.description || 'No description',
    verified: guild.verified || false,
    partnered: guild.partnered || false
  }));
  
  res.render('servers', { servers: userServers, user: client.user });
});

app.get('/server/:id', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const guild = client.guilds.cache.get(req.params.id);
  if (!guild) {
    return res.status(404).send('Server not found');
  }
  
  const channels = [];
  guild.channels.cache.forEach(ch => {
    channels.push({
      id: ch.id,
      name: ch.name,
      type: ch.type,
      position: ch.position,
      parentId: ch.parentId || null,
      nsfw: ch.nsfw || false
    });
  });
  channels.sort((a, b) => a.position - b.position);
  
  const roles = guild.roles.cache.map(role => ({
    id: role.id,
    name: role.name,
    color: role.hexColor,
    position: role.position,
    permissions: role.permissions.toArray(),
    mentionable: role.mentionable,
    hoist: role.hoist
  }));
  
  const emojis = guild.emojis.cache.map(emoji => ({
    id: emoji.id,
    name: emoji.name,
    url: emoji.url,
    animated: emoji.animated,
    available: emoji.available
  }));
  
  res.render('server', { guild, channels, roles, emojis, user: client.user });
});

app.get('/channel/:serverId/:channelId', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const channel = client.channels.cache.get(req.params.channelId);
  if (!channel) {
    return res.status(404).send('Channel not found');
  }
  
  try {
    const messages = await channel.messages.fetch({ limit: 50 });
    const messagesArray = messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      author: msg.author.tag,
      authorId: msg.author.id,
      authorAvatar: msg.author.displayAvatarURL(),
      timestamp: msg.createdAt.toLocaleString(),
      editable: msg.author.id === client.user.id,
      attachments: msg.attachments.map(a => ({
        url: a.url,
        name: a.name,
        size: a.size,
        contentType: a.contentType
      })),
      embeds: msg.embeds,
      reactions: msg.reactions.cache.map(r => ({
        emoji: r.emoji.name,
        count: r.count,
        me: r.me
      })),
      reference: msg.reference ? {
        messageId: msg.reference.messageId,
        channelId: msg.reference.channelId
      } : null
    })).reverse();
    
    res.render('channel', { 
      channel, 
      messages: messagesArray, 
      serverId: req.params.serverId,
      user: client.user 
    });
  } catch (error) {
    res.status(500).send('Error fetching messages: ' + error.message);
  }
});

app.post('/send-message', upload.single('file'), async (req, res) => {
  const { channelId, message, replyTo } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const options = {};
    if (message) options.content = message;
    if (replyTo) options.reply = { messageReference: replyTo };
    if (req.file) options.files = [req.file.path];
    
    await channel.send(options);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/send-embed', async (req, res) => {
  const { channelId, title, description, color, footer, thumbnail, image, fields } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const embed = {
      title: title || undefined,
      description: description || undefined,
      color: color ? parseInt(color.replace('#', ''), 16) : undefined,
      footer: footer ? { text: footer } : undefined,
      thumbnail: thumbnail ? { url: thumbnail } : undefined,
      image: image ? { url: image } : undefined,
      fields: fields || undefined
    };
    
    await channel.send({ embeds: [embed] });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/edit-message', async (req, res) => {
  const { channelId, messageId, newContent } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = await channel.messages.fetch(messageId);
    if (message.author.id !== client.user.id) {
      return res.status(403).json({ error: 'Cannot edit messages from other users' });
    }
    
    await message.edit(newContent);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/delete-message', async (req, res) => {
  const { channelId, messageId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = await channel.messages.fetch(messageId);
    if (message.author.id !== client.user.id) {
      return res.status(403).json({ error: 'Cannot delete messages from other users' });
    }
    
    await message.delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/add-reaction', async (req, res) => {
  const { channelId, messageId, emoji } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const message = await channel.messages.fetch(messageId);
    await message.react(emoji);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-status', async (req, res) => {
  const { status } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setStatus(status);
    currentStatus = status;
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-custom-status', async (req, res) => {
  const { emoji, text, expiresAt } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const status = new CustomStatus(client)
      .setEmoji(emoji || '')
      .setState(text || '');
    
    if (expiresAt) {
      status.setExpiresAt(new Date(expiresAt));
    }
    
    await client.user.setPresence({ activities: [status] });
    currentActivities = [status];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-rpc', async (req, res) => {
  const { name, details, state, largeImage, largeText, smallImage, smallText, appId, buttons } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const rpc = new RichPresence(client)
      .setApplicationId(appId || '123456789012345678')
      .setType('PLAYING')
      .setName(name || 'Custom Activity')
      .setDetails(details || '')
      .setState(state || '')
      .setStartTimestamp(Date.now());
    
    if (largeImage) {
      rpc.setAssetsLargeImage(largeImage);
    }
    if (largeText) {
      rpc.setAssetsLargeText(largeText);
    }
    if (smallImage) {
      rpc.setAssetsSmallImage(smallImage);
    }
    if (smallText) {
      rpc.setAssetsSmallText(smallText);
    }
    if (buttons && buttons.length > 0) {
      rpc.setButtons(buttons);
    }
    
    await client.user.setPresence({ activities: [rpc] });
    currentActivities = [rpc];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-spotify', async (req, res) => {
  const { songName, artist, album, albumCoverUrl, duration, startTime } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const spotify = new SpotifyRPC(client)
      .setAssetsLargeImage(albumCoverUrl || 'spotify:1')
      .setDetails(songName || 'Song Name')
      .setState(artist || 'Artist Name')
      .setStartTimestamp(startTime || Date.now())
      .setEndTimestamp((startTime || Date.now()) + (duration || 180000));
    
    if (album) {
      spotify.setAssetsLargeText(album);
    }
    
    await client.user.setPresence({ activities: [spotify] });
    currentActivities = [spotify];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/clear-activities', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setPresence({ activities: [] });
    currentActivities = [];
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/dms', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const dmChannels = [];
  client.channels.cache.forEach(ch => {
    if (ch.type === 'DM' && ch.recipient) {
      dmChannels.push({
        id: ch.id,
        recipient: ch.recipient.tag,
        recipientAvatar: ch.recipient.displayAvatarURL({ dynamic: true }),
        recipientId: ch.recipient.id,
        lastMessageId: ch.lastMessageId
      });
    } else if (ch.type === 'GROUP_DM') {
      dmChannels.push({
        id: ch.id,
        name: ch.name || 'Group DM',
        recipients: ch.recipients ? ch.recipients.map(r => r.tag).join(', ') : '',
        icon: ch.iconURL() || '/default-icon.png'
      });
    }
  });
  
  res.render('dms', { dms: dmChannels, user: client.user });
});

app.get('/friends', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const friends = [];
  const pending = [];
  const blocked = [];
  
  if (client.relationships && client.relationships.cache) {
    client.relationships.cache.forEach(r => {
      const userData = {
        id: r.id,
        username: r.user.tag,
        avatar: r.user.displayAvatarURL({ dynamic: true }),
        type: r.type
      };
      
      if (r.type === 'FRIEND') {
        friends.push({
          ...userData,
          status: r.user.presence?.status || 'offline',
          activities: r.user.presence?.activities || []
        });
      } else if (r.type === 'PENDING_INCOMING') {
        pending.push(userData);
      } else if (r.type === 'PENDING_OUTGOING') {
        pending.push({ ...userData, outgoing: true });
      } else if (r.type === 'BLOCKED') {
        blocked.push(userData);
      }
    });
  }
  
  res.render('friends', { friends, pending, blocked, user: client.user });
});

app.post('/send-friend-request', async (req, res) => {
  const { username } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.sendFriendRequest(username);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/accept-friend-request', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const relationship = client.relationships.cache.get(userId);
    if (relationship) {
      await relationship.accept();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Friend request not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/remove-friend', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const relationship = client.relationships.cache.get(userId);
    if (relationship) {
      await relationship.delete();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Relationship not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/block-user', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.blockUser(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/unblock-user', async (req, res) => {
  const { userId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.unblockUser(userId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/voice', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const voiceChannels = [];
  client.guilds.cache.forEach(guild => {
    guild.channels.cache.forEach(ch => {
      if (ch.type === 'GUILD_VOICE' || ch.type === 'GUILD_STAGE_VOICE') {
        voiceChannels.push({
          id: ch.id,
          name: ch.name,
          type: ch.type,
          guildName: guild.name,
          guildId: guild.id,
          members: ch.members ? ch.members.size : 0,
          userLimit: ch.userLimit || 0
        });
      }
    });
  });
  
  const currentVoice = client.voice?.channel ? {
    id: client.voice.channel.id,
    name: client.voice.channel.name,
    guild: client.voice.channel.guild.name,
    muted: client.voice.mute || false,
    deafened: client.voice.deaf || false
  } : null;
  
  res.render('voice', { voiceChannels, currentVoice, user: client.user });
});

app.post('/join-voice', async (req, res) => {
  const { channelId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel || (channel.type !== 'GUILD_VOICE' && channel.type !== 'GUILD_STAGE_VOICE')) {
      return res.status(404).json({ error: 'Voice channel not found' });
    }
    
    await channel.join();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/leave-voice', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    if (client.voice?.channel) {
      await client.voice.channel.leave();
      res.json({ success: true });
    } else {
      res.status(400).json({ error: 'Not in a voice channel' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voice-mute', async (req, res) => {
  const { mute } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    if (client.voice?.connection) {
      await client.voice.setSelfMute(mute);
      res.json({ success: true, muted: mute });
    } else {
      res.status(400).json({ error: 'Not in a voice channel' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/voice-deafen', async (req, res) => {
  const { deafen } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    if (client.voice?.connection) {
      await client.voice.setSelfDeaf(deafen);
      res.json({ success: true, deafened: deafen });
    } else {
      res.status(400).json({ error: 'Not in a voice channel' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/invites', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const invites = [];
  for (const guild of client.guilds.cache.values()) {
    try {
      const guildInvites = await guild.invites.fetch();
      guildInvites.forEach(invite => {
        invites.push({
          code: invite.code,
          url: invite.url,
          guild: guild.name,
          channel: invite.channel?.name || 'Unknown',
          uses: invite.uses,
          maxUses: invite.maxUses,
          expiresAt: invite.expiresAt ? invite.expiresAt.toLocaleString() : 'Never',
          inviter: invite.inviter ? invite.inviter.tag : 'Unknown'
        });
      });
    } catch (err) {
      console.error(`Failed to fetch invites for ${guild.name}:`, err.message);
    }
  }
  
  res.render('invites', { invites, user: client.user });
});

app.post('/create-invite', async (req, res) => {
  const { channelId, maxAge, maxUses } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const invite = await channel.createInvite({
      maxAge: parseInt(maxAge) || 0,
      maxUses: parseInt(maxUses) || 0
    });
    
    res.json({ success: true, code: invite.code, url: invite.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/leave-server', async (req, res) => {
  const { serverId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const guild = client.guilds.cache.get(serverId);
    if (!guild) {
      return res.status(404).json({ error: 'Server not found' });
    }
    
    await guild.leave();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/user-info', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  res.render('user-info', { 
    user: client.user,
    nitroType: client.user.nitroType || 'None',
    premiumType: client.user.premiumType || 0,
    phone: client.user.phone || 'Not set',
    email: client.user.email || 'Not set',
    verified: client.user.verified,
    mfaEnabled: client.user.mfaEnabled || false,
    bio: client.user.bio || '',
    banner: client.user.bannerURL() || null,
    accentColor: client.user.accentColor || null
  });
});

app.post('/update-bio', async (req, res) => {
  const { bio } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setBio(bio);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-banner', async (req, res) => {
  const { banner } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setBanner(banner);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-accent-color', async (req, res) => {
  const { color } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setAccentColor(color);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-avatar', async (req, res) => {
  const { avatar } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setAvatar(avatar);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/update-hypesquad', async (req, res) => {
  const { house } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setHypeSquad(house);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/settings', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const settings = {
    theme: client.settings?.theme || 'dark',
    locale: client.settings?.locale || 'en-US',
    messageDisplay: client.settings?.messageDisplayCompact || false,
    inlineAttachmentMedia: client.settings?.inlineAttachmentMedia || true,
    inlineEmbedMedia: client.settings?.inlineEmbedMedia || true,
    gifAutoPlay: client.settings?.gifAutoPlay || true,
    renderEmbeds: client.settings?.renderEmbeds || true,
    renderReactions: client.settings?.renderReactions || true,
    animateEmoji: client.settings?.animateEmoji || true,
    enableTTSCommand: client.settings?.enableTTSCommand || false,
    showCurrentGame: client.settings?.showCurrentGame || true
  };
  
  res.render('settings', { settings, user: client.user });
});

app.post('/update-settings', async (req, res) => {
  const { setting, value } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.settings.edit({ [setting]: value });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/applications', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const applications = await client.fetchApplications() || [];
    res.render('applications', { applications, user: client.user });
  } catch (error) {
    res.render('applications', { applications: [], user: client.user, error: error.message });
  }
});

app.get('/billing', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const billingInfo = {
      premiumType: client.user.premiumType || 0,
      premiumGuildSince: client.user.premiumGuildSince || null
    };
    res.render('billing', { billing: billingInfo, user: client.user });
  } catch (error) {
    res.render('billing', { billing: {}, user: client.user, error: error.message });
  }
});

app.get('/webhooks/:guildId', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) {
      return res.status(404).send('Server not found');
    }
    
    const webhooks = await guild.fetchWebhooks();
    const webhookList = webhooks.map(wh => ({
      id: wh.id,
      name: wh.name,
      avatar: wh.avatarURL() || '/default-icon.png',
      channelId: wh.channelId,
      token: wh.token || 'Hidden',
      url: wh.url
    }));
    
    res.render('webhooks', { webhooks: webhookList, guild, user: client.user });
  } catch (error) {
    res.status(500).send('Error fetching webhooks: ' + error.message);
  }
});

app.post('/create-webhook', async (req, res) => {
  const { channelId, name, avatar } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
      return res.status(404).json({ error: 'Channel not found' });
    }
    
    const webhook = await channel.createWebhook(name, { avatar: avatar || undefined });
    res.json({ success: true, webhook: { id: webhook.id, url: webhook.url } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/delete-webhook', async (req, res) => {
  const { webhookId } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    const webhook = await client.fetchWebhook(webhookId);
    await webhook.delete();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/notes', async (req, res) => {
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  const notes = [];
  if (client.notes) {
    for (const [userId, note] of client.notes.cache) {
      try {
        const user = await client.users.fetch(userId);
        notes.push({
          userId,
          username: user.tag,
          avatar: user.displayAvatarURL(),
          note
        });
      } catch (err) {
        console.error(`Failed to fetch user ${userId}:`, err.message);
      }
    }
  }
  
  res.render('notes', { notes, user: client.user });
});

app.post('/set-note', async (req, res) => {
  const { userId, note } = req.body;
  
  if (!botReady) {
    return res.status(503).json({ error: 'Bot not ready' });
  }
  
  try {
    await client.user.setNote(userId, note);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Discord client events
client.on('ready', async () => {
  console.log(`\n✅ Successfully logged in as: ${client.user.tag}`);
  console.log(`📊 User ID: ${client.user.id}`);
  console.log(`🏰 Servers: ${client.guilds.cache.size}`);
  console.log(`👥 Friends: ${client.relationships?.cache?.filter(r => r.type === 'FRIEND').size || 0}`);
  console.log(`💎 Nitro Type: ${client.user.nitroType || 'None'}`);
  console.log(`\n🌐 Dashboard available at: http://0.0.0.0:${PORT}`);
  botReady = true;
});

client.on('messageCreate', async (message) => {
  // Auto-response or logging can be added here
  console.log(`[${message.channel.type}] ${message.author.tag}: ${message.content}`);
});

client.on('relationshipAdd', (relationship) => {
  console.log(`Relationship added: ${relationship.user.tag} (${relationship.type})`);
});

client.on('relationshipRemove', (relationship) => {
  console.log(`Relationship removed: ${relationship.user.tag} (${relationship.type})`);
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Dashboard server running on http://0.0.0.0:${PORT}`);
});

// Login to Discord
if (!DISCORD_TOKEN || DISCORD_TOKEN === 'YOUR_TOKEN_HERE') {
  console.error('❌ ERROR: No Discord token provided!');
  console.error('Please set your DISCORD_TOKEN in environment variables:');
  console.error('export DISCORD_TOKEN="your_token_here"');
  console.error('\n⚠️  WARNING: Selfbots violate Discord ToS - use at your own risk!');
  console.error('This tool is for educational purposes only.');
} else {
  console.log('🔐 Attempting to login to Discord...');
  client.login(DISCORD_TOKEN).catch(err => {
    console.error('❌ Failed to login:', err.message);
    console.error('\nPlease check:');
    console.error('1. Your token is correct and valid');
    console.error('2. The token is from a user account (not a bot)');
    console.error('3. The account is not locked or restricted');
  });
}

// Create upload directory
const fs = require('fs');
const uploadDir = '/tmp/uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}
