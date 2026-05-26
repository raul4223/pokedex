import { TestBed } from '@angular/core/testing';

import { PokeApi } from './poke-api';

describe('PokeApi', () => {
  let service: PokeApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PokeApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
