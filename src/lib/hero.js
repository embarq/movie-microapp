import { isValidString } from "./util";

/**
  @param {string} actors
  @param {string} genger
  @param {string} name
  @param {string} photo
  @param {string} status
  @param {string|null} birthDay
  @param {string|null} citizenship
  @param {string|null} deathDay
  @param {string[]|null} movies
  @param {string|null} realName
  @param {string|null} species
 */
export class Hero {
  /** @param {Hero} data */
  constructor(data) {
    this.actors = data.actors;
    this.genger = data.genger;
    this.name = data.name;
    this.photo = data.photo;
    this.status = data.status;

    // Optional params;
    this.birthDay = isValidString(data.birthDay) ? data.birthDay : null;
    this.citizenship = isValidString(data.citizenship) ? data.citizenship : null;
    this.deathDay = isValidString(data.deathDay) ? data.deathDay : null;
    this.movies = Array.isArray(data.movies) ? data.movies : [];
    this.realName = isValidString(data.realName) ? data.realName : null;
    this.species = isValidString(data.species) ? data.species : null;
    this.id = window.btoa(JSON.stringify(data));
  }
}
