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

/**
 * @param {Hero} hero
 * @returns {HTMLElement} new instance of hero-card template with pre-populated data
 */
function renderHero(hero) {
  const template = document.getElementById('template:hero-card');
  const heroTemplate = document.importNode(template.content, true);   // makes template copy
  /** @type HTMLElement[] */
  const properties = heroTemplate.querySelectorAll('[data-hero-property]');

  for (let propertyElem of properties) {
    const heroProperty = propertyElem.dataset.heroProperty;

    if (hero[heroProperty] == null) {
      propertyElem.remove();
      continue;
    }

    if (propertyElem.dataset.heroPropertyType === 'list') {
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
  heroCard.id = hero.id;  // this will useful for future cross-referencing
  heroCard.setAttribute('style', `background-image: url(${ hero.photo });`)

  return heroTemplate;
}

/**
 * Creates HTML list from heroes array. Uses `renderHero` function to render each hero.
 * @param {Hero[]} heroes
 * @returns {HTMLUListElement}
 */
function renderHeroes(heroes) {
  const heroList = document.getElementById('hero-list');
  const heroListContent = document.createDocumentFragment();

  heroList.innerHTML = '';

  for (let hero of heroes) {
    const component = renderHero(hero);
    heroListContent.appendChild(component);
  }

  heroList.appendChild(heroListContent);
  return heroList;
}

/**
 * @param {string} templateId
 */
function getRenderFilterItemFactory(templateId) {
  const filterEntryTemplate = document.getElementById(templateId);

  // this closure is used to prevent unnecessary queriyng for template element(filterEntryTemplate)
  /**
   * @param {string} filterLabel
   */
  return function renderFilterItem(filterLabel) {
    const entryComponent = document.importNode(filterEntryTemplate.content, true);
    const label = entryComponent.querySelector('[data-label-binding]');
    const labelContent = entryComponent.querySelector('[data-label-text-binding]');
    const input = label.querySelector('input');

    input.id = window.btoa(filterLabel);
    input.dataset.filterValue = filterLabel;
    input.checked = true;

    label.setAttribute('for', input.id);
    labelContent.innerText = filterLabel;

    return entryComponent;
  }
}

function renderMovies(movies) {
  const movieFilterElem = document.getElementById('movie-filter');
  const movieFilterComponents = document.createDocumentFragment();
  const filterEntryFactory = getRenderFilterItemFactory('template:filter-entry');

  movieFilterElem.innerHTML = '';

  for (let [entry] of movies.entries()) {
    const entryListItem = document.createElement('li');
    const entryComponent = filterEntryFactory(entry)

    entryListItem.classList.add('filter-entry');
    entryListItem.appendChild(entryComponent);
    movieFilterComponents.appendChild(entryListItem);
  }

  movieFilterElem.appendChild(movieFilterComponents);
  return movieFilterElem;
}

/**
 * @param {(filterKey: string, filterValue: boolean) => void} updateFilter
 */
function handleFilterChange(updateFilter) {
  return event => {
    updateFilter(event.target.dataset.filterValue, event.target.checked);
    window.dispatchEvent(new CustomEvent('heroes:filters-change'));
  };
}

/**
 * @param {string} componentId
 */
function toggleOverlay(componentId) {
  return () => {
    const overlay = document.querySelector(`#${ componentId } .hero-overlay`);
    const overlayToggleBtn = document.querySelector(`#${ componentId } [data-action="toggle-overlay"]`);

    overlay.classList.toggle('show');
    overlayToggleBtn.classList.toggle('gg-arrow-up-r');
    overlayToggleBtn.classList.toggle('gg-arrow-down-r');
  };
}

/**
 * @param {Hero[]} heroes
 */
function toggleAllOverlays(heroes) {
  return () => {
    for (let hero of heroes) {
      const component = document.getElementById(hero.id);
      if (component == null) {
        continue;
      }
      const overlay = component.querySelector('.hero-overlay');
      overlay.classList.toggle('show');
    }
  };
}

/**
 * @param {() => object} getFiltersState
 */
function resetFilters(getFiltersState) {
  return () => {
    const filtersState = getFiltersState();
    for (let key in filtersState) {
      filtersState[key] = true;
    }

    const items = document.querySelectorAll('#movie-filter input[type=checkbox]');
    for (let item of items) {
      item.checked = true;
    }

    window.dispatchEvent(new CustomEvent('heroes:filters-change'));
  };
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

    // Render preparation: heroes
    const OPTIMIZER_ENDPOINT = 'https://res.cloudinary.com/dfbnwe0t7/image/upload/c_thumb,w_220/v1583033753/marvel_heroes';
    const imageOptimizer = new ImageOptimizer(OPTIMIZER_ENDPOINT);

    const heroes = [];
    const movies = new Set();
    const filtersState = {};

    for (let entry of data) {
      const hero = new Hero(entry);

      hero.photo = imageOptimizer.getOptimizedResourceUrl(hero.photo);
      hero.movies.forEach(item => movies.add(item));
      heroes.push(hero);
    }

    renderHeroes(heroes);

    window.addEventListener('heroes:filters-change', function handleFiltersChange() {
      for (let hero of heroes) {
        const isDisplayed = hero.movies.every(movie => filtersState[movie]);
        const target = document.getElementById(hero.id).parentElement;
        const isAlreadyHidden = target.classList.contains('hidden');

        if (isDisplayed) {
          target.classList.remove('hidden');
        } else if (!isAlreadyHidden) {
          target.classList.add('hidden');
        }
      }
    });

    const movieFilterElem = renderMovies(movies);
    /** @type NodeListOf<HTMLInputElement> */
    const movieFilters = movieFilterElem.querySelectorAll('input[type=checkbox]');

    for (let filterEntryElem of movieFilters) {
      // Initialize filters state map
      // E.g. { 'Iron Man': true }
      filtersState[filterEntryElem.dataset.filterValue] = filterEntryElem.checked;

      filterEntryElem.addEventListener('change', handleFilterChange((key, value) => {
        filtersState[key] = value;
      }));
    }

    for (let hero of heroes) {
      const heroComponent = document.getElementById(hero.id);

      if (heroComponent == null) {
        continue;
      }

      const overlayToggleBtn = heroComponent.querySelector('[data-action="toggle-overlay"]');
      overlayToggleBtn.addEventListener('click', toggleOverlay(hero.id));
    }

    const toggleAllOverlaysBtn = document.getElementById('toggle-all-overlays');
    toggleAllOverlaysBtn.addEventListener('change', toggleAllOverlays(heroes));

    const resetFiltersTrigger = document.getElementById('reset-filters-trigger');
    resetFiltersTrigger.addEventListener('click', resetFilters(() => filtersState));
  });
}

window.addEventListener('DOMContentLoaded', () => main());
