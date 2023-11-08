import secrets from "./secrets.json" assert { type: "json" }
import {
    InteractionType,
    InteractionResponseType,
    InteractionResponseFlags,
    MessageComponentTypes,
    ButtonStyleTypes,
} from "discord-interactions";

export function scheduleMatch(components, res){
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
  
export function faceitStatsSearch(components, res){
    console.log(components[0].components[0].value)
    console.log(components[1].components[0].value)
    console.log(components[2].components[0].value)
    const userName = components[0].components[0].value;
    let historyLength = parseInt(components[1].components[0].value) || 20;
    let gameName = components[2].components[0].value;
  
    if (historyLength > 100) historyLength = 100;
    if(gameName != 'cs2' && gameName != 'csgo') gameName = 'cs2';
  
    makeFaceitAPICall("https://open.faceit.com/data/v4/search/players?nickname=" + userName)
      .then(function (template) {
        template = JSON.parse(template);
        const playerId = template.items[0].player_id
        const endpoint = `https://open.faceit.com/data/v4/players/${playerId}/games/${gameName}/stats?offset=0&limit=${historyLength}`
        console.log('faceitStatsSearch', userName, playerId, template)
        makeFaceitAPICall(endpoint)
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
                content: `### [${userName}](<https://www.faceit.com/en/players/${userName}>)'s last ${template.items.length} ${gameName} matches\nKills: ${stats.Kills}\nDeaths: ${stats.Deaths}
K/D Ratio: ${stats.KDR.toFixed(2)}\nHeadshot Percentage: ${(stats.HeadshotPercent.toFixed(2)) * 100}%
Win Rate: ${stats.WinRate.toFixed(2) * 100}%`
                }
            });
        });
    });
}

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