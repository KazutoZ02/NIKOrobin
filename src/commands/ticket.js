// src/commands/ticket.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, AttachmentBuilder } = require('discord.js');
const {
    GUILD_ID,
    BANNER_IMAGE,
    imageExists,
    loadTicketData,
    saveTicketData
} = require('../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Create a support ticket')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('Ticket title')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('description')
                .setDescription('Describe your issue')
                .setRequired(true)
        ),
    
    async execute(interaction) {
        // Only respond in the configured guild
        if (interaction.guildId !== GUILD_ID) {
            return interaction.reply({
                content: '⚠️ This command is only available in the designated server!',
                ephemeral: true
            });
        }
        
        const guild = interaction.guild;
        const user = interaction.user;
        const title = interaction.options.getString('title');
        const description = interaction.options.getString('description');
        
        // Get settings
        const data = loadTicketData();
        const settings = data.settings;
        
        // Check if user can create ticket
        if (settings.createRoles && settings.createRoles.length > 0) {
            const userRoleIds = user.roles.cache.map(r => r.id);
            const hasPermission = settings.createRoles.some(roleId => userRoleIds.includes(roleId));
            
            if (!hasPermission) {
                return interaction.reply({
                    content: '❌ You don\'t have permission to create tickets!',
                    ephemeral: true
                });
            }
        }
        
        // Check if user already has an open ticket
        const userTickets = Object.values(data.tickets).filter(
            ticket => ticket.userId === user.id && ticket.status === 'open'
        );
        
        if (userTickets.length > 0) {
            return interaction.reply({
                content: '⚠️ You already have an open ticket! Please close it first.',
                ephemeral: true
            });
        }
        
        // Find or create ticket category
        let category = guild.channels.cache.find(c => c.type === ChannelType.GuildCategory && c.name === '🎫 Tickets');
        
        if (!category) {
            category = await guild.channels.create({
                name: '🎫 Tickets',
                type: ChannelType.GuildCategory
            });
        }
        
        // Create ticket number
        const ticketNumber = Object.keys(data.tickets).length + 1;
        
        // Create channel name
        const channelName = `ticket-${ticketNumber}-${user.username.toLowerCase()}`;
        
        // Permission overwrites
        const overwrites = [
            {
                id: guild.id,
                deny: [PermissionFlagsBits.ViewChannel]
            },
            {
                id: user.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.EmbedLinks,
                    PermissionFlagsBits.AttachFiles,
                    PermissionFlagsBits.ReadMessageHistory
                ]
            },
            {
                id: guild.me.id,
                allow: [
                    PermissionFlagsBits.ViewChannel,
                    PermissionFlagsBits.SendMessages,
                    PermissionFlagsBits.ManageMessages
                ]
            }
        ];
        
        // Add claim role permissions
        if (settings.claimRoles && settings.claimRoles.length > 0) {
            for (const roleId of settings.claimRoles) {
                const role = guild.roles.cache.get(roleId);
                if (role) {
                    overwrites.push({
                        id: role.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageMessages
                        ]
                    });
                }
            }
        }
        
        // Create ticket channel
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: category.id,
            topic: `Ticket for ${user.username}`,
            permissionOverwrites: overwrites
        });
        
        // Save ticket data
        const ticketId = ticketChannel.id;
        data.tickets[ticketId] = {
            ticketNumber: ticketNumber,
            userId: user.id,
            userName: user.username,
            title: title,
            description: description,
            status: 'open',
            createdAt: new Date().toISOString(),
            claimedBy: null,
            channelId: ticketChannel.id
        };
        saveTicketData(data);
        
        // Create ticket embed
        const embed = {
            title: `🎫 Ticket #${ticketNumber}: ${title}`,
            description: description,
            color: 0x00ff00,
            fields: [
                {
                    name: '👤 Created by',
                    value: user.toString(),
                    inline: true
                },
                {
                    name: '📊 Status',
                    value: '🟢 Open',
                    inline: true
                },
                {
                    name: '📝 Claim',
                    value: 'Use `/ticket-claim` to assign this ticket',
                    inline: false
                }
            ],
            footer: {
                text: "Niko Robin's Crew",
                icon_url: interaction.client.user.displayAvatarURL()
            },
            timestamp: new Date().toISOString()
        };
        
        // Send message to ticket channel
        const hasBanner = imageExists(BANNER_IMAGE);
        
        if (hasBanner) {
            const attachment = new AttachmentBuilder(BANNER_IMAGE, { name: 'banner.jpg' });
            embed.image = { url: 'attachment://banner.jpg' };
            
            await ticketChannel.send({
                content: `${user.toString()} Your ticket has been created!`,
                embeds: [embed],
                files: [attachment]
            });
        } else {
            await ticketChannel.send({
                content: `${user.toString()} Your ticket has been created!`,
                embeds: [embed]
            });
        }
        
        // Confirm to user
        await interaction.reply({
            content: `✅ Ticket created! Check ${ticketChannel.toString()}`,
            ephemeral: true
        });
        
        console.log(`🎫 Ticket #${ticketNumber} created by ${user.username}`);
    }
};
