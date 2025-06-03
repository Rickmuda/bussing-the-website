<template>
  <div class="game-board">
    <!-- Add bus length selection phase -->
    <div v-if="selectingBusLength" class="bus-selection">
      <h3>{{ players[busPlayer] }}, select a card to determine your bus length</h3>
      <div class="cards-row">
        <div v-for="(card, index) in busCards" 
             :key="index"
             class="card"
             :class="card.color"
             @click="selectBusCard(card, index)">
          {{ card.value }} {{ card.suit }}
        </div>
      </div>
    </div>

    <!-- Add bus building phase -->
    <div v-if="buildingBus" class="bus-building">
      <h3>{{ players[busPlayer] }}'s Bus</h3>
      <div class="bus-cards">
        <div v-for="(card, index) in busCards" 
             :key="index"
             class="card"
             :class="[card.color, { 'flipped': card.isFlipped }]">
          <div v-if="card.isFlipped">
            {{ card.value }} {{ card.suit }}
          </div>
          <div v-else class="card-back">
            <div class="back-pattern"></div>
          </div>
        </div>
      </div>
      
      <div v-if="!gameOver" class="choice-buttons">
        <button @click="makeBusGuess('higher')" class="btn btn-primary">Higher</button>
        <button @click="makeBusGuess('lower')" class="btn btn-primary">Lower</button>
      </div>
    </div>

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
          <div class="current-card">
            <div v-if="currentCard" class="card" :class="[currentCard.color, { 'flip-out': hasGuessed }]">
              {{ currentCard.value }} {{ currentCard.suit }}
            </div>
            <div v-else-if="!currentCard && showButtons" class="card card-back" :class="{ 'flip-in': isRevealed }">
              <div class="back-pattern"></div>
            </div>
          </div>
        </div>

        <div class="controls" v-if="!gameOver && showButtons">
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
            <button @click="makeGuess('yes')" class="btn btn-success">Yes</button>
            <button @click="makeGuess('no')" class="btn btn-danger">No</button>
            <button 
              v-if="getMissingSuits(playerCards[currentPlayerIndex]).length === 1"
              @click="makeGuess('disco')" 
              class="btn btn-warning">
              Disco
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
  '', // Have This Suit
  ''  // Pyramid
]

const currentPlayer = computed(() => {
  return players.value[currentPlayerIndex.value]
})

const initializeDeck = () => {
  const suits = ['♥', '♦', '♣', '♠']
  // Update values array to put 'A' at the end
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const newDeck = []

  for (const suit of suits) {
    for (const value of values) {
      newDeck.push({
        suit,
        value,
        color: suit === '♥' || suit === '♦' ? 'red' : 'black',
        // numericValue will now be 0-12 with A being 12 (highest)
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

// Add new ref for shown card
const shownCard = ref(null)

// Add new refs
const isRevealed = ref(false)
const hasGuessed = ref(false)

// Add new ref to track if we're showing buttons
const showButtons = ref(true)

// Modified makeGuess function
const makeGuess = async (guess) => {
  // Hide buttons immediately after guess
  showButtons.value = false
  
  // Draw card if not already drawn
  if (!currentCard.value) {
    currentCard.value = drawCard()
  }

  const drawnCard = currentCard.value
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
    case 4: // Has Same Suit
      if (guess === 'disco') {
        // If player chose disco, they're betting the card will be their missing suit
        const missingSuits = getMissingSuits(playerCurrentCards)
        correct = missingSuits.length === 1 && drawnCard.suit === missingSuits[0]
        // Double the drinking if wrong with disco
        if (!correct) {
          message.value = `Wrong! Take TWO drinks, ${currentPlayer.value}! 🍺🍺`
        }
      } else {
        const hasMatchingSuit = playerCurrentCards.some(card => card.suit === drawnCard.suit)
        correct = (guess === 'yes' && hasMatchingSuit) || 
                 (guess === 'no' && !hasMatchingSuit)
      }
      break
  }

  // Add card to player's cards
  playerCards.value[currentPlayerIndex.value].push({
    ...drawnCard,
    suit: drawnCard.suit,
    value: drawnCard.value,
    color: drawnCard.color,
    numericValue: drawnCard.numericValue
  })
  
  lastGuessCorrect.value = correct

  // Show result after card is revealed
  setTimeout(() => {
    message.value = correct 
      ? 'Correct! You\'re safe!' 
      : `Wrong! Take a drink, ${currentPlayer.value}! 🍺`

    // Reset state and move to next turn
    setTimeout(() => {
      message.value = ''
      currentCard.value = null
      isRevealed.value = false
      showButtons.value = true
      nextTurn()
    }, 2000)
  }, 500)
}

const nextTurn = () => {
  if (currentRound.value === 5 && gameOver.value) {
    // Start bus length selection instead of ending game
    initializeBusLength()
    return
  }
  currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
  if (currentPlayerIndex.value === 0) {
    currentRound.value++
    if (currentRound.value > 5) {
      gameOver.value = true
    }
  }
}

const restartGame = () => {
  localStorage.removeItem('playerCards') // Clear stored cards
  router.push('/')
}

const pyramid = ref([])

onMounted(() => {
  const savedPlayers = localStorage.getItem('players')
  
  if (savedPlayers) {
    players.value = JSON.parse(savedPlayers)
    // Initialize empty arrays for each player's cards - no loading from storage
    playerCards.value = players.value.map(() => [])
  } else {
    router.push('/setup')
  }
  
  initializeDeck()
  initializePyramid()
})

// Add helper function to check for duplicate values in pyramid
const hasValueInPyramid = (pyramidCards, value) => {
  return pyramidCards.some(card => card.value === value)
}

const initializePyramid = () => {
  const pyramidCards = []
  const totalCards = 10 // 4 + 3 + 2 + 1 cards needed for pyramid
  
  while (pyramidCards.length < totalCards) {
    const card = drawCard()
    // Only add card if its value is not already in the pyramid
    if (card && !hasValueInPyramid(pyramidCards, card.value)) {
      pyramidCards.push(card)
    }
  }

  // Arrange unique cards into pyramid structure
  pyramid.value = [
    pyramidCards.slice(0, 4),  // Left row - 4 cards
    pyramidCards.slice(4, 7),  // Second row - 3 cards
    pyramidCards.slice(7, 9),  // Third row - 2 cards
    pyramidCards.slice(9, 10)  // Right row - 1 card
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

  // Check all players' cards for matches based on value only
  players.value.forEach((player, playerIndex) => {
    const playerCurrentCards = playerCards.value[playerIndex]
    // Find all matching cards by value
    const matchingCardIndices = playerCurrentCards
      .map((card, index) => ({ card, index }))
      .filter(({ card: playerCard }) => playerCard.value === card.value)
      .map(({ index }) => index)
      .reverse() // Reverse to remove from end to start

    if (matchingCardIndices.length > 0) {
      // Remove each matching card with animation
      matchingCardIndices.forEach(matchIndex => {
        const cardElement = document.querySelector(
          `.player-cards:nth-child(${playerIndex + 1}) .card:nth-child(${matchIndex + 1})`
        )
        if (cardElement) {
          cardElement.classList.add('removing')
          
          // Remove card after animation
          setTimeout(() => {
            playerCurrentCards.splice(matchIndex, 1)
          }, 300)
        }
      })

      // Update message based on number of matches
      const matchCount = matchingCardIndices.length
      message.value = `${player} lost ${matchCount} ${card.value}${matchCount > 1 ? 's' : ''}! Drink ${matchCount} times! ${
        '🍺'.repeat(matchCount)
      }`
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

// Add this helper function
const getMissingSuits = (playerCards) => {
  const playerSuits = new Set(playerCards.map(card => card.suit))
  const allSuits = new Set(['♥', '♦', '♣', '♠'])
  return Array.from(allSuits).filter(suit => !playerSuits.has(suit))
}

// Add new refs for bus building phase
const busLength = ref(null)
const busCards = ref([])
const busCurrentIndex = ref(0)
const busPlayer = ref(null)
const selectingBusLength = ref(false)
const buildingBus = ref(false)

// Add function to find player with most cards after pyramid
const findPlayerWithMostCards = () => {
  let maxCards = 0
  let maxPlayer = 0
  playerCards.value.forEach((cards, index) => {
    if (cards.length > maxCards) {
      maxCards = cards.length
      maxPlayer = index
    }
  })
  return maxPlayer
}

// Add function to initialize bus length selection
const initializeBusLength = () => {
  selectingBusLength.value = true
  busPlayer.value = findPlayerWithMostCards()
  
  // Draw 8 random cards for selection
  const selectionCards = []
  for (let i = 0; i < 8; i++) {
    const card = drawCard()
    if (card) selectionCards.push(card)
  }
  busCards.value = selectionCards
}

// Add function to handle bus length card selection
const selectBusCard = (card, index) => {
  busLength.value = parseInt(card.value) || 10 // Use 10 for face cards
  busCards.value = []
  selectingBusLength.value = false
  buildingBus.value = true
  initializeBus()
}

// Add function to initialize bus
const initializeBus = () => {
  busCards.value = []
  busCurrentIndex.value = 0
  
  // Draw cards for the bus
  for (let i = 0; i < busLength.value; i++) {
    const card = drawCard()
    if (card) {
      card.isFlipped = false
      busCards.value.push(card)
    }
  }
}

// Add bus guessing function
const makeBusGuess = (guess) => {
  const currentCard = busCards.value[busCurrentIndex.value]
  const previousCard = busCurrentIndex.value > 0 ? busCards.value[busCurrentIndex.value - 1] : null
  
  currentCard.isFlipped = true
  let correct = false
  
  if (!previousCard || (
    guess === 'higher' && currentCard.numericValue > previousCard.numericValue ||
    guess === 'lower' && currentCard.numericValue < previousCard.numericValue
  )) {
    correct = true
  }
  
  if (!correct) {
    // On wrong guess, reset to beginning
    busCurrentIndex.value = 0
    busCards.value.forEach(card => card.isFlipped = false)
    message.value = `Wrong! Start over, ${players.value[busPlayer.value]}! 🍺`
  } else {
    busCurrentIndex.value++
    if (busCurrentIndex.value >= busLength.value) {
      // Game truly over
      gameOver.value = true
      buildingBus.value = false
      message.value = `${players.value[busPlayer.value]} completed their bus! Game Over! 🎉`
    } else {
      message.value = 'Correct! Keep going!'
    }
  }
  
  setTimeout(() => {
    message.value = ''
  }, 2000)
}
</script>