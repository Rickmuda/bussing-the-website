<template>
  <div class="game-board">
    <!-- Add bus length selection phase -->
    <div v-if="selectingBusLength" class="bus-selection">
      <h3>{{ players[busPlayer] }}, select a card to determine your bus length</h3>
      <div class="cards-row">
        <div v-for="(card, index) in busCards" 
             :key="index"
             class="card"
             :class="[card.color, { 'flip-in': card.isFlipped }]"
             @click="selectBusCard(card, index)">
          <div v-if="card.isFlipped">
            {{ card.value }} {{ card.suit }}
          </div>
          <div v-else class="card-back">
            <div class="back-pattern"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add bus building phase -->
    <div v-if="buildingBus" class="bus-building">
      <h3>{{ players[busPlayer] }}'s Bus</h3>
      <div class="bus-counter">
        <p>Cards remaining: {{ busLength - busCurrentIndex }} / {{ busLength }}</p>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: (busCurrentIndex / busLength) * 100 + '%' }"></div>
        </div>
        <p v-if="busCurrentIndex >= 5" class="checkpoint-info">✓ Checkpoint reached!</p>
      </div>
      
      <!-- Show message for first card -->
      <div v-if="busCurrentIndex === 0" class="first-card-message">
        <h4>First card - no comparison needed!</h4>
        <p>Press either button to draw the first card</p>
      </div>
      
      <!-- Show all bus cards with current one highlighted -->
      <div class="bus-cards-grid">
        <div v-for="(card, index) in busCards" 
             :key="index"
             class="card"
             :class="[
               card.color, 
               { 
                 'current': index === busCurrentIndex,
                 'completed': index < busCurrentIndex,
                 'upcoming': index > busCurrentIndex,
                 'checkpoint': index === 4
               }
             ]">
          {{ card.value }} {{ card.suit }}
        </div>
      </div>
      
      <div v-if="!gameOver && busCurrentIndex < busLength && !showBusResult" class="choice-buttons">
        <button @click="makeBusGuess('higher')" class="btn btn-primary">Higher</button>
        <button @click="makeBusGuess('lower')" class="btn btn-primary">Lower</button>
      </div>
    </div>

    <!-- Only show game info and controls if not in pyramid round -->
    <div v-if="currentRound !== 5">
      <div class="game-info">
        <div class="player-info">
          <h3>{{ currentPlayer }}'s turn</h3>
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
    <div v-else-if="currentRound === 5 && !selectingBusLength && !buildingBus" class="pyramid-container">
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

    <!-- Player cards display - only during rounds 1-5, not bus phases -->
    <div v-if="!selectingBusLength && !buildingBus" class="players-cards">
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
  const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
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

// Add new refs
const isRevealed = ref(false)
const hasGuessed = ref(false)
const showButtons = ref(true)

// Add new refs for bus result display
const showBusResult = ref(false)
const currentBusCard = ref(null)

const makeGuess = async (guess) => {
  showButtons.value = false
  
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
        const missingSuits = getMissingSuits(playerCurrentCards)
        correct = missingSuits.length === 1 && drawnCard.suit === missingSuits[0]
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

  playerCards.value[currentPlayerIndex.value].push({
    ...drawnCard,
    suit: drawnCard.suit,
    value: drawnCard.value,
    color: drawnCard.color,
    numericValue: drawnCard.numericValue
  })
  
  lastGuessCorrect.value = correct

  setTimeout(() => {
    message.value = correct 
      ? 'Correct! You\'re safe!' 
      : `Wrong! Take a drink, ${currentPlayer.value}! 🍺`

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
  localStorage.removeItem('playerCards')
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

const hasValueInPyramid = (pyramidCards, value) => {
  return pyramidCards.some(card => card.value === value)
}

const initializePyramid = () => {
  const pyramidCards = []
  const totalCards = 10
  
  while (pyramidCards.length < totalCards) {
    const card = drawCard()
    if (card && !hasValueInPyramid(pyramidCards, card.value)) {
      pyramidCards.push(card)
    }
  }

  pyramid.value = [
    pyramidCards.slice(0, 4),
    pyramidCards.slice(4, 7),
    pyramidCards.slice(7, 9),
    pyramidCards.slice(9, 10)
  ]

  pyramid.value.forEach(row => {
    row.forEach(card => {
      card.isFlipped = false
    })
  })
}

const flipCard = (rowIndex, cardIndex) => {
  const card = pyramid.value[rowIndex][cardIndex]
  if (card.isFlipped) return

  card.isFlipped = true

  players.value.forEach((player, playerIndex) => {
    const playerCurrentCards = playerCards.value[playerIndex]
    const matchingCardIndices = playerCurrentCards
      .map((card, index) => ({ card, index }))
      .filter(({ card: playerCard }) => playerCard.value === card.value)
      .map(({ index }) => index)
      .reverse()

    if (matchingCardIndices.length > 0) {
      matchingCardIndices.forEach(index => {
        playerCards.value[playerIndex].splice(index, 1)
      })

      message.value = `${player} lost ${matchingCardIndices.length} ${card.value}${
        matchingCardIndices.length > 1 ? 's' : ''
      }! Drink ${matchingCardIndices.length} times! ${
        '🍺'.repeat(matchingCardIndices.length)
      }`
    }
  })

  const allFlipped = pyramid.value.every(row => 
    row.every(card => card.isFlipped)
  )

  if (allFlipped) {
    setTimeout(() => {
      message.value = "Pyramid round complete! Time to build the bus!"
      setTimeout(() => {
        selectingBusLength.value = true
        busPlayer.value = findPlayerWithMostCards()
        initializeBusLength()
        message.value = ''
      }, 2000)
    }, 1000)
  }
}

const getMissingSuits = (playerCards) => {
  const playerSuits = new Set(playerCards.map(card => card.suit))
  const allSuits = new Set(['♥', '♦', '♣', '♠'])
  return Array.from(allSuits).filter(suit => !playerSuits.has(suit))
}

// Bus building refs
const busLength = ref(null)
const busCards = ref([])
const busCurrentIndex = ref(0)
const busPlayer = ref(null)
const selectingBusLength = ref(false)
const buildingBus = ref(false)

const findPlayerWithMostCards = () => {
  let maxCards = 0
  let playersWithMax = []

  playerCards.value.forEach((cards, index) => {
    if (cards.length > maxCards) {
      maxCards = cards.length
      playersWithMax = [index]
    } else if (cards.length === maxCards) {
      playersWithMax.push(index)
    }
  })

  if (playersWithMax.length > 1) {
    const randomIndex = Math.floor(Math.random() * playersWithMax.length)
    const chosenPlayer = playersWithMax[randomIndex]
    
    message.value = `Multiple players had ${maxCards} cards. ${players.value[chosenPlayer]} was randomly selected!`
    setTimeout(() => {
      message.value = ''
    }, 3000)
    
    return chosenPlayer
  }

  return playersWithMax[0]
}

const initializeBusLength = () => {
  selectingBusLength.value = true
  busPlayer.value = findPlayerWithMostCards()
  
  const selectionCards = []
  for (let i = 0; i < 8; i++) {
    const card = drawCard()
    if (card) {
      card.isFlipped = false
      selectionCards.push(card)
    }
  }
  busCards.value = selectionCards
}

const selectBusCard = (card, index) => {
  card.isFlipped = true
  
  setTimeout(() => {
    let length
    if (card.value === 'J') length = 11
    else if (card.value === 'Q') length = 12
    else if (card.value === 'K') length = 13
    else if (card.value === 'A') length = 14
    else length = parseInt(card.value)
    
    busLength.value = length
    
    message.value = `Bus length set to ${length} cards!`
    
    setTimeout(() => {
      message.value = ''
      selectingBusLength.value = false
      buildingBus.value = true
      initializeBus()
    }, 2000)
  }, 1000)
}

const initializeBus = () => {
  busCards.value = []
  busCurrentIndex.value = 0
  showBusResult.value = false
  currentBusCard.value = null
  
  // Create empty slots for the bus
  for (let i = 0; i < busLength.value; i++) {
    busCards.value.push({ value: '?', suit: '', color: 'black', numericValue: 0 })
  }
}

const makeBusGuess = (guess) => {
  // Draw a new random card
  currentBusCard.value = drawCard()
  
  const drawnCard = currentBusCard.value
  const previousCard = busCurrentIndex.value > 0 ? busCards.value[busCurrentIndex.value - 1] : null
  
  let correct = false
  
  if (!previousCard) {
    // First card is always correct (no comparison) and immediately placed
    correct = true
    busCards.value[busCurrentIndex.value] = { ...drawnCard }
    busCurrentIndex.value++
    message.value = `First card placed: ${drawnCard.value} ${drawnCard.suit}`
    
    // Skip the result display for first card
    setTimeout(() => {
      message.value = ''
    }, 2000)
    return
  } else if (
    (guess === 'higher' && drawnCard.numericValue > previousCard.numericValue) ||
    (guess === 'lower' && drawnCard.numericValue < previousCard.numericValue)
  ) {
    correct = true
    message.value = `Correct! You guessed ${guess} and got ${drawnCard.value} ${drawnCard.suit}!`
  } else {
    message.value = `Wrong! You guessed ${guess} but got ${drawnCard.value} ${drawnCard.suit}! 🍺`
  }
  
  // Show the result cards (only for cards after the first)
  showBusResult.value = true
  
  // Handle the result after showing cards
  setTimeout(() => {
    if (correct) {
      // Add the drawn card to the bus
      busCards.value[busCurrentIndex.value] = { ...drawnCard }
      busCurrentIndex.value++
      
      if (busCurrentIndex.value >= busLength.value) {
        gameOver.value = true
        buildingBus.value = false
        message.value = `${players.value[busPlayer.value]} completed their bus! Game Over! 🎉`
        return
      } else if (busCurrentIndex.value === 5) {
        message.value = 'Checkpoint reached! Keep going!'
      } else {
        message.value = 'Correct! Keep going!'
      }
    } else {
      // Reset cards based on checkpoint
      if (busCurrentIndex.value >= 5) {
        // Reset to checkpoint (5th card) - clear cards after position 4
        for (let i = 5; i < busLength.value; i++) {
          busCards.value[i] = { value: '?', suit: '', color: 'black', numericValue: 0 }
        }
        busCurrentIndex.value = 5
        message.value = `Wrong! Back to checkpoint, ${players.value[busPlayer.value]}! 🍺`
      } else {
        // Reset to beginning but keep the first card
        for (let i = 1; i < busLength.value; i++) {
          busCards.value[i] = { value: '?', suit: '', color: 'black', numericValue: 0 }
        }
        busCurrentIndex.value = 1
        message.value = `Wrong! Start over, ${players.value[busPlayer.value]}! 🍺`
      }
    }
    
    // Hide result and continue game
    setTimeout(() => {
      showBusResult.value = false
      currentBusCard.value = null
      if (!gameOver.value) {
        message.value = ''
      }
    }, 2000)
  }, 3000) // Show result for 3 seconds
}
</script>