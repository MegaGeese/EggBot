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
  
export async function faceitStatsSearch(components, res){
    const userName = components[0].components[0].value;
    let historyLength = parseInt(components[1].components[0].value) || 20;
    let gameName = components[2].components[0].value;
  
    if (historyLength > 100) historyLength = 100;
    if(gameName != 'cs2' && gameName != 'csgo') gameName = 'cs2';
    console.log(userName, historyLength, gameName)

    const apiReturn = await retryRequest("https://open.faceit.com/data/v4/search/players?nickname=" + userName, 3)
    const template = JSON.parse(apiReturn);
    const playerId = template.items[0].player_id
    const playerAvatar = template.items[0].avatar
    const playerLevel = template.items[0].games.find(x => x.name = gameName).skill_level;
    const iconUrl = `https://megageese.com/faceit${playerLevel}.png`
    const endpoint = `https://open.faceit.com/data/v4/players/${playerId}/games/${gameName}/stats?offset=0&limit=${historyLength}`
    console.log('faceitStatsSearch', userName, playerId)
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
            embeds: [
              {
                "type": "rich",
                "title": `${userName}'s last ${template.items.length} ${gameName} matches`,
                "description": `Kills: ${stats.Kills}\nDeaths: ${stats.Deaths}\nK/D Ratio: ${stats.KDR.toFixed(2)}\nHeadshot Percentage: ${(stats.HeadshotPercent * 100).toFixed(2)}%\nWin Rate: ${(stats.WinRate * 100).toFixed(2)}%`,
                "color": 0xff5500,
                "thumbnail": {
                  "url": playerAvatar,
                  "height": 0,
                  "width": 0
                },
                "footer": {
                  "text": `Level ${playerLevel}`,
                  "icon_url": iconUrl
                },
                "url": `https://www.faceit.com/en/players/MegaGeese`
              }
            ]
          }
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

async function retryRequest(endpoint, times){
  for(let i = 0; i < times; i++){
    const faceitResult = await makeFaceitAPICall(endpoint)
    if(faceitResult) return faceitResult;
  }
  return undefined;
}