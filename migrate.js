// ⚠️ USE AT YOUR OWN RISK - EDUCATIONAL PURPOSES ONLY ⚠️
// 
// Discord Terms of Service strictly prohibit selfbots and automation of user accounts.
// Using this tool may result in account termination.
// This code is provided for educational purposes only.
// The authors are not responsible for any consequences of using this tool.

const { Client, MessageAttachment } = require('discord.js-selfbot-v13');
const fetch = require('node-fetch'); // npm i node-fetch@2
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

// ============ CONFIGURATION ============
const TOKEN = ''; // your user token here
const SOURCE_GUILD_ID = ''; // source server ID
const TARGET_GUILD_ID = ''; // target server ID

// ============ TWEAKS ============
const MESSAGE_BATCH_LIMIT = 100;
const SEND_DELAY_MS = 1200; // Delay between sending messages
const ATTACHMENT_DOWNLOAD_DELAY_MS = 300; // Delay between downloading attachments
const TEMP_DIR = path.join(os.tmpdir(), 'guild-migrate-temp');
const ENABLE_FORWARDED_MESSAGES = true; // Copy forwarded message metadata
const ENABLE_EMBEDS = true; // Copy message embeds
const ENABLE_STICKERS = true; // Note stickers (can't reupload)

// ============ UTILITY FUNCTIONS ============
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function displayWarning() {
  console.log('\n' + '='.repeat(80));
  console.log('⚠️  WARNING: USE AT YOUR OWN RISK ⚠️');
  console.log('='.repeat(80));
  console.log('This tool automates a user account, which violates Discord Terms of Service.');
  console.log('Using this tool may result in:');
  console.log('  - Account suspension or termination');
  console.log('  - Rate limiting or API restrictions');
  console.log('  - Legal consequences');
  console.log('\nThis code is provided for EDUCATIONAL PURPOSES ONLY.');
  console.log('The authors assume NO responsibility for any consequences.');
  console.log('='.repeat(80) + '\n');
}

// ============ CLIENT SETUP ============
const client = new Client();

/**
 * Fetch all messages from a channel (reverse chronological to chronological)
 */
async function fetchAllMessages(channel) {
  let all = [];
  let lastId;
  
  console.log(`  Fetching messages...`);
  
  while (true) {
    const options = { limit: MESSAGE_BATCH_LIMIT };
    if (lastId) options.before = lastId;
    
    const fetched = await channel.messages.fetch(options).catch(() => null);
    if (!fetched || fetched.size === 0) break;
    
    all = all.concat(Array.from(fetched.values()));
    lastId = fetched.last().id;
    
    if (fetched.size < MESSAGE_BATCH_LIMIT) break;
    await sleep(400);
  }
  
  return all.reverse(); // Oldest first
}

/**
 * Download an attachment from a URL to a temporary file
 */
async function downloadAttachment(url, filenameHint) {
  await fs.mkdir(TEMP_DIR, { recursive: true });
  
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status} ${res.statusText}`);
  
  const filename = filenameHint || path.basename(new URL(url).pathname);
  const tmpPath = path.join(TEMP_DIR, `${Date.now()}-${Math.random().toString(36).slice(2)}-${filename}`);
  const buffer = await res.arrayBuffer();
  await fs.writeFile(tmpPath, Buffer.from(buffer));
  
  return { tmpPath, filename };
}

/**
 * Safe send with retry logic
 */
async function safeSend(channel, content, files) {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      return await channel.send({ content, files });
    } catch (err) {
      console.warn(`  Send failed (attempt ${attempt + 1}/5): ${err.message}`);
      await sleep(1500);
    }
  }
  console.error(`  Failed to send message after 5 attempts`);
  return null;
}

/**
 * Format message content with metadata including forwarded message info
 */
function formatMessageContent(msg) {
  const ts = Math.floor(msg.createdTimestamp / 1000);
  let header = `**Originally by ${msg.author.tag}** (<t:${ts}:F>)`;
  
  // Detect and format forwarded messages
  if (ENABLE_FORWARDED_MESSAGES && msg.type === 'REPLY') {
    if (msg.reference && msg.reference.messageId) {
      header += `\n*↪️ This was a reply to another message*`;
    }
  }
  
  // Check if the message was forwarded (heuristic: contains forward metadata)
  // Note: discord.js-selfbot-v13 may expose message.messageReference for forwards
  if (ENABLE_FORWARDED_MESSAGES && msg.messageReference) {
    const ref = msg.messageReference;
    header += `\n*📨 Forwarded message (from channel ${ref.channelId})*`;
  }
  
  // Check for message edits
  if (msg.editedTimestamp) {
    const editTs = Math.floor(msg.editedTimestamp / 1000);
    header += `\n*✏️ Last edited: <t:${editTs}:R>*`;
  }
  
  let content = header;
  
  // Add original message content
  if (msg.content) {
    content += `\n\n${msg.content}`;
  }
  
  // Note about embeds
  if (ENABLE_EMBEDS && msg.embeds && msg.embeds.length > 0) {
    content += `\n\n*📎 Original message contained ${msg.embeds.length} embed(s)*`;
    
    // Try to preserve embed information
    for (const embed of msg.embeds) {
      if (embed.title || embed.description) {
        content += `\n\n**Embed:** ${embed.title || 'Untitled'}`;
        if (embed.description) {
          // Truncate long descriptions
          const desc = embed.description.length > 200 
            ? embed.description.substring(0, 200) + '...' 
            : embed.description;
          content += `\n${desc}`;
        }
        if (embed.url) {
          content += `\n🔗 ${embed.url}`;
        }
      }
    }
  }
  
  // Note about stickers
  if (ENABLE_STICKERS && msg.stickers && msg.stickers.size > 0) {
    const stickerNames = Array.from(msg.stickers.values()).map(s => s.name).join(', ');
    content += `\n\n*🎨 Original message had sticker(s): ${stickerNames}*`;
  }
  
  return content;
}

/**
 * Main migration logic
 */
client.on('ready', async () => {
  displayWarning();
  
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log(`Starting migration process...\n`);

  // Validate guilds
  const sourceGuild = client.guilds.cache.get(SOURCE_GUILD_ID);
  const targetGuild = client.guilds.cache.get(TARGET_GUILD_ID);
  
  if (!sourceGuild || !targetGuild) {
    console.error('❌ Invalid guild IDs. Please check SOURCE_GUILD_ID and TARGET_GUILD_ID.');
    process.exit(1);
  }

  console.log(`📥 Source: ${sourceGuild.name}`);
  console.log(`📤 Target: ${targetGuild.name}\n`);

  // Get all text channels from source
  const srcChannels = sourceGuild.channels.cache.filter(c => c.type === 'GUILD_TEXT');
  console.log(`Found ${srcChannels.size} text channels in source guild.\n`);

  // Map source channels to target channels (by name)
  const channelMap = new Map();
  const tgtChannels = targetGuild.channels.cache.filter(c => c.type === 'GUILD_TEXT');

  console.log('📋 Mapping channels...');
  for (const [id, srcCh] of srcChannels) {
    let tgt = tgtChannels.find(c => c.name === srcCh.name);
    
    // Create channel if it doesn't exist
    if (!tgt) {
      console.log(`  Creating channel: #${srcCh.name}`);
      tgt = await targetGuild.channels
        .create(srcCh.name, { 
          type: 'GUILD_TEXT', 
          topic: srcCh.topic || null,
          nsfw: srcCh.nsfw || false
        })
        .catch(err => {
          console.warn(`  Failed to create channel ${srcCh.name}: ${err.message}`);
          return null;
        });
      await sleep(500);
    }
    
    if (tgt) {
      channelMap.set(id, tgt);
      console.log(`  ✓ Mapped #${srcCh.name}`);
    }
  }

  console.log(`\n📨 Starting message migration...\n`);

  // Migrate messages for each channel
  for (const [id, srcCh] of srcChannels) {
    const tgt = channelMap.get(id);
    if (!tgt) {
      console.log(`⏭️  Skipping #${srcCh.name} (no target channel)`);
      continue;
    }

    console.log(`\n🔄 Processing: #${srcCh.name} → #${tgt.name}`);
    
    const messages = await fetchAllMessages(srcCh);
    console.log(`  Found ${messages.length} message(s) to copy`);

    if (messages.length === 0) {
      console.log(`  ✓ Channel empty, skipping`);
      continue;
    }

    let copied = 0;
    let failed = 0;

    for (const msg of messages) {
      try {
        // Format message with metadata
        const content = formatMessageContent(msg);

        // Download attachments
        const files = [];
        if (msg.attachments.size > 0) {
          console.log(`  ⬇️  Downloading ${msg.attachments.size} attachment(s)...`);
          
          for (const att of msg.attachments.values()) {
            try {
              const { tmpPath, filename } = await downloadAttachment(att.url, att.name);
              files.push(new MessageAttachment(tmpPath, filename));
              await sleep(ATTACHMENT_DOWNLOAD_DELAY_MS);
            } catch (err) {
              console.warn(`    ⚠️  Attachment download failed: ${err.message}`);
            }
          }
        }

        // Send message
        const sent = await safeSend(tgt, content, files);
        
        if (sent) {
          copied++;
          console.log(`  ✓ Copied message ${copied}/${messages.length}`);
        } else {
          failed++;
        }

        // Clean up temporary files
        for (const file of files) {
          try {
            await fs.unlink(file.attachment).catch(() => {});
          } catch {}
        }

        // Rate limiting
        await sleep(SEND_DELAY_MS);
      } catch (err) {
        failed++;
        console.error(`  ❌ Error copying message: ${err.message}`);
      }
    }

    console.log(`  ✅ Channel complete: ${copied} copied, ${failed} failed`);
  }

  console.log('\n' + '='.repeat(80));
  console.log('✅ Migration complete!');
  console.log('='.repeat(80));
  console.log('\nCleaning up temporary files...');
  
  await fs.rm(TEMP_DIR, { recursive: true, force: true }).catch(() => {});
  
  console.log('Done. Exiting.\n');
  process.exit(0);
});

// Error handling
client.on('error', (error) => {
  console.error('Client error:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled promise rejection:', error);
});

// Start the client
console.log('Starting Discord client...');
client.login(TOKEN).catch((err) => {
  console.error('Failed to login:', err.message);
  console.error('Please check your TOKEN in the configuration.');
  process.exit(1);
});
