const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Replies with Pong!'),
	async execute(interaction) {
		await interaction.reply('Pong!');
	},
};

return res.send({
	type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
	data: {
	  // Fetches a random emoji to send from a helper function
	  content: `Upcoming match: ${tournament}\n${team1.name} vs ${team2.name}\nScheduled for <t:${template.scheduled_at}:f>\nLink: ${matchPage}`,
	},
  });