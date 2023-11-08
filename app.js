import "dotenv/config";
import express from "express";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";
import {
  VerifyDiscordRequest,
  getRandomEmoji,
  DiscordRequest,
} from "./utils.js";
import { Events, ModalBuilder } from "discord.js";
import fetch from "node-fetch";

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

// Store for in-progress games. In production, you'd want to use a DB
const activeGames = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  const { type, id, data } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash command requests
   * See https://discord.com/developers/docs/interactions/application-commands#slash-commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    // "test" command
    if (name === "schedule_match") {
      // Send a message into the channel where command was triggered from
      const userId = req.body.member.user.id;
      const guildId = req.body.channel.guild_id
      console.log(guildId)

      return res.send({
        type: InteractionResponseType.MODAL,
        data: {
          title: "Submit Match Page",
          custom_id: guildId,
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
  }

  if (type === InteractionType.MODAL_SUBMIT) {
    const { components } = data;
    const matchScheduleChannelId = ''
    if (components[0].components[0].value) {
      const matchPage = components[0].components[0].value;
      const matchID = matchPage.split("/room/")[1];
      fetch("https://open.faceit.com/data/v4/matches/" + matchID, {
        headers: {
          Authorization: `Bearer ${process.env.FACEIT_CLIENT}`,
        },
      })
        .then(function (response) {
          switch (response.status) {
            // status "OK"
            case 200:
              return response.text();
            // status "Not Found"
            case 404:
              throw response;
          }
        })
        .then(function (template) {
          template = JSON.parse(template);
          const team1 = template.teams.faction1;
          const team2 = template.teams.faction2;
          const tournament = template.competition_name;
          DiscordRequest(`channels/${process.env.MATCH_SCHEDULE_CHANNEL_ID}/messages`, {
            method: "POST",
            body: {
              content: `${team1.name} vs ${team2.name}\n${tournament}\nScheduled for <t:${template.scheduled_at}:f>\n[Match Page](<${matchPage}>)\n`,
            },
          });
          return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE});
        });
    }
  }
});

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
