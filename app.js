// app.js

//Global variables

let gameData;
// Fetch game data from JSON file
fetch('gameData.json')
  .then(response => response.json())
  .then(data=> {    
     gameData = data;
     initGame(); // <<-- Call it here after data loads
  })
  .catch(error => console.error("Failed to load JSON:", error));

  // Game state management
  const gameState = {
      currentActivity: "introduction",
      score: 0,
      completedActivities: 0,
      totalActivities: 4,
      activityCompleted: {
          multipleChoice: false,
          fillBlanks: false,
          dragDrop: false,
          habits: false
      },
      questionAnswered: {}
  };

  // DOM Elements
  const contentContainer = document.getElementById('content-container');
  const scoreDisplay = document.getElementById('score');
  const progressBar = document.getElementById('progressBar');
  const congratsMessage = document.getElementById('congratsMessage');
  const finalScoreDisplay = document.getElementById('finalScore');
  
  // Event Listeners
  document.getElementById('playAgain').addEventListener('click', resetGame);
  
  // Initialize the game
  function initGame() {
      renderIntroduction();
      updateProgressBar();
  }
  
  // Render introduction section
  function renderIntroduction() {
      const intro = gameData.introduction;
      
      let rulesHtml = '';
      intro.rules.forEach(rule => {
          rulesHtml += `
              <div class="rule-box">
                  <h3>${rule.title}</h3>
                  <p>${rule.description}</p>
                  <p><strong>${rule.examples.join(', ')}</strong></p>
                  <p>${rule.sampleSentence}</p>
              </div>
          `;
      });
      
      const introHtml = `
          <div class="section" id="introduction">
              <h2>${intro.title}</h2>
              ${rulesHtml}
              <img src="assets/Learning Grammar.jpeg" alt="Kid learning grammar" class="character">
              <div class="nav-buttons">
                  <button class="nav-btn" id="startActivity">Start Activities</button>
              </div>
          </div>
      `;
      
      contentContainer.innerHTML = introHtml;
      
      // Add event listener to start button
      document.getElementById('startActivity').addEventListener('click', () => {
          renderActivity("multipleChoice");
      });
  }
  
  // Render activity based on ID
  function renderActivity(activityId) {
      gameState.currentActivity = activityId;
      
      // Find the activity data
      const activity = gameData.activities.find(act => act.id === activityId);
      if (!activity) return;
      
      // Create activity HTML based on its type
      let activityHtml = `
          <div class="section" id="${activity.id}">
              <h2>${activity.title}</h2>
              <p>${activity.instructions}</p>
      `;
      
      switch (activityId) {
          case "multipleChoice":
              activityHtml += renderMultipleChoice(activity);
              break;
              
          case "fillBlanks":
              activityHtml += renderFillBlanks(activity);
              break;
              
          case "dragDrop":
              activityHtml += renderDragDrop(activity);
              break;
              
          case "habits":
              activityHtml += renderHabits(activity);
              break;
      }
      
      // Add navigation buttons
      activityHtml += `
          <div class="nav-buttons">
              ${getPreviousActivityButton(activityId)}
              ${getNextActivityButton(activityId)}
          </div>
          </div>
      `;
      
      contentContainer.innerHTML = activityHtml;
      
      // Initialize activity-specific behavior
      initActivityBehavior(activityId);
  }
  
  // Render Multiple Choice activity
  function renderMultipleChoice(activity) {
      let html = '';
      
      activity.questions.forEach((question, index) => {
          html += `
              <div class="activity" id="${question.id}">
                  <p>${index + 1}. ${question.text}</p>
                  <div class="options">
                      ${question.options.map(option => `
                          <button class="option" 
                              data-correct="${option.correct}" 
                              data-question="${question.id}">${option.text}</button>
                      `).join('')}
                  </div>
                  <div class="feedback" id="feedback-${question.id}"></div>
              </div>
          `;
      });
      
      return html;
  }
  
  // Render Fill in the Blanks activity
  function renderFillBlanks(activity) {
      const story = activity.story;
      let storyText = story.text;
      
      // Replace placeholders with input fields
      story.blanks.forEach(blank => {
          const placeholder = `{${blank.answer}}`;
          const input = `<input type="text" class="fill-input" id="${blank.id}" data-answer="${blank.answer}" size="8"> (${blank.verb})`;
          storyText = storyText.replace(placeholder, input);
      });
      
      return `
          <div class="activity">
              <p>${story.title}</p>
              <p>${storyText}</p>
              <button id="checkStory">Check My Answers</button>
              <div class="feedback" id="storyFeedback"></div>
          </div>
      `;
  }
  
  // Render Drag and Drop activity
  function renderDragDrop(activity) {
      // Create sentences with drop zones
      let sentencesHtml = '';
      activity.sentences.forEach(sentence => {
          let sentenceText = sentence.text;
          
          // Replace drop zone placeholders
          sentence.drops.forEach(drop => {
              const placeholder = `[${drop.id}]`;
              const dropZone = `<span class="drop-zone" id="${drop.id}" data-correct-item="${drop.correctItem}"></span>`;
              sentenceText = sentenceText.replace(placeholder, dropZone);
          });
          
          sentencesHtml += `<p>${sentenceText}</p>`;
      });
      
      // Create drag items
      const dragItemsHtml = `
          <div class="drag-container" id="dragContainer">
              ${activity.dragItems.map(item => `
                  <div class="drag-item" draggable="true" 
                      id="${item.id}" 
                      data-correct-target="${item.correctTarget}">${item.text}</div>
              `).join('')}
          </div>
      `;
      
      return `
          <div class="activity">
              ${sentencesHtml}
              ${dragItemsHtml}
              <button id="checkDrag">Check My Answers</button>
              <div class="feedback" id="dragFeedback"></div>
          </div>
      `;
  }
  
  // Render Habits activity
  function renderHabits(activity) {
      return `
          <div class="activity">
              <p>How often do you do these things?</p>
              ${activity.questions.map(q => `
                  <p>${q.text} <input type="text" id="${q.id}" placeholder="write your answer" class="user-input"></p>
              `).join('')}
              <button id="saveAnswers">Save My Answers</button>
              <div class="feedback" id="habitsFeedback"></div>
          </div>
      `;
  }
  
  // Initialize activity-specific behaviors
  function initActivityBehavior(activityId) {
      switch (activityId) {
          case "multipleChoice":
              initMultipleChoice();
              break;
              
          case "fillBlanks":
              initFillBlanks();
              break;
              
          case "dragDrop":
              initDragDrop();
              break;
              
          case "habits":
              initHabits();
              break;
      }
      
      // Add navigation event listeners
      const prevBtn = document.getElementById('prevActivity');
      const nextBtn = document.getElementById('nextActivity');
      
      if (prevBtn) {
          prevBtn.addEventListener('click', () => {
              const prevActivity = getPreviousActivity(activityId);
              if (prevActivity === "introduction") {
                  renderIntroduction();
              } else {
                  renderActivity(prevActivity);
              }
          });
      }
      
      if (nextBtn) {
          nextBtn.addEventListener('click', () => {
              const nextActivity = getNextActivity(activityId);
              renderActivity(nextActivity);
          });
      }
  }
  
  // Initialize Multiple Choice activity
  function initMultipleChoice() {
      const options = document.querySelectorAll('.option');
      
      options.forEach(option => {
          const questionId = option.getAttribute('data-question');
          
          // Disable answered questions
          if (gameState.questionAnswered[questionId]) {
              const parent = option.parentElement;
              parent.querySelectorAll('.option').forEach(opt => {
                  opt.disabled = true;
                  if (opt.getAttribute('data-correct') === 'true' && 
                      gameState.questionAnswered[questionId] === 'correct') {
                      opt.classList.add('correct');
                  }
              });
              
              // Show feedback
              const feedback = document.getElementById(`feedback-${questionId}`);
              if (feedback) {
                  feedback.textContent = '✅ Great job! That\'s correct!';
                  feedback.style.color = 'green';
              }
          }
          
          option.addEventListener('click', function() {
              // Skip if already answered
              if (gameState.questionAnswered[questionId]) return;
              
              const parent = this.parentElement;
              const feedback = document.getElementById(`feedback-${questionId}`);
              const isCorrect = this.getAttribute('data-correct') === 'true';
              
              // Remove previous classes
              parent.querySelectorAll('.option').forEach(opt => {
                  opt.disabled = true;
              });
              
              // Add appropriate class
              this.classList.add(isCorrect ? 'correct' : 'incorrect');
              
              // Show feedback
              if (isCorrect) {
                  feedback.textContent = '✅ Great job! That\'s correct!';
                  feedback.style.color = 'green';
                  updateScore(10);
                  gameState.questionAnswered[questionId] = 'correct';
                  
                  // Check if all questions are answered
                  checkActivityCompletion('multipleChoice');
              } else {
                  feedback.textContent = '❌ Oops! Try again!';
                  feedback.style.color = 'red';
                  
                  // Re-enable options after a short delay
                  setTimeout(() => {
                      parent.querySelectorAll('.option').forEach(opt => {
                          opt.disabled = false;
                          opt.classList.remove('incorrect');
                      });
                      feedback.textContent = '';
                  }, 1500);
              }
          });
      });
  }
  
  // Initialize Fill in the Blanks activity
  function initFillBlanks() {
      const checkButton = document.getElementById('checkStory');
      
      checkButton.addEventListener('click', function() {
          const inputs = document.querySelectorAll('.fill-input');
          let allCorrect = true;
          let correctCount = 0;
          
          inputs.forEach(input => {
              const userAnswer = input.value.trim().toLowerCase();
              const correctAnswer = input.getAttribute('data-answer').toLowerCase();
              
              if (userAnswer === correctAnswer) {
                  input.style.backgroundColor = '#c8e6c9';
                  input.style.borderColor = '#4caf50';
                  correctCount++;
              } else {
                  input.style.backgroundColor = '#ffcdd2';
                  input.style.borderColor = '#f44336';
                  allCorrect = false;
              }
          });
          
          const feedback = document.getElementById('storyFeedback');
          if (allCorrect) {
              feedback.textContent = '✅ Perfect! All answers are correct!';
              feedback.style.color = 'green';
              
              if (!gameState.activityCompleted.fillBlanks) {
                  updateScore(15);
                  gameState.activityCompleted.fillBlanks = true;
                  updateCompletedActivities();
              }
          } else {
              feedback.textContent = `✓ You got ${correctCount} out of ${inputs.length} correct. Keep trying!`;
              feedback.style.color = 'orange';
          }
      });
  }
  
  // Initialize Drag and Drop activity
  function initDragDrop() {
      const dragItems = document.querySelectorAll('.drag-item');
      const dropZones = document.querySelectorAll('.drop-zone');
      let draggedItem = null;
      
      dragItems.forEach(item => {
          item.addEventListener('dragstart', function(e) {
              draggedItem = this;
              setTimeout(() => this.style.opacity = '0.5', 0);
              e.dataTransfer.setData('text/plain', this.id);
          });
          
          item.addEventListener('dragend', function() {
              setTimeout(() => this.style.opacity = '1', 0);
              draggedItem = null;
          });
      });
      
      dropZones.forEach(zone => {
          zone.addEventListener('dragover', function(e) {
              e.preventDefault();
              this.style.backgroundColor = '#bbdefb';
          });
          
          zone.addEventListener('dragleave', function() {
              this.style.backgroundColor = '#e3f2fd';
          });
          
          zone.addEventListener('drop', function(e) {
              e.preventDefault();
              this.style.backgroundColor = '#e3f2fd';
              
              if (draggedItem) {
                  // If the drop zone already has an item, move it back to the container
                  if (this.firstChild) {
                      const container = document.getElementById('dragContainer');
                      container.appendChild(this.firstChild);
                  }
                  
                  this.appendChild(draggedItem);
              }
          });
      });
      
      document.getElementById('checkDrag').addEventListener('click', function() {
          let allCorrect = true;
          let correctCount = 0;
          
          dropZones.forEach(zone => {
              const correctItem = zone.getAttribute('data-correct-item');
              
              if (zone.firstChild && 
                  zone.firstChild.textContent === correctItem) {
                  zone.style.backgroundColor = '#c8e6c9';
                  zone.style.borderColor = '#4caf50';
                  correctCount++;
              } else {
                  zone.style.backgroundColor = '#ffcdd2';
                  zone.style.borderColor = '#f44336';
                  allCorrect = false;
              }
          });
          
          const feedback = document.getElementById('dragFeedback');
          if (allCorrect) {
              feedback.textContent = '✅ Amazing! All matches are correct!';
              feedback.style.color = 'green';
              
              if (!gameState.activityCompleted.dragDrop) {
                  updateScore(20);
                  gameState.activityCompleted.dragDrop = true;
                  updateCompletedActivities();
              }
          } else {
              feedback.textContent = `✓ You matched ${correctCount} correctly. Keep trying!`;
              feedback.style.color = 'orange';
          }
      });
  }
  
  // Initialize Habits activity
  function initHabits() {
      document.getElementById('saveAnswers').addEventListener('click', function() {
          const inputs = document.querySelectorAll('.user-input');
          let allFilled = true;
          
          inputs.forEach(input => {
              if (input.value.trim() === '') {
                  allFilled = false;
                  input.style.borderColor = '#f44336';
              } else {
                  input.style.borderColor = '#4caf50';
              }
          });
          
          const feedback = document.getElementById('habitsFeedback');
          if (allFilled) {
              feedback.textContent = '✅ Your answers have been saved!';
              feedback.style.color = 'green';
              
              if (!gameState.activityCompleted.habits) {
                  updateScore(5);
                  gameState.activityCompleted.habits = true;
                  updateCompletedActivities();
              }
          } else {
              feedback.textContent = '❌ Please fill in all the fields!';
              feedback.style.color = 'red';
          }
      });
  }
  
  // Helper function to get previous activity ID
  function getPreviousActivity(currentActivityId) {
      const activityIds = gameData.activities.map(a => a.id);
      const currentIndex = activityIds.indexOf(currentActivityId);
      
      if (currentIndex <= 0) return "introduction";
      return activityIds[currentIndex - 1];
  }
  
  // Helper function to get next activity ID
  function getNextActivity(currentActivityId) {
      const activityIds = gameData.activities.map(a => a.id);
      const currentIndex = activityIds.indexOf(currentActivityId);
      
      if (currentIndex >= activityIds.length - 1) return currentActivityId;
      return activityIds[currentIndex + 1];
  }
  
  // Generate previous activity button HTML
  function getPreviousActivityButton(currentActivityId) {
      const prevActivity = getPreviousActivity(currentActivityId);
      const buttonText = prevActivity === "introduction" ? "Back to Introduction" : "Previous Activity";
      
      return `<button class="nav-btn" id="prevActivity">${buttonText}</button>`;
  }
  
  // Generate next activity button HTML
  function getNextActivityButton(currentActivityId) {
      const nextActivity = getNextActivity(currentActivityId);
      
      if (nextActivity === currentActivityId) {
          return '';
      }
      
      const activityIndex = gameData.activities.findIndex(a => a.id === nextActivity);
      const nextActivityTitle = gameData.activities[activityIndex].title.split(':')[0];
      
      return `<button class="nav-btn" id="nextActivity">Next: ${nextActivityTitle}</button>`;
  }
  
  // Update score
  function updateScore(points) {
      gameState.score += points;
      scoreDisplay.textContent = gameState.score;
      finalScoreDisplay.textContent = gameState.score;
  }
  
  // Update completed activities count
  function updateCompletedActivities() {
      gameState.completedActivities++;
      updateProgressBar();
      
      // Check if all activities are completed
      if (gameState.completedActivities >= gameState.totalActivities) {
          setTimeout(() => {
              congratsMessage.style.display = 'block';
              createConfetti();
          }, 1000);
      }
  }
  
  // Update progress bar
  function updateProgressBar() {
      const progressPercent = Math.min(Math.round((gameState.completedActivities / gameState.totalActivities) * 100), 100);
      progressBar.style.width = progressPercent + '%';
      progressBar.textContent = progressPercent + '%';
  }
  
  // Check if activity is completed
  function checkActivityCompletion(activityId) {
      if (gameState.activityCompleted[activityId]) {
          return;
      }
      
      switch (activityId) {
          case "multipleChoice":
              const totalQuestions = gameData.activities.find(a => a.id === activityId).questions.length;
              const answeredCorrectly = Object.values(gameState.questionAnswered).filter(a => a === 'correct').length;
              
              if (answeredCorrectly >= totalQuestions) {
                  gameState.activityCompleted[activityId] = true;
                  updateCompletedActivities();
              }
              break;
      }
  }
  
  // Create confetti effect
  function createConfetti() {
      const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
      
      for (let i = 0; i < 50; i++) {
          const confetti = document.createElement('div');
          confetti.className = 'confetti';
          confetti.style.left = Math.random() * 100 + 'vw';
          confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
          confetti.style.animationDuration = (Math.random() * 3 + 2) + 's';
          document.body.appendChild(confetti);
          
          // Remove confetti after animation
          setTimeout(() => {
              confetti.remove();
          }, 5000);
      }
  }
  
  // Reset game
  function resetGame() {
      // Reset game state
      gameState.score = 0;
      gameState.completedActivities = 0;
      gameState.currentActivity = "introduction";
      gameState.activityCompleted = {
          multipleChoice: false,
          fillBlanks: false,
          dragDrop: false,
          habits: false
      };
      gameState.questionAnswered = {};
      
      // Reset UI
      scoreDisplay.textContent = '0';
      updateProgressBar();
      congratsMessage.style.display = 'none';
      
      // Go back to introduction
      renderIntroduction();
  }
  
  // API simulation for storing progress and scores
  const api = {
      saveProgress: function(data) {
          // In a real app, this would send data to a server
          console.log('Saving progress:', data);
          // Using localStorage for demonstration purposes
          localStorage.setItem('grammarGameProgress', JSON.stringify(data));
          return Promise.resolve({ success: true });
      },
      
      loadProgress: function() {
          // In a real app, this would fetch data from a server
          const saved = localStorage.getItem('grammarGameProgress');
          if (saved) {
              return Promise.resolve(JSON.parse(saved));
          }
          return Promise.resolve(null);
      },
      
      submitScore: function(score) {
          // In a real app, this would submit the score to a leaderboard
          console.log('Submitting score:', score);
          // Using localStorage for demonstration
          const scores = JSON.parse(localStorage.getItem('grammarGameScores') || '[]');
          scores.push(score);
          localStorage.setItem('grammarGameScores', JSON.stringify(scores));
          return Promise.resolve({ success: true });
      }
  };
  
  // Check for saved progress
  function loadSavedProgress() {
      api.loadProgress().then(savedState => {
          if (savedState) {
              // Could implement logic to restore the game state
              console.log('Found saved progress:', savedState);
              
              // For demonstration, we'll just show an alert
              const resumeGame = confirm('Would you like to resume your previous game?');
              
              if (resumeGame) {
                  // Restore game state
                  Object.assign(gameState, savedState);
                  scoreDisplay.textContent = gameState.score;
                  finalScoreDisplay.textContent = gameState.score;
                  updateProgressBar();
                  
                  // Render the current activity
                  if (gameState.currentActivity === "introduction") {
                      renderIntroduction();
                  } else {
                      renderActivity(gameState.currentActivity);
                  }
              }
          }
      }).catch(err => {
          console.error('Error loading saved progress:', err);
      });
  }
  
  // Save progress periodically
  function saveGameProgress() {
      api.saveProgress(gameState).then(response => {
          console.log('Progress saved successfully');
      }).catch(err => {
          console.error('Error saving progress:', err);
      });
  }
  
  // Set up auto-save
  setInterval(saveGameProgress, 30000); // Save every 30 seconds
  
  // Start the game
  initGame();
  loadSavedProgress();


