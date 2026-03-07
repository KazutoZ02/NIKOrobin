const { Events, ChannelType, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`[Command Error] No command matching ${interaction.commandName} was found.`);
                return;
            }

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`[Command Error] Failed to execute ${interaction.commandName}:`, error);
                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
                } else {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                }
            }
        } else if (interaction.isButton()) {
            if (interaction.customId === 'create_ticket') {
                const { guild, user } = interaction;

                // Let user know their request is processing
                await interaction.reply({ content: 'Creating your ticket...', ephemeral: true });

                try {
                    // Determine the category to place the channel in
                    const categoryId = config.ticketCategoryId;
                    let parentOption = categoryId ? { parent: categoryId } : {};

                    const permissionOverwrites = [
                        {
                            id: guild.roles.everyone.id,
                            deny: [PermissionsBitField.Flags.ViewChannel],
                        },
                        {
                            id: user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        },
                        {
                            id: interaction.client.user.id,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        }
                    ];

                    if (config.supportRoleId) {
                        permissionOverwrites.push({
                            id: config.supportRoleId,
                            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
                        });
                    }

                    // Create the private text channel
                    const ticketChannel = await guild.channels.create({
                        name: `ticket-${user.username}`,
                        type: ChannelType.GuildText,
                        ...parentOption,
                        permissionOverwrites: permissionOverwrites
                    });

                    // Embed for the new ticket channel
                    const ticketEmbed = new EmbedBuilder()
                        .setTitle('Support Ticket')
                        .setDescription(`Hello ${user}, welcome to your ticket. A member of our support team will be with you shortly.\n\nTo close this ticket, click the button below.`)
                        .setColor('#00ff00')
                        .setTimestamp();

                    const closeRow = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('close_ticket')
                                .setLabel('Close Ticket')
                                .setStyle(ButtonStyle.Danger)
                                .setEmoji('🔒'),
                        );

                    const pingText = config.supportRoleId ? `<@&${config.supportRoleId}> ${user}` : `${user}`;
                    await ticketChannel.send({ content: pingText, embeds: [ticketEmbed], components: [closeRow] });

                    // Update the ephemeral reply
                    await interaction.editReply({ content: `Your ticket has been created: ${ticketChannel}` });
                } catch (error) {
                    console.error('[Ticket Error] Failed to create ticket channel:', error);
                    await interaction.editReply({ content: 'Sorry, there was an error creating your ticket.' });
                }
            } else if (interaction.customId === 'close_ticket') {
                // Must have permission or be the bot? Usually anyone inside can close,
                // or we check if user is admin / has support role. Here we just let anyone in the channel close it.

                await interaction.reply({ content: 'Closing ticket in 5 seconds...', ephemeral: false });

                setTimeout(async () => {
                    try {
                        await interaction.channel.delete();
                    } catch (error) {
                        console.error('[Ticket Error] Failed to close ticket:', error);
                        if (interaction.channel) {
                            await interaction.channel.send('Failed to close the channel automatically. An admin may need to delete it manually.');
                        }
                    }
                }, 5000);
            }
        }
    },
};
