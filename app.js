import 'dotenv/config';
import express from 'express';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { VerifyDiscordRequest, getRandomEmoji, DiscordRequest } from './utils.js';

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
app.post('/interactions', async function (req, res) {
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
    if (name === 'schedulematch') {
      console.log(res)
      // Send a message into the channel where command was triggered from
      return res.send({
        "title": "My Cool Modal",
        "custom_id": "cool_modal",
        "components": [{
          "type": 1,
          "components": [{
            "type": 4,
            "custom_id": "name",
            "label": "Name",
            "style": 1,
            "min_length": 1,
            "max_length": 4000,
            "placeholder": "John",
            "required": true
          }]
        }]
      });
    }
  }
});

app.listen(PORT, () => {
  console.log('Listening on port', PORT);
});
