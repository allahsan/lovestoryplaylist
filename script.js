// Global audio management
let currentlyPlaying = null;
let audioPlayers = new Map();

// Initialize audio players for all songs
function initializeAudioPlayers() {
    const songCards = document.querySelectorAll('.song-card[data-audio]');
    
    songCards.forEach((card, index) => {
        const audio = card.querySelector('audio');
        const playBtn = card.querySelector('.play-btn');
        const seekBar = card.querySelector('.seek-bar');
        const seekProgress = card.querySelector('.seek-progress');
        const currentTimeEl = card.querySelector('.current-time');
        const totalTimeEl = card.querySelector('.total-time');
        const volumeBtn = card.querySelector('.volume-btn');
        const volumeSlider = card.querySelector('.volume-slider');
        const playIcon = card.querySelector('.play-icon');
        const pauseIcon = card.querySelector('.pause-icon');
        const volumeHighIcon = card.querySelector('.volume-high');
        const volumeMutedIcon = card.querySelector('.volume-muted');
        
        if (!audio) return;
        
        // Store player reference
        audioPlayers.set(card, {
            audio,
            playBtn,
            seekBar,
            seekProgress,
            currentTimeEl,
            totalTimeEl,
            volumeBtn,
            volumeSlider,
            playIcon,
            pauseIcon,
            volumeHighIcon,
            volumeMutedIcon,
            isPlaying: false,
            isMuted: false
        });
        
        // Set initial volume
        audio.volume = volumeSlider.value / 100;
        
        // Audio event listeners
        audio.addEventListener('loadedmetadata', () => {
            totalTimeEl.textContent = formatTime(audio.duration);
        });
        
        audio.addEventListener('timeupdate', () => {
            if (audio.duration) {
                const progress = (audio.currentTime / audio.duration) * 100;
                seekProgress.style.width = progress + '%';
                currentTimeEl.textContent = formatTime(audio.currentTime);
            }
        });
        
        audio.addEventListener('ended', () => {
            stopAudio(card);
        });
        
        audio.addEventListener('error', (e) => {
            console.log('Audio error for song:', card.querySelector('.song-title').textContent);
            // Fallback: show error state or disable controls
            playBtn.style.opacity = '0.5';
            playBtn.style.cursor = 'not-allowed';
        });
        
        // Play/Pause button
        playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (audioPlayers.get(card).isPlaying) {
                pauseAudio(card);
            } else {
                playAudio(card);
            }
        });
        
        // Seek bar functionality
        seekBar.addEventListener('click', (e) => {
            e.stopPropagation();
            const rect = seekBar.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            audio.currentTime = percent * audio.duration;
        });
        
        // Volume control
        volumeSlider.addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            audio.volume = volume;
            updateVolumeIcon(card, volume);
        });
        
        volumeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleMute(card);
        });
        
        // Song card click to play/pause
        card.addEventListener('click', () => {
            if (audioPlayers.get(card).isPlaying) {
                pauseAudio(card);
            } else {
                playAudio(card);
            }
        });
    });
}

// Play audio function
function playAudio(card) {
    const player = audioPlayers.get(card);
    if (!player) return;
    
    // Stop currently playing audio
    if (currentlyPlaying && currentlyPlaying !== card) {
        stopAudio(currentlyPlaying);
    }
    
    player.audio.play().then(() => {
        player.isPlaying = true;
        currentlyPlaying = card;
        updatePlayButton(card, true);
        player.playBtn.classList.add('playing');
    }).catch((error) => {
        console.log('Playback failed:', error);
        // Create a visual feedback for failed playback
        showAudioError(card);
    });
}

// Pause audio function
function pauseAudio(card) {
    const player = audioPlayers.get(card);
    if (!player) return;
    
    player.audio.pause();
    player.isPlaying = false;
    updatePlayButton(card, false);
    player.playBtn.classList.remove('playing');
}

// Stop audio function
function stopAudio(card) {
    const player = audioPlayers.get(card);
    if (!player) return;
    
    player.audio.pause();
    player.audio.currentTime = 0;
    player.isPlaying = false;
    currentlyPlaying = null;
    updatePlayButton(card, false);
    player.playBtn.classList.remove('playing');
    player.seekProgress.style.width = '0%';
    player.currentTimeEl.textContent = '0:00';
}

// Update play/pause button icons
function updatePlayButton(card, isPlaying) {
    const player = audioPlayers.get(card);
    if (!player) return;
    
    if (isPlaying) {
        player.playIcon.style.display = 'none';
        player.pauseIcon.style.display = 'block';
    } else {
        player.playIcon.style.display = 'block';
        player.pauseIcon.style.display = 'none';
    }
}

// Toggle mute function
function toggleMute(card) {
    const player = audioPlayers.get(card);
    if (!player) return;
    
    if (player.isMuted) {
        player.audio.volume = player.volumeSlider.value / 100;
        player.isMuted = false;
    } else {
        player.audio.volume = 0;
        player.isMuted = true;
    }
    
    updateVolumeIcon(card, player.audio.volume);
}

// Update volume icon based on volume level
function updateVolumeIcon(card, volume) {
    const player = audioPlayers.get(card);
    if (!player) return;
    
    if (volume === 0 || player.isMuted) {
        player.volumeHighIcon.style.display = 'none';
        player.volumeMutedIcon.style.display = 'block';
    } else {
        player.volumeHighIcon.style.display = 'block';
        player.volumeMutedIcon.style.display = 'none';
    }
}

// Show audio error feedback
function showAudioError(card) {
    const player = audioPlayers.get(card);
    if (!player) return;
    
    // Visual feedback for error
    player.playBtn.style.background = 'linear-gradient(135deg, #ff6b6b, #ff5252)';
    player.playBtn.style.transform = 'scale(0.95)';
    
    setTimeout(() => {
        player.playBtn.style.background = '';
        player.playBtn.style.transform = '';
    }, 1000);
    
    // Show tooltip or notification
    const errorMsg = document.createElement('div');
    errorMsg.textContent = 'Audio unavailable';
    errorMsg.style.cssText = `
        position: absolute;
        top: -40px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 107, 107, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 0.8rem;
        white-space: nowrap;
        z-index: 1000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    card.style.position = 'relative';
    card.appendChild(errorMsg);
    
    setTimeout(() => errorMsg.style.opacity = '1', 10);
    setTimeout(() => {
        errorMsg.style.opacity = '0';
        setTimeout(() => card.removeChild(errorMsg), 300);
    }, 2000);
}

// Format time helper function
function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Create floating hearts with modern aesthetic
function createFloatingHeart() {
    const heart = document.createElement('div');
    heart.className = 'floating-heart';
    heart.innerHTML = Math.random() > 0.5 ? '♥' : '◆';
    heart.style.left = Math.random() * 100 + '%';
    heart.style.color = `hsl(${Math.random() * 60 + 300}, 70%, 60%)`;
    heart.style.animationDelay = Math.random() * 8 + 's';
    heart.style.animationDuration = (Math.random() * 4 + 8) + 's';
    return heart;
}

// Create geometric shapes
function createGeometricShape() {
    const shape = document.createElement('div');
    shape.className = 'geometric-shape';
    const size = Math.random() * 100 + 50;
    shape.style.width = size + 'px';
    shape.style.height = size + 'px';
    shape.style.left = Math.random() * 100 + '%';
    shape.style.top = Math.random() * 100 + '%';
    shape.style.borderRadius = Math.random() > 0.5 ? '50%' : '0';
    shape.style.animationDuration = (Math.random() * 20 + 10) + 's';
    shape.style.animationDelay = Math.random() * 5 + 's';
    return shape;
}

// Initialize floating elements
function initializeFloatingElements() {
    const floatingContainer = document.querySelector('.floating-elements');
    const geometricContainer = document.querySelector('.geometric-bg');
    
    // Initialize floating elements
    for (let i = 0; i < 15; i++) {
        floatingContainer.appendChild(createFloatingHeart());
    }
    
    for (let i = 0; i < 8; i++) {
        geometricContainer.appendChild(createGeometricShape());
    }
    
    // Continuous heart generation
    setInterval(() => {
        const heart = createFloatingHeart();
        floatingContainer.appendChild(heart);
        
        setTimeout(() => {
            if (heart.parentNode) {
                heart.parentNode.removeChild(heart);
            }
        }, 12000);
    }, 2000);
}

// Intersection Observer for scroll animations
function initializeScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.chapter').forEach(chapter => {
        observer.observe(chapter);
    });
}

// Enhanced hover effects for song cards
function initializeHoverEffects() {
    document.querySelectorAll('.song-card').forEach(card => {
        card.addEventListener('mouseenter', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            card.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05))`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.background = 'rgba(255, 255, 255, 0.05)';
        });
    });
}

// Playlist button interaction
function initializePlaylistButton() {
    const playlistBtn = document.querySelector('.playlist-btn');
    if (playlistBtn) {
        playlistBtn.addEventListener('click', (e) => {
            const btn = e.currentTarget;
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        });
    }
}

// Dynamic color themes based on scroll position
function initializeScrollColorThemes() {
    const chapters = document.querySelectorAll('.chapter');
    const colors = [
        'rgba(255, 215, 0, 0.3)',    // Gold for spark
        'rgba(255, 20, 147, 0.3)',   // Deep pink for deepening
        'rgba(255, 140, 0, 0.3)',    // Orange for shift
        'rgba(220, 20, 60, 0.3)',    // Crimson for heartbreak
        'rgba(50, 205, 50, 0.3)'     // Lime green for moving forward
    ];
    
    window.addEventListener('scroll', () => {
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const colorIndex = Math.floor(scrollPercent * colors.length);
        const bgOverlay = document.querySelector('.bg-overlay');
        
        if (colorIndex < colors.length && bgOverlay) {
            const currentColor = colors[colorIndex];
            bgOverlay.style.background = `
                radial-gradient(circle at 20% 80%, ${currentColor} 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(138, 43, 226, 0.4) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(30, 144, 255, 0.3) 0%, transparent 50%),
                linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(20, 20, 40, 0.9))
            `;
        }
    });
}

// Parallax effect for header
function initializeParallaxEffect() {
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const header = document.querySelector('.header');
        if (header) {
            header.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}

// Keyboard controls for audio
function initializeKeyboardControls() {
    document.addEventListener('keydown', (e) => {
        if (!currentlyPlaying) return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                const player = audioPlayers.get(currentlyPlaying);
                if (player.isPlaying) {
                    pauseAudio(currentlyPlaying);
                } else {
                    playAudio(currentlyPlaying);
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                const currentPlayer = audioPlayers.get(currentlyPlaying);
                currentPlayer.audio.currentTime = Math.max(0, currentPlayer.audio.currentTime - 10);
                break;
            case 'ArrowRight':
                e.preventDefault();
                const currentPlayerRight = audioPlayers.get(currentlyPlaying);
                currentPlayerRight.audio.currentTime = Math.min(
                    currentPlayerRight.audio.duration, 
                    currentPlayerRight.audio.currentTime + 10
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                const currentPlayerUp = audioPlayers.get(currentlyPlaying);
                const newVolumeUp = Math.min(1, currentPlayerUp.audio.volume + 0.1);
                currentPlayerUp.audio.volume = newVolumeUp;
                currentPlayerUp.volumeSlider.value = newVolumeUp * 100;
                updateVolumeIcon(currentlyPlaying, newVolumeUp);
                break;
            case 'ArrowDown':
                e.preventDefault();
                const currentPlayerDown = audioPlayers.get(currentlyPlaying);
                const newVolumeDown = Math.max(0, currentPlayerDown.audio.volume - 0.1);
                currentPlayerDown.audio.volume = newVolumeDown;
                currentPlayerDown.volumeSlider.value = newVolumeDown * 100;
                updateVolumeIcon(currentlyPlaying, newVolumeDown);
                break;
        }
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initializeAudioPlayers();
    initializeFloatingElements();
    initializeScrollAnimations();
    initializeHoverEffects();
    initializePlaylistButton();
    initializeScrollColorThemes();
    initializeParallaxEffect();
    initializeKeyboardControls();
    
    // Add visual feedback for song cards without audio controls
    document.querySelectorAll('.song-card:not([data-audio])').forEach(card => {
        card.addEventListener('click', () => {
            // Visual feedback for non-functional cards
            card.style.transform = 'scale(0.98)';
            setTimeout(() => {
                card.style.transform = '';
            }, 100);
            
            // Show coming soon message
            const message = document.createElement('div');
            message.textContent = 'Coming Soon';
            message.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(255, 255, 255, 0.9);
                color: #333;
                padding: 12px 24px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 0.9rem;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(10px);
            `;
            
            card.style.position = 'relative';
            card.appendChild(message);
            
            setTimeout(() => message.style.opacity = '1', 10);
            setTimeout(() => {
                message.style.opacity = '0';
                setTimeout(() => {
                    if (message.parentNode) {
                        message.parentNode.removeChild(message);
                    }
                }, 300);
            }, 1500);
        });
    });
    
    console.log('Love Story Playlist initialized successfully!');
});

// Cleanup function for page unload
window.addEventListener('beforeunload', () => {
    // Stop all playing audio
    audioPlayers.forEach((player, card) => {
        if (player.isPlaying) {
            stopAudio(card);
        }
    });
});