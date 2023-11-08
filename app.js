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
  DiscordRequest,
} from "./utils.js";
import fetch from "node-fetch";
import secrets from "./secrets.json" assert { type: "json" }

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(secrets.PUBLIC_KEY) }));

app.get('/', (req, res) => res.send('Hello World'));

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  console.log('interactions');
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
    // "schedule_match" command
    if (name === "schedule_match") {
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

    if (name === "faceit_stats") {
      // Send a message into the channel where command was triggered from
      const userId = req.body.member.user.id;
      const guildId = req.body.channel.guild_id
      console.log(guildId)

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
    const custom_id = data.custom_id

    if(custom_id == "schedule_match") scheduleMatch(components);
    if(custom_id == "faceit_stats") faceitStatsSearch(components, res);
  }
});

async function makeFaceitAPICall(endpoint){
  const response = await fetch(endpoint, {
    headers: {
      Authorization: `Bearer ${secrets.FACEIT_CLIENT}`,
    },
  });
  switch (response.status) {
    // status "OK"
    case 200:
      return response.text();
    // status "Not Found"
    case 404:
      throw response;
  }
}

function scheduleMatch(components){
  if (components[0].components[0].value) {
    const matchPage = components[0].components[0].value;
    const matchID = matchPage.split("/room/")[1];
    makeFaceitAPICall("https://open.faceit.com/data/v4/matches/" + matchID)
      .then(function (template) {
        template = JSON.parse(template);
        const team1 = template.teams.faction1;
        const team2 = template.teams.faction2;
        const tournament = template.competition_name;
        console.log('scheduleMatch', tournament, matchID)
        DiscordRequest(`channels/${secrets.MATCH_SCHEDULE_CHANNEL_ID}/messages`, {
          method: "POST",
          body: {
            content: `${team1.name} vs ${team2.name}\n${tournament}\nScheduled for <t:${template.scheduled_at}:f>\n[Match Page](<${matchPage}>)\n`,
          },
        });
        return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE});
      });
  }
}

function faceitStatsSearch(components, res){
  if (components[0].components[0].value) {
    const userName = components[0].components[0].value;
    makeFaceitAPICall("https://open.faceit.com/data/v4/search/players?nickname=" + userName)
      .then(function (template) {
        template = JSON.parse(template);
        const playerId = template.items[0].player_id
        console.log('faceitStatsSearch', userName, playerId, template)
        makeFaceitAPICall(`https://open.faceit.com/data/v4/players/${playerId}/games/cs2/stats?offset=0&limit=20`)
          .then(function (template) {
            template = JSON.parse(template)
            const stats = {
              Kills: 0,
              Deaths: 0,
              HeadshotPercent: 0,
              KDR: 0,
              Wins: 0,
            }
            for(const item of template.items) {
              stats.Kills += parseInt(item.stats.Kills);
              stats.Deaths += parseInt(item.stats.Deaths);
              stats.HeadshotPercent += parseInt(item.stats.Headshots);
              stats.KDR += parseFloat(item.stats["K/D Ratio"]);
              stats.Wins += parseInt(item.stats.Result);
            }
            stats.HeadshotPercent /= stats.Kills;
            stats.KDR = stats.KDR / template.items.length;
            stats.WinRate = stats.Wins / template.items.length;
            return res.send({
              type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
              data: {
                content: `### [${userName}](<https://www.faceit.com/en/players/${userName}>)'s last ${template.items.length} matches\nKills: ${stats.Kills}\nDeaths: ${stats.Deaths}
K/D Ratio: ${stats.KDR.toFixed(2)}\nHeadshot Percentage: ${(stats.HeadshotPercent.toFixed(2)) * 100}%
Win Rate: ${stats.WinRate.toFixed(2) * 100}%`
              }
            });
          });
      });
  }
}

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
