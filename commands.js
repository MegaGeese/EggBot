import 'dotenv/config';
import { InstallGlobalCommands } from './utils.js';
import secrets from "./secrets.json" assert {'type': 'json'}

// Simple test command
const ALL_COMMANDS = [
{
  name: 'schedule_match',
  description: 'Schedules a faceit match by URL',
  type: 1,
},

{
  name: 'update_match',
  type: 3
},

{
  name: 'update_all_matches',
  description: 'Update all matches in #match-schedule',
  type: 1
},

{
  name: 'faceit_stats',
  description: 'Display a user\'s stats',
  type: 1,
},

{
  name: 'add_team',
  description: "Add a team to the list",
  type: 1
},

{
  name: 'ping',
  description: "Responds with 'Pong'",
  type: 1
}]

InstallGlobalCommands(secrets.APP_ID, ALL_COMMANDS);
