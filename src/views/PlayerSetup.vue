<template>
  <div class="player-setup">
    <h2>Enter Player Names</h2>
    <div class="players-list">
      <div v-for="(player, index) in players" :key="index" class="player-input">
        <input 
          v-model="players[index]" 
          :placeholder="'Player ' + (index + 1)"
          type="text"
        >
      </div>
    </div>
    <div class="setup-buttons">
      <button 
        @click="removePlayer" 
        class="btn btn-danger"
        :disabled="players.length <= 2"
      >
        Remove Player
      </button>
      <button 
        @click="addPlayer" 
        class="btn btn-secondary"
        :disabled="players.length >= 6"
      >
        Add Player
      </button>
      <button 
        @click="startGame" 
        class="btn btn-primary"
        :disabled="!canStartGame"
      >
        Start Game
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const players = ref(['', ''])
const MAX_PLAYERS = 6

const canStartGame = computed(() => {
  return players.value.filter(p => p.trim()).length >= 2
})

const addPlayer = () => {
  if (players.value.length < MAX_PLAYERS) {
    players.value.push('')
  }
}

const removePlayer = () => {
  if (players.value.length > 2) {
    players.value.pop() // Remove last player
  }
}

const startGame = () => {
  const validPlayers = players.value.filter(p => p.trim())
  if (validPlayers.length >= 2 && validPlayers.length <= MAX_PLAYERS) {
    localStorage.setItem('players', JSON.stringify(validPlayers))
    router.push('/game')
  }
}
</script>