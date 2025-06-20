// Achievement UI system for displaying badges and notifications
class AchievementUI {
    constructor(achievementSystem) {
        this.achievementSystem = achievementSystem;
        this.notificationQueue = [];
        this.isShowingNotification = false;
        this.setupUI();
    }
    
    setupUI() {
        // Create achievement button in controls
        this.createAchievementButton();
        
        // Create achievement modal
        this.createAchievementModal();
        
        // Create notification container
        this.createNotificationContainer();
    }
    
    createAchievementButton() {
        const controls = document.querySelector('.controls');
        const achievementButton = document.createElement('button');
        achievementButton.id = 'achievementToggle';
        achievementButton.className = 'control-button';
        achievementButton.innerHTML = '🏆';
        achievementButton.title = 'View Achievements';
        achievementButton.style.pointerEvents = 'auto';
        
        achievementButton.addEventListener('click', () => {
            this.toggleAchievementModal();
        });
        
        controls.appendChild(achievementButton);
        
        // Update button with progress indicator
        this.updateAchievementButton();
    }
    
    updateAchievementButton() {
        const button = document.getElementById('achievementToggle');
        const progress = this.achievementSystem.getCompletionPercentage();
        button.title = `Achievements (${this.achievementSystem.getUnlockedCount()}/${this.achievementSystem.getTotalCount()}) - ${progress}%`;
    }
    
    createAchievementModal() {
        // Create modal overlay
        const overlay = document.createElement('div');
        overlay.id = 'achievementModal';
        overlay.className = 'achievement-modal-overlay';
        overlay.style.display = 'none';
        
        // Create modal content
        const modal = document.createElement('div');
        modal.className = 'achievement-modal';
        
        // Modal header
        const header = document.createElement('div');
        header.className = 'achievement-modal-header';
        header.innerHTML = `
            <h2>🏆 Achievements</h2>
            <span class="achievement-progress">${this.achievementSystem.getUnlockedCount()}/${this.achievementSystem.getTotalCount()} (${this.achievementSystem.getCompletionPercentage()}%)</span>
            <button class="modal-close" onclick="document.getElementById('achievementModal').style.display='none'">×</button>
        `;
        
        // Modal body
        const body = document.createElement('div');
        body.className = 'achievement-modal-body';
        
        // Generate achievement categories
        const categories = this.achievementSystem.getAchievementsByCategory();
        for (const [categoryName, achievements] of Object.entries(categories)) {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'achievement-category';
            
            const categoryTitle = document.createElement('h3');
            categoryTitle.textContent = categoryName;
            categoryTitle.className = 'achievement-category-title';
            
            const achievementGrid = document.createElement('div');
            achievementGrid.className = 'achievement-grid';
            
            for (const achievement of achievements) {
                const achievementCard = document.createElement('div');
                achievementCard.className = `achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'} rarity-${achievement.rarity}`;
                
                achievementCard.innerHTML = `
                    <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '🔒'}</div>
                    <div class="achievement-info">
                        <div class="achievement-name">${achievement.unlocked ? achievement.name : '???'}</div>
                        <div class="achievement-description">${achievement.unlocked ? achievement.description : 'Achievement locked'}</div>
                        ${achievement.unlocked ? `<div class="achievement-rarity">${achievement.rarity}</div>` : ''}
                    </div>
                `;
                
                achievementGrid.appendChild(achievementCard);
            }
            
            categoryDiv.appendChild(categoryTitle);
            categoryDiv.appendChild(achievementGrid);
            body.appendChild(categoryDiv);
        }
        
        modal.appendChild(header);
        modal.appendChild(body);
        overlay.appendChild(modal);
        
        // Close modal when clicking outside
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
        
        document.body.appendChild(overlay);
    }
    
    createNotificationContainer() {
        const container = document.createElement('div');
        container.id = 'achievementNotifications';
        container.className = 'achievement-notifications';
        document.body.appendChild(container);
    }
    
    toggleAchievementModal() {
        let modal = document.getElementById('achievementModal');
        
        if (!modal || modal.style.display === 'none' || modal.style.display === '') {
            this.refreshAchievementModal();
            modal = document.getElementById('achievementModal');
            modal.style.display = 'flex';
        } else {
            modal.style.display = 'none';
        }
    }
    
    refreshAchievementModal() {
        // Remove existing modal and recreate with updated data
        const existingModal = document.getElementById('achievementModal');
        if (existingModal) {
            existingModal.remove();
        }
        this.createAchievementModal();
        this.updateAchievementButton();
    }
    
    showAchievementNotification(achievement) {
        this.notificationQueue.push(achievement);
        this.processNotificationQueue();
    }
    
    processNotificationQueue() {
        if (this.isShowingNotification || this.notificationQueue.length === 0) {
            return;
        }
        
        this.isShowingNotification = true;
        const achievement = this.notificationQueue.shift();
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `achievement-notification rarity-${achievement.rarity}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon">🏆</span>
                    <span class="notification-title">Achievement Unlocked!</span>
                </div>
                <div class="notification-achievement">
                    <span class="achievement-icon">${achievement.icon}</span>
                    <div class="achievement-details">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-description">${achievement.description}</div>
                    </div>
                </div>
            </div>
        `;
        
        // Add to container
        const container = document.getElementById('achievementNotifications');
        container.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        // Auto hide after 4 seconds
        setTimeout(() => {
            notification.classList.add('hide');
            setTimeout(() => {
                notification.remove();
                this.isShowingNotification = false;
                this.processNotificationQueue(); // Process next in queue
            }, 500);
        }, 4000);
        
        // Update UI elements
        this.updateAchievementButton();
    }
    
    showMultipleAchievements(achievements) {
        achievements.forEach(achievement => {
            this.showAchievementNotification(achievement);
        });
    }
}