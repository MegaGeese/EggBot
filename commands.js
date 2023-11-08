import 'dotenv/config';
import { capitalize, InstallGlobalCommands } from './utils.js';

// Simple test command
const MATCH_SCHEDULER = {
  name: 'schedule_match',
  description: 'Basic command',
  type: 1,
};

const ALL_COMMANDS = [MATCH_SCHEDULER];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);