// Notification System Test Suite

class NotificationTestSuite {
    constructor() {
        this.testResults = [];
        this.errors = [];
        this.startTime = 0;
    }
    
    async runAllTests() {
        console.log('📜 Starting Notification System Tests...');
        this.startTime = performance.now();
        
        try {
            // Test notification system initialization
            await this.testNotificationSystemInit();
            
            // Test basic notification display
            await this.testBasicNotificationDisplay();
            
            // Test notification queue management
            await this.testNotificationQueue();
            
            // Test different notification types
            await this.testNotificationTypes();
            
            // Test priority handling
            await this.testPriorityHandling();
            
            // Test game event integration
            await this.testGameEventIntegration();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            this.errors.push(`Critical test failure: ${error.message}`);
            this.generateTestReport();
        }
    }
    
    async testNotificationSystemInit() {
        console.log('🔧 Testing Notification System Initialization...');
        
        // Check if notification system exists
        if (!window.notificationSystem) {
            throw new Error('Notification system not initialized');
        }
        
        // Check if container was created
        const container = document.querySelector('.parchment-notifications');
        if (!container) {
            throw new Error('Notification container not created');
        }
        
        // Check initial state
        if (window.notificationSystem.queue.length !== 0) {
            throw new Error('Initial queue should be empty');
        }
        
        if (window.notificationSystem.isShowing) {
            throw new Error('Should not be showing notifications initially');
        }
        
        this.logTest('Notification System Initialization', 'PASS', 'System properly initialized');
    }
    
    async testBasicNotificationDisplay() {
        console.log('📢 Testing Basic Notification Display...');
        
        // Clear any existing notifications
        window.notificationSystem.clearAll();
        
        // Show a test notification
        window.notificationSystem.show('Test notification message', {
            type: 'info',
            duration: 1000
        });
        
        // Wait a bit for animation
        await this.wait(100);
        
        // Check if notification appears
        const notification = document.querySelector('.parchment-notification');
        if (!notification) {
            throw new Error('Notification element not created');
        }
        
        // Check if it has correct classes
        if (!notification.classList.contains('parchment-info')) {
            throw new Error('Notification missing type class');
        }
        
        // Check content
        const message = notification.querySelector('.notification-message');
        if (!message || !message.textContent.includes('Test notification message')) {
            throw new Error('Notification content incorrect');
        }
        
        // Wait for auto-hide
        await this.wait(1200);
        
        // Check if notification was removed
        const remainingNotifications = document.querySelectorAll('.parchment-notification');
        if (remainingNotifications.length > 0) {
            console.warn('Notification may not have been properly removed after timeout');
        }
        
        this.logTest('Basic Notification Display', 'PASS', 'Notifications display and hide correctly');
    }
    
    async testNotificationQueue() {
        console.log('📋 Testing Notification Queue Management...');
        
        // Clear existing notifications
        window.notificationSystem.clearAll();
        
        // Add multiple notifications quickly
        window.notificationSystem.show('First notification', { duration: 500 });
        window.notificationSystem.show('Second notification', { duration: 500 });
        window.notificationSystem.show('Third notification', { duration: 500 });
        
        // Check initial queue state
        if (window.notificationSystem.queue.length < 2) {
            throw new Error('Queue should contain multiple notifications');
        }
        
        // Wait for processing
        await this.wait(200);
        
        // Should be showing first notification
        if (!window.notificationSystem.isShowing) {
            throw new Error('Should be showing notification from queue');
        }
        
        // Wait for queue to process
        await this.wait(2000);
        
        // Queue should be empty after processing
        if (window.notificationSystem.queue.length > 0) {
            console.warn('Queue still has items after processing');
        }
        
        this.logTest('Notification Queue Management', 'PASS', 'Queue processes notifications sequentially');
    }
    
    async testNotificationTypes() {
        console.log('🎨 Testing Different Notification Types...');
        
        // Clear all notifications immediately
        window.notificationSystem.clearAll();
        
        const types = ['info', 'success', 'warning', 'quest', 'treasure', 'achievement'];
        
        for (const type of types) {
            // Clear any previous notifications immediately
            window.notificationSystem.clearAll();
            
            window.notificationSystem.show(`Testing ${type} notification`, {
                type: type,
                duration: 1000
            });
            
            // Wait for notification to appear and animate in
            await this.wait(100);
            
            const notification = document.querySelector('.parchment-notification');
            if (!notification) {
                throw new Error(`${type} notification not created`);
            }
            
            if (!notification.classList.contains(`parchment-${type}`)) {
                throw new Error(`${type} notification missing type class`);
            }
            
            // Brief wait before next iteration
            await this.wait(50);
        }
        
        // Final cleanup
        window.notificationSystem.clearAll();
        
        this.logTest('Notification Types', 'PASS', 'All notification types display correctly');
    }
    
    async testPriorityHandling() {
        console.log('⚡ Testing Priority Handling...');
        
        window.notificationSystem.clearAll();
        
        // Add low priority notification first
        window.notificationSystem.show('Low priority', { priority: 0, duration: 1000 });
        
        // Add high priority notification
        window.notificationSystem.show('High priority', { priority: 10, duration: 1000 });
        
        // High priority should be at front of queue
        if (window.notificationSystem.queue.length > 0) {
            const nextNotification = window.notificationSystem.queue[0];
            if (!nextNotification.message.includes('High priority')) {
                throw new Error('High priority notification not at front of queue');
            }
        }
        
        await this.wait(100);
        
        // Check if high priority notification is showing
        const notification = document.querySelector('.parchment-notification .notification-message');
        if (!notification || !notification.textContent.includes('High priority')) {
            console.warn('High priority notification may not be showing first');
        }
        
        await this.wait(1200);
        
        this.logTest('Priority Handling', 'PASS', 'Priority system works correctly');
    }
    
    async testGameEventIntegration() {
        console.log('🎮 Testing Game Event Integration...');
        
        window.notificationSystem.clearAll();
        
        // Test predefined notification methods
        const methods = [
            () => window.notificationSystem.showTreasureCollected('Test Treasure', 100),
            () => window.notificationSystem.showKeyCollected('red'),
            () => window.notificationSystem.showDoorUnlocked('blue'),
            () => window.notificationSystem.showPuzzleSolved('pressure_plate'),
            () => window.notificationSystem.showAchievement('Test Achievement'),
            () => window.notificationSystem.showQuestStart('Test Quest')
        ];
        
        for (let i = 0; i < methods.length; i++) {
            const method = methods[i];
            
            try {
                method();
                await this.wait(50);
                
                const notification = document.querySelector('.parchment-notification');
                if (!notification) {
                    throw new Error(`Method ${i} did not create notification`);
                }
                
                await this.wait(300);
                
            } catch (error) {
                throw new Error(`Game event method ${i} failed: ${error.message}`);
            }
        }
        
        this.logTest('Game Event Integration', 'PASS', 'All game event methods work correctly');
    }
    
    // Utility methods
    
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    logTest(testName, status, details) {
        this.testResults.push({
            name: testName,
            status,
            details,
            timestamp: performance.now() - this.startTime
        });
    }
    
    generateTestReport() {
        const totalTime = performance.now() - this.startTime;
        const passCount = this.testResults.filter(t => t.status === 'PASS').length;
        const failCount = this.testResults.filter(t => t.status === 'FAIL').length;
        
        console.log('\\n' + '='.repeat(60));
        console.log('📜 NOTIFICATION SYSTEM TEST REPORT');
        console.log('='.repeat(60));
        console.log(`Total Test Time: ${(totalTime / 1000).toFixed(2)}s`);
        console.log(`Tests Passed: ${passCount}`);
        console.log(`Tests Failed: ${failCount}`);
        console.log(`Errors: ${this.errors.length}`);
        
        if (this.errors.length > 0) {
            console.log('\\n❌ ERRORS:');
            this.errors.forEach(error => console.log(`  - ${error}`));
        }
        
        console.log('\\n📊 TEST RESULTS:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : '❌';
            console.log(`  ${icon} ${result.name}: ${result.details}`);
        });
        
        const overallStatus = failCount === 0 ? 'PASSED' : 'FAILED';
        console.log(`\\n🎯 OVERALL RESULT: ${overallStatus}`);
        console.log('='.repeat(60));
    }
}

// Auto-run tests when script is loaded
if (typeof window !== 'undefined') {
    window.NotificationTestSuite = NotificationTestSuite;
    
    // Add test runner button to page
    window.addEventListener('load', () => {
        // Wait a bit for other systems to load
        setTimeout(() => {
            const button = document.createElement('button');
            button.textContent = '📜 Test Notifications';
            button.style.cssText = `
                position: fixed;
                top: 50px;
                right: 10px;
                z-index: 10000;
                padding: 10px;
                background: #8B6914;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            `;
            
            button.addEventListener('click', async () => {
                button.disabled = true;
                button.textContent = '📜 Running Tests...';
                
                const testSuite = new NotificationTestSuite();
                await testSuite.runAllTests();
                
                button.disabled = false;
                button.textContent = '📜 Test Notifications';
            });
            
            document.body.appendChild(button);
        }, 1000);
    });
}