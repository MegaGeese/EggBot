import {
    InteractionType,
    InteractionResponseType,
    InteractionResponseFlags,
    MessageComponentTypes,
    ButtonStyleTypes,
} from "discord-interactions";

export function faceitStatsModal(req, res) {
    
    // Send a message into the channel where command was triggered from
    const userId = req.body.member.user.id;
    const guildId = req.body.channel.guild_id
    console.log("faceit_stats", userId, guildId)

    return res.send({
    type: InteractionResponseType.MODAL,
    data: {
        title: "Submit Player for Judgement",
        custom_id: "faceit_stats",
        components: [
        {
            type: 1,
            components: [
            {
                type: 4,
                custom_id: "name",
                label: "Name",
                style: 1,
                min_length: 1,
                max_length: 4000,
                placeholder: "MegaGeese",
                required: true,
            }
            ],
        },
        {
            type: 1,
            components: [
            {
                type: 4,
                custom_id: "historyLength",
                label: "Number of Matches",
                style: 1,
                min_length: 1,
                max_length: 3,
                placeholder: "20",
                required: false,
            },
            ],
        },
        {
            type: 1,
            components: [
            {
                type: 4,
                custom_id: "gameName",
                label: "Game",
                style: 1,
                min_length: 1,
                max_length: 300,
                placeholder: "cs2",
                required: false,
            },
            ],
        },
        ],
    },
    });
}

export function scheduleMatchModal(req, res) {
    // Send a message into the channel where command was triggered from
    const userId = req.body.member.user.id;
    const guildId = req.body.channel.guild_id
    console.log(guildId)

    return res.send({
      type: InteractionResponseType.MODAL,
      data: {
        title: "Submit Match Page",
        custom_id: "schedule_match",
        components: [
          {
            type: 1,
            components: [
              {
                type: 4,
                custom_id: "name",
                label: "Name",
                style: 1,
                min_length: 1,
                max_length: 4000,
                placeholder: "https://www.faceit.com",
                required: true,
              },
            ],
          },
        ],
      },
    });
}