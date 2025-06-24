// Parchment-style notification system for medieval themed game events

class NotificationSystem {
    constructor() {
        this.container = null;
        this.queue = [];
        this.isShowing = false;
        this.currentNotification = null;
        this.init();
    }
    
    init() {
        // Create container for notifications
        this.container = document.createElement('div');
        this.container.className = 'parchment-notifications';
        document.body.appendChild(this.container);
    }
    
    // Show a notification with optional options
    show(message, options = {}) {
        const notification = {
            message,
            type: options.type || 'info', // info, success, warning, quest, treasure
            duration: options.duration || 3000,
            icon: options.icon || null,
            sound: options.sound || null,
            priority: options.priority || 0, // Higher priority shows first
            id: Date.now() + Math.random()
        };
        
        // Add to queue based on priority
        if (notification.priority > 0) {
            // Find insertion point for priority notifications
            let insertIndex = 0;
            for (let i = 0; i < this.queue.length; i++) {
                if (this.queue[i].priority < notification.priority) {
                    break;
                }
                insertIndex++;
            }
            this.queue.splice(insertIndex, 0, notification);
        } else {
            this.queue.push(notification);
        }
        
        // Process queue if not already showing
        if (!this.isShowing) {
            this.processQueue();
        }
    }
    
    processQueue() {
        if (this.queue.length === 0) {
            this.isShowing = false;
            return;
        }
        
        this.isShowing = true;
        const notification = this.queue.shift();
        this.displayNotification(notification);
    }
    
    displayNotification(notification) {
        // Create parchment element
        const element = document.createElement('div');
        element.className = `parchment-notification parchment-${notification.type}`;
        
        // Add icon if provided
        let iconHtml = '';
        if (notification.icon) {
            iconHtml = `<span class="notification-icon">${notification.icon}</span>`;
        } else {
            // Default icons based on type
            const defaultIcons = {
                info: '📜',
                success: '✨',
                warning: '⚠️',
                quest: '⚔️',
                treasure: '💰',
                key: '🗝️',
                achievement: '🏆',
                puzzle: '⚙️'
            };
            iconHtml = `<span class="notification-icon">${defaultIcons[notification.type] || '📜'}</span>`;
        }
        
        // Build notification content
        element.innerHTML = `
            <div class="parchment-content">
                ${iconHtml}
                <div class="notification-message">${notification.message}</div>
            </div>
            <div class="parchment-edge-top"></div>
            <div class="parchment-edge-bottom"></div>
        `;
        
        // Add to container
        this.container.appendChild(element);
        this.currentNotification = element;
        
        // Play sound if provided
        if (notification.sound && window.gameAudio) {
            window.gameAudio.playSound(notification.sound);
        }
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            element.classList.add('show');
        });
        
        // Auto-hide after duration
        setTimeout(() => {
            this.hideNotification(element);
        }, notification.duration);
    }
    
    hideNotification(element) {
        element.classList.add('hide');
        
        // Remove after animation completes
        setTimeout(() => {
            if (element.parentNode) {
                element.parentNode.removeChild(element);
            }
            this.currentNotification = null;
            // Process next in queue
            this.processQueue();
        }, 500);
    }
    
    // Clear all notifications
    clear() {
        this.queue = [];
        if (this.currentNotification) {
            this.hideNotification(this.currentNotification);
        }
    }
    
    // Force clear all notifications immediately (for testing)
    clearAll() {
        this.queue = [];
        this.isShowing = false;
        
        // Remove all notification elements immediately
        const notifications = document.querySelectorAll('.parchment-notification');
        notifications.forEach(notification => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        });
        
        this.currentNotification = null;
    }
    
    // Predefined notification methods for common game events
    
    showQuestStart(questName) {
        this.show(`New Quest: ${questName}`, {
            type: 'quest',
            icon: '⚔️',
            duration: 4000,
            sound: 'quest_start'
        });
    }
    
    showTreasureCollected(treasureName, value) {
        this.show(`Found ${treasureName}! +${value} gold`, {
            type: 'treasure',
            icon: '💰',
            duration: 2500,
            sound: 'treasure_collect'
        });
    }
    
    showKeyCollected(keyColor) {
        const colorEmojis = {
            red: '🔴',
            blue: '🔵',
            green: '🟢',
            yellow: '🟡'
        };
        this.show(`${keyColor.charAt(0).toUpperCase() + keyColor.slice(1)} Key Acquired!`, {
            type: 'key',
            icon: `${colorEmojis[keyColor] || '🗝️'}`,
            duration: 3000,
            sound: 'key_collect'
        });
    }
    
    showDoorUnlocked(doorColor) {
        this.show(`${doorColor.charAt(0).toUpperCase() + doorColor.slice(1)} door unlocked!`, {
            type: 'success',
            icon: '🚪',
            duration: 2500,
            sound: 'door_unlock'
        });
    }
    
    showPuzzleSolved(puzzleType) {
        const messages = {
            pressure_plate: 'Secret passage opened!',
            lever: 'Mechanism activated!',
            mirror: 'Light beam redirected!'
        };
        this.show(messages[puzzleType] || 'Puzzle solved!', {
            type: 'puzzle',
            icon: '⚙️',
            duration: 3000,
            sound: 'puzzle_solve'
        });
    }
    
    showAchievement(achievementName) {
        this.show(`Achievement Unlocked: ${achievementName}`, {
            type: 'achievement',
            icon: '🏆',
            duration: 4000,
            priority: 10, // High priority
            sound: 'achievement_unlock'
        });
    }
    
    showWarning(message) {
        this.show(message, {
            type: 'warning',
            icon: '⚠️',
            duration: 3500,
            priority: 5
        });
    }
    
    showTimeWarning(seconds) {
        if (seconds === 60) {
            this.showWarning('One minute remaining!');
        } else if (seconds === 30) {
            this.showWarning('30 seconds remaining!');
        } else if (seconds === 10) {
            this.showWarning('10 seconds! Hurry!');
        }
    }
    
    showLevelComplete(stats) {
        const message = `Quest Complete! Time: ${stats.time}, Steps: ${stats.steps}`;
        this.show(message, {
            type: 'success',
            icon: '🏰',
            duration: 5000,
            priority: 10,
            sound: 'level_complete'
        });
    }
}

// Create global instance
window.notificationSystem = new NotificationSystem();