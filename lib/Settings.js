'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const util = require('util');

const Log = require('./Log');

const statAsync = util.promisify(fs.stat);
const readFileAsync = util.promisify(fs.readFile);
const writeFileAsync = util.promisify(fs.writeFile);
const mkdirAsync = util.promisify(fs.mkdir);

class Settings {

  constructor() {
    this._settings = null;
    this._settingsPath = this.getSettingsPath();
  }

  getSettingsDirectory() {
    const platform = os.platform();

    if (platform === 'win32') {
      return path.join(process.env.APPDATA, 'athom-cli');
    }

    return path.join(process.env.HOME, '.athom-cli');
  }

  getSettingsPath() {
    return path.join(this.getSettingsDirectory(), 'settings.json');
  }

  async _getSettings() {
    if (this._settings) return this._settings;

    try {
      const data = await readFileAsync(this._settingsPath, 'utf8');
      const json = JSON.parse(data);
      this._settings = json;
    } catch (err) {
      if (err.code !== 'ENOENT') Log(err);
      this._settings = {};
    }
    return this._settings;
  }

  async get(key) {
    await this._getSettings();
    return this._settings[key] || null;
  }

  async set(key, value) {
    await this._getSettings();

    this._settings[key] = value;

    // create directory if not exists
    const dir = path.dirname(this._settingsPath);
    try {
      await statAsync(dir);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      await mkdirAsync(dir);
    }

    const json = JSON.stringify(this._settings, false, 4);
    await writeFileAsync(this._settingsPath, json);

    return this.get(key);
  }

  async unset(key) {
    return this.set(key, null);
  }

}

module.exports = Settings;
