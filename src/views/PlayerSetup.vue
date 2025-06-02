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
        <button 
          @click="removePlayer(index)" 
          class="btn btn-danger"
          :disabled="players.length <= 2"
        >
          X
        </button>
      </div>
    </div>
    <button @click="addPlayer" class="btn btn-secondary">Add Player</button>
    <button 
      @click="startGame" 
      class="btn btn-primary"
      :disabled="!canStartGame"
    >
      Start Game
    </button>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const players = ref(['', ''])

const canStartGame = computed(() => {
  return players.value.filter(p => p.trim()).length >= 2
})

const addPlayer = () => {
  players.value.push('')
}

const removePlayer = (index) => {
  if (players.value.length > 2) {
    players.value.splice(index, 1)
  }
}

const startGame = () => {
  const validPlayers = players.value.filter(p => p.trim())
  if (validPlayers.length >= 2) {
    localStorage.setItem('players', JSON.stringify(validPlayers))
    router.push('/game')
  }
}
</script>