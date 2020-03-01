export const isValidString = (str) => {
  const isEmptyString = /\s+/ig.test(str);
  return typeof str === 'string' && str.length > 0 && !isEmptyString;
}

export class ImageOptimizer {
  constructor(optimizationEndpoint) {
    this.optimizationEndpoint = optimizationEndpoint;
  }

  getOptimizedResourceUrl(originalUrl) {
    const hash = window.btoa(originalUrl).replace(/\=/g, '');
    return `${ this.optimizationEndpoint }/${ hash }`;
  }
}
