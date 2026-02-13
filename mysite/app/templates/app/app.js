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
    BASE_URL: 'YOUR_BACKEND_URL_HERE', // Replace with your actual backend URL
    ENDPOINTS: {
        REQUIREMENTS: '/api/requirements',           // GET - Fetch all requirements
        SUB_REQUIREMENTS: '/api/requirements/:id',   // GET - Fetch sub-requirements by requirement ID
        EVIDENCE: '/api/evidence',                   // GET - Fetch all evidence
        EVIDENCE_BY_SUB_REQ: '/api/evidence/:subReqId', // GET - Fetch evidence by sub-requirement ID
        UPLOAD: '/api/evidence/upload'               // POST - Upload new evidence
    }
};

// ============================================
// API FUNCTIONS - CONNECT TO YOUR BACKEND
// ============================================

/**
 * Fetch all PCI DSS requirements from backend
 * Expected response format:
 * [
 *   {
 *     id: "req1",
 *     number: "1",
 *     title: "Install and maintain network security controls",
 *     subRequirementsCount: 3
 *   },
 *   ...
 * ]
 */
async function fetchRequirements() {
    try {
        // TODO: Replace with actual API call
        // const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.REQUIREMENTS}`);
        // const data = await response.json();
        // return data;
        
        // For now, return empty array - backend will provide data
        return [];
    } catch (error) {
        console.error('Error fetching requirements:', error);
        return [];
    }
}

/**
 * Fetch sub-requirements for a specific requirement
 * Expected response format:
 * {
 *   id: "req1",
 *   number: "1",
 *   title: "Install and maintain network security controls",
 *   subRequirements: [
 *     {
 *       id: "req1.1",
 *       title: "1.1 Processes and mechanisms...",
 *       description: "Define and document processes...",
 *       testingProcedure: "Examine documentation..."
 *     },
 *     ...
 *   ]
 * }
 */
async function fetchSubRequirements(requirementId) {
    try {
        // TODO: Replace with actual API call
        // const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SUB_REQUIREMENTS.replace(':id', requirementId)}`;
        // const response = await fetch(url);
        // const data = await response.json();
        // return data;
        
        // For now, return null - backend will provide data
        return null;
    } catch (error) {
        console.error('Error fetching sub-requirements:', error);
        return null;
    }
}

/**
 * Fetch evidence for a specific sub-requirement
 * Expected response format:
 * [
 *   {
 *     id: "evidence1",
 *     requirementId: "req1",
 *     subRequirementId: "req1.1",
 *     fileName: "network-diagram.pdf",
 *     label: "Network Security Diagram Q1 2026",
 *     uploadDate: "2026-01-15T10:30:00Z",
 *     fileSize: 2048576,
 *     fileUrl: "/uploads/network-diagram.pdf"
 *   },
 *   ...
 * ]
 */
async function fetchEvidenceBySubRequirement(subReqId) {
    try {
        // TODO: Replace with actual API call
        // const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.EVIDENCE_BY_SUB_REQ.replace(':subReqId', subReqId)}`;
        // const response = await fetch(url);
        // const data = await response.json();
        // return data;
        
        // For now, return empty array - backend will provide data
        return [];
    } catch (error) {
        console.error('Error fetching evidence:', error);
        return [];
    }
}

/**
 * Upload evidence file to backend
 * Request format:
 * FormData with:
 *   - file: File object
 *   - requirementId: string
 *   - subRequirementId: string
 *   - label: string
 */
async function uploadEvidence(file, requirementId, subRequirementId, label) {
    try {
        // TODO: Replace with actual API call
        /*
        const formData = new FormData();
        formData.append('file', file);
        formData.append('requirementId', requirementId);
        formData.append('subRequirementId', subRequirementId);
        formData.append('label', label);

        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.UPLOAD}`, {
            method: 'POST',
            body: formData,
            // Add authentication headers if needed
            // headers: {
            //     'Authorization': 'Bearer YOUR_TOKEN'
            // }
        });

        const data = await response.json();
        return data;
        */

        // For now, return mock success - backend will handle actual upload
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

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Format date and time
 */
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

/**
 * Get evidence count for a sub-requirement
 */
function getEvidenceCount(subReqId) {
    return currentState.evidenceData.filter(e => e.subRequirementId === subReqId).length;
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

/**
 * Render the requirements list in the left sidebar
 */
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

/**
 * Render sub-requirements details in the middle section
 */
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
    document.getElementById('requirementDescription').textContent = requirement.title;

    const subReqList = document.getElementById('subRequirementsList');
    
    if (!requirement.subRequirements || requirement.subRequirements.length === 0) {
        subReqList.innerHTML = '<p class="loading">Loading sub-requirements...</p>';
        return;
    }

    subReqList.innerHTML = requirement.subRequirements.map(subReq => {
        const evidenceCount = getEvidenceCount(subReq.id);
        const isSelected = currentState.selectedSubRequirement?.id === subReq.id;

        return `
            <div class="sub-requirement-card ${isSelected ? 'selected' : ''}"
                 onclick="handleSubRequirementClick('${subReq.id}')">
                <div class="sub-req-header">
                    <h3 class="sub-req-title">${subReq.title}</h3>
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

/**
 * Render upload section in the right panel
 */
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
    
    // Render evidence list for this sub-requirement
    renderEvidenceList(subRequirement.id);
}

/**
 * Render evidence list for a sub-requirement
 */
async function renderEvidenceList(subReqId) {
    const evidenceListContainer = document.getElementById('evidenceList');
    
    // Fetch evidence from backend
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
 * Handle requirement selection click
 */
async function handleRequirementClick(requirementId) {
    // Fetch detailed requirement data with sub-requirements from backend
    const requirementData = await fetchSubRequirements(requirementId);
    
    currentState.selectedRequirement = requirementData;
    currentState.selectedSubRequirement = null;

    // Re-render UI
    renderRequirementsList(currentState.requirements);
    renderSubRequirements(requirementData);
    renderUploadSection(null);
}

/**
 * Handle sub-requirement selection click
 */
function handleSubRequirementClick(subReqId) {
    const subReq = currentState.selectedRequirement?.subRequirements?.find(
        sr => sr.id === subReqId
    );
    
    currentState.selectedSubRequirement = subReq;

    // Re-render UI
    renderSubRequirements(currentState.selectedRequirement);
    renderUploadSection(subReq);
}

/**
 * Handle file upload
 */
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const label = document.getElementById('evidenceLabel').value;
    const requirementId = currentState.selectedRequirement?.id;
    const subReqId = currentState.selectedSubRequirement?.id;

    if (!requirementId || !subReqId) {
        alert('Please select a sub-requirement first');
        return;
    }

    try {
        // Show loading state
        const evidenceListContainer = document.getElementById('evidenceList');
        evidenceListContainer.innerHTML = '<div class="loading"><div class="loading-spinner"></div><span>Uploading...</span></div>';

        // Upload to backend
        const result = await uploadEvidence(file, requirementId, subReqId, label || file.name);

        if (result.success) {
            // Clear form
            document.getElementById('evidenceLabel').value = '';
            event.target.value = '';

            // Refresh evidence list
            await renderEvidenceList(subReqId);
            
            // Refresh requirements list to update badges
            renderRequirementsList(currentState.requirements);
        } else {
            alert('Upload failed. Please try again.');
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Error uploading file. Please try again.');
    }
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize the application
 */
async function initializeApp() {
    // Fetch initial data from backend
    const requirements = await fetchRequirements();
    currentState.requirements = requirements;

    // Render initial UI
    renderRequirementsList(requirements);
    renderSubRequirements(null);
    renderUploadSection(null);

    // Attach file upload listener
    const fileInput = document.getElementById('fileInput');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// ============================================
// EXPORT FOR DEBUGGING (Optional)
// ============================================
// Uncomment to expose functions for debugging in browser console
// window.PCI_DSS_App = {
//     state: currentState,
//     fetchRequirements,
//     fetchSubRequirements,
//     fetchEvidenceBySubRequirement,
//     uploadEvidence
// };
