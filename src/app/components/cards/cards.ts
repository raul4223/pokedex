import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PokeApi, PokemonListItem } from '../../services/poke-api';

export interface PokemonDetailInfo {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: string[];
  hp: number;
  attack: number;
  defense: number;
  loading: boolean;
  error?: boolean;
  backImageFallback?: string;
  japaneseName?: string;
}

@Component({
  selector: 'app-cards',
  imports: [CommonModule, FormsModule],
  templateUrl: './cards.html',
  styleUrl: './cards.css',
})
export class Cards implements OnInit, OnDestroy {

  // Dados mockados de inicialização (segurança para renderização imediata)
  pokemons: PokemonListItem[] = [
    { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon/1/' },
    { name: 'charmander', url: 'https://pokeapi.co/api/v2/pokemon/4/' },
    { name: 'squirtle', url: 'https://pokeapi.co/api/v2/pokemon/7/' }
  ];

  searchTerm: string = '';
  
  // Easter Eggs Configs
  konamiCode: string[] = [
    'arrowup', 'arrowup', 'arrowdown', 'arrowdown',
    'arrowleft', 'arrowright', 'arrowleft', 'arrowright',
    'b', 'a'
  ];
  konamiIndex: number = 0;
  isRetroMode: boolean = false;
  flippedPokemonIds: { [id: string]: boolean } = {};
  pokemonDetails: { [id: string]: PokemonDetailInfo } = {};

  selectedType: string = '';
  selectedGeneration: string = '';
  loadingType: boolean = false;
  pokemonsByType: { [type: string]: PokemonListItem[] } = {};

  // Controle de dropdowns customizados
  isTypeDropdownOpen: boolean = false;
  isGenDropdownOpen: boolean = false;

  // Estado da Modal de História do Pokémon
  selectedStoryPokemonId: string | null = null;
  storyLoading: boolean = false;
  storyText: string = '';
  storyTextJa: string = '';
  storyEvolutionChain: { name: string, id: string }[] = [];
  activeStoryPokemonType: string = 'normal';
  activeStoryPokemonName: string = '';

  pokemonTypes: string[] = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic',
    'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ];

  constructor(private pokeApi: PokeApi, private sanitizer: DomSanitizer) {}
  
  ngOnInit(): void {
    this.carregarPokemons();
  }

  ngOnDestroy(): void {
    document.body.classList.remove('retro-dmg-active');
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    
    // Verificação da sequência do Código Konami
    if (key === this.konamiCode[this.konamiIndex]) {
      this.konamiIndex++;
      if (this.konamiIndex === this.konamiCode.length) {
        this.toggleRetroMode();
        this.konamiIndex = 0;
      }
    } else {
      this.konamiIndex = key === 'arrowup' ? 1 : 0;
    }
  }

  toggleRetroMode(): void {
    this.isRetroMode = !this.isRetroMode;
    if (this.isRetroMode) {
      document.body.classList.add('retro-dmg-active');
      // Grito do Pikachu de level up retrô!
      const audio = new Audio('https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg');
      audio.volume = 0.25;
      audio.play().catch(() => {});
    } else {
      document.body.classList.remove('retro-dmg-active');
    }
  }

  carregarPokemons(): void {
    this.pokeApi.getAllPokemons().subscribe({
      next: (res) => {
        if (res && res.results) {
          this.pokemons = res.results;
        }
        console.log('Pokemons carregados com sucesso:', this.pokemons);
      },
      error: (err) => {
        console.error('Erro ao carregar pokemons da API:', err);
      }
    });
  }

  getPokemonId(url: string | number): string {
    if (!url) return '1';
    const urlStr = String(url);
    if (/^\d+$/.test(urlStr)) {
      return urlStr;
    }
    const parts = urlStr.split('/');
    return parts[parts.length - 2] || '1';
  }

  getPokemonImage(url: string | number, back: boolean = false): string {
    const idStr = this.getPokemonId(url);
    const id = parseInt(idStr);
    if (id === 0) {
      // Retorna uma Pokébola bugada estilizada em pixel art como SVG inline em Base64
      return 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 20" width="160" height="200" style="image-rendering:pixelated;shape-rendering:crispEdges;"><g fill="%23000000"><rect x="0" y="0" width="4" height="20"/><rect x="4" y="0" width="4" height="12"/><rect x="8" y="0" width="4" height="4"/><rect x="12" y="4" width="4" height="12"/><rect x="8" y="12" width="4" height="8"/><rect x="4" y="16" width="4" height="4"/></g><g fill="%23555555"><rect x="4" y="12" width="4" height="4"/><rect x="8" y="4" width="4" height="8"/></g><g fill="%23aaaaaa"><rect x="8" y="8" width="4" height="4"/><rect x="12" y="0" width="4" height="4"/><rect x="12" y="16" width="4" height="4"/></g></svg>';
    }
    if (id <= 649) {
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${back ? 'back/' : ''}${id}.gif`;
    }
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${back ? 'back/' : ''}${idStr}.png`;
  }

  getPokemonGeneration(url: string): number {
    const id = parseInt(this.getPokemonId(url));
    if (id <= 151) return 1;
    if (id <= 251) return 2;
    if (id <= 386) return 3;
    if (id <= 493) return 4;
    if (id <= 649) return 5;
    if (id <= 721) return 6;
    if (id <= 809) return 7;
    if (id <= 905) return 8;
    return 9;
  }

  getGenerationSvg(url: string): SafeHtml {
    const gen = this.getPokemonGeneration(url);
    const colors = [
      '#FF5A36', // Gen 1 (Red/Orange)
      '#3399FF', // Gen 2 (Blue/Gold)
      '#3FA127', // Gen 3 (Ruby/Sapphire Emerald Green)
      '#D6B55A', // Gen 4 (Diamond/Pearl Platinum Gold)
      '#9933FF', // Gen 5 (Black/White Dark Purple)
      '#FF5599', // Gen 6 (X/Y Pink)
      '#FFCC00', // Gen 7 (Sun/Moon Orange-Yellow)
      '#AAAA99', // Gen 8 (Sword/Shield Teal-Gray)
      '#E0C068'  // Gen 9 (Scarlet/Violet Crimson-Violet)
    ];
    const color = colors[gen - 1] || '#A8A878';
    
    // Algarismos romanos em pixel art no corpo do badge
    let numeralSvg = '';
    switch(gen) {
      case 1: // I
        numeralSvg = `<rect x="11" y="5" width="2" height="6"/><rect x="9" y="5" width="6" height="1"/><rect x="9" y="10" width="6" height="1"/>`;
        break;
      case 2: // II
        numeralSvg = `<rect x="9" y="5" width="2" height="6"/><rect x="13" y="5" width="2" height="6"/><rect x="7" y="5" width="10" height="1"/><rect x="7" y="10" width="10" height="1"/>`;
        break;
      case 3: // III
        numeralSvg = `<rect x="7" y="5" width="2" height="6"/><rect x="11" y="5" width="2" height="6"/><rect x="15" y="5" width="2" height="6"/><rect x="5" y="5" width="14" height="1"/><rect x="5" y="10" width="14" height="1"/>`;
        break;
      case 4: // IV
        numeralSvg = `<rect x="6" y="5" width="2" height="4"/><rect x="7" y="9" width="2" height="2"/><rect x="9" y="5" width="2" height="4"/><rect x="12" y="5" width="2" height="6"/><rect x="11" y="5" width="4" height="1"/><rect x="11" y="10" width="4" height="1"/>`;
        break;
      case 5: // V
        numeralSvg = `<rect x="6" y="5" width="2" height="4"/><rect x="12" y="5" width="2" height="4"/><rect x="8" y="9" width="2" height="2"/><rect x="10" y="9" width="2" height="2"/>`;
        break;
      case 6: // VI
        numeralSvg = `<rect x="5" y="5" width="2" height="4"/><rect x="11" y="5" width="2" height="4"/><rect x="7" y="9" width="2" height="2"/><rect x="9" y="9" width="2" height="2"/><rect x="15" y="5" width="2" height="6"/><rect x="13" y="5" width="6" height="1"/><rect x="13" y="10" width="6" height="1"/>`;
        break;
      case 7: // VII
        numeralSvg = `<rect x="4" y="5" width="2" height="4"/><rect x="10" y="5" width="2" height="4"/><rect x="6" y="9" width="2" height="2"/><rect x="8" y="9" width="2" height="2"/><rect x="13" y="5" width="2" height="6"/><rect x="17" y="5" width="2" height="6"/><rect x="11" y="5" width="9" height="1"/><rect x="11" y="10" width="9" height="1"/>`;
        break;
      case 8: // VIII
        numeralSvg = `<rect x="3" y="5" width="2" height="4"/><rect x="9" y="5" width="2" height="4"/><rect x="5" y="9" width="2" height="2"/><rect x="7" y="9" width="2" height="2"/><rect x="12" y="5" width="2" height="6"/><rect x="15" y="5" width="2" height="6"/><rect x="18" y="5" width="2" height="6"/><rect x="11" y="5" width="10" height="1"/><rect x="11" y="10" width="10" height="1"/>`;
        break;
      case 9: // IX
        numeralSvg = `<rect x="6" y="5" width="2" height="6"/><rect x="8" y="5" width="4" height="1"/><rect x="8" y="10" width="4" height="1"/><rect x="12" y="5" width="2" height="6"/><rect x="15" y="5" width="2" height="6"/><rect x="14" y="5" width="4" height="1"/><rect x="14" y="10" width="4" height="1"/>`;
        break;
    }

    const badgeSvg = `
      <svg viewBox="0 0 24 16" width="48" height="32" style="image-rendering:pixelated; display:inline-block; vertical-align:middle;">
        <!-- Borda e Cor de Fundo Baseada na Geração -->
        <rect x="1" y="0" width="22" height="16" fill="#000000"/>
        <rect x="2" y="1" width="20" height="14" fill="${color}"/>
        <rect x="3" y="2" width="18" height="12" fill="#000000"/>
        <rect x="4" y="3" width="16" height="10" fill="#ffffff"/>
        
        <!-- Letra "G" em pixel art -->
        <rect x="5" y="5" width="2" height="6" fill="#000000"/>
        <rect x="5" y="5" width="3" height="1" fill="#000000"/>
        <rect x="5" y="10" width="3" height="1" fill="#000000"/>
        <rect x="7" y="8" width="1" height="2" fill="#000000"/>
        
        <!-- Algarismo Romano correspondente à Geração -->
        <g fill="#000000">
          ${numeralSvg}
        </g>
      </svg>
    `;
    
    return this.sanitizer.bypassSecurityTrustHtml(badgeSvg);
  }

  tocarSom(pokemonId: string, event: Event): void {
    event.stopPropagation(); // Evita que o card gire de volta para a frente
    const audioUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemonId}.ogg`;
    const audio = new Audio(audioUrl);
    audio.volume = 0.4;
    audio.play().catch(err => {
      console.error("Erro ao reproduzir o som do Pokémon:", err);
    });
  }

  handleBackImageError(pokemonId: string): void {
    if (this.pokemonDetails[pokemonId]) {
      this.pokemonDetails[pokemonId].backImageFallback = this.getPokemonImage(pokemonId, false);
    }
  }

  falarNome(nome: string, event: Event): void {
    event.stopPropagation(); // Evita que o card gire de volta para a frente
    if ('speechSynthesis' in window) {
      // Cancela qualquer fala que esteja tocando para tocar o novo som imediatamente
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(nome);
      utterance.lang = 'en-US'; 
      utterance.pitch = 1.0;    // Tom padrão natural para máxima clareza de áudio
      utterance.rate = 0.95;    // Velocidade natural e fluida

      // Procura dinamicamente por uma voz em inglês de alta qualidade/premium disponível no sistema
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Busca prioritariamente vozes conhecidas por alta fidelidade (como Google, Samantha da Apple, Premium, Natural)
        const vozAltaQualidade = voices.find(v => 
          v.lang.startsWith('en') && 
          (v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Premium') || v.name.includes('Natural'))
        ) || voices.find(v => v.lang.startsWith('en'));

        if (vozAltaQualidade) {
          utterance.voice = vozAltaQualidade;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-speech não suportado neste navegador.");
    }
  }

  falarNomeJapones(nome: string, event: Event): void {
    event.stopPropagation(); // Evita que o card gire de volta para a frente
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(nome);
      utterance.lang = 'ja-JP'; // Voz Japonesa
      utterance.pitch = 1;   // Tom ligeiramente mais baixo/grave para efeito robótico Pokedex japonesa
      utterance.rate = 1;    // Cadência ligeiramente pausada e firme (idêntica ao anime!)

      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        // Procura voz japonesa nativa no navegador do usuário
        const vozJaponesa = voices.find(v => v.lang.startsWith('ja') || v.lang.includes('JP'));
        if (vozJaponesa) {
          utterance.voice = vozJaponesa;
        }
      }
      
      window.speechSynthesis.speak(utterance);
    } else {
      console.warn("Text-to-speech não suportado neste navegador.");
    }
  }

  getFilteredPokemonsList(): PokemonListItem[] {
    let list = this.pokemons;
    
    // 1. Filtrar por Tipo (Elemento) se selecionado
    if (this.selectedType) {
      list = this.pokemonsByType[this.selectedType] || [];
    }
    
    // 2. Filtrar por Geração se selecionada
    if (this.selectedGeneration) {
      const genNum = parseInt(this.selectedGeneration);
      list = list.filter(pokemon => this.getPokemonGeneration(pokemon.url) === genNum);
    }
    
    // 3. Filtrar por Nome ou ID se digitado
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.trim().toLowerCase();
      if (term === 'missingno' || term === '0') {
        return [{ name: 'MissingNo.', url: 'https://pokeapi.co/api/v2/pokemon/0/' }];
      }
      list = list.filter(pokemon => {
        const id = this.getPokemonId(pokemon.url);
        return pokemon.name.toLowerCase().includes(term) || id === term;
      });
    }
    
    return list;
  }

  get filteredPokemons(): PokemonListItem[] {
    return this.getFilteredPokemonsList();
  }

  onTypeChange(): void {
    const type = this.selectedType;
    if (!type || this.pokemonsByType[type]) {
      return;
    }
    
    this.loadingType = true;
    this.pokeApi.getPokemonsByType(type).subscribe({
      next: (res) => {
        if (res && res.pokemon) {
          this.pokemonsByType[type] = res.pokemon.map((p: any) => p.pokemon);
        }
        this.loadingType = false;
      },
      error: (err) => {
        console.error(`Erro ao carregar pokemons do tipo ${type}:`, err);
        this.loadingType = false;
      }
    });
  }

  toggleFlip(pokemonId: string): void {
    if (this.flippedPokemonIds[pokemonId]) {
      delete this.flippedPokemonIds[pokemonId];
    } else {
      this.flippedPokemonIds[pokemonId] = true;
      this.carregarDetalhes(pokemonId);
    }
  }

  carregarDetalhes(pokemonId: string): void {
    // Se já estiver carregado ou carregando, não faz nada
    if (this.pokemonDetails[pokemonId]) {
      return;
    }

    if (pokemonId === '0') {
      this.pokemonDetails['0'] = {
        id: 0,
        name: 'MissingNo.',
        height: 10,
        weight: 3507,
        types: ['???', 'normal'],
        hp: 33,
        attack: 136,
        defense: 0,
        loading: false,
        japaneseName: 'けつばん (Ketsuban)'
      };
      return;
    }

    // Inicializa o estado de carregamento
    this.pokemonDetails[pokemonId] = {
      id: parseInt(pokemonId),
      name: '',
      height: 0,
      weight: 0,
      types: [],
      hp: 0,
      attack: 0,
      defense: 0,
      loading: true
    };

    this.pokeApi.buscarPokemon(pokemonId).subscribe({
      next: (data) => {
        const hp = data.stats?.find(s => s.stat.name === 'hp')?.base_stat || 50;
        const attack = data.stats?.find(s => s.stat.name === 'attack')?.base_stat || 50;
        const defense = data.stats?.find(s => s.stat.name === 'defense')?.base_stat || 50;
        const types = data.types?.map(t => t.type.name) || ['normal'];

        this.pokemonDetails[pokemonId] = {
          id: data.id,
          name: data.name,
          height: data.height,
          weight: data.weight,
          types: types,
          hp: hp,
          attack: attack,
          defense: defense,
          loading: false,
          japaneseName: ''
        };

        // Busca o nome original em Japonês assincronamente da API de espécies
        this.pokeApi.buscarEspecie(pokemonId).subscribe({
          next: (speciesData) => {
            if (speciesData && speciesData.names) {
              const jpnObj = speciesData.names.find((n: any) => n.language.name === 'ja-Hrkt' || n.language.name === 'ja');
              if (jpnObj) {
                this.pokemonDetails[pokemonId].japaneseName = jpnObj.name;
              }
            }
          },
          error: (err) => {
            console.error(`Erro ao carregar espécie para ${pokemonId}:`, err);
          }
        });
      },
      error: (err) => {
        console.error(`Erro ao carregar detalhes do pokémon ${pokemonId}:`, err);
        this.pokemonDetails[pokemonId] = {
          id: parseInt(pokemonId),
          name: 'Erro',
          height: 0,
          weight: 0,
          types: ['normal'],
          hp: 0,
          attack: 0,
          defense: 0,
          loading: false,
          error: true
        };
      }
    });
  }

  getTypeColor(type: string): string {
    const colors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC',
      '???': '#1E2022'
    };
    return colors[type.toLowerCase()] || '#A8A878';
  }

  getTypeSvg(type: string): SafeHtml {
    const t = type.toLowerCase();
    const color = this.getTypeColor(t);
    const svgMap: { [key: string]: string } = {
      fire: `<rect x="7" y="1" width="2" height="2"/><rect x="6" y="3" width="4" height="2"/><rect x="5" y="5" width="6" height="2"/><rect x="4" y="7" width="8" height="2"/><rect x="3" y="9" width="10" height="3"/><rect x="5" y="12" width="6" height="2"/><rect x="7" y="14" width="2" height="1"/><rect x="7" y="6" width="2" height="4" fill="#FFAA00"/><rect x="6" y="8" width="4" height="3" fill="#FFAA00"/><rect x="7" y="9" width="2" height="2" fill="#FFFF00"/>`,
      water: `<rect x="7" y="2" width="2" height="2"/><rect x="6" y="4" width="4" height="2"/><rect x="5" y="6" width="6" height="2"/><rect x="4" y="8" width="8" height="2"/><rect x="3" y="10" width="10" height="3"/><rect x="4" y="13" width="8" height="2"/><rect x="6" y="9" width="2" height="3" fill="#FFFFFF"/><rect x="5" y="11" width="2" height="2" fill="#FFFFFF"/>`,
      grass: `<rect x="8" y="1" width="2" height="2"/><rect x="6" y="3" width="4" height="2"/><rect x="4" y="5" width="6" height="2"/><rect x="3" y="7" width="8" height="2"/><rect x="2" y="9" width="11" height="2"/><rect x="4" y="11" width="9" height="2"/><rect x="6" y="13" width="6" height="2"/><rect x="7" y="5" width="2" height="6" fill="#8BE16A"/><rect x="5" y="7" width="2" height="4" fill="#8BE16A"/>`,
      electric: `<rect x="9" y="1" width="2" height="2"/><rect x="8" y="3" width="3" height="2"/><rect x="7" y="5" width="4" height="2"/><rect x="5" y="7" width="8" height="2"/><rect x="4" y="9" width="6" height="2"/><rect x="5" y="11" width="4" height="2"/><rect x="6" y="13" width="2" height="2"/><rect x="8" y="5" width="2" height="3" fill="#FFFFFF"/><rect x="6" y="8" width="3" height="2" fill="#FFFFFF"/>`,
      normal: `<rect x="5" y="2" width="6" height="2"/><rect x="3" y="4" width="10" height="2"/><rect x="2" y="6" width="12" height="4"/><rect x="3" y="10" width="10" height="2"/><rect x="5" y="12" width="6" height="2"/><rect x="5" y="5" width="3" height="3" fill="#EAEAE1"/><rect x="6" y="6" width="4" height="3" fill="#EAEAE1"/>`,
      poison: `<rect x="6" y="2" width="4" height="2"/><rect x="4" y="4" width="8" height="2"/><rect x="3" y="6" width="10" height="4"/><rect x="4" y="10" width="8" height="2"/><rect x="6" y="12" width="4" height="2"/><rect x="5" y="5" width="2" height="2" fill="#DA70D6"/><rect x="8" y="6" width="3" height="3" fill="#DA70D6"/>`,
      ground: `<rect x="2" y="12" width="12" height="2"/><rect x="4" y="9" width="8" height="3"/><rect x="6" y="6" width="4" height="3"/><rect x="7" y="3" width="2" height="3"/><rect x="8" y="7" width="1" height="2" fill="#F8E8B0"/><rect x="5" y="10" width="2" height="1" fill="#F8E8B0"/>`,
      rock: `<rect x="3" y="11" width="10" height="3"/><rect x="5" y="8" width="8" height="3"/><rect x="4" y="5" width="6" height="3"/><rect x="7" y="3" width="3" height="2"/><rect x="9" y="9" width="2" height="2" fill="#D8C068"/><rect x="5" y="6" width="2" height="2" fill="#D8C068"/>`,
      bug: `<rect x="5" y="2" width="6" height="2"/><rect x="4" y="4" width="8" height="2"/><rect x="3" y="6" width="10" height="4"/><rect x="4" y="10" width="8" height="2"/><rect x="5" y="12" width="6" height="2"/><rect x="2" y="5" width="2" height="4" fill="#A8B820"/><rect x="12" y="5" width="2" height="4" fill="#A8B820"/><rect x="7" y="4" width="2" height="6" fill="#D8E030"/>`,
      ghost: `<rect x="5" y="2" width="6" height="2"/><rect x="3" y="4" width="10" height="2"/><rect x="2" y="6" width="12" height="6"/><rect x="2" y="12" width="2" height="2"/><rect x="6" y="12" width="4" height="2"/><rect x="12" y="12" width="2" height="2"/><rect x="4" y="6" width="2" height="2" fill="#E8E8F8"/><rect x="10" y="6" width="2" height="2" fill="#E8E8F8"/>`,
      steel: `<rect x="4" y="2" width="8" height="2"/><rect x="2" y="4" width="12" height="2"/><rect x="2" y="6" width="12" height="4"/><rect x="3" y="10" width="10" height="2"/><rect x="5" y="12" width="6" height="2"/><rect x="5" y="5" width="6" height="6" fill="#D8D8E0"/><rect x="7" y="7" width="2" height="2" fill="#FFFFFF"/>`,
      psychic: `<rect x="2" y="8" width="12" height="2"/><rect x="4" y="5" width="8" height="3"/><rect x="5" y="3" width="6" height="2"/><rect x="4" y="10" width="8" height="2"/><rect x="6" y="12" width="4" height="2"/><rect x="7" y="7" width="2" height="2" fill="#FFFFFF"/>`,
      ice: `<rect x="7" y="1" width="2" height="14"/><rect x="1" y="7" width="14" height="2"/><rect x="4" y="4" width="2" height="2"/><rect x="10" y="4" width="2" height="2"/><rect x="4" y="10" width="2" height="2"/><rect x="10" y="10" width="2" height="2"/><rect x="7" y="7" width="2" height="2" fill="#FFFFFF"/>`,
      dragon: `<rect x="4" y="2" width="8" height="2"/><rect x="3" y="4" width="10" height="2"/><rect x="2" y="6" width="12" height="4"/><rect x="4" y="10" width="8" height="3"/><rect x="6" y="13" width="4" height="2"/><rect x="5" y="5" width="3" height="3" fill="#A080FF"/><rect x="9" y="5" width="3" height="3" fill="#A080FF"/>`,
      dark: `<rect x="6" y="1" width="6" height="2"/><rect x="4" y="3" width="4" height="2"/><rect x="2" y="5" width="4" height="4"/><rect x="4" y="9" width="4" height="2"/><rect x="6" y="11" width="6" height="2"/><rect x="9" y="13" width="4" height="2"/><rect x="10" y="5" width="2" height="4" fill="#A0A0A0"/>`,
      fairy: `<rect x="7" y="1" width="2" height="2"/><rect x="4" y="3" width="8" height="2"/><rect x="2" y="5" width="12" height="4"/><rect x="4" y="9" width="8" height="2"/><rect x="6" y="11" width="4" height="3"/><rect x="5" y="5" width="2" height="2" fill="#FFD0E0"/><rect x="9" y="5" width="2" height="2" fill="#FFD0E0"/>`,
      fighting: `<rect x="6" y="2" width="4" height="2"/><rect x="4" y="4" width="8" height="2"/><rect x="3" y="6" width="10" height="4"/><rect x="4" y="10" width="8" height="2"/><rect x="5" y="12" width="6" height="2"/><rect x="6" y="6" width="4" height="2" fill="#C03028"/>`,
      flying: `<rect x="2" y="3" width="4" height="2"/><rect x="4" y="5" width="6" height="2"/><rect x="6" y="7" width="8" height="2"/><rect x="4" y="9" width="8" height="2"/><rect x="2" y="11" width="10" height="2"/><rect x="5" y="13" width="6" height="2"/>`,
      '???': `<rect x="2" y="2" width="12" height="12"/><rect x="4" y="4" width="8" height="8" fill="#FFF"/><rect x="6" y="6" width="4" height="4" fill="#000"/>`
    };

    const innerSvg = svgMap[t] || `<rect x="4" y="4" width="8" height="8"/><rect x="7" y="7" width="2" height="2" fill="#FFF"/>`;
    const fullSvg = `<svg viewBox="0 0 16 16" width="22" height="22" style="image-rendering:pixelated; display:inline-block; vertical-align:middle;" fill="${color}">${innerSvg}</svg>`;
    return this.sanitizer.bypassSecurityTrustHtml(fullSvg);
  }

  // Métodos para dropdowns customizados
  toggleTypeDropdown(event: Event): void {
    event.stopPropagation();
    this.isTypeDropdownOpen = !this.isTypeDropdownOpen;
    this.isGenDropdownOpen = false;
  }

  toggleGenDropdown(event: Event): void {
    event.stopPropagation();
    this.isGenDropdownOpen = !this.isGenDropdownOpen;
    this.isTypeDropdownOpen = false;
  }

  selectType(type: string): void {
    this.selectedType = type;
    this.onTypeChange();
    this.isTypeDropdownOpen = false;
  }

  selectGeneration(gen: string): void {
    this.selectedGeneration = gen;
    this.isGenDropdownOpen = false;
  }

  getGenerationLabel(gen: string): string {
    if (!gen) return 'TODAS';
    const labels: { [key: string]: string } = {
      '1': 'GERAÇÃO I',
      '2': 'GERAÇÃO II',
      '3': 'GERAÇÃO III',
      '4': 'GERAÇÃO IV',
      '5': 'GERAÇÃO V',
      '6': 'GERAÇÃO VI',
      '7': 'GERAÇÃO VII',
      '8': 'GERAÇÃO VIII',
      '9': 'GERAÇÃO IX'
    };
    return labels[gen] || 'TODAS';
  }

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event): void {
    this.isTypeDropdownOpen = false;
    this.isGenDropdownOpen = false;
  }

  // Métodos da Modal de História do Pokémon
  openStoryModal(pokemonId: string, event: Event): void {
    event.stopPropagation();
    this.selectedStoryPokemonId = pokemonId;
    this.storyLoading = true;
    this.storyText = '';
    this.storyTextJa = '';
    this.storyEvolutionChain = [];

    if (pokemonId === '0') {
      this.activeStoryPokemonName = 'MissingNo.';
      this.activeStoryPokemonType = '???';
      this.storyText = 'A GLITCH POKÉMON OCCURRING IN RED AND BLUE. ITS APPEARANCE INDUCES A SENSE OF STRANGENESS AND DISTORTS LOGS.';
      this.storyTextJa = 'しょうがない バグポケモン。でんどういり すると セーブデータが こわれる ことがある。';
      this.storyEvolutionChain = [{ name: 'MissingNo.', id: '0' }];
      this.storyLoading = false;
      return;
    }

    this.pokeApi.buscarPokemon(pokemonId).subscribe({
      next: (pokeData) => {
        this.activeStoryPokemonName = pokeData.name;
        this.activeStoryPokemonType = pokeData.types?.[0]?.type?.name || 'normal';

        this.pokeApi.buscarEspecie(pokemonId).subscribe({
          next: (speciesData) => {
            // Obter história em Inglês e Japonês
            if (speciesData && speciesData.flavor_text_entries) {
              const entries = speciesData.flavor_text_entries;
              
              // 1. Entrada em Inglês (en)
              const enEntry = entries.find((e: any) => e.language.name === 'en');
              if (enEntry) {
                this.storyText = this.cleanFlavorText(enEntry.flavor_text);
              } else {
                // Caso não ache inglês, tenta qualquer uma ou deixa mensagem de fallback
                const fallbackEntry = entries[0];
                this.storyText = fallbackEntry ? this.cleanFlavorText(fallbackEntry.flavor_text) : 'NO DATA RECORDED IN POKEDEX.';
              }

              // 2. Entrada em Japonês (ja-Hrkt ou ja)
              const jaEntry = entries.find((e: any) => e.language.name === 'ja-Hrkt' || e.language.name === 'ja');
              if (jaEntry) {
                this.storyTextJa = this.cleanFlavorText(jaEntry.flavor_text);
              }
            }

            // Obter Cadeia Evolutiva
            if (speciesData && speciesData.evolution_chain && speciesData.evolution_chain.url) {
              const chainUrl = speciesData.evolution_chain.url;
              this.pokeApi.getEvolutionChain(chainUrl).subscribe({
                next: (chainData) => {
                  if (chainData && chainData.chain) {
                    this.storyEvolutionChain = this.parseEvolutionChain(chainData.chain);
                  }
                  this.storyLoading = false;
                },
                error: (err) => {
                  console.error('Erro ao carregar cadeia evolutiva:', err);
                  this.storyEvolutionChain = [{ name: pokeData.name, id: pokemonId }];
                  this.storyLoading = false;
                }
              });
            } else {
              this.storyEvolutionChain = [{ name: pokeData.name, id: pokemonId }];
              this.storyLoading = false;
            }
          },
          error: (err) => {
            console.error('Erro ao carregar especie para modal:', err);
            this.storyEvolutionChain = [{ name: pokeData.name, id: pokemonId }];
            this.storyLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Erro ao carregar pokemon para modal:', err);
        this.storyLoading = false;
      }
    });
  }

  closeStoryModal(): void {
    this.selectedStoryPokemonId = null;
    this.storyText = '';
    this.storyTextJa = '';
    this.storyEvolutionChain = [];
  }

  cleanFlavorText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\f/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\r/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }



  parseEvolutionChain(chain: any): { name: string, id: string }[] {
    const list: { name: string, id: string }[] = [];
    if (!chain) return list;
    
    // Fase 1 (Pequena)
    if (chain.species) {
      list.push({
        name: chain.species.name,
        id: this.getPokemonId(chain.species.url)
      });
    }
    
    // Fase 2 (Média)
    let current = chain.evolves_to;
    if (current && current.length > 0) {
      list.push({
        name: current[0].species.name,
        id: this.getPokemonId(current[0].species.url)
      });
      
      // Fase 3 (Grande)
      let next = current[0].evolves_to;
      if (next && next.length > 0) {
        list.push({
          name: next[0].species.name,
          id: this.getPokemonId(next[0].species.url)
        });
      }
    }
    return list;
  }

  getEnvironmentClass(type: string): string {
    const t = (type || 'normal').toLowerCase();
    if (['grass', 'bug'].includes(t)) return 'env-forest';
    if (['fire'].includes(t)) return 'env-volcano';
    if (['water', 'ice'].includes(t)) return 'env-ocean';
    if (['electric'].includes(t)) return 'env-storm';
    if (['poison', 'ghost', 'dark'].includes(t)) return 'env-haunted';
    if (['ground', 'rock', 'steel', 'fighting'].includes(t)) return 'env-desert';
    if (['psychic', 'fairy', 'dragon'].includes(t)) return 'env-cosmic';
    return 'env-sky';
  }

}
