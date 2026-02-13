// ============================================
// STATE MANAGEMENT
// ============================================
let currentState = {
    requirements: [],
    selectedRequirement: null,
    selectedSubRequirement: null,
    evidenceData: []
};

// ============================================
// API CONFIGURATION
// ============================================
const API_CONFIG = {
    BASE_URL: '',  // Current host
    ENDPOINTS: {
        REQUIREMENTS: '/api/requirements/',
        REQUIREMENT_DETAIL: '/api/requirements/:id/',
        EVIDENCE: '/api/evidence',
        EVIDENCE_BY_SUB_REQ: '/api/evidence/:subReqId',
        UPLOAD: '/api/evidence/upload'
    }
};

// ============================================
// API FUNCTIONS - CONNECT TO YOUR BACKEND
// ============================================

/**
 * Fetch all main requirements from backend
 */
async function fetchRequirements() {
    try {
        const response = await fetch(API_CONFIG.ENDPOINTS.REQUIREMENTS);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching requirements:', error);
        return [];
    }
}

/**
 * Fetch sub-requirements for a specific main requirement
 */
async function fetchSubRequirements(requirementId) {
    try {
        const url = API_CONFIG.ENDPOINTS.REQUIREMENT_DETAIL.replace(':id', requirementId);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching sub-requirements:', error);
        return null;
    }
}

/**
 * Fetch evidence for a specific sub-requirement
 */
async function fetchEvidenceBySubRequirement(subReqId) {
    try {
        // TODO: Implement evidence API when available
        return [];
    } catch (error) {
        console.error('Error fetching evidence:', error);
        return [];
    }
}

/**
 * Upload evidence file to backend
 */
async function uploadEvidence(file, requirementId, subRequirementId, label) {
    try {
        // TODO: Implement evidence upload when available
        console.log('Upload would send:', { file, requirementId, subRequirementId, label });
        return {
            success: true,
            evidence: {
                id: 'temp-' + Date.now(),
                fileName: file.name,
                label: label,
                uploadDate: new Date().toISOString(),
                fileSize: file.size
            }
        };
    } catch (error) {
        console.error('Error uploading evidence:', error);
        throw error;
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(date);
}

function getEvidenceCount(subReqId) {
    return currentState.evidenceData.filter(e => e.subRequirementId === subReqId).length;
}

function renderRequirementsList(requirements) {
    const listContainer = document.getElementById('requirementsList');
    
    if (!requirements || requirements.length === 0) {
        listContainer.innerHTML = `
            <div class="loading">
                <div class="loading-spinner"></div>
                <span>Loading requirements...</span>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = requirements.map(req => {
        const isActive = currentState.selectedRequirement?.id === req.id;
        const hasEvidence = req.subRequirements?.some(subReq => 
            getEvidenceCount(subReq.id) > 0
        );

        return `
            <button class="requirement-item ${isActive ? 'active' : ''}" 
                    data-requirement-id="${req.id}"
                    onclick="handleRequirementClick('${req.id}')">
                <div class="requirement-header">
                    <div class="requirement-content">
                        <div class="requirement-number">
                            Requirement ${req.number}
                            ${hasEvidence ? `
                                <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                            ` : ''}
                        </div>
                        <p class="requirement-title">${req.title}</p>
                        <p class="sub-req-count">${req.subRequirementsCount || 0} sub-requirements</p>
                    </div>
                    <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </div>
            </button>
        `;
    }).join('');
}

function renderSubRequirements(requirement) {
    const emptyState = document.getElementById('emptyState');
    const detailsSection = document.getElementById('requirementDetails');
    
    if (!requirement) {
        emptyState.style.display = 'flex';
        detailsSection.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    detailsSection.style.display = 'block';

    document.getElementById('requirementTitle').textContent = `Requirement ${requirement.number}`;
    document.getElementById('requirementDescription').textContent = `All sub-requirements for Requirement ${requirement.number}`;

    const subReqList = document.getElementById('subRequirementsList');
    
    if (!requirement.subRequirements || requirement.subRequirements.length === 0) {
        subReqList.innerHTML = '<p class="loading">No sub-requirements found</p>';
        return;
    }

    subReqList.innerHTML = requirement.subRequirements.map(subReq => {
        const evidenceCount = getEvidenceCount(subReq.id);
        const isSelected = currentState.selectedSubRequirement?.id === subReq.id;

        return `
            <div class="sub-requirement-card ${isSelected ? 'selected' : ''}"
                 onclick="handleSubRequirementClick('${subReq.id}')">
                <div class="sub-req-header">
                    <h3 class="sub-req-title">${subReq.number}: ${subReq.title}</h3>
                    ${evidenceCount > 0 ? `
                        <div class="evidence-badge">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            <span>${evidenceCount} file(s)</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="sub-req-section">
                    <h4>Description:</h4>
                    <p>${subReq.description}</p>
                </div>

                <div class="sub-req-section">
                    <h4>Testing Procedure:</h4>
                    <p>${subReq.testingProcedure}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderUploadSection(subRequirement) {
    const emptyState = document.getElementById('uploadEmptyState');
    const uploadForm = document.getElementById('uploadForm');

    if (!subRequirement) {
        emptyState.style.display = 'flex';
        uploadForm.style.display = 'none';
        return;
    }

    emptyState.style.display = 'none';
    uploadForm.style.display = 'block';

    document.getElementById('selectedSubReqTitle').textContent = subRequirement.title;
    
    renderEvidenceList(subRequirement.id);
}

async function renderEvidenceList(subReqId) {
    const evidenceListContainer = document.getElementById('evidenceList');
    
    const evidences = await fetchEvidenceBySubRequirement(subReqId);
    currentState.evidenceData = evidences;

    if (!evidences || evidences.length === 0) {
        evidenceListContainer.innerHTML = `
            <div class="evidence-list empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p>No evidence uploaded yet</p>
            </div>
        `;
        return;
    }

    evidenceListContainer.innerHTML = evidences.map(evidence => `
        <div class="evidence-item">
            <div class="evidence-content">
                <svg class="evidence-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                </svg>
                <div class="evidence-details">
                    <p class="evidence-filename">${evidence.fileName}</p>
                    <div class="evidence-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                        <span class="evidence-meta-text">${evidence.label}</span>
                    </div>
                    <div class="evidence-meta">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polyline points="12 6 12 12 16 14"></polyline>
                        </svg>
                        <span class="evidence-meta-text">${formatDateTime(evidence.uploadDate)}</span>
                    </div>
                    <p class="evidence-size">${formatFileSize(evidence.fileSize)}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// ============================================
// EVENT HANDLERS
// ============================================

/**
 * Handle requirement selection from sidebar
 */
function handleRequirementClick(requirementId) {
    // Update state
    const requirement = currentState.requirements.find(r => r.id === requirementId);
    if (!requirement) return;
    
    currentState.selectedRequirement = requirement;
    currentState.selectedSubRequirement = null;
    
    // Render UI updates
    renderRequirementsList(currentState.requirements);
    
    // Load and render sub-requirements for this main requirement
    loadAndRenderSubRequirements(requirementId);
    
    renderUploadSection(null);
}

/**
 * Load sub-requirements from API and render them
 */
async function loadAndRenderSubRequirements(requirementId) {
    const detailsSection = document.getElementById('requirementDetails');
    const emptyState = document.getElementById('emptyState');
    
    // Show loading state
    emptyState.style.display = 'none';
    detailsSection.style.display = 'block';
    document.getElementById('subRequirementsList').innerHTML = `
        <div class="loading">
            <div class="loading-spinner"></div>
            <span>Loading sub-requirements...</span>
        </div>
    `;
    
    // Fetch the full requirement data with sub-requirements
    const fullRequirement = await fetchSubRequirements(requirementId);
    
    if (fullRequirement) {
        currentState.selectedRequirement = fullRequirement;
        renderSubRequirements(fullRequirement);
    }
}

/**
 * Handle sub-requirement selection
 */
function handleSubRequirementClick(subReqId) {
    const subReq = currentState.selectedRequirement?.subRequirements?.find(s => s.id === subReqId);
    if (!subReq) return;
    
    currentState.selectedSubRequirement = subReq;
    
    // Render UI updates
    renderSubRequirements(currentState.selectedRequirement);
    renderUploadSection(subReq);
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
async function initializeApp() {
    try {
        // Show loading state
        renderRequirementsList([]);
        
        // Fetch requirements from backend
        const requirements = await fetchRequirements();
        currentState.requirements = requirements;
        
        // Render the requirements list
        renderRequirementsList(requirements);
        
        console.log('App initialized with', requirements.length, 'requirements');
    } catch (error) {
        console.error('Failed to initialize app:', error);
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);
