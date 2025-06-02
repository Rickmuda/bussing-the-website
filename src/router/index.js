import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../views/LandingPage.vue'
import PlayerSetup from '../views/PlayerSetup.vue'
import GameBoard from '../views/GameBoard.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage
  },
  {
    path: '/setup',
    name: 'Setup',
    component: PlayerSetup
  },
  {
    path: '/game',
    name: 'Game',
    component: GameBoard
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router