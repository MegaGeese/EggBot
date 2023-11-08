import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';
import secrets from "./secrets.json" assert {'type': 'json'}

// Simple test command
const MATCH_SCHEDULER = {
  name: 'schedule_match',
  description: 'Schedules a faceit match by URL',
  type: 1,
};

const PING = {
  name: 'ping',
  description: "Responds with 'Pong'",
  type: 1
}

const ALL_COMMANDS = [PING, MATCH_SCHEDULER];

InstallGlobalCommands(secrets.APP_ID, ALL_COMMANDS);
