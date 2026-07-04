// Dynamic Database and State
let siteData = {
    hero: {},
    about: {},
    skills: [],
    projects: []
};
let isAdmin = false;
let currentSlideIndex = 0;
let slideshowInterval = null;

// Initialize Lucide Icons
const updateIcons = () => {
    if (window.lucide) {
        window.lucide.createIcons();
    }
};

// Fetch all site content from server
async function fetchContent() {
    try {
        const res = await fetch('/api/content');
        if (!res.ok) throw new Error('Failed to load portfolio content data.');
        siteData = await res.json();
        
        // Render content
        renderHero();
        renderAbout();
        renderSkills();
        renderPortfolioGrid();
        renderDashboardProjects();
        renderDashboardMessages();
        
        updateIcons();
    } catch (err) {
        console.error('Error fetching site data:', err);
    }
}

// Check if user is already authenticated
async function checkAuth() {
    try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();
        isAdmin = data.authenticated;
        
        const triggerBtn = document.getElementById('admin-trigger-btn');
        if (isAdmin) {
            triggerBtn.innerHTML = '<i data-lucide="sliders"></i>';
            triggerBtn.setAttribute('aria-label', 'Open Dashboard');
        } else {
            triggerBtn.innerHTML = '<i data-lucide="lock"></i>';
            triggerBtn.setAttribute('aria-label', 'Admin Login');
        }
        updateIcons();
    } catch (err) {
        console.error('Auth verification error:', err);
    }
}

// Save modified site state to backend
async function saveSiteData() {
    try {
        const res = await fetch('/api/save', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(siteData)
        });
        
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.error || 'Failed to save changes.');
        }
        
        alert('All modifications saved successfully!');
        fetchContent(); // Reload data
    } catch (err) {
        alert('Error saving data: ' + err.message);
    }
}

// Upload file to server helper
async function uploadFile(fileInput) {
    if (!fileInput.files || fileInput.files.length === 0) return null;
    
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
    });
    
    if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'File upload failed.');
    }
    
    const data = await res.json();
    return data.filePath; // Returns 'assets/filename.ext'
}

// -------------------------------------------------------------
// RENDER FUNCTIONS
// -------------------------------------------------------------

function renderHero() {
    const hero = siteData.hero;
    document.getElementById('hero-badge-val').innerHTML = `<span class="badge-ping"></span> ${hero.badge || 'Available'}`;
    document.getElementById('hero-title-val').innerHTML = hero.title || 'Bending Reality';
    document.getElementById('hero-subtitle-val').textContent = hero.subtitle || '';
    
    // Start video slideshow
    startHeroSlideshow();
}

function startHeroSlideshow() {
    const slideshowContainer = document.getElementById('hero-slideshow');
    if (!slideshowContainer) return;
    
    slideshowContainer.innerHTML = '';
    
    const projects = siteData.projects;
    if (!projects || projects.length === 0) return;
    
    projects.forEach((project, idx) => {
        const video = document.createElement('video');
        video.classList.add('hero-slide-video');
        video.src = project.videoUrl;
        video.poster = project.thumbUrl;
        video.muted = true;
        video.loop = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        
        if (idx === 0) {
            video.classList.add('active');
            video.play().catch(err => console.log("Hero slideshow autoplay blocked: ", err));
        }
        
        slideshowContainer.appendChild(video);
    });
    
    currentSlideIndex = 0;
    
    if (slideshowInterval) clearInterval(slideshowInterval);
    
    slideshowInterval = setInterval(() => {
        const slides = document.querySelectorAll('.hero-slide-video');
        if (slides.length <= 1) return;
        
        const currentSlide = slides[currentSlideIndex];
        currentSlide.classList.remove('active');
        currentSlide.pause();
        
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        
        const nextSlide = slides[currentSlideIndex];
        nextSlide.classList.add('active');
        nextSlide.play().catch(err => console.log("Hero slide play blocked: ", err));
    }, 5000);
}

function renderAbout() {
    const about = siteData.about;
    document.getElementById('about-title-val').textContent = about.title || '';
    document.getElementById('about-text1-val').textContent = about.text1 || '';
    document.getElementById('about-text2-val').textContent = about.text2 || '';
    
    const statsContainer = document.getElementById('about-stats-val');
    statsContainer.innerHTML = '';
    
    if (about.stats && about.stats.length > 0) {
        about.stats.forEach(stat => {
            const div = document.createElement('div');
            div.classList.add('stat-item');
            div.innerHTML = `
                <span class="stat-num">${stat.number}</span>
                <span class="stat-lbl">${stat.label}</span>
            `;
            statsContainer.appendChild(div);
        });
    }
}

function renderSkills() {
    const grid = document.getElementById('skills-grid');
    grid.innerHTML = '';
    
    siteData.skills.forEach(skill => {
        const card = document.createElement('div');
        card.classList.add('skill-card', 'glass-panel');
        card.id = skill.id;
        card.innerHTML = `
            <div class="skill-icon-container ${skill.colorClass}">
                <i data-lucide="${skill.icon}"></i>
            </div>
            <h3>${skill.name}</h3>
            <p>${skill.desc}</p>
            <div class="skill-bar-wrapper">
                <div class="skill-bar-label"><span>Expertise Level</span><span>${skill.level}%</span></div>
                <div class="skill-bar"><div class="skill-progress ${skill.barClass}" style="width: ${skill.level}%"></div></div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderPortfolioGrid() {
    const grid = document.getElementById('portfolio-grid');
    grid.innerHTML = '';
    
    siteData.projects.forEach(project => {
        const card = document.createElement('article');
        card.classList.add('portfolio-item', 'glass-panel');
        card.setAttribute('data-category', project.category);
        card.id = project.id;
        card.innerHTML = `
            <div class="portfolio-media">
                <video src="${project.videoUrl}" poster="${project.thumbUrl}" class="portfolio-img" autoplay loop muted playsinline></video>
                <div class="portfolio-hover-overlay">
                    <div class="portfolio-hover-actions">
                        <span class="btn-play-icon"><i data-lucide="play"></i></span>
                    </div>
                </div>
            </div>
            <div class="portfolio-info">
                <span class="portfolio-cat">${project.category}</span>
                <h3 class="portfolio-item-title">${project.title}</h3>
                <p class="portfolio-item-desc">${project.desc}</p>
                <div class="portfolio-meta">
                    <span><i data-lucide="clock"></i> ${project.duration}</span>
                    <span><i data-lucide="calendar"></i> ${project.year}</span>
                </div>
            </div>
        `;
        
        // Modal trigger binding
        card.addEventListener('click', () => openLightbox(project.id));
        grid.appendChild(card);
    });
}

// Render project items inside the Dashboard Tab 2
function renderDashboardProjects() {
    const list = document.getElementById('dashboard-projects-list');
    list.innerHTML = '';
    
    siteData.projects.forEach(project => {
        const item = document.createElement('div');
        item.classList.add('dashboard-proj-item');
        item.innerHTML = `
            <div class="proj-item-left">
                <img src="${project.thumbUrl}" class="proj-item-thumb" alt="">
                <div class="proj-item-meta">
                    <h4>${project.title}</h4>
                    <span>${project.category}</span>
                </div>
            </div>
            <div class="proj-item-actions">
                <button class="btn btn-glow btn-secondary" onclick="openEditProjectModal('${project.id}')">Edit</button>
                <button class="btn btn-glow btn-danger" onclick="deleteProject('${project.id}')">Delete</button>
            </div>
        `;
        list.appendChild(item);
    });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
              .replace(/"/g, "&quot;")
              .replace(/'/g, "&#039;");
}

function renderDashboardMessages() {
    const messages = siteData.messages || [];
    
    // Update count badge in tab header and dashboard header
    const badge = document.getElementById('inbox-badge-count');
    if (badge) badge.textContent = messages.length;
    
    const summaryBadge = document.getElementById('inbox-summary-badge');
    if (summaryBadge) summaryBadge.textContent = `${messages.length} Inquiry${messages.length === 1 ? '' : 'ies'}`;
    
    const list = document.getElementById('dashboard-messages-list');
    if (!list) return;
    
    list.innerHTML = '';
    
    if (messages.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 3rem 0; color: var(--text-secondary);">
                <i data-lucide="inbox" style="width: 48px; height: 48px; margin-bottom: 1rem; opacity: 0.5; display: inline-block;"></i>
                <p>Your inbox is empty.</p>
            </div>
        `;
        updateIcons();
        return;
    }
    
    // Render in reverse chronological order (newest first)
    [...messages].reverse().forEach(msg => {
        const card = document.createElement('div');
        card.classList.add('inbox-msg-card');
        card.innerHTML = `
            <div class="inbox-msg-header">
                <div class="inbox-msg-sender">
                    <h4>${escapeHTML(msg.name)}</h4>
                    <span><a href="mailto:${escapeHTML(msg.email)}" style="color: var(--accent-cyan); text-decoration: underline;">${escapeHTML(msg.email)}</a></span>
                </div>
                <div class="inbox-msg-meta">
                    <div>${msg.date}</div>
                </div>
            </div>
            <div class="inbox-msg-project" style="margin-bottom: 0.75rem;">Project Inquiry: ${escapeHTML(msg.project)}</div>
            <div class="inbox-msg-body">${escapeHTML(msg.message)}</div>
            <div class="inbox-msg-actions">
                <button class="btn btn-glow btn-danger" onclick="deleteMessage('${msg.id}')">
                    <span>Delete Message</span>
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        list.appendChild(card);
    });
    updateIcons();
}

window.deleteMessage = function(id) {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    siteData.messages = siteData.messages.filter(m => m.id !== id);
    saveSiteData();
};

// -------------------------------------------------------------
// EVENT BINDINGS & ADMIN PANELS OVERLAYS
// -------------------------------------------------------------

const adminTriggerBtn = document.getElementById('admin-trigger-btn');
const adminLoginModal = document.getElementById('admin-login-modal');
const adminDashboardModal = document.getElementById('admin-dashboard-modal');
const loginForm = document.getElementById('admin-login-form');
const loginErrorMsg = document.getElementById('login-error-msg');

// Floating Admin Trigger Action
adminTriggerBtn.addEventListener('click', () => {
    if (isAdmin) {
        populateDashboardContentForm();
        adminDashboardModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    } else {
        loginForm.reset();
        loginErrorMsg.textContent = '';
        adminLoginModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
});

// Close Overlays
document.getElementById('admin-login-close').addEventListener('click', () => {
    adminLoginModal.classList.remove('active');
    document.body.style.overflow = '';
});
document.getElementById('admin-dashboard-close').addEventListener('click', () => {
    adminDashboardModal.classList.remove('active');
    document.body.style.overflow = '';
});

// Admin Login Form Submit
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const password = document.getElementById('admin-password').value;
    
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        if (res.ok) {
            adminLoginModal.classList.remove('active');
            await checkAuth(); // Sets isAdmin true, updates button icon
            populateDashboardContentForm();
            adminDashboardModal.classList.add('active');
        } else {
            const data = await res.json();
            loginErrorMsg.textContent = data.error || 'Authentication failed.';
        }
    } catch (err) {
        loginErrorMsg.textContent = 'Server connectivity error.';
    }
});

// Admin Logout
document.getElementById('admin-logout-btn').addEventListener('click', async () => {
    try {
        await fetch('/api/logout', { method: 'POST' });
        adminDashboardModal.classList.remove('active');
        document.body.style.overflow = '';
        await checkAuth(); // Updates isAdmin and triggers login flow
        alert('Successfully logged out.');
    } catch (err) {
        console.error('Logout error:', err);
    }
});

// Tab Navigation inside Dashboard
const tabButtons = document.querySelectorAll('.dashboard-tabs .tab-btn');
const tabPanels = document.querySelectorAll('.tab-content-panel');

tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        tabPanels.forEach(p => p.classList.remove('active'));
        
        btn.classList.add('active');
        const targetId = btn.getAttribute('data-tab');
        document.getElementById(targetId).classList.add('active');
    });
});

// -------------------------------------------------------------
// FORM SUBMISSIONS & SAVING
// -------------------------------------------------------------

// Populate Tab 1 dashboard fields from local siteData
function populateDashboardContentForm() {
    document.getElementById('edit-hero-badge').value = siteData.hero.badge || '';
    document.getElementById('edit-hero-title').value = siteData.hero.title || '';
    document.getElementById('edit-hero-subtitle').value = siteData.hero.subtitle || '';
    
    document.getElementById('edit-about-title').value = siteData.about.title || '';
    document.getElementById('edit-about-text1').value = siteData.about.text1 || '';
    document.getElementById('edit-about-text2').value = siteData.about.text2 || '';
    
    const stats = siteData.about.stats || [];
    if (stats.length >= 3) {
        document.getElementById('edit-stat-1-num').value = stats[0].number;
        document.getElementById('edit-stat-1-lbl').value = stats[0].label;
        document.getElementById('edit-stat-2-num').value = stats[1].number;
        document.getElementById('edit-stat-2-lbl').value = stats[1].label;
        document.getElementById('edit-stat-3-num').value = stats[2].number;
        document.getElementById('edit-stat-3-lbl').value = stats[2].label;
    }
    
    // Populate SMTP settings
    const smtp = siteData.smtp || {};
    document.getElementById('edit-smtp-web3forms-key').value = smtp.web3forms_key || '';
    document.getElementById('edit-smtp-host').value = smtp.host || 'smtp.gmail.com';
    document.getElementById('edit-smtp-port').value = smtp.port || 587;
    document.getElementById('edit-smtp-user').value = smtp.user || '';
    document.getElementById('edit-smtp-password').value = smtp.password || '';
    document.getElementById('edit-smtp-receiver').value = smtp.receiver || 'achyueee181@gmail.com';
    
    // Trigger floating label update on select elements/inputs
    document.querySelectorAll('.admin-dashboard-container .form-control').forEach(el => {
        if (el.value !== "") {
            el.classList.add('has-value');
        } else {
            el.classList.remove('has-value');
        }
    });
}

// Global Site Text Form Submission
document.getElementById('dashboard-content-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    siteData.hero.badge = document.getElementById('edit-hero-badge').value;
    siteData.hero.title = document.getElementById('edit-hero-title').value;
    siteData.hero.subtitle = document.getElementById('edit-hero-subtitle').value;
    
    siteData.about.title = document.getElementById('edit-about-title').value;
    siteData.about.text1 = document.getElementById('edit-about-text1').value;
    siteData.about.text2 = document.getElementById('edit-about-text2').value;
    
    siteData.about.stats = [
        {
            number: document.getElementById('edit-stat-1-num').value,
            label: document.getElementById('edit-stat-1-lbl').value
        },
        {
            number: document.getElementById('edit-stat-2-num').value,
            label: document.getElementById('edit-stat-2-lbl').value
        },
        {
            number: document.getElementById('edit-stat-3-num').value,
            label: document.getElementById('edit-stat-3-lbl').value
        }
    ];
    
    saveSiteData();
});

// SMTP Settings Form Submission
document.getElementById('dashboard-smtp-form').addEventListener('submit', (e) => {
    e.preventDefault();
    
    if (!siteData.smtp) siteData.smtp = {};
    
    siteData.smtp.web3forms_key = document.getElementById('edit-smtp-web3forms-key').value.trim();
    siteData.smtp.host = document.getElementById('edit-smtp-host').value;
    
    const portVal = document.getElementById('edit-smtp-port').value;
    siteData.smtp.port = portVal ? parseInt(portVal) : 587;
    
    siteData.smtp.user = document.getElementById('edit-smtp-user').value;
    siteData.smtp.password = document.getElementById('edit-smtp-password').value;
    siteData.smtp.receiver = document.getElementById('edit-smtp-receiver').value;
    
    saveSiteData();
});

// Contact Form Submission Handler
document.getElementById('portfolio-contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const project = document.getElementById('contact-project').value;
    const message = document.getElementById('contact-message').value;
    
    const submitBtn = document.getElementById('contact-submit-btn');
    const originalBtnHTML = submitBtn.innerHTML;
    
    // Set loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Sending...</span><span class="spinner-mini"></span>`;
    
    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, project, message })
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert(data.message || 'Thank you! Your message has been sent.');
            document.getElementById('portfolio-contact-form').reset();
            // Clear floating labels has-value class
            document.querySelectorAll('#portfolio-contact-form .form-control').forEach(el => el.classList.remove('has-value'));
        } else {
            alert('Failed to send message: ' + (data.error || 'Server error.'));
        }
    } catch (err) {
        alert('Connectivity error. Please check your network and try again.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
        updateIcons();
    }
});

// Add New Project Form Submission
document.getElementById('dashboard-add-project-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const fileInput = document.getElementById('add-project-file');
    const videoFileInput = document.getElementById('add-project-video-file');
    let thumbUrl = document.getElementById('add-project-thumb-url').value;
    let videoUrl = document.getElementById('add-project-video').value;
    
    try {
        // If file selected, upload it first
        if (fileInput.files.length > 0) {
            const uploadedPath = await uploadFile(fileInput);
            if (uploadedPath) thumbUrl = uploadedPath;
        }
        
        // If video selected, upload it
        if (videoFileInput.files.length > 0) {
            const uploadedPath = await uploadFile(videoFileInput);
            if (uploadedPath) videoUrl = uploadedPath;
        }
        
        if (!thumbUrl) {
            alert('Please select an image file to upload or provide a static thumbnail URL.');
            return;
        }
        
        if (!videoUrl) {
            alert('Please select a video file to upload or provide a static video URL/path.');
            return;
        }
        
        const newProj = {
            id: 'project-' + Date.now(),
            title: document.getElementById('add-project-title').value,
            category: document.getElementById('add-project-category').value,
            desc: document.getElementById('add-project-desc').value,
            duration: document.getElementById('add-project-duration').value,
            year: document.getElementById('add-project-year').value,
            videoUrl: videoUrl,
            thumbUrl: thumbUrl
        };
        
        siteData.projects.push(newProj);
        
        await saveSiteData();
        
        // Reset Tab Form fields
        document.getElementById('dashboard-add-project-form').reset();
        fileInput.value = '';
        videoFileInput.value = '';
        
        // Switch back to Projects list Tab
        document.querySelector('.dashboard-tabs [data-tab="tab-projects"]').click();
    } catch (err) {
        alert('Upload/Save failed: ' + err.message);
    }
});

// Delete project action
window.deleteProject = function(id) {
    if (!confirm('Are you sure you want to delete this project?')) return;
    
    siteData.projects = siteData.projects.filter(p => p.id !== id);
    saveSiteData();
};

// Edit project modals and details
const editProjectModal = document.getElementById('admin-edit-project-modal');
const editProjectForm = document.getElementById('dashboard-edit-project-form');

window.openEditProjectModal = function(id) {
    const project = siteData.projects.find(p => p.id === id);
    if (!project) return;
    
    document.getElementById('edit-project-id').value = project.id;
    document.getElementById('edit-project-title').value = project.title;
    document.getElementById('edit-project-category').value = project.category;
    document.getElementById('edit-project-desc').value = project.desc;
    document.getElementById('edit-project-duration').value = project.duration;
    document.getElementById('edit-project-year').value = project.year;
    document.getElementById('edit-project-video').value = project.videoUrl;
    document.getElementById('edit-project-thumb-url').value = project.thumbUrl;
    
    // Trigger float labels
    document.querySelectorAll('#admin-edit-project-modal .form-control').forEach(el => {
        if (el.value !== "") el.classList.add('has-value');
        else el.classList.remove('has-value');
    });
    
    editProjectModal.classList.add('active');
};

document.getElementById('admin-edit-project-close').addEventListener('click', () => {
    editProjectModal.classList.remove('active');
});

// Edit Project Form Submit
editProjectForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const id = document.getElementById('edit-project-id').value;
    const fileInput = document.getElementById('edit-project-file');
    const videoFileInput = document.getElementById('edit-project-video-file');
    let thumbUrl = document.getElementById('edit-project-thumb-url').value;
    let videoUrl = document.getElementById('edit-project-video').value;
    
    try {
        // Handle upload if file selected
        if (fileInput.files.length > 0) {
            const uploadedPath = await uploadFile(fileInput);
            if (uploadedPath) thumbUrl = uploadedPath;
        }
        
        // Handle video upload if file selected
        if (videoFileInput.files.length > 0) {
            const uploadedPath = await uploadFile(videoFileInput);
            if (uploadedPath) videoUrl = uploadedPath;
        }
        
        const projectIndex = siteData.projects.findIndex(p => p.id === id);
        if (projectIndex !== -1) {
            siteData.projects[projectIndex] = {
                id,
                title: document.getElementById('edit-project-title').value,
                category: document.getElementById('edit-project-category').value,
                desc: document.getElementById('edit-project-desc').value,
                duration: document.getElementById('edit-project-duration').value,
                year: document.getElementById('edit-project-year').value,
                videoUrl: videoUrl,
                thumbUrl: thumbUrl
            };
            
            await saveSiteData();
            editProjectModal.classList.remove('active');
            fileInput.value = '';
            videoFileInput.value = '';
        }
    } catch (err) {
        alert('Edit upload/save failed: ' + err.message);
    }
});

// -------------------------------------------------------------
// STANDALONE VIEW LOGIC (MODALS, SCROLLS, HEADER)
// -------------------------------------------------------------

// Scroll Event listener
window.addEventListener('scroll', () => {
    const header = document.getElementById('main-header');
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
    } else {
        header.classList.remove('scrolled');
    }
});

// Active Link scroll observer
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (window.pageYOffset >= sectionTop - 150) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').includes(current)) {
            link.classList.add('active');
        }
    });
});

// Mobile Nav toggling
const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
const mobileNavDrawer = document.getElementById('mobile-nav-drawer');
const mobileNavClose = document.getElementById('mobile-nav-close');
const mobileLinks = document.querySelectorAll('.mobile-link');

mobileMenuToggle.addEventListener('click', () => {
    mobileNavDrawer.classList.add('active');
    document.body.style.overflow = 'hidden';
});

const closeMobileMenu = () => {
    mobileNavDrawer.classList.remove('active');
    document.body.style.overflow = '';
};

mobileNavClose.addEventListener('click', closeMobileMenu);
mobileLinks.forEach(link => link.addEventListener('click', closeMobileMenu));

// Portfolio Filter Click Binding
const filterButtons = document.querySelectorAll('.filter-btn');

document.getElementById('portfolio-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;
    
    filterButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const filterValue = btn.getAttribute('data-filter');
    const items = document.querySelectorAll('.portfolio-item');

    items.forEach(item => {
        item.style.transform = 'scale(0.85)';
        item.style.opacity = '0';
        
        setTimeout(() => {
            const category = item.getAttribute('data-category');
            if (filterValue === 'all' || category === filterValue) {
                item.style.display = 'block';
                setTimeout(() => {
                    item.style.transform = 'scale(1)';
                    item.style.opacity = '1';
                }, 50);
            } else {
                item.style.display = 'none';
            }
        }, 300);
    });
});

// Button Ripple Click generator
document.body.addEventListener('click', (e) => {
    const button = e.target.closest('.btn-glow');
    if (!button) return;
    
    const ripple = document.createElement('span');
    ripple.classList.add('click-glow-ring');
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = e.clientX - rect.left - size/2;
    const y = e.clientY - rect.top - size/2;
    
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    
    const existing = button.querySelectorAll('.click-glow-ring');
    existing.forEach(r => r.remove());
    
    button.appendChild(ripple);
    
    setTimeout(() => {
        ripple.remove();
    }, 800);
});

// Lightbox player controls
const videoLightbox = document.getElementById('video-lightbox');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxVideo = document.getElementById('lightbox-video');
const lightboxLoader = document.getElementById('lightbox-loader');
const lightboxTitle = document.getElementById('lightbox-title');
const lightboxDesc = document.getElementById('lightbox-desc');
const lightboxMetaCat = document.getElementById('lightbox-meta-cat');
const lightboxMetaDuration = document.getElementById('lightbox-meta-duration');
const lightboxMetaYear = document.getElementById('lightbox-meta-year');

function openLightbox(id) {
    // If id is play-hero-reel, take first project
    const project = id === 'play-hero-reel' 
        ? siteData.projects[0] 
        : siteData.projects.find(p => p.id === id);
        
    if (!project) return;

    lightboxTitle.textContent = project.title;
    lightboxDesc.textContent = project.desc;
    lightboxMetaCat.textContent = project.category;
    lightboxMetaDuration.innerHTML = `<i data-lucide="clock"></i> ${project.duration}`;
    lightboxMetaYear.innerHTML = `<i data-lucide="calendar"></i> ${project.year}`;

    lightboxLoader.classList.add('loading');
    
    lightboxVideo.src = project.videoUrl;
    lightboxVideo.load();
    
    lightboxVideo.oncanplay = function() {
        lightboxLoader.classList.remove('loading');
    };

    videoLightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    updateIcons();

    // Trigger video playback within user click thread
    lightboxVideo.play().catch(err => {
        console.warn("Autoplay play was blocked: ", err);
    });
}

function closeLightbox() {
    videoLightbox.classList.remove('active');
    lightboxVideo.pause();
    lightboxVideo.src = '';
    document.body.style.overflow = '';
}

document.getElementById('play-hero-reel').addEventListener('click', () => {
    const projects = siteData.projects;
    if (!projects || projects.length === 0) return;
    const currentProject = projects[currentSlideIndex];
    openLightbox(currentProject.id);
});
lightboxClose.addEventListener('click', closeLightbox);
videoLightbox.addEventListener('click', (e) => {
    if (e.target === videoLightbox) closeLightbox();
});

// Select Dropdowns floating highlights helper
document.body.addEventListener('change', (e) => {
    const sel = e.target.closest('select.form-control');
    if (!sel) return;
    if (sel.value !== "") sel.classList.add('has-value');
    else sel.classList.remove('has-value');
});

// Canvas Dust Particles Background
const particleContainer = document.getElementById('bg-particles');
const canvas = document.createElement('canvas');
particleContainer.appendChild(canvas);
const ctx = canvas.getContext('2d');

let particlesArray = [];
let width = canvas.width = window.innerWidth;
let height = canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.4 - 0.2;
        this.speedY = Math.random() * 0.4 - 0.2;
        this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > width) this.x = 0;
        else if (this.x < 0) this.x = width;
        
        if (this.y > height) this.y = 0;
        else if (this.y < 0) this.y = height;
    }
    draw() {
        ctx.fillStyle = `rgba(138, 43, 226, ${this.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0, 242, 254, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

function initParticles() {
    particlesArray = [];
    const numberOfParticles = Math.floor((width * height) / 9000);
    for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, width, height);
    particlesArray.forEach(p => {
        p.update();
        p.draw();
    });
    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();
window.addEventListener('resize', initParticles);

// Bootstrapping site setup
window.addEventListener('DOMContentLoaded', () => {
    fetchContent();
    checkAuth();
});
