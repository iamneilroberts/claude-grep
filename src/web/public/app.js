// Simple vanilla JavaScript - no build tools required
class ClaudeGrepApp {
    constructor() {
        this.currentProject = null;
        this.isSearching = false;
        this.initializeElements();
        this.attachEventListeners();
        this.loadProjects();
    }

    initializeElements() {
        this.elements = {
            projectSelect: document.getElementById('project-select'),
            refreshButton: document.getElementById('refresh-projects'),
            searchForm: document.getElementById('search-form'),
            queryInput: document.getElementById('query'),
            progressSection: document.getElementById('progress'),
            progressFill: document.getElementById('progress-fill'),
            progressText: document.getElementById('progress-text'),
            resultsHeader: document.getElementById('results-header'),
            resultsStats: document.getElementById('results-stats'),
            resultsContainer: document.getElementById('results-container'),
            detailPanel: document.getElementById('detail-panel'),
            detailContent: document.getElementById('detail-content'),
            detailSearchInput: document.getElementById('detail-search-input'),
            detailSearchStatus: document.getElementById('detail-search-status')
        };
        
        // Search state
        this.searchMatches = [];
        this.currentMatchIndex = -1;
        this.conversationContent = '';
    }

    attachEventListeners() {
        this.elements.searchForm.addEventListener('submit', (e) => this.handleSearch(e));
        this.elements.projectSelect.addEventListener('change', (e) => this.handleProjectChange(e));
        this.elements.refreshButton.addEventListener('click', () => this.loadProjects());
        
        // Detail search listeners
        if (this.elements.detailSearchInput) {
            this.elements.detailSearchInput.addEventListener('input', () => this.searchInConversation());
            this.elements.detailSearchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.findPrevMatch();
                    } else {
                        this.findNextMatch();
                    }
                }
            });
        }
    }

    async loadProjects() {
        try {
            const response = await fetch('/api/projects');
            const data = await response.json();
            
            this.elements.projectSelect.innerHTML = '';
            
            // Add "All Projects" option
            const allOption = document.createElement('option');
            allOption.value = '';
            allOption.textContent = 'All Projects';
            this.elements.projectSelect.appendChild(allOption);
            
            // Add individual projects
            data.projects.forEach(project => {
                const option = document.createElement('option');
                option.value = project;
                option.textContent = project;
                if (project === data.currentProject) {
                    option.selected = true;
                    this.currentProject = project;
                }
                this.elements.projectSelect.appendChild(option);
            });
        } catch (error) {
            this.showError('Failed to load projects: ' + error.message);
        }
    }

    async handleProjectChange(event) {
        const project = event.target.value;
        if (project && project !== this.currentProject) {
            try {
                const response = await fetch('/api/projects/switch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ project })
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to switch project');
                }
                
                this.currentProject = project;
            } catch (error) {
                this.showError('Failed to switch project: ' + error.message);
                // Reset the select to the current project
                this.elements.projectSelect.value = this.currentProject || '';
            }
        }
    }

    async handleSearch(event) {
        event.preventDefault();
        
        if (this.isSearching) return;
        
        const formData = new FormData(event.target);
        const displayFormat = formData.get('format') || 'table';
        const searchParams = {
            query: formData.get('query'),
            searchAllProjects: formData.get('searchAllProjects') === 'on',
            exhaustive: formData.get('exhaustive') === 'on',
            includeErrors: formData.get('includeErrors') === 'on',
            includeToolCalls: formData.get('includeToolCalls') === 'on',
            maxResults: parseInt(formData.get('maxResults') || '20'),
            format: 'json'  // Always request JSON to enable interactive features
        };

        if (!searchParams.searchAllProjects && this.currentProject) {
            searchParams.project = this.currentProject;
        }

        this.performSearch(searchParams, displayFormat);
    }

    async performSearch(params, displayFormat = 'table') {
        this.isSearching = true;
        this.showProgress();
        this.clearResults();

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }

            const data = await response.json();
            this.displayResults(data, displayFormat);
            
        } catch (error) {
            this.showError('Search failed: ' + error.message);
        } finally {
            this.isSearching = false;
            this.hideProgress();
        }
    }

    showProgress() {
        this.elements.progressSection.style.display = 'block';
        this.elements.progressFill.style.width = '0%';
        this.elements.progressText.textContent = 'Searching...';
        
        // Simulate progress
        let progress = 0;
        this.progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            this.elements.progressFill.style.width = progress + '%';
        }, 200);
    }

    hideProgress() {
        clearInterval(this.progressInterval);
        this.elements.progressFill.style.width = '100%';
        setTimeout(() => {
            this.elements.progressSection.style.display = 'none';
        }, 300);
    }

    displayResults(data, format) {
        const { results, metadata } = data;
        
        // Show results header
        this.elements.resultsHeader.style.display = 'flex';
        this.elements.resultsStats.textContent = 
            `Found ${metadata.totalMatches} results in ${metadata.searchTime}ms`;

        // Clear previous results
        this.elements.resultsContainer.innerHTML = '';

        if (metadata.totalMatches === 0) {
            this.elements.resultsContainer.innerHTML = 
                '<div class="loading">No results found</div>';
            return;
        }

        // For non-JSON formats, results is a formatted string
        if (format !== 'json' && typeof results === 'string') {
            const pre = document.createElement('pre');
            pre.style.whiteSpace = 'pre-wrap';
            pre.style.fontFamily = 'monospace';
            pre.textContent = results;
            this.elements.resultsContainer.appendChild(pre);
            return;
        }

        // Display based on format (only for JSON format which returns array)
        switch (format) {
            case 'table':
                this.displayTableResults(results);
                break;
            case 'list':
                this.displayListResults(results);
                break;
            case 'markdown':
                this.displayMarkdownResults(results);
                break;
            case 'csv':
                this.displayCsvResults(results);
                break;
            case 'json':
            default:
                this.displayJsonResults(results);
        }
    }

    displayTableResults(results) {
        const table = document.createElement('table');
        table.className = 'results-table';
        
        // Create header
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr>
                <th>Time</th>
                <th>Matched Content</th>
                <th>Files</th>
                <th>Score</th>
                <th>Actions</th>
            </tr>
        `;
        table.appendChild(thead);
        
        // Create body
        const tbody = document.createElement('tbody');
        results.forEach(result => {
            const row = document.createElement('tr');
            const time = new Date(result.timestamp).toLocaleString();
            const content = this.truncate(result.matchedContent || '', 100);
            const files = (result.files || []).join(', ');
            row.innerHTML = `
                <td>${time}</td>
                <td>${this.escapeHtml(content)}</td>
                <td>${this.escapeHtml(files)}</td>
                <td>${result.score ? result.score.toFixed(4) : 'N/A'}</td>
                <td style="color: var(--text-secondary); font-style: italic;">Click row for details</td>
            `;
            // Make row clickable
            row.style.cursor = 'pointer';
            row.onclick = () => this.showConversationInPanel(result.sessionId, row);
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        this.elements.resultsContainer.appendChild(table);
    }

    displayListResults(results) {
        results.forEach(result => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            const time = new Date(result.timestamp).toLocaleString();
            const files = (result.files || []).join(', ');
            item.innerHTML = `
                <div class="result-header">
                    <div class="result-timestamp">${time}</div>
                    <div class="result-score">Score: ${result.score ? result.score.toFixed(4) : 'N/A'}</div>
                </div>
                <div class="result-content">
                    <div class="result-text">${this.escapeHtml(result.matchedContent || '')}</div>
                    <div class="result-files">Files: ${this.escapeHtml(files)}</div>
                </div>
                <div class="result-metadata">
                    Project: ${result.project || 'Unknown'} | 
                    Session: ${result.sessionId}
                </div>
            `;
            
            this.elements.resultsContainer.appendChild(item);
        });
    }

    displayMarkdownResults(markdown) {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'monospace';
        pre.textContent = markdown;
        this.elements.resultsContainer.appendChild(pre);
    }

    displayCsvResults(csv) {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'monospace';
        pre.textContent = csv;
        this.elements.resultsContainer.appendChild(pre);
    }

    displayJsonResults(results) {
        const pre = document.createElement('pre');
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.fontFamily = 'monospace';
        pre.textContent = JSON.stringify(results, null, 2);
        this.elements.resultsContainer.appendChild(pre);
    }

    clearResults() {
        this.elements.resultsHeader.style.display = 'none';
        this.elements.resultsContainer.innerHTML = '';
    }

    showError(message) {
        const error = document.createElement('div');
        error.className = 'error';
        error.textContent = message;
        this.elements.resultsContainer.innerHTML = '';
        this.elements.resultsContainer.appendChild(error);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    truncate(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    closeDetailPanel() {
        this.elements.detailPanel.style.display = 'none';
        // Remove selected class from all rows
        document.querySelectorAll('.results-table tr.selected').forEach(row => {
            row.classList.remove('selected');
        });
    }

    async showConversationInPanel(sessionId, selectedRow) {
        try {
            // Store current search query
            this.currentSearchQuery = this.elements.queryInput.value;
            
            // Remove previous selection
            document.querySelectorAll('.results-table tr.selected').forEach(row => {
                row.classList.remove('selected');
            });
            
            // Highlight selected row
            if (selectedRow) {
                selectedRow.classList.add('selected');
            }
            
            // Show loading in detail panel
            this.elements.detailPanel.style.display = 'flex';
            this.elements.detailContent.innerHTML = '<div class="loading">Loading conversation...</div>';
            
            const response = await fetch(`/api/conversation/${sessionId}`);
            if (!response.ok) {
                throw new Error('Failed to load conversation');
            }
            
            const conversation = await response.json();
            
            // Clear detail content
            this.elements.detailContent.innerHTML = '';
            
            // Display conversation content
            if (conversation.content) {
                // Store the content
                this.conversationContent = conversation.content;
                
                // Create a pre element for the full conversation
                const pre = document.createElement('pre');
                pre.className = 'conversation-content';
                pre.style.fontFamily = 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace';
                pre.style.whiteSpace = 'pre-wrap';
                pre.style.wordWrap = 'break-word';
                pre.style.fontSize = '0.875rem';
                pre.style.lineHeight = '1.5';
                pre.textContent = conversation.content;
                
                this.elements.detailContent.appendChild(pre);
                
                // Set initial search term and trigger search
                if (this.currentSearchQuery) {
                    this.elements.detailSearchInput.value = this.currentSearchQuery;
                    setTimeout(() => {
                        this.searchInConversation();
                        this.findNextMatch();
                    }, 100);
                }
                
                // Add metadata at the bottom
                const metaDiv = document.createElement('div');
                metaDiv.className = 'conversation-metadata';
                metaDiv.style.marginTop = '2rem';
                metaDiv.style.paddingTop = '1rem';
                metaDiv.style.borderTop = '1px solid var(--border)';
                metaDiv.style.fontSize = '0.875rem';
                metaDiv.style.color = 'var(--text-secondary)';
                
                metaDiv.innerHTML = `
                    <div><strong>Session ID:</strong> ${conversation.sessionId}</div>
                    <div><strong>Timestamp:</strong> ${new Date(conversation.timestamp).toLocaleString()}</div>
                    ${conversation.files && conversation.files.length > 0 ? `<div><strong>Files:</strong> ${conversation.files.join(', ')}</div>` : ''}
                `;
                
                this.elements.detailContent.appendChild(metaDiv);
            } else {
                // Fallback to showing raw JSON if no content
                const pre = document.createElement('pre');
                pre.style.fontFamily = 'SF Mono, Monaco, Cascadia Code, Roboto Mono, Consolas, Courier New, monospace';
                pre.textContent = JSON.stringify(conversation, null, 2);
                this.elements.detailContent.appendChild(pre);
            }
        } catch (error) {
            this.elements.detailContent.innerHTML = `<div class="error">Error loading conversation: ${error.message}</div>`;
        }
    }
    
    searchInConversation() {
        const searchTerm = this.elements.detailSearchInput.value.toLowerCase();
        if (!searchTerm || !this.conversationContent) {
            this.clearHighlights();
            this.searchMatches = [];
            this.currentMatchIndex = -1;
            this.updateSearchStatus();
            return;
        }
        
        // Find all matches
        this.searchMatches = [];
        const content = this.conversationContent;
        let index = content.toLowerCase().indexOf(searchTerm);
        
        while (index !== -1) {
            this.searchMatches.push({
                start: index,
                end: index + searchTerm.length,
                text: content.substring(index, index + searchTerm.length)
            });
            index = content.toLowerCase().indexOf(searchTerm, index + 1);
        }
        
        // Reset current match
        this.currentMatchIndex = -1;
        
        // Update highlights
        this.updateHighlights();
        this.updateSearchStatus();
    }
    
    updateHighlights() {
        const pre = this.elements.detailContent.querySelector('pre');
        if (!pre || this.searchMatches.length === 0) {
            return;
        }
        
        // Build highlighted content
        let html = '';
        let lastIndex = 0;
        
        this.searchMatches.forEach((match, index) => {
            // Add text before match
            html += this.escapeHtml(this.conversationContent.substring(lastIndex, match.start));
            
            // Add highlighted match
            const isCurrentMatch = index === this.currentMatchIndex;
            const className = isCurrentMatch ? 'current-match' : 'match';
            html += `<mark class="${className}" data-match-index="${index}">${this.escapeHtml(match.text)}</mark>`;
            
            lastIndex = match.end;
        });
        
        // Add remaining text
        html += this.escapeHtml(this.conversationContent.substring(lastIndex));
        
        pre.innerHTML = html;
    }
    
    clearHighlights() {
        const pre = this.elements.detailContent.querySelector('pre');
        if (pre) {
            pre.textContent = this.conversationContent;
        }
    }
    
    findNextMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = (this.currentMatchIndex + 1) % this.searchMatches.length;
        this.updateHighlights();
        this.scrollToCurrentMatch();
        this.updateSearchStatus();
    }
    
    findPrevMatch() {
        if (this.searchMatches.length === 0) return;
        
        this.currentMatchIndex = this.currentMatchIndex - 1;
        if (this.currentMatchIndex < 0) {
            this.currentMatchIndex = this.searchMatches.length - 1;
        }
        this.updateHighlights();
        this.scrollToCurrentMatch();
        this.updateSearchStatus();
    }
    
    scrollToCurrentMatch() {
        if (this.currentMatchIndex === -1) return;
        
        const currentMark = this.elements.detailContent.querySelector('mark.current-match');
        if (currentMark) {
            currentMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    updateSearchStatus() {
        if (this.searchMatches.length === 0) {
            this.elements.detailSearchStatus.textContent = '';
        } else {
            const current = this.currentMatchIndex + 1;
            this.elements.detailSearchStatus.textContent = `${current} / ${this.searchMatches.length}`;
        }
    }

    async viewConversation(sessionId) {
        try {
            const response = await fetch(`/api/conversation/${sessionId}`);
            if (!response.ok) {
                throw new Error('Failed to load conversation');
            }
            
            const conversation = await response.json();
            
            // Create modal
            const modal = document.createElement('div');
            modal.className = 'modal';
            
            const modalContent = document.createElement('div');
            modalContent.className = 'modal-content';
            
            // Modal header
            const modalHeader = document.createElement('div');
            modalHeader.className = 'modal-header';
            
            const modalTitle = document.createElement('h3');
            modalTitle.className = 'modal-title';
            modalTitle.textContent = `Conversation: ${new Date(conversation.timestamp).toLocaleDateString()}`;
            
            const closeBtn = document.createElement('button');
            closeBtn.className = 'modal-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.onclick = () => modal.remove();
            
            modalHeader.appendChild(modalTitle);
            modalHeader.appendChild(closeBtn);
            
            // Modal body
            const modalBody = document.createElement('div');
            modalBody.className = 'modal-body';
            
            // Process and display messages
            if (conversation.messages && Array.isArray(conversation.messages)) {
                conversation.messages.forEach(msg => {
                    const messageDiv = document.createElement('div');
                    messageDiv.className = 'conversation-message';
                    
                    // Message header
                    const messageHeader = document.createElement('div');
                    messageHeader.className = 'message-header';
                    
                    const roleSpan = document.createElement('span');
                    roleSpan.className = `message-role ${msg.role}`;
                    roleSpan.textContent = msg.role;
                    
                    const timeSpan = document.createElement('span');
                    timeSpan.className = 'message-time';
                    timeSpan.textContent = new Date(msg.timestamp || conversation.timestamp).toLocaleTimeString();
                    
                    messageHeader.appendChild(roleSpan);
                    messageHeader.appendChild(timeSpan);
                    
                    // Message content
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    contentDiv.textContent = msg.content || '';
                    
                    messageDiv.appendChild(messageHeader);
                    messageDiv.appendChild(contentDiv);
                    
                    // Files if present
                    if (msg.files && msg.files.length > 0) {
                        const filesDiv = document.createElement('div');
                        filesDiv.className = 'message-files';
                        filesDiv.textContent = `Files: ${msg.files.join(', ')}`;
                        messageDiv.appendChild(filesDiv);
                    }
                    
                    modalBody.appendChild(messageDiv);
                });
            } else {
                // Fallback to showing raw JSON if no messages array
                const pre = document.createElement('pre');
                pre.textContent = JSON.stringify(conversation, null, 2);
                modalBody.appendChild(pre);
            }
            
            modalContent.appendChild(modalHeader);
            modalContent.appendChild(modalBody);
            modal.appendChild(modalContent);
            document.body.appendChild(modal);
            
            // Close on background click
            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };
            
            // Close on Escape key
            const handleEscape = (e) => {
                if (e.key === 'Escape') {
                    modal.remove();
                    document.removeEventListener('keydown', handleEscape);
                }
            };
            document.addEventListener('keydown', handleEscape);
        } catch (error) {
            this.showError('Error loading conversation: ' + error.message);
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.claudeGrepApp = new ClaudeGrepApp();
});