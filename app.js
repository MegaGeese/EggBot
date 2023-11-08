import express from "express";
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from "discord-interactions";
import {
  scheduleMatch,
  faceitStatsSearch
} from './interactions.js'
import {
    faceitStatsModal,
    scheduleMatchModal
} from './modals.js'
import {
  VerifyDiscordRequest,
  DiscordRequest,
} from "./utils.js";
import fetch from "node-fetch";
import secrets from "./secrets.json" assert { type: "json" }
import path from "path"

// Create an express app
const app = express();
// Get port, or default to 3000
const PORT = process.env.PORT || 3000;
// Parse request body and verifies incoming requests using discord-interactions package
app.use(express.json({ verify: VerifyDiscordRequest(secrets.PUBLIC_KEY) }));

// app.get('/', (req, res) => res.send('Hello World'));

// Interactions endpoint URL where Discord will send HTTP requests
app.post("/interactions", async function (req, res) {
  // Interaction type and data
  console.log('interactions');
  const { type, id, data } = req.body;

  //Handle verification requests
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  // Handle slash command requests
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    if (name === "schedule_match") scheduleMatchModal(req, res)
    if (name === "faceit_stats") faceitStatsModal(req, res)
  }

  // Handle Modal Submissions
  if (type === InteractionType.MODAL_SUBMIT) {
    const { components } = data;
    const custom_id = data.custom_id

    if(custom_id == "schedule_match") scheduleMatch(components, res);
    if(custom_id == "faceit_stats") faceitStatsSearch(components, res);
  }
});

app.use(express.static("public"));

app.listen(PORT, () => {
  console.log("Listening on port", PORT);
});
