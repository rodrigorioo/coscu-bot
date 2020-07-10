require('dotenv').config({path: __dirname + '/.env'});

const { ShardingManager } = require('discord.js');
const manager = new ShardingManager('./bot.js', { token: process.env['TOKEN'] });

manager.spawn();
// manager.on('shardCreate', shard => console.log(`Launched shard id(s) ${shard.ids.join(', ')}`));
// manager.on('shardCreate', shard => console.log(shard.id));