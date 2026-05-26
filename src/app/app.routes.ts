import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Cards } from './components/cards/cards';

export const routes: Routes = [
    {
        path: '',
        component: Home
    },
    {
        path: 'cards',
        component: Cards
    }
];
