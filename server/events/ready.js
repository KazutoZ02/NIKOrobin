const { Events, REST, Routes } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`[Discord Logged In] Ready! Logged in as ${client.user.tag}`);

        // Register slash commands on ready
        if (config.clientId && config.discordToken && config.guildId) {
            const rest = new REST({ version: '10' }).setToken(config.discordToken);
            const commandsData = client.commands.map(command => command.data.toJSON());

            try {
                console.log(`[Command Registration] Started refreshing ${commandsData.length} application (/) commands.`);

                const data = await rest.put(
                    Routes.applicationGuildCommands(config.clientId, config.guildId),
                    { body: commandsData },
                );

                console.log(`[Command Registration] Successfully reloaded ${data.length} application (/) commands.`);
            } catch (error) {
                console.error(`[Command Registration Error]`, error);
            }
        } else {
            console.warn(`[Command Registration Warning] Missing clientId, discordToken or guildId in environment variables. Commands not registered.`);
        }
    },
};
