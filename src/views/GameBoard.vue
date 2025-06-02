<template>
  <div class="game-board">
    <!-- Only show game info and controls if not in pyramid round -->
    <div v-if="currentRound !== 5">
      <div class="game-info">
        <div class="player-info">
          <h3>{{ currentPlayer }}'s turn</h3>
          <div class="players-list">
            <span 
              v-for="(player, index) in players" 
              :key="index"
              :class="{ active: index === currentPlayerIndex }"
            >
              {{ player }}
            </span>
          </div>
        </div>
      </div>

      <div class="game-area">
        <div class="card-area">
          <div class="current-card" v-if="currentCard">
            <div class="card" :class="currentCard.color">
              {{ currentCard.value }} {{ currentCard.suit }}
            </div>
          </div>
        </div>

        <div class="controls" v-if="!gameOver">
          <!-- Red or Black -->
          <div v-if="currentRound === 1" class="choice-buttons">
            <button @click="makeGuess('red')" class="btn btn-danger">Red</button>
            <button @click="makeGuess('black')" class="btn btn-dark">Black</button>
          </div>

          <!-- Higher or Lower -->
          <div v-else-if="currentRound === 2" class="choice-buttons">
            <button @click="makeGuess('higher')" class="btn btn-primary">Higher</button>
            <button @click="makeGuess('lower')" class="btn btn-primary">Lower</button>
          </div>

          <!-- Inside or Outside -->
          <div v-else-if="currentRound === 3" class="choice-buttons">
            <button @click="makeGuess('inside')" class="btn btn-primary">Inside</button>
            <button @click="makeGuess('outside')" class="btn btn-primary">Outside</button>
          </div>

          <!-- Choose Suit -->
          <div v-else-if="currentRound === 4" class="choice-buttons">
            <button v-for="suit in ['♥', '♦', '♣', '♠']" 
                    :key="suit"
                    @click="makeGuess(suit)"
                    class="btn btn-primary">
              {{ suit }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Pyramid round -->
    <div v-else class="pyramid-container">
      <div class="pyramid">
        <div v-for="(row, rowIndex) in pyramid" 
             :key="rowIndex" 
             class="pyramid-row">
          <div v-for="(card, cardIndex) in row" 
               :key="cardIndex" 
               class="pyramid-card"
               :class="{ flipped: card.isFlipped }"
               @click="flipCard(rowIndex, cardIndex)">
            <div class="card-front card" :class="card.color">
              {{ card.value }} {{ card.suit }}
            </div>
            <div class="card-back"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Player cards display - always visible -->
    <div class="players-cards">
      <div v-for="(player, index) in players" 
           :key="index" 
           class="player-cards"
           :class="{ active: index === currentPlayerIndex }">
        <h4>{{ player }}'s Cards</h4>
        <div class="cards-row">
          <div v-for="(card, cardIndex) in playerCards[index]" 
               :key="cardIndex" 
               class="card"
               :class="card.color">
            {{ card.value }} {{ card.suit }}
          </div>
        </div>
      </div>
    </div>

    <!-- Message display - always visible -->
    <div v-if="message" class="message" :class="{ 'incorrect': !lastGuessCorrect }">
      {{ message }}
    </div>

    <!-- Game over display -->
    <div v-if="gameOver" class="game-over">
      <h2>Game Over!</h2>
      <button @click="restartGame" class="btn btn-primary">Play Again</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const players = ref([])
const currentPlayerIndex = ref(0)
const currentRound = ref(1)
const gameOver = ref(false)
const currentCard = ref(null)
const deck = ref([])
const message = ref('')
const lastGuessCorrect = ref(true)

const roundNames = [
  '', // Red or Black
  '', // Higher or Lower
  '', // Inside or Outside
  '', // Choose Suit
  ''  // Pyramid
]

const currentPlayer = computed(() => {
  return players.value[currentPlayerIndex.value]
})

const initializeDeck = () => {
  const suits = ['♥', '♦', '♣', '♠']
  const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const newDeck = []

  for (const suit of suits) {
    for (const value of values) {
      newDeck.push({
        suit,
        value,
        color: suit === '♥' || suit === '♦' ? 'red' : 'black',
        numericValue: values.indexOf(value)
      })
    }
  }

  deck.value = newDeck.sort(() => Math.random() - 0.5)
}

const drawCard = () => {
  if (deck.value.length === 0) return null
  return deck.value.pop()
}

const playerCards = ref([])

const makeGuess = (guess) => {
  const drawnCard = drawCard()
  currentCard.value = drawnCard
  
  const playerCurrentCards = playerCards.value[currentPlayerIndex.value]
  const previousCard = playerCurrentCards[playerCurrentCards.length - 1]
  
  let correct = false
  switch (currentRound.value) {
    case 1: // Red or Black
      correct = (guess === 'red' && drawnCard.color === 'red') ||
               (guess === 'black' && drawnCard.color === 'black')
      break
    case 2: // Higher or Lower
      if (previousCard) {
        if (guess === 'higher') {
          correct = drawnCard.numericValue > previousCard.numericValue
        } else {
          correct = drawnCard.numericValue < previousCard.numericValue
        }
      }
      break
    case 3: // Inside or Outside
      if (playerCurrentCards.length >= 2) {
        const firstCard = playerCurrentCards[playerCurrentCards.length - 2]
        const secondCard = playerCurrentCards[playerCurrentCards.length - 1]
        const min = Math.min(firstCard.numericValue, secondCard.numericValue)
        const max = Math.max(firstCard.numericValue, secondCard.numericValue)
        
        if (guess === 'inside') {
          correct = drawnCard.numericValue > min && drawnCard.numericValue < max
        } else {
          correct = drawnCard.numericValue < min || drawnCard.numericValue > max
        }
      }
      break
    case 4: // Choose Suit
      correct = drawnCard.suit === guess
      break
  }

  // Add card to player's cards after checking
  playerCards.value[currentPlayerIndex.value].push(drawnCard)

  lastGuessCorrect.value = correct
  message.value = correct 
    ? 'Correct! You\'re safe!' 
    : `Wrong! Take a drink, ${currentPlayer.value}! 🍺`

  setTimeout(() => {
    message.value = ''
  }, 5000)

  nextTurn()
}

const nextTurn = () => {
  currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
  if (currentPlayerIndex.value === 0) {
    currentRound.value++
    if (currentRound.value > 5) {
      gameOver.value = true
    }
  }
}

const restartGame = () => {
  router.push('/')
}

const pyramid = ref([])

onMounted(() => {
  const savedPlayers = localStorage.getItem('players')
  if (savedPlayers) {
    players.value = JSON.parse(savedPlayers)
    playerCards.value = players.value.map(() => [])
  } else {
    router.push('/setup')
  }
  
  initializeDeck()
  initializePyramid()
})

const initializePyramid = () => {
  pyramid.value = [
    [drawCard(), drawCard(), drawCard(), drawCard()], // Left row - 4 cards
    [drawCard(), drawCard(), drawCard()], // Second row - 3 cards
    [drawCard(), drawCard()], // Third row - 2 cards
    [drawCard()] // Right row - 1 card
  ]

  // Initialize isFlipped property for each card
  pyramid.value.forEach(row => {
    row.forEach(card => {
      card.isFlipped = false
    })
  })
}

const flipCard = (rowIndex, cardIndex) => {
  const card = pyramid.value[rowIndex][cardIndex]
  if (card.isFlipped) return // Already flipped

  card.isFlipped = true

  // Check all players' cards for matches
  players.value.forEach((player, playerIndex) => {
    const playerCurrentCards = playerCards.value[playerIndex]
    const matchingCardIndex = playerCurrentCards.findIndex(playerCard => 
      playerCard.value === card.value && playerCard.suit === card.suit
    )

    if (matchingCardIndex !== -1) {
      // Add removing class first for animation
      const cardElement = document.querySelector(
        `.player-cards:nth-child(${playerIndex + 1}) .card:nth-child(${matchingCardIndex + 1})`
      )
      if (cardElement) {
        cardElement.classList.add('removing')
        
        // Remove card after animation
        setTimeout(() => {
          playerCurrentCards.splice(matchingCardIndex, 1)
        }, 300)
      }

      message.value = `${player} lost a ${card.value} ${card.suit}! Drink! 🍺`
      setTimeout(() => {
        message.value = ''
      }, 3000)
    }
  })

  // Check if all cards are flipped to end the game
  const allFlipped = pyramid.value.every(row => 
    row.every(card => card.isFlipped)
  )

  if (allFlipped) {
    gameOver.value = true
  }
}
</script>