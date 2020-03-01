// @ts-check

import { Hero } from "./lib/hero";
import { ImageOptimizer } from "./lib/util";

function getHeroes() {
  // Workaround for CORS
  const srcProtocol = location.protocol === 'http:' ? 'http' : 'https';
  const url = `${ srcProtocol }://gist.githubusercontent.com/embarq/1a71f161de06cafa5613f244c666838a/raw/9bcd7446b19befe75a87021b67f5885b53269c0d/heroes.json`;

  return fetch(url)
    .then(res => res.json())
    .catch(err => {
      console.error(err);
      return null;
    });
}

/** @param {Hero} hero */
function renderHero(hero) {
  const template = document.getElementById('hero-card-template');
  const heroTemplate = document.importNode(template.content, true);
  /** @type HTMLElement[] */
  const properties = heroTemplate.querySelectorAll('[data-hero-property]');

  for (let propertyElem of properties) {
    const heroProperty = propertyElem.dataset.heroProperty;

    if (hero[heroProperty] == null) {
      propertyElem.remove();
      continue;
    }

    if (
      propertyElem.dataset.heroPropertyType === 'list'
    ) {
      const listTemplate = document.createDocumentFragment();

      for (let entry of hero[heroProperty]) {
        const listItem = document.createElement('li');
        listItem.innerText = entry;
        listTemplate.appendChild(listItem);
      }

      propertyElem.appendChild(listTemplate);
    } else {
      /** @type HTMLSpanElement */
      const heroPropertyValueElem = propertyElem.querySelector('.hero-detail-value');

      if (heroPropertyValueElem == null) {
        console.warn(`Value host for property "${ heroProperty }" not found`);
        continue;
      }

      heroPropertyValueElem.innerText = hero[heroProperty];
    }
  }

  /** @type HTMLDivElement */
  const heroCard = heroTemplate.querySelector('.hero-card');
  heroCard.id = hero.id;
  heroCard.setAttribute('style', `background-image: url(${ hero.photo });`)

  return heroTemplate;
}

function main() {
  /**
   * - Figure out two-way binding between hero model and view(its component)
   * - On click on a question-mark button a movie list slides to top
   */

  getHeroes().then(data => {
    if (!Array.isArray(data)) {
      throw new Error(`Heroes data is malformed or missing. Expected array; instead got ${ typeof data }`);
    }

    const imageOptimizer = new ImageOptimizer(
      'https://res.cloudinary.com/dfbnwe0t7/image/upload/c_thumb,w_220/v1583033753/marvel_heroes'
    );
    const heroList = document.getElementById('hero-list');
    const heroListContent = document.createDocumentFragment();
    const heroes = [];

    for (let entry of data) {
      const hero = new Hero(entry);
      hero.photo = imageOptimizer.getOptimizedResourceUrl(hero.photo);

      const component = renderHero(hero);
      heroListContent.appendChild(component);

      heroes.push(hero);
    }

    heroList.appendChild(heroListContent);

    for (let hero of heroes) {
      const component = document.getElementById(hero.id);

      if (component == null) {
        continue;
      }

      const overlayToggleBtn = component.querySelector('[data-action="toggle-overlay"]');
      overlayToggleBtn.addEventListener('click', () => {
        const overlay = component.querySelector('.hero-overlay');
        overlay.classList.toggle('show');
      });
    }

    const toggleAllOverlays = document.getElementById('toggle-all-overlays');
    toggleAllOverlays.addEventListener('click', () => {
      for (let hero of heroes) {
        const component = document.getElementById(hero.id);

        if (component == null) {
          continue;
        }

        const overlay = component.querySelector('.hero-overlay');
        overlay.classList.toggle('show');
      }
    })

  });
}

window.addEventListener('DOMContentLoaded', () => main());
