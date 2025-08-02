class SiteBlocker {
    constructor() {
        this.blockedSites = [];
        this.isBlockingActive = true;
        this.pauseEndTime = null;
        this.pauseInterval = null;
        
        this.init();
    }

    init() {
        this.loadBlockedSites();
        this.setupEventListeners();
        this.updateUI();
        this.startBlocking();
        this.checkPauseStatus();
    }

    setupEventListeners() {
        // Bouton d'ajout de site
        document.getElementById('addSiteBtn').addEventListener('click', () => {
            this.addSite();
        });

        // Entrée dans le champ de saisie
        document.getElementById('siteInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addSite();
            }
        });

        // Boutons de sites rapides
        document.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const site = btn.dataset.site;
                this.addSiteToList(site);
            });
        });

        // Bouton pause/reprise
        document.getElementById('toggleBlockingBtn').addEventListener('click', () => {
            this.togglePause();
        });

        // Bouton tout supprimer
        document.getElementById('clearAllBtn').addEventListener('click', () => {
            this.clearAllSites();
        });
    }

    addSite() {
        const input = document.getElementById('siteInput');
        const site = input.value.trim().toLowerCase();
        
        if (!site) {
            this.showNotification('Veuillez entrer un nom de site', 'error');
            return;
        }

        // Nettoyer l'URL
        const cleanSite = this.cleanSiteUrl(site);
        
        if (this.blockedSites.includes(cleanSite)) {
            this.showNotification('Ce site est déjà bloqué', 'warning');
            return;
        }

        this.addSiteToList(cleanSite);
        input.value = '';
    }

    cleanSiteUrl(url) {
        // Supprimer le protocole
        url = url.replace(/^https?:\/\//, '');
        // Supprimer www. si présent
        url = url.replace(/^www\./, '');
        // Supprimer tout ce qui suit le premier /
        url = url.split('/')[0];
        return url;
    }

    addSiteToList(site) {
        this.blockedSites.push(site);
        this.saveBlockedSites();
        this.updateUI();
        this.showNotification(`Site ${site} ajouté à la liste de blocage`);
    }

    removeSite(site) {
        const index = this.blockedSites.indexOf(site);
        if (index > -1) {
            this.blockedSites.splice(index, 1);
            this.saveBlockedSites();
            this.updateUI();
            this.showNotification(`Site ${site} retiré de la liste de blocage`);
        }
    }

    clearAllSites() {
        if (this.blockedSites.length === 0) {
            this.showNotification('Aucun site à supprimer', 'warning');
            return;
        }

        if (confirm('Êtes-vous sûr de vouloir supprimer tous les sites bloqués ?')) {
            this.blockedSites = [];
            this.saveBlockedSites();
            this.updateUI();
            this.showNotification('Tous les sites ont été supprimés');
        }
    }

    togglePause() {
        if (this.pauseEndTime && Date.now() < this.pauseEndTime) {
            // Annuler la pause
            this.pauseEndTime = null;
            if (this.pauseInterval) {
                clearInterval(this.pauseInterval);
                this.pauseInterval = null;
            }
            this.isBlockingActive = true;
            this.showNotification('Blocage réactivé');
        } else {
            // Activer la pause
            this.pauseEndTime = Date.now() + (5 * 60 * 1000); // 5 minutes
            this.isBlockingActive = false;
            this.startPauseTimer();
            this.showNotification('Pause de 5 minutes activée');
        }
        
        this.updateUI();
    }

    startPauseTimer() {
        if (this.pauseInterval) {
            clearInterval(this.pauseInterval);
        }
        
        this.pauseInterval = setInterval(() => {
            if (Date.now() >= this.pauseEndTime) {
                this.pauseEndTime = null;
                this.isBlockingActive = true;
                clearInterval(this.pauseInterval);
                this.pauseInterval = null;
                this.updateUI();
                this.showNotification('Pause terminée - Blocage réactivé');
            } else {
                this.updatePauseTime();
            }
        }, 1000);
        
        this.updatePauseTime();
    }

    updatePauseTime() {
        const timeLeft = this.pauseEndTime - Date.now();
        if (timeLeft > 0) {
            const minutes = Math.floor(timeLeft / 60000);
            const seconds = Math.floor((timeLeft % 60000) / 1000);
            document.getElementById('pauseTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        } else {
            document.getElementById('pauseTime').textContent = '-';
        }
    }

    checkPauseStatus() {
        if (this.pauseEndTime && Date.now() < this.pauseEndTime) {
            this.isBlockingActive = false;
            this.startPauseTimer();
        } else if (this.pauseEndTime && Date.now() >= this.pauseEndTime) {
            this.pauseEndTime = null;
            this.isBlockingActive = true;
        }
        this.updateUI();
    }

    updateUI() {
        this.updateBlockedSitesList();
        this.updateBlockedCount();
        this.updateStatus();
        this.updatePauseButton();
    }

    updateBlockedSitesList() {
        const list = document.getElementById('blockedSitesList');
        const emptyState = document.getElementById('emptyState');
        
        if (this.blockedSites.length === 0) {
            list.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        list.innerHTML = '';
        
        this.blockedSites.forEach(site => {
            const siteItem = document.createElement('div');
            siteItem.className = 'site-item';
            siteItem.innerHTML = `
                <span class="site-name">${site}</span>
                <button class="remove-btn" onclick="siteBlocker.removeSite('${site}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            list.appendChild(siteItem);
        });
    }

    updateBlockedCount() {
        document.getElementById('blockedCount').textContent = this.blockedSites.length;
    }

    updateStatus() {
        const statusElement = document.getElementById('blockingStatus');
        if (this.isBlockingActive) {
            statusElement.textContent = 'Actif';
            statusElement.className = 'status-active';
        } else {
            statusElement.className = 'status-paused';
            statusElement.textContent = 'En pause';
        }
    }

    updatePauseButton() {
        const btn = document.getElementById('toggleBlockingBtn');
        if (this.pauseEndTime && Date.now() < this.pauseEndTime) {
            btn.innerHTML = '<i class="fas fa-play"></i> Reprendre';
            btn.className = 'btn btn-primary';
        } else {
            btn.innerHTML = '<i class="fas fa-pause"></i> Pause (5 min)';
            btn.className = 'btn btn-secondary';
        }
    }

    startBlocking() {
        // Vérifier si on est sur un site bloqué
        const currentHost = window.location.hostname.replace(/^www\./, '');
        
        if (this.blockedSites.includes(currentHost) && this.isBlockingActive) {
            this.showBlockedPage();
        }
    }

    showBlockedPage() {
        document.body.innerHTML = `
            <div style="
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-align: center;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            ">
                <div style="
                    background: white;
                    color: #333;
                    padding: 40px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                    max-width: 500px;
                    margin: 20px;
                ">
                    <h1 style="color: #e53e3e; margin-bottom: 20px;">
                        <i class="fas fa-ban"></i> Site Bloqué
                    </h1>
                    <p style="font-size: 1.2rem; margin-bottom: 15px;">
                        Ce site a été bloqué par votre bloqueur.
                    </p>
                    <p style="color: #718096; margin-bottom: 30px;">
                        Vous pouvez désactiver temporairement le blocage depuis l'application.
                    </p>
                    <button onclick="window.history.back()" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-right: 10px;
                    ">
                        <i class="fas fa-arrow-left"></i> Retour
                    </button>
                    <button onclick="window.location.href='./index.html'" style="
                        background: #f7fafc;
                        color: #4a5568;
                        border: 2px solid #e2e8f0;
                        padding: 15px 30px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                    ">
                        <i class="fas fa-cog"></i> Paramètres
                    </button>
                </div>
            </div>
        `;
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notificationText');
        
        text.textContent = message;
        
        // Changer la couleur selon le type
        if (type === 'error') {
            notification.style.background = '#e53e3e';
        } else if (type === 'warning') {
            notification.style.background = '#d69e2e';
        } else {
            notification.style.background = '#48bb78';
        }
        
        notification.classList.remove('hidden');
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.classList.add('hidden');
            }, 300);
        }, 3000);
    }

    saveBlockedSites() {
        localStorage.setItem('blockedSites', JSON.stringify(this.blockedSites));
        localStorage.setItem('isBlockingActive', JSON.stringify(this.isBlockingActive));
        if (this.pauseEndTime) {
            localStorage.setItem('pauseEndTime', JSON.stringify(this.pauseEndTime));
        } else {
            localStorage.removeItem('pauseEndTime');
        }
    }

    loadBlockedSites() {
        const saved = localStorage.getItem('blockedSites');
        if (saved) {
            this.blockedSites = JSON.parse(saved);
        }
        
        const savedActive = localStorage.getItem('isBlockingActive');
        if (savedActive !== null) {
            this.isBlockingActive = JSON.parse(savedActive);
        }
        
        const savedPause = localStorage.getItem('pauseEndTime');
        if (savedPause) {
            this.pauseEndTime = JSON.parse(savedPause);
        }
    }
}

// Initialiser l'application
const siteBlocker = new SiteBlocker();

// Fonction globale pour l'accès depuis les boutons
window.siteBlocker = siteBlocker; 