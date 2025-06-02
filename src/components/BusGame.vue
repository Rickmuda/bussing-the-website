<template>
  <div class="bus-game">
    <h1>Bussen - The Drinking Game</h1>
    <div class="game-area" v-if="!gameOver">
      <div class="current-round">
        <h2>Round {{ currentRound }}: {{ roundNames[currentRound - 1] }}</h2>
        <p>{{ currentPlayer }}'s turn</p>
      </div>
      <!-- Game controls will go here -->
    </div>
    <div v-else>
      <h2>Game Over!</h2>
      <button @click="startNewGame">Start New Game</button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BusGame',
  data() {
    return {
      players: [],
      currentRound: 1,
      currentPlayerIndex: 0,
      gameOver: false,
      roundNames: [
        'Red or Black',
        'Higher or Lower',
        'Inside or Outside',
        'Choose a Suit',
        'Build Your Bus'
      ]
    }
  },
  computed: {
    currentPlayer() {
      return this.players[this.currentPlayerIndex] || 'Player'
    }
  },
  methods: {
    startNewGame() {
      this.currentRound = 1
      this.currentPlayerIndex = 0
      this.gameOver = false
      // Initialize game state
    }
  }
}
</script>

<style scoped>
.bus-game {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.game-area {
  margin-top: 20px;
}

button {
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
</style>