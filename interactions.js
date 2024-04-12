import secrets from "./secrets.json" assert { type: "json" }
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
  FaceitRequest,
} from "./utils.js";

const eseaColor = 0x0e9648;
const faceitColor = 0xfe5f15

export async function scheduleMatch(components, res){
  if (components[0].components[0].value) {
    const matchPage = components[0].components[0].value;
    const matchID = matchPage.split("/room/")[1];
    const apiReturn = await FaceitRequest("matches/" + matchID)
    const template = await apiReturn.json();
    const faction1IsPrimary = secrets.TEAMS.includes(template.teams.faction1.name)
    const team1 = faction1IsPrimary ? template.teams.faction1 : template.teams.faction2;
    const team2 = faction1IsPrimary ? template.teams.faction2 : template.teams.faction1;
    const tournament = template.competition_name;
    const thumbnail = team1.avatar

    console.log('scheduleMatch', tournament, matchID)
    DiscordRequest(`channels/${secrets.MATCH_SCHEDULE_CHANNEL_ID}/messages`, {
      method: "POST",
      body: {
        "embeds": [
          {
            "type": "rich",
            "title": `${team1.name} vs ${team2.name}`,
            "description": `<t:${template.scheduled_at}:f>`,
            "color": eseaColor,
            "thumbnail": {
              "url": thumbnail,
              "height": 0,
              "width": 0
            },
            "footer": {
              "text": tournament,
              "icon_url": `https://yt3.googleusercontent.com/ytc/APkrFKb2fvigvHueJFjTlJ_d0J-DscBgX5mXQxhs_Xj-dA=s900-c-k-c0x00ffffff-no-rj`
            },
            "url": matchPage
          }
        ]
      },
    });
    return res.send({type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE});
  }
}

export async function updateMatch(components, res){
  const messageFetch = await DiscordRequest(`channels/${secrets.MATCH_SCHEDULE_CHANNEL_ID}/messages/${components.target_id}`, {
    method: "GET"
  })
  const message = await messageFetch.json();
  updateSingleMatch(message);
  return res.send({type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE});
}

export async function updateAllMatches(components, res){
  const messagesFetch = await DiscordRequest(`channels/${secrets.MATCH_SCHEDULE_CHANNEL_ID}/messages`, {
    method: "GET"
  })
  const messages = await messagesFetch.json();
  for(const message of messages){
    const scheduledMatchTime = parseInt(message.embeds[0].description.split('<t:')[1].split(':f>')[0]);
    if(scheduledMatchTime < Date.now() / 1000);
      updateSingleMatch(message);
  }
  return res.send({type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE});
}

async function updateSingleMatch(message){
  if(!message.embeds) return;
  let embed = message.embeds[0];
  const matchID = embed.url.split("/room/")[1];
  const apiReturn = await FaceitRequest("matches/" + matchID + '/stats')
  const template = await apiReturn.json();
  const primaryTeamName = embed.title.split(' vs')[0];
  const primaryTeamIndex = template.rounds[0].teams.findIndex(x => x.team_stats.Team == primaryTeamName);
  const secondaryTeamIndex = !primaryTeamIndex ? 1 : 0
  const primaryTeam = template.rounds[0].teams[primaryTeamIndex];
  const secondaryTeam = template.rounds[0].teams[secondaryTeamIndex];
  const outcome = primaryTeam.team_stats["Team Win"] == "1" ? "Victory" : "Defeat"
  const s = `${outcome}: ${primaryTeam.team_stats["Final Score"]} - ${secondaryTeam.team_stats["Final Score"]}`
  console.log(s);
  embed.fields = [{
    "name": `${s}`,
    "value": "\u200B"
  }];

  DiscordRequest(`channels/${secrets.MATCH_SCHEDULE_CHANNEL_ID}/messages/${message.id}`, {
    method: "PATCH",
    body: {
      "embeds": [ embed ]
    }
  });
  return;
}
  
export async function faceitStatsSearch(components, res){
    const userName = components[0].components[0].value;
    let historyLength = parseInt(components[1].components[0].value) || 20;
    let gameName = components[2].components[0].value;
  
    if (historyLength > 100) historyLength = 100;
    if(gameName != 'cs2' && gameName != 'csgo') gameName = 'cs2';
    console.log(userName, historyLength, gameName)

    const playerSearch = await FaceitRequest("search/players?nickname=" + userName)
    const playerSearchJson = await playerSearch.json();
    const playerId = playerSearchJson.items[0].player_id
    const playerAvatar = playerSearchJson.items[0].avatar
    const playerLevel = playerSearchJson.items[0].games.find(x => x.name = gameName).skill_level;
    const iconUrl = `https://megageese.com/faceit${playerLevel}.png`
    const endpoint = `players/${playerId}/games/${gameName}/stats?offset=0&limit=${historyLength}`
    console.log('faceitStatsSearch', userName, playerId)
    const statsSearch = await FaceitRequest(endpoint);
    const statsSearchJson = await statsSearch.json();
    console.log(statsSearchJson)
    const stats = {
      Kills: 0,
      Deaths: 0,
      HeadshotPercent: 0,
      KDR: 0,
      Wins: 0,
    }
    for(const item of statsSearchJson.items) {
      stats.Kills += parseInt(item.stats.Kills);
      stats.Deaths += parseInt(item.stats.Deaths);
      stats.HeadshotPercent += parseInt(item.stats.Headshots);
      stats.Wins += parseInt(item.stats.Result);
    }
    stats.HeadshotPercent /= stats.Kills;
    stats.KDR = stats.Kills / stats.Deaths;
    stats.WinRate = stats.Wins / statsSearchJson.items.length;
    return res.send({
      type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        embeds: [
          {
            "type": "rich",
            "title": `${userName}'s last ${statsSearchJson.items.length} ${gameName} matches`,
            "description": `Kills: ${stats.Kills}\nDeaths: ${stats.Deaths}\nK/D Ratio: ${stats.KDR.toFixed(2)}\nHeadshot Percentage: ${(stats.HeadshotPercent * 100).toFixed(2)}%\nWin Rate: ${(stats.WinRate * 100).toFixed(2)}%`,
            "color": faceitColor,
            "thumbnail": {
              "url": playerAvatar,
              "height": 0,
              "width": 0
            },
            "footer": {
              "text": `Level ${playerLevel}`,
              "icon_url": iconUrl
            },
            "url": `https://www.faceit.com/en/players/${userName}`
          }
        ]
      }
    });
}