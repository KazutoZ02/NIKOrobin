const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  rest: { timeout: 30000 }
});

let isReady = false;

const initializeBot = async () => {
  if (!process.env.DISCORD_BOT_TOKEN) {
    console.log('[Bot] No bot token provided, skipping bot initialization');
    return;
  }

  try {
    await client.login(process.env.DISCORD_BOT_TOKEN);
    console.log(`[Bot] Logged in as ${client.user.tag}`);
    isReady = true;
  } catch (error) {
    console.error('[Bot] Login failed:', error.message);
  }
};

client.on('ready', () => {
  console.log(`[Bot] ${client.user.tag} is ready!`);
  isReady = true;
});

client.on('error', (error) => {
  console.error('[Bot] Error:', error.message);
});

client.on('shardError', (error, shardId) => {
  console.error(`[Bot] Shard ${shardId} error:`, error.message);
});

// Function to send payment confirmation embed
const sendPaymentEmbed = async (paymentData) => {
  if (!isReady || !client.isReady()) {
    console.log('[Bot] Client not ready, queuing embed');
    return;
  }

  const channelId = process.env.DISCORD_PAYMENT_CHANNEL_ID;
  if (!channelId) {
    console.log('[Bot] No payment channel configured');
    return;
  }

  const channel = client.channels.cache.get(channelId);
  if (!channel) {
    console.log('[Bot] Payment channel not found');
    return;
  }

  const { user, service, game, amount, currency, paymentMethod } = paymentData;

  const embed = new EmbedBuilder()
    .setTitle('👑 Royal Paradise Payment Confirmed')
    .setColor(0xff69b4)
    .setThumbnail(user.avatar ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.avatar}.png` : null)
    .addFields(
      { name: 'User', value: `[${user.username}](https://discord.com/users/${user.discordId})`, inline: true },
      { name: 'Service', value: service, inline: true },
      { name: 'Game', value: game, inline: true },
      { name: 'Amount', value: `${currency === 'INR' ? '₹' : '$'}${amount}`, inline: true },
      { name: 'Payment Method', value: paymentMethod, inline: true },
      { name: 'Verification', value: '✅ Paid', inline: true }
    )
    .setFooter({ text: 'Royal\'s Paradise 💕' })
    .setTimestamp();

  // Add background image if available
  const backgroundUrl = process.env.BACKGROUND_IMAGE_URL;
  if (backgroundUrl) {
    embed.setImage(backgroundUrl);
  }

  try {
    await channel.send({ embeds: [embed] });
    console.log(`[Bot] Payment embed sent for user: ${user.username}`);
  } catch (error) {
    console.error('[Bot] Failed to send embed:', error.message);
  }
};

module.exports = { client, initializeBot, sendPaymentEmbed };
