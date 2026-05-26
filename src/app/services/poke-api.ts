import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Pokemon {
  id: number;
  name: string;
  height: number;
  weight: number;
  sprites?: {
    front_default: string;
    back_default?: string;
  };
  types?: {
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }[];
  stats?: {
    base_stat: number;
    effort: number;
    stat: {
      name: string;
      url: string;
    };
  }[];
}

export interface PokemonList {
  count: number;
  next: string | null;
  previous: string | null;
  results: PokemonListItem[];
}

export interface PokemonListItem {
  name: string;
  url: string;
}

@Injectable({
  providedIn: 'root',
})
export class PokeApi {
  private readonly apiUrl = 'https://pokeapi.co/api/v2';

  constructor(private http: HttpClient) {}

  buscarPokemon(nameOuId: string | number): Observable<Pokemon> {
    return this.http.get<Pokemon>(`${this.apiUrl}/pokemon/${nameOuId}`);
  }

  buscarEspecie(nameOuId: string | number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/pokemon-species/${nameOuId}`);
  }

  getPokemonsByType(typeName: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/type/${typeName}`);
  }

  getAllPokemons(): Observable<PokemonList> {
    return this.http.get<PokemonList>(
      `${this.apiUrl}/pokemon?limit=1025&offset=0`
    );
  }

  getEvolutionChain(url: string): Observable<any> {
    return this.http.get<any>(url);
  }
}
