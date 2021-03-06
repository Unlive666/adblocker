import { parseList } from '../src/parsing/list';
import { fastHash, tokenize, tokenizeCSS } from '../src/utils';
import requests from './data/requests';
import { loadAllLists } from './utils';

function t(tokens: string[]): Uint32Array {
  return new Uint32Array(tokens.map(fastHash));
}

expect.extend({
  toNotCollideWithOtherFilter(filter: { getId: () => number }, map) {
    const found = map.get(filter.getId());
    if (found !== undefined && found !== filter.toString()) {
      return {
        message: () =>
          `expected ${filter.toString()} to not collide, found ${found} (${filter.getId()})`,
        pass: false,
      };
    }

    return {
      message: () => 'Ok',
      pass: true,
    };
  },
});

function checkCollisions(filters: any[]) {
  const hashes = new Map();
  for (let i = 0; i < filters.length; i += 1) {
    const filter = filters[i];
    // @ts-ignore
    expect(filter).toNotCollideWithOtherFilter(hashes);
    hashes.set(filter.getId(), filters[i].toString());
  }
}

describe('Utils', () => {
  describe('fastHash', () => {
    it('does not produce collision on network filters', () => {
      const { networkFilters } = parseList(loadAllLists());
      checkCollisions(networkFilters);
    });

    it('does not produce collision on requests dataset', () => {
      // Collect all raw filters
      const { networkFilters } = parseList(
        requests.map(({ filters }) => filters.join('\n')).join('\n'),
      );
      checkCollisions(networkFilters);
    });

    it('does not produce collision on cosmetic filters', () => {
      const { cosmeticFilters } = parseList(loadAllLists());
      checkCollisions(cosmeticFilters);
    });
  });

  it('#tokenize', () => {
    expect(tokenize('')).toEqual(t([]));
    expect(tokenize('foo')).toEqual(t(['foo']));
    expect(tokenize('foo/bar')).toEqual(t(['foo', 'bar']));
    expect(tokenize('foo-bar')).toEqual(t(['foo', 'bar']));
    expect(tokenize('foo.bar')).toEqual(t(['foo', 'bar']));
  });

  it('#tokenizeCSS', () => {
    expect(tokenizeCSS('')).toEqual(t([]));
    expect(tokenizeCSS('.selector')).toEqual(t(['.selector']));
    expect(tokenizeCSS('.selector-foo')).toEqual(t(['.selector-foo']));
  });
});
