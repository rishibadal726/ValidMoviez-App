// --- PAGE ELEMENTS ---
const typingElement = document.getElementById('typingText');
const sendBtn = document.getElementById('sendBtn');
const chatInput = document.getElementById('chatInput');
const chatMessages = document.getElementById('chatMessages');
const chatWelcomeContent = document.getElementById('chatWelcomeContent');
const suggestedReplies = document.getElementById('suggestedReplies');
// const videoPlayerScreen = document.getElementById('videoPlayerScreen');  <-- REMOVED
// const videoElement = videoPlayerScreen.querySelector('video'); <-- REMOVED
const sideMenu = document.getElementById('sideMenu'); 
const menuOverlay = document.getElementById('menuOverlay'); 
const savedMovie = document.getElementById('savedMovie'); 
const emptyWatchlistText = document.getElementById('emptyWatchlistText'); 
const genreTags = document.getElementById('genre-tags'); 
const moodTags = document.getElementById('mood-tags');   

// --- GLOBAL STATE ---
let charIndex = 0;
let isMovieSaved = false; 
let hasModifiedPreferences = false; // Tracks if user has clicked "modify"

// --- Initial Welcome Animation ---
const fullText = "Welcome to\n ValidMoviez!";
function typeWriter() {
    if (charIndex < fullText.length) {
        const char = fullText.charAt(charIndex);
        if (char === '\n') {
            typingElement.innerHTML += '<br>';
        } else {
            typingElement.textContent += char;
        }
        charIndex++;
        const typingSpeed = Math.random() * 100 + 50;
        setTimeout(typeWriter, typingSpeed);
    } else {
        setTimeout(() => {
            typingElement.classList.add('done');
        }, 300);
    }
}
typingElement.textContent = '';
setTimeout(typeWriter, 500);

// --- NAVIGATION FUNCTIONS ---
function goToStep(step) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    if (step === 'welcome') {
        document.getElementById('welcome').classList.add('active');
        charIndex = 0;
        typingElement.textContent = '';
        typingElement.classList.remove('done');
        setTimeout(typeWriter, 500);
    } else if (step === 1) {
        document.getElementById('step1').classList.add('active');
    } else if (step === 2) {
        document.getElementById('step2').classList.add('active');
    } else if (step === 3) { 
        document.getElementById('step3').classList.add('active');
    }
}

function goToChat() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('chat').classList.add('active');
}

function toggleOption(element) {
    const parent = element.parentElement;
    const screen = element.closest('.quiz-screen');
    const nextButton = screen.querySelector('.next-button');
    element.classList.toggle('selected');
    const hasSelection = parent.querySelector('.option-card.selected');
    nextButton.disabled = !hasSelection;
}

// --- CHAT LOGIC ---
sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

function sendMessage() {
    const messageText = chatInput.value.trim();
    if (messageText === '') return;

    hideWelcomeContent();
    hideSuggestedReplies(); 
    addMessageToChat(messageText, 'user');
    chatInput.value = '';
    
    const messageTextLower = messageText.toLowerCase();
    
    if (messageTextLower.includes("save it") || (messageTextLower.includes("not in mood") && messageTextLower.includes("save"))) {
        let botReply = "Saved! You can find it in your Watchlist. (Hint: Check the menu in the top-left 😉)";
        isMovieSaved = true; 
        let callback = () => {
            setTimeout(() => showSuggestedReplies('final'), 500);
        };
        setTimeout(() => {
            typeBotMessage(botReply, callback); 
        }, 1000);
        
    } else {
        setTimeout(() => {
            typeBotMessage('Sorry, I can only respond to the suggested replies in this demo!', null);
        }, 1000); 
    }
}
    
function sendSuggestion(element) {
    const messageText = element.textContent;
    hideWelcomeContent();
    hideSuggestedReplies();
    addMessageToChat(messageText, 'user');

    let botReply = "I'm looking that up...";
    let callback = null;

    if (messageText.includes("Who stars")) {
        botReply = "It stars Kate Mara, Laurence Fishburne, and Gabriel Luna. Here's the main cast:";
        callback = () => {
            const kateMaraImg = "https://ntvb.tmsimg.com/assets/assets/262770_v9_bb.jpg?w=360&h=480";
            const laurenceFishburneImg = "https://m.media-amazon.com/images/M/MV5BMTc0NjczNDc1MV5BMl5BanBnXkFtZTYwMDU0Mjg1._V1_FMjpg_UX1000_.jpg";
            const gabrielLunaImg = "https://ntvb.tmsimg.com/assets/assets/573619_v9_bb.jpg";
            const ivanaMilicevicImg = "https://static.wikia.nocookie.net/castlevania/images/e/e5/Ivana_Milicevic_-_01.jpg/revision/latest?cb=20200309145222";
            
            const carouselHTML = `
                <div class="actor-carousel-container">
                    <div class="actor-card"><img src="${kateMaraImg}" alt="Kate Mara"><p>Kate Mara</p></div>
                    <div class="actor-card"><img src="${laurenceFishburneImg}" alt="Laurence Fishburne"><p>Laurence Fishburne</p></div>
                    <div class="actor-card"><img src="${gabrielLunaImg}" alt="Gabriel Luna"><p>Gabriel Luna</p></div>
                    <div class="actor-card"><img src="${ivanaMilicevicImg}" alt="Ivana Milicevic"><p>Ivana Milicevic</p></div>
                </div>
            `;
            addCustomMessageBlock(carouselHTML, 'bot');
            setTimeout(() => showSuggestedReplies('initial'), 500); 
        };
        
    } else if (messageText.includes("streaming")) {
        botReply = "It's available to rent or buy on these platforms:";
        callback = () => {
            const watchButtonsHTML = `
                <div class="watch-buttons-container">
                    <button class="watch-button apple">Apple TV</button>
                    <button class="watch-button amazon">Prime Video</button>
                    <button class="watch-button vudu">Vudu</button>
                </div>
            `;
            addCustomMessageBlock(watchButtonsHTML, 'bot');
            // MODIFIED: Show replies again so user can type
            setTimeout(() => showSuggestedReplies('initial'), 500);
        };
    } else if (messageText.includes("Not in the mood")) {
        botReply = "No problem! What kind of movie are you looking for instead? (You can type a genre)";
        callback = null; 
        
    } else if (messageText.includes("Thanks!")) {
        botReply = "You're welcome! Anything else?";
        callback = () => {
            setTimeout(() => showSuggestedReplies('initial'), 500); 
        };
    }
    
    setTimeout(() => {
        typeBotMessage(botReply, callback); 
    }, 1000); 
}

// --- CHAT UI FUNCTIONS ---
function addMessageToChat(text, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', sender);
    messageEl.innerHTML = text; 
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
    
function addCustomMessageBlock(html, sender) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', sender, 'custom-block');
    messageEl.innerHTML = html;
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}
    
function hideWelcomeContent() {
     if (chatWelcomeContent.style.display !== 'none') {
        chatWelcomeContent.style.display = 'none';
    }
}
    
// --- SUGGESTED REPLY FUNCTIONS ---
function showSuggestedReplies(replySet) {
    let repliesHTML = '';
    if (replySet === 'initial') {
        repliesHTML = `
            <div class="reply-chip" onclick="sendSuggestion(this)">Who stars in that?</div>
            <div class="reply-chip" onclick="sendSuggestion(this)">Is it streaming anywhere?</div>
            <div class="reply-chip" onclick="sendSuggestion(this)">Not in the mood.</div>
        `; // <-- REMOVED 'Show me the trailer'
    } else if (replySet === 'final') {
         repliesHTML = `
            <div class="reply-chip" onclick="sendSuggestion(this)">Thanks!</div>
            <div class="reply-chip" onclick="goToStep('welcome')">Start Over</div>
        `;
    }
    suggestedReplies.innerHTML = repliesHTML;
    suggestedReplies.style.display = 'flex';
}
    
function hideSuggestedReplies() {
    suggestedReplies.style.display = 'none';
}
    
// --- BOT TYPING FUNCTION ---
function typeBotMessage(fullText, onCompleteCallback) {
    const messageEl = document.createElement('div');
    messageEl.classList.add('message', 'bot');
    chatMessages.appendChild(messageEl);
    chatMessages.scrollTop = chatMessages.scrollHeight; 

    let charIndex = 0;
    let htmlContent = ''; 

    function typeChar() {
        if (charIndex < fullText.length) {
            if (fullText.charAt(charIndex) === '<') {
                let tagEndIndex = fullText.indexOf('>', charIndex);
                htmlContent += fullText.substring(charIndex, tagEndIndex + 1);
                charIndex = tagEndIndex + 1;
            } else {
                htmlContent += fullText.charAt(charIndex);
                charIndex++;
            }
            messageEl.innerHTML = htmlContent + '<span class="typing-cursor">|</span>';
            chatMessages.scrollTop = chatMessages.scrollHeight;
            const typingSpeed = Math.random() * 40 + 20; 
            setTimeout(typeChar, typingSpeed);
        } else {
            messageEl.innerHTML = htmlContent; 
            if (onCompleteCallback) {
                onCompleteCallback(); 
            }
        }
    }
    typeChar(); 
}

// --- MAIN DEMO FUNCTION ---
function showMovieSuggestion() {
    hideWelcomeContent();
    hideSuggestedReplies(); 
    addMessageToChat("See Suggestions for sci fi", 'user');
    
    const plot = "When an astronaut crash-lands back to Earth, a general puts her in quarantine for rehabilitation and testing. As disturbing events unfold, she fears that something extraterrestrial has followed her home.";
    const fullBotText = "Here's a great sci-fi pick based on your interests in sci fi and thriller:<br><br><strong>The Astronaut (2025)</strong><br>" + plot;

    setTimeout(() => {
        typeBotMessage(fullBotText, () => {
            setTimeout(() => {
                const posterUrl = "https://m.media-amazon.com/images/M/MV5BZGRlMDA5NGYtOWNmYy00YWI3LWFlMzMtYjlhMTkxZmI1NDRjXkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg";
                
                const posterHTML = `
                <div class="poster-container">
                    <img src="${posterUrl}" class="chat-movie-poster">
                </div>
                `;
                addCustomMessageBlock(posterHTML, 'bot');
                
                setTimeout(() => showSuggestedReplies('initial'), 500); 
            }, 500); 
        });
    }, 1000); 
}
    
// --- TRAILER PLAYER FUNCTIONS ---
// <-- REMOVED showTrailer() and closeTrailer() FUNCTIONS -->
    
// --- SIDE MENU FUNCTIONS ---
function showMenu() {
    // Check watchlist status
    if (isMovieSaved) {
        savedMovie.style.display = 'flex';
        emptyWatchlistText.style.display = 'none';
    } else {
        savedMovie.style.display = 'none'; 
        emptyWatchlistText.style.display = 'block';
    }
    
    // --- DYNAMIC PROFILE ---
    if (hasModifiedPreferences) {
        // Show the "modified" preferences
        genreTags.innerHTML = `
            <span class="pref-tag">Comedy</span>
            <span class="pref-tag">Horror</span>
        `;
        moodTags.innerHTML = `
            <span class="pref-tag">Something thrilling</span>
            <span class="pref-tag">Light and fun</span>
        `;
    } else {
        // Show the "initial" preferences
        genreTags.innerHTML = `
            <span class="pref-tag">Sci-Fi</span>
            <span class="pref-tag">Action</span>
            <span class="pref-tag">Thriller</span>
        `;
        moodTags.innerHTML = `
            <span class="pref-tag">Deep & thought-provoking</span>
        `;
    }
    
    // Show menu
    sideMenu.classList.add('active');
    menuOverlay.classList.add('active');
    // Default to profile page
    showMenuPage(document.querySelector('.nav-tab[onclick*="profile-page"]'), 'profile-page');
}
    
function closeMenu() {
    sideMenu.classList.remove('active');
    menuOverlay.classList.remove('active');
}
    
function showMenuPage(tabElement, pageId) {
    // 1. Handle tabs
    document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));
    tabElement.classList.add('active');
    
    // 2. Handle pages
    document.querySelectorAll('.menu-page').forEach(page => page.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
}
    
// --- CHAT HISTORY CLICK FUNCTION ---
function loadChatHistory(historyId) {
    // 1. Clear the current chat
    chatMessages.innerHTML = '';
    hideWelcomeContent();
    hideSuggestedReplies();
    
    // 2. Add fake messages instantly, no typing
    if (historyId === '90s-comedies') {
        addMessageToChat("Got any 90s comedies?", 'user');
        addMessageToChat("You bet. How about *Dumb and Dumber*?", 'bot');
        addMessageToChat("lol classic. any others?", 'user');
        addMessageToChat("*Friday* or *Clerks* if you're into that.", 'bot');
    } else if (historyId === 'thrillers') {
        addMessageToChat("Need a mind-bending thriller", 'user');
        addMessageToChat("Have you seen *Shutter Island*?", 'bot');
    } else if (historyId === 'kate-mara') {
        addMessageToChat("What movies has Kate Mara been in?", 'user');
        addMessageToChat("She was in *The Martian*, *Fantastic Four*, and the new one, *The Astronaut*.", 'bot');
        addMessageToChat("cool thanks", 'user');
    } else if (historyId === 'sci-fi') {
        // This is the current chat, so just reload it
        addMessageToChat("See Suggestions", 'user');
        const plot = "When an astronaut crash-lands back to Earth, a general puts her in quarantine for rehabilitation and testing. As disturbing events unfold, she fears that something extraterrestrial has followed her home.";
        const fullBotText = "Here's a great sci-fi pick:<br><br><strong>The Astronaut (2025)</strong><br>" + plot;
        addMessageToChat(fullBotText, 'bot');
        const posterUrl = "https://image.tmdb.org/t/p/w600_and_h900_bestv2/vRj9m9sAhO1d2hR2q0iA6F3E6W.jpg";
        const posterHTML = `<div class.="poster-container"><img src="${posterUrl}" class="chat-movie-poster"></div>`;
        addCustomMessageBlock(posterHTML, 'bot');
        showSuggestedReplies('initial');
        
    } else {
        addMessageToChat("I'm feeling lucky", 'user');
        addMessageToChat("Okay, here's a random pick: *The Grand Budapest Hotel*.", 'bot');
    }
    
    // 3. Close the menu
    closeMenu();
}
    
// --- MODIFY PREFERENCES FUNCTION ---
function modifyPreferences() {
    hasModifiedPreferences = true; // SET THE FLAG
    closeMenu();
    // Send user back to the first quiz step after a short delay
    setTimeout(() => {
        goToStep(1);
    }, 400); // 400ms delay to let the menu close smoothly
}
