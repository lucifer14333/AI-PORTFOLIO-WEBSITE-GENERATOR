// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyCXh_h4GUdg_waD5WZGQh4ZL5IgI4jK_tU",
  authDomain: "egspillay-ac8af.firebaseapp.com",
  projectId: "egspillay-ac8af",
  storageBucket: "egspillay-ac8af.firebasestorage.app",
  messagingSenderId: "621517501722",
  appId: "1:621517501722:web:76a0a742aea91e1c47a8a3"
};

// Initialize Firebase
try {
  const app = firebase.initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.log('Firebase already initialized or error:', error);
}

const auth = firebase.auth();

// Global variables
let currentUser = null;
let profilePhoto = null;
let resumeData = null;
let githubProjects = [];
let currentPortfolioHTML = '';
let selectedTheme = 'dark'; // Default theme
let selectedTemplate = 'modern'; // Default template
let aiSuggestions = null;
let currentPortfolioData = null;

// Template configurations
const TEMPLATES = {
  modern: {
    name: 'Modern',
    description: 'Clean, professional design with smooth animations',
    colors: {
      primary: '#6366f1',
      secondary: '#8b5cf6',
      accent: '#10b981'
    }
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple and elegant with focus on content',
    colors: {
      primary: '#3b82f6',
      secondary: '#1e40af',
      accent: '#059669'
    }
  },
  creative: {
    name: 'Creative',
    description: 'Bold and artistic with unique layouts',
    colors: {
      primary: '#ec4899',
      secondary: '#8b5cf6',
      accent: '#f59e0b'
    }
  },
  corporate: {
    name: 'Corporate',
    description: 'Professional and formal business style',
    colors: {
      primary: '#1e40af',
      secondary: '#374151',
      accent: '#0284c7'
    }
  }
};

// Firebase UI Auth Configuration
const uiConfig = {
  signInSuccessUrl: '#',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    firebase.auth.GithubAuthProvider.PROVIDER_ID,
  ],
  tosUrl: '#',
  privacyPolicyUrl: '#',
  callbacks: {
    signInSuccessWithAuthResult: function(authResult, redirectUrl) {
      currentUser = authResult.user;
      updateUserUI();
      closeAuthModal();
      showStatus('Successfully signed in!', 'success');
      return false;
    },
    signInFailure: function(error) {
      showStatus('Authentication failed: ' + error.message, 'error');
    }
  }
};

// Initialize Firebase UI
let ui = null;

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, initializing Portfolio Generator...');
  
  // Initialize theme from localStorage or default
  const savedTheme = localStorage.getItem('portfolio-theme');
  if (savedTheme) {
    selectedTheme = savedTheme;
    document.documentElement.setAttribute('data-theme', selectedTheme);
  }
  
  // Initialize template from localStorage or default
  const savedTemplate = localStorage.getItem('portfolio-template');
  if (savedTemplate && TEMPLATES[savedTemplate]) {
    selectedTemplate = savedTemplate;
  }
  
  // Update template UI
  updateTemplateUI();
  
  try {
    ui = new firebaseui.auth.AuthUI(auth);
    if (!ui.isPendingRedirect()) {
      ui.start('#firebaseui-auth-container', uiConfig);
    }
  } catch (error) {
    console.log('Firebase UI error:', error);
  }
  
  // Initialize upload areas
  initUploadAreas();
  
  // Initialize skill tags
  initSkillTags();
  
  // Initialize theme toggle
  initThemeToggle();
  
  // Initialize template selector
  initTemplateSelector();
  
  // Check auth state
  auth.onAuthStateChanged(function(user) {
    currentUser = user;
    updateUserUI();
    
    if (user) {
      console.log('User signed in:', user.email);
    } else {
      console.log('No user signed in');
    }
  });
  
  // Add event listeners for form buttons
  document.querySelector('.btn-generate').addEventListener('click', generatePortfolio);
  document.querySelector('.btn-ai').addEventListener('click', aiEnhance);
  document.querySelector('.btn-export').addEventListener('click', exportPortfolio);
  document.querySelector('.btn-github').addEventListener('click', deployToGitHub);
  document.querySelector('.btn-clear').addEventListener('click', clearForm);
  document.querySelector('.btn-download').addEventListener('click', downloadPortfolio);
  document.querySelector('.btn-copy').addEventListener('click', copyHTML);
  
  // Initialize with one project item
  addProject();
  
  // Welcome message
  console.log('%c🚀 Portfolio Generator Ready!', 'font-size: 16px; font-weight: bold; color: #667eea;');
  console.log('%c🎨 Theme System: ' + selectedTheme, 'font-size: 12px; color: #10b981;');
  console.log('%c📁 Template: ' + selectedTemplate, 'font-size: 12px; color: #f59e0b;');
});

// ===========================
// THEME & TEMPLATE MANAGEMENT
// ===========================

function initThemeToggle() {
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = selectedTheme === 'dark' ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
    
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Update theme-specific elements
  updateThemeUI();
}

function toggleTheme() {
  selectedTheme = selectedTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', selectedTheme);
  localStorage.setItem('portfolio-theme', selectedTheme);
  
  // Update toggle button
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.innerHTML = selectedTheme === 'dark' ? 
      '<i class="fas fa-sun"></i>' : 
      '<i class="fas fa-moon"></i>';
  }
  
  // Update UI elements
  updateThemeUI();
  
  // Regenerate portfolio with new theme if exists
  if (currentPortfolioData) {
    const newPortfolio = generateEnhancedPortfolio(currentPortfolioData);
    currentPortfolioHTML = generatePortfolioHTML(newPortfolio);
    const previewElement = document.getElementById('portfolio-preview');
    if (previewElement) {
      previewElement.innerHTML = currentPortfolioHTML;
    }
  }
  
  showStatus(`Theme changed to ${selectedTheme} mode`, 'success');
}

function updateThemeUI() {
  // Update CSS variables based on theme
  const root = document.documentElement;
  if (selectedTheme === 'dark') {
    root.style.setProperty('--bg-primary', '#acbee8');
    root.style.setProperty('--bg-secondary', '#a9c4f1');
    root.style.setProperty('--text-primary', '#313131');
    root.style.setProperty('--text-secondary', '#454545');
  } else {
    root.style.setProperty('--bg-primary', '#ffffff');
    root.style.setProperty('--bg-secondary', '#f8fafc');
    root.style.setProperty('--text-primary', '#1e293b');
    root.style.setProperty('--text-secondary', '#64748b');
  }
}

function initTemplateSelector() {
  const templateSelect = document.getElementById('template-select');
  if (!templateSelect) return;
  
  // Populate template options
  Object.entries(TEMPLATES).forEach(([key, template]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = `${template.name} - ${template.description}`;
    option.selected = key === selectedTemplate;
    templateSelect.appendChild(option);
  });
  
  templateSelect.addEventListener('change', function() {
    selectedTemplate = this.value;
    localStorage.setItem('portfolio-template', selectedTemplate);
    updateTemplateUI();
    
    // Regenerate portfolio with new template if exists
    if (currentPortfolioData) {
      const newPortfolio = generateEnhancedPortfolio(currentPortfolioData);
      currentPortfolioHTML = generatePortfolioHTML(newPortfolio);
      const previewElement = document.getElementById('portfolio-preview');
      if (previewElement) {
        previewElement.innerHTML = currentPortfolioHTML;
      }
    }
    
    showStatus(`Template changed to ${TEMPLATES[selectedTemplate].name}`, 'success');
  });
}

function updateTemplateUI() {
  const template = TEMPLATES[selectedTemplate];
  const templateName = document.getElementById('template-name');
  const templateColors = document.getElementById('template-colors');
  
  if (templateName) {
    templateName.textContent = template.name;
  }
  
  if (templateColors) {
    templateColors.innerHTML = `
      <div class="color-palette">
        <div class="color-item" style="background: ${template.colors.primary}" title="Primary: ${template.colors.primary}"></div>
        <div class="color-item" style="background: ${template.colors.secondary}" title="Secondary: ${template.colors.secondary}"></div>
        <div class="color-item" style="background: ${template.colors.accent}" title="Accent: ${template.colors.accent}"></div>
      </div>
    `;
  }
}

// ===========================
// PORTFOLIO GENERATION
// ===========================

async function generatePortfolio() {
  console.log('Generating portfolio...');
  
  // Collect form data
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const title = document.getElementById('title').value.trim();
  const about = document.getElementById('about').value.trim();
  const skills = document.getElementById('skills').value.trim();
  
  // Validate required fields
  if (!name || !email || !title) {
    showStatus('Please fill in at least Name, Email, and Title fields', 'error');
    return;
  }
  
  showStatus('✨ Generating your portfolio...', 'loading');
  
  try {
    // Collect projects
    const projects = [];
    document.querySelectorAll('.project-item').forEach(project => {
      const projectName = project.querySelector('.project-name').value.trim();
      const projectDesc = project.querySelector('.project-desc').value.trim();
      if (projectName) {
        projects.push({ 
          name: projectName, 
          description: projectDesc || 'No description provided' 
        });
      }
    });
    
    // Collect GitHub username
    const githubUsername = document.getElementById('github-username').value.trim();
    
    // Prepare data
    const portfolioData = {
      name,
      email,
      title,
      about: about || 'No about section provided',
      skills: skills.split(',').map(s => s.trim()).filter(s => s),
      projects,
      githubUsername,
      profilePhoto: profilePhoto ? 'Profile photo uploaded' : null,
      resumeData: resumeData ? 'Resume uploaded' : null,
      theme: selectedTheme,
      template: selectedTemplate
    };
    
    // Store data for regeneration
    currentPortfolioData = portfolioData;
    
    // Generate enhanced portfolio
    const enhancedPortfolio = generateEnhancedPortfolio(portfolioData);
    
    // Store the AI suggestions for later use
    aiSuggestions = enhancedPortfolio.suggestions;
    
    // Generate the HTML
    currentPortfolioHTML = generatePortfolioHTML(enhancedPortfolio);
    
    // Display preview
    const previewElement = document.getElementById('portfolio-preview');
    if (previewElement) {
      previewElement.innerHTML = currentPortfolioHTML;
      showStatus('✨ Portfolio generated successfully!', 'success');
      
      // Scroll to preview
      previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // Update form with suggestions
      updateFormWithSuggestions(enhancedPortfolio.suggestions);
    } else {
      showStatus('Preview element not found', 'error');
    }
    
  } catch (error) {
    console.error('Portfolio Generation Error:', error);
    showStatus('Generation failed: ' + error.message, 'error');
  }
}

function generateEnhancedPortfolio(data) {
  console.log('Generating enhanced portfolio...');
  
  const template = TEMPLATES[selectedTemplate];
  const colors = template.colors;
  
  // Categorize skills
  const technicalSkills = data.skills.filter(skill => 
    skill.toLowerCase().match(/(js|javascript|python|java|c\+\+|c#|react|node|vue|angular|sql|database|aws|docker|kubernetes|git|html|css|typescript|graphql|rest|api|machine learning|ai|ml|data science|backend|frontend|fullstack|mobile|android|ios)/)
  );
  
  const softSkills = [
    'Communication', 'Problem Solving', 'Team Collaboration', 
    'Time Management', 'Adaptability', 'Leadership', 'Creativity'
  ];
  
  const tools = [
    'Visual Studio Code', 'Git', 'GitHub', 'Docker', 'Postman', 
    'Figma', 'Jira', 'Slack', 'VS Code', 'Terminal'
  ];
  
  // Generate experience based on skills
  const experience = [];
  if (technicalSkills.length > 0) {
    experience.push({
      title: data.title,
      company: 'Professional Experience',
      period: 'Current',
      description: `Working with technologies including ${technicalSkills.slice(0, 5).join(', ')}. Developing innovative solutions and collaborating with cross-functional teams.`
    });
    
    if (technicalSkills.includes('React') || technicalSkills.includes('JavaScript')) {
      experience.push({
        title: 'Frontend Developer',
        company: 'Previous Role',
        period: 'Previous Years',
        description: 'Developed responsive web applications and collaborated with design teams.'
      });
    }
  }
  
  // Enhance project descriptions
  const enhancedProjects = data.projects.map((project, index) => {
    const techForProject = technicalSkills.slice(index * 2, index * 2 + 3);
    const impacts = [
      'Improved performance by optimizing key algorithms',
      'Enhanced user experience with intuitive interfaces',
      'Increased efficiency by automating manual processes',
      'Scaled application to handle 10,000+ users'
    ];
    
    return {
      name: project.name,
      description: project.description || `A ${project.name.toLowerCase()} project demonstrating expertise in ${techForProject.join(', ')}.`,
      technologies: techForProject.length > 0 ? techForProject : ['Web Technologies', 'Modern Frameworks'],
      impact: impacts[index % impacts.length] || 'Successfully delivered project meeting all requirements'
    };
  });
  
  // Generate portfolio structure
  return {
    portfolio: {
      hero: {
        headline: `${data.name} | ${data.title}`,
        tagline: `Professional ${data.title} with ${data.skills.length}+ skills`,
        summary: `Experienced ${data.title} specializing in ${technicalSkills.slice(0, 3).join(', ')}. Passionate about creating efficient solutions and delivering high-quality work. Committed to continuous learning and innovation.`
      },
      about: {
        content: `${data.name} is a ${data.title} with expertise in ${technicalSkills.slice(0, 5).join(', ')}. ${data.about || `With a strong background in technology and problem-solving, ${data.name} excels at creating innovative solutions that meet business needs. Dedicated to continuous learning and staying current with industry trends.`}\n\nDriven by a passion for technology and innovation, ${data.name} brings a unique combination of technical expertise and creative problem-solving to every project. Always eager to take on new challenges and contribute to team success.\n\nCommitted to writing clean, maintainable code and following best practices in software development. Strong advocate for collaboration, knowledge sharing, and continuous improvement.`,
        keyStrengths: [
          `Expertise in ${technicalSkills[0] || 'Web Technologies'}`,
          'Strong problem-solving skills',
          'Effective team collaboration',
          'Attention to detail',
          'Project management',
          'Continuous learning',
          'Innovative thinking'
        ]
      },
      skills: {
        technical: data.skills.slice(0, 12),
        softSkills: softSkills,
        tools: tools
      },
      experience: experience,
      projects: enhancedProjects,
      contact: {
        emailText: `Contact ${data.name} for collaboration opportunities, project inquiries, or professional networking. Always open to discussing new ideas and opportunities.`,
        callToAction: 'Get in touch to discuss how we can work together!'
      }
    },
    suggestions: {
      titleSuggestions: [
        data.title,
        `Senior ${data.title}`,
        `Lead ${data.title}`,
        `${data.title} & Developer`,
        `Full Stack ${data.title}`,
        `Technical ${data.title}`
      ],
      skillSuggestions: [
        'TypeScript',
        'React Native',
        'GraphQL',
        'AWS Services',
        'CI/CD Pipeline',
        'Testing Frameworks',
        'Performance Optimization',
        'Security Best Practices'
      ],
      projectIdeas: [
        'Build a personal portfolio website with blog functionality',
        'Create an open-source tool for developers',
        'Develop a mobile app for task management',
        'Build a REST API with authentication and documentation',
        'Create a dashboard for data visualization'
      ],
      improvementTips: [
        'Add specific metrics to project descriptions',
        'Include links to live projects or GitHub repositories',
        'Add certifications and education details',
        'Use action verbs in experience descriptions',
        'Add testimonials or references from colleagues/clients',
        'Showcase contributions to open-source projects'
      ]
    },
    metadata: {
      theme: data.theme,
      template: data.template,
      colors: colors,
      generated: new Date().toISOString()
    }
  };
}

function generatePortfolioHTML(portfolio) {
  const data = portfolio.portfolio;
  const metadata = portfolio.metadata;
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const githubUsername = document.getElementById('github-username').value.trim();
  
  // Get template colors
  const colors = metadata.colors;
  
  return `
  <!DOCTYPE html>
<html lang="en" data-theme="${metadata.theme}" data-template="${metadata.template}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${name} | Professional Portfolio</title>
    <meta name="description" content="Professional portfolio of ${name} - ${data.hero.tagline}">
    <meta name="keywords" content="${name}, ${data.hero.headline}, portfolio, developer, ${data.skills.technical.slice(0, 5).join(', ')}">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        :root {
            --primary-color: ${colors.primary};
            --secondary-color: ${colors.secondary};
            --accent-color: ${colors.accent};
            --bg-primary: ${metadata.theme === 'dark' ? '#0f172a' : '#ffffff'};
            --bg-secondary: ${metadata.theme === 'dark' ? '#1e293b' : '#f8fafc'};
            --text-primary: ${metadata.theme === 'dark' ? '#f8fafc' : '#1e293b'};
            --text-secondary: ${metadata.theme === 'dark' ? '#cbd5e1' : '#64748b'};
            --border-color: ${metadata.theme === 'dark' ? '#334155' : '#e2e8f0'};
            --shadow-color: ${metadata.theme === 'dark' ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.1)'};
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            line-height: 1.6;
            background: var(--bg-primary);
            color: var(--text-primary);
            transition: all 0.3s ease;
        }
        
        .portfolio-container {
            max-width: 1200px;
            margin: 0 auto;
            background: var(--bg-primary);
            min-height: 100vh;
        }
        
        /* Header & Navigation */
        .portfolio-header {
            position: sticky;
            top: 0;
            z-index: 1000;
            background: var(--bg-secondary);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid var(--border-color);
            padding: 1rem 2rem;
        }
        
        .nav-container {
            max-width: 1200px;
            margin: 0 auto;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .logo {
            font-size: 1.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .nav-links {
            display: flex;
            gap: 2rem;
            list-style: none;
        }
        
        .nav-links a {
            color: var(--text-secondary);
            text-decoration: none;
            font-weight: 500;
            transition: color 0.3s ease;
            position: relative;
        }
        
        .nav-links a:hover {
            color: var(--primary-color);
        }
        
        .nav-links a::after {
            content: '';
            position: absolute;
            bottom: -5px;
            left: 0;
            width: 0;
            height: 2px;
            background: var(--primary-color);
            transition: width 0.3s ease;
        }
        
        .nav-links a:hover::after {
            width: 100%;
        }
        
        .theme-toggle {
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 50%;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .theme-toggle:hover {
            transform: rotate(15deg);
            border-color: var(--primary-color);
        }
        
        /* Hero Section */
        .hero-section {
            min-height: 80vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 4rem 2rem;
            position: relative;
            overflow: hidden;
        }
        
        .hero-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
                rgba(var(--primary-color-rgb), 0.1) 0%,
                rgba(var(--secondary-color-rgb), 0.05) 100%);
            z-index: 0;
        }
        
        .hero-content {
            position: relative;
            z-index: 1;
            text-align: center;
            max-width: 800px;
        }
        
        .hero-avatar {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            border: 4px solid var(--primary-color);
            margin: 0 auto 2rem;
            overflow: hidden;
            box-shadow: 0 20px 40px var(--shadow-color);
        }
        
        .hero-avatar img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .hero-avatar-placeholder {
            width: 180px;
            height: 180px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            margin: 0 auto 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 4px solid var(--primary-color);
        }
        
        .hero-avatar-placeholder i {
            font-size: 4rem;
            color: white;
        }
        
        .hero-title {
            font-size: 3.5rem;
            font-weight: 800;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.1;
        }
        
        .hero-subtitle {
            font-size: 1.5rem;
            color: var(--text-secondary);
            margin-bottom: 2rem;
            font-weight: 300;
        }
        
        .hero-description {
            font-size: 1.2rem;
            color: var(--text-secondary);
            margin-bottom: 3rem;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        
        .hero-badges {
            display: flex;
            gap: 1rem;
            justify-content: center;
            flex-wrap: wrap;
        }
        
        .hero-badge {
            padding: 0.75rem 1.5rem;
            background: var(--bg-secondary);
            border: 1px solid var(--border-color);
            border-radius: 50px;
            font-size: 0.9rem;
            font-weight: 500;
            color: var(--text-secondary);
            transition: all 0.3s ease;
        }
        
        .hero-badge:hover {
            background: var(--primary-color);
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(var(--primary-color-rgb), 0.2);
        }
        
        /* Section Styling */
        .section {
            padding: 5rem 2rem;
            position: relative;
        }
        
        .section-header {
            text-align: center;
            margin-bottom: 4rem;
        }
        
        .section-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
            color: var(--text-primary);
            position: relative;
            display: inline-block;
        }
        
        .section-title::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 50%;
            transform: translateX(-50%);
            width: 60px;
            height: 4px;
            background: var(--primary-color);
            border-radius: 2px;
        }
        
        .section-subtitle {
            font-size: 1.1rem;
            color: var(--text-secondary);
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* About Section */
        .about-content {
            max-width: 800px;
            margin: 0 auto;
            font-size: 1.1rem;
            line-height: 1.8;
            color: var(--text-secondary);
        }
        
        .about-content p {
            margin-bottom: 1.5rem;
        }
        
        .strengths-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 3rem;
        }
        
        .strength-card {
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 2rem;
            transition: all 0.3s ease;
            border: 1px solid var(--border-color);
        }
        
        .strength-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px var(--shadow-color);
            border-color: var(--primary-color);
        }
        
        .strength-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1rem;
        }
        
        .strength-icon i {
            font-size: 1.5rem;
            color: white;
        }
        
        .strength-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        /* Skills Section */
        .skills-container {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 3rem;
        }
        
        .skill-category {
            background: var(--bg-secondary);
            border-radius: 16px;
            padding: 2rem;
            border: 1px solid var(--border-color);
        }
        
        .category-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .category-icon {
            width: 50px;
            height: 50px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .category-icon i {
            font-size: 1.3rem;
            color: white;
        }
        
        .category-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .skills-grid {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
        }
        
        .skill-item {
            padding: 0.75rem 1.5rem;
            background: var(--bg-primary);
            border: 1px solid var(--border-color);
            border-radius: 25px;
            font-size: 0.95rem;
            font-weight: 500;
            color: var(--text-secondary);
            transition: all 0.3s ease;
        }
        
        .skill-item:hover {
            background: var(--primary-color);
            color: white;
            transform: translateY(-2px);
        }
        
        /* Experience Section */
        .experience-timeline {
            position: relative;
            max-width: 800px;
            margin: 0 auto;
        }
        
        .experience-timeline::before {
            content: '';
            position: absolute;
            left: 30px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(to bottom, var(--primary-color), transparent);
        }
        
        .experience-item {
            position: relative;
            margin-bottom: 3rem;
            padding-left: 80px;
        }
        
        .experience-item::before {
            content: '';
            position: absolute;
            left: 22px;
            top: 5px;
            width: 16px;
            height: 16px;
            background: var(--primary-color);
            border-radius: 50%;
            border: 4px solid var(--bg-primary);
            box-shadow: 0 0 0 4px var(--primary-color);
        }
        
        .experience-header {
            margin-bottom: 1rem;
        }
        
        .experience-title {
            font-size: 1.4rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        
        .experience-company {
            color: var(--primary-color);
            font-weight: 500;
            font-size: 1.1rem;
        }
        
        .experience-period {
            color: var(--text-secondary);
            font-size: 0.9rem;
            background: var(--bg-secondary);
            padding: 0.25rem 1rem;
            border-radius: 15px;
            display: inline-block;
            margin-left: 1rem;
        }
        
        .experience-description {
            color: var(--text-secondary);
            line-height: 1.7;
        }
        
        /* Projects Section */
        .projects-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 2.5rem;
        }
        
        .project-card {
            background: var(--bg-secondary);
            border-radius: 20px;
            padding: 2.5rem;
            border: 1px solid var(--border-color);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        
        .project-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--primary-color), var(--secondary-color));
        }
        
        .project-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 30px 60px var(--shadow-color);
            border-color: var(--primary-color);
        }
        
        .project-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1.5rem;
        }
        
        .project-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .project-tech {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
        }
        
        .tech-tag {
            padding: 0.4rem 1rem;
            background: var(--bg-primary);
            color: var(--primary-color);
            border-radius: 15px;
            font-size: 0.85rem;
            font-weight: 500;
            border: 1px solid var(--border-color);
        }
        
        .project-description {
            color: var(--text-secondary);
            line-height: 1.7;
            margin-bottom: 1.5rem;
        }
        
        .project-impact {
            padding: 1.2rem;
            background: var(--bg-primary);
            border-radius: 12px;
            border-left: 4px solid var(--accent-color);
            color: var(--text-secondary);
            font-size: 0.95rem;
        }
        
        /* Contact Section */
        .contact-container {
            max-width: 1000px;
            margin: 0 auto;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 4rem;
            align-items: center;
        }
        
        .contact-info {
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }
        
        .contact-item {
            display: flex;
            align-items: center;
            gap: 1.5rem;
            padding: 1.5rem;
            background: var(--bg-secondary);
            border-radius: 16px;
            transition: all 0.3s ease;
            border: 1px solid var(--border-color);
        }
        
        .contact-item:hover {
            transform: translateX(10px);
            border-color: var(--primary-color);
        }
        
        .contact-icon {
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .contact-icon i {
            font-size: 1.5rem;
            color: white;
        }
        
        .contact-details strong {
            display: block;
            font-size: 1.1rem;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }
        
        .contact-details a {
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .contact-details a:hover {
            color: var(--primary-color);
        }
        
        .contact-cta {
            text-align: center;
        }
        
        .cta-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            color: var(--text-primary);
        }
        
        .cta-description {
            color: var(--text-secondary);
            margin-bottom: 2.5rem;
            line-height: 1.7;
        }
        
        .cta-button {
            display: inline-flex;
            align-items: center;
            gap: 1rem;
            padding: 1.2rem 3rem;
            background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
            color: white;
            text-decoration: none;
            border-radius: 12px;
            font-weight: 600;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        
        .cta-button:hover {
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(var(--primary-color-rgb), 0.3);
        }
        
        /* Footer */
        .portfolio-footer {
            text-align: center;
            padding: 3rem 2rem;
            color: var(--text-secondary);
            font-size: 0.95rem;
            border-top: 1px solid var(--border-color);
            background: var(--bg-secondary);
        }
        
        .footer-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1200px;
            margin: 0 auto;
            flex-wrap: wrap;
            gap: 2rem;
        }
        
        .footer-info {
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        
        .footer-info i {
            color: var(--primary-color);
        }
        
        .footer-links {
            display: flex;
            gap: 2rem;
        }
        
        .footer-links a {
            color: var(--text-secondary);
            text-decoration: none;
            transition: color 0.3s ease;
        }
        
        .footer-links a:hover {
            color: var(--primary-color);
        }
        
        /* Animations */
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .animate-in {
            animation: fadeIn 0.8s ease-out;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            .nav-container {
                flex-direction: column;
                gap: 1rem;
            }
            
            .nav-links {
                gap: 1rem;
            }
            
            .hero-title {
                font-size: 2.5rem;
            }
            
            .hero-subtitle {
                font-size: 1.2rem;
            }
            
            .section {
                padding: 3rem 1rem;
            }
            
            .section-title {
                font-size: 2rem;
            }
            
            .contact-container {
                grid-template-columns: 1fr;
            }
            
            .projects-grid {
                grid-template-columns: 1fr;
            }
            
            .skills-container {
                grid-template-columns: 1fr;
            }
            
            .footer-content {
                flex-direction: column;
                text-align: center;
            }
            
            .experience-timeline::before {
                left: 20px;
            }
            
            .experience-item {
                padding-left: 60px;
            }
            
            .experience-item::before {
                left: 12px;
            }
        }
        
        @media (max-width: 480px) {
            .hero-avatar,
            .hero-avatar-placeholder {
                width: 140px;
                height: 140px;
            }
            
            .hero-title {
                font-size: 2rem;
            }
            
            .hero-badges {
                flex-direction: column;
                align-items: center;
            }
            
            .experience-period {
                display: block;
                margin: 0.5rem 0 0 0;
            }
        }
        
        /* Print Styles */
        @media print {
            .portfolio-header,
            .theme-toggle,
            .cta-button {
                display: none;
            }
            
            body {
                background: white;
                color: black;
            }
            
            .portfolio-container {
                max-width: 100%;
                margin: 0;
            }
        }
    </style>
</head>
<body>
    <div class="portfolio-container">
        <!-- Navigation -->
        <header class="portfolio-header">
            <nav class="nav-container">
                <div class="logo">${name}</div>
                <ul class="nav-links">
                    <li><a href="#about">About</a></li>
                    <li><a href="#skills">Skills</a></li>
                    <li><a href="#experience">Experience</a></li>
                    <li><a href="#projects">Projects</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
                <button class="theme-toggle" onclick="togglePortfolioTheme()">
                    <i class="fas ${metadata.theme === 'dark' ? 'fa-sun' : 'fa-moon'}"></i>
                </button>
            </nav>
        </header>

        <!-- Hero Section -->
        <section class="hero-section" id="home">
            <div class="hero-content">
                ${profilePhoto ? `
                <div class="hero-avatar">
                    <img src="${profilePhoto}" alt="${name}">
                </div>
                ` : `
                <div class="hero-avatar-placeholder">
                    <i class="fas fa-user"></i>
                </div>
                `}
                
                <h1 class="hero-title">${data.hero.headline}</h1>
                <p class="hero-subtitle">${data.hero.tagline}</p>
                <p class="hero-description">${data.hero.summary}</p>
                
                <div class="hero-badges">
                    <span class="hero-badge">${TEMPLATES[metadata.template].name} Template</span>
                    <span class="hero-badge">${metadata.theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                    <span class="hero-badge">${new Date().getFullYear()}</span>
                </div>
            </div>
        </section>

        <!-- About Section -->
        <section class="section" id="about">
            <div class="section-header">
                <h2 class="section-title">About Me</h2>
                <p class="section-subtitle">Learn more about my background, skills, and passion</p>
            </div>
            
            <div class="about-content">
                ${data.about.content.split('\n').map(para => `<p>${para}</p>`).join('')}
            </div>
            
            ${data.about.keyStrengths && data.about.keyStrengths.length > 0 ? `
            <div class="strengths-grid">
                ${data.about.keyStrengths.map((strength, index) => `
                <div class="strength-card">
                    <div class="strength-icon">
                        <i class="fas fa-${['star', 'bolt', 'rocket', 'gem', 'shield', 'trophy', 'crown'][index % 7]}"></i>
                    </div>
                    <h3 class="strength-title">${strength}</h3>
                </div>
                `).join('')}
            </div>
            ` : ''}
        </section>

        <!-- Skills Section -->
        <section class="section" id="skills">
            <div class="section-header">
                <h2 class="section-title">Skills & Expertise</h2>
                <p class="section-subtitle">Technical proficiencies and professional capabilities</p>
            </div>
            
            <div class="skills-container">
                ${data.skills.technical && data.skills.technical.length > 0 ? `
                <div class="skill-category">
                    <div class="category-header">
                        <div class="category-icon">
                            <i class="fas fa-code"></i>
                        </div>
                        <h3 class="category-title">Technical Skills</h3>
                    </div>
                    <div class="skills-grid">
                        ${data.skills.technical.map(skill => `
                        <span class="skill-item">${skill}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${data.skills.softSkills && data.skills.softSkills.length > 0 ? `
                <div class="skill-category">
                    <div class="category-header">
                        <div class="category-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <h3 class="category-title">Soft Skills</h3>
                    </div>
                    <div class="skills-grid">
                        ${data.skills.softSkills.map(skill => `
                        <span class="skill-item">${skill}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
                
                ${data.skills.tools && data.skills.tools.length > 0 ? `
                <div class="skill-category">
                    <div class="category-header">
                        <div class="category-icon">
                            <i class="fas fa-tools"></i>
                        </div>
                        <h3 class="category-title">Tools & Technologies</h3>
                    </div>
                    <div class="skills-grid">
                        ${data.skills.tools.map(tool => `
                        <span class="skill-item">${tool}</span>
                        `).join('')}
                    </div>
                </div>
                ` : ''}
            </div>
        </section>

        <!-- Experience Section -->
        ${data.experience && data.experience.length > 0 ? `
        <section class="section" id="experience">
            <div class="section-header">
                <h2 class="section-title">Professional Experience</h2>
                <p class="section-subtitle">Career journey and professional growth</p>
            </div>
            
            <div class="experience-timeline">
                ${data.experience.map(exp => `
                <div class="experience-item animate-in">
                    <div class="experience-header">
                        <h3 class="experience-title">${exp.title}</h3>
                        <div>
                            <span class="experience-company">${exp.company}</span>
                            <span class="experience-period">${exp.period}</span>
                        </div>
                    </div>
                    <p class="experience-description">${exp.description}</p>
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <!-- Projects Section -->
        ${data.projects && data.projects.length > 0 ? `
        <section class="section" id="projects">
            <div class="section-header">
                <h2 class="section-title">Projects</h2>
                <p class="section-subtitle">Selected work and accomplishments</p>
            </div>
            
            <div class="projects-grid">
                ${data.projects.map(project => `
                <div class="project-card animate-in">
                    <div class="project-header">
                        <h3 class="project-title">${project.name}</h3>
                        ${project.technologies && project.technologies.length > 0 ? `
                        <div class="project-tech">
                            ${project.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                        </div>
                        ` : ''}
                    </div>
                    <p class="project-description">${project.description}</p>
                    ${project.impact ? `
                    <div class="project-impact">
                        <strong>Impact:</strong> ${project.impact}
                    </div>
                    ` : ''}
                </div>
                `).join('')}
            </div>
        </section>
        ` : ''}

        <!-- Contact Section -->
        <section class="section" id="contact">
            <div class="section-header">
                <h2 class="section-title">Contact</h2>
                <p class="section-subtitle">Let's connect and create something amazing</p>
            </div>
            
            <div class="contact-container">
                <div class="contact-info">
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="contact-details">
                            <strong>Email</strong>
                            <a href="mailto:${email}">${email}</a>
                        </div>
                    </div>
                    
                    ${githubUsername ? `
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fab fa-github"></i>
                        </div>
                        <div class="contact-details">
                            <strong>GitHub</strong>
                            <a href="https://github.com/${githubUsername}" target="_blank">@${githubUsername}</a>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <div class="contact-cta">
                    <h3 class="cta-title">${data.contact.callToAction}</h3>
                    <p class="cta-description">${data.contact.emailText}</p>
                    <a href="mailto:${email}" class="cta-button">
                        <i class="fas fa-paper-plane"></i>
                        Send Message
                    </a>
                </div>
            </div>
        </section>

        <!-- Footer -->
        <footer class="portfolio-footer">
            <div class="footer-content">
                <div class="footer-info">
                    <i class="fas fa-palette"></i>
                    <span>${TEMPLATES[metadata.template].name} Template • ${metadata.theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
                </div>
                
                <div class="footer-links">
                    <a href="#home">Home</a>
                    <a href="#about">About</a>
                    <a href="#contact">Contact</a>
                </div>
                
                <div class="footer-info">
                    <i class="fas fa-calendar"></i>
                    <span>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
            </div>
        </footer>
    </div>

    <script>
        // Theme Toggle for Generated Portfolio
        function togglePortfolioTheme() {
            const html = document.documentElement;
            const currentTheme = html.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            html.setAttribute('data-theme', newTheme);
            
            // Update theme toggle icon
            const themeToggle = document.querySelector('.theme-toggle i');
            themeToggle.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            
            // Update CSS variables
            updateCSSVariables(newTheme);
        }
        
        function updateCSSVariables(theme) {
            const root = document.documentElement;
            const primary = getComputedStyle(root).getPropertyValue('--primary-color');
            const secondary = getComputedStyle(root).getPropertyValue('--secondary-color');
            
            if (theme === 'dark') {
                root.style.setProperty('--bg-primary', '#0f172a');
                root.style.setProperty('--bg-secondary', '#1e293b');
                root.style.setProperty('--text-primary', '#f8fafc');
                root.style.setProperty('--text-secondary', '#cbd5e1');
                root.style.setProperty('--border-color', '#334155');
                root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.3)');
            } else {
                root.style.setProperty('--bg-primary', '#ffffff');
                root.style.setProperty('--bg-secondary', '#f8fafc');
                root.style.setProperty('--text-primary', '#1e293b');
                root.style.setProperty('--text-secondary', '#64748b');
                root.style.setProperty('--border-color', '#e2e8f0');
                root.style.setProperty('--shadow-color', 'rgba(0, 0, 0, 0.1)');
            }
            
            // Keep original colors
            root.style.setProperty('--primary-color', primary);
            root.style.setProperty('--secondary-color', secondary);
        }
        
        // Smooth scrolling for navigation links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
        
        // Intersection Observer for animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-in');
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        document.querySelectorAll('.experience-item, .project-card').forEach(el => {
            observer.observe(el);
        });
        
        // Initialize theme
        updateCSSVariables('${metadata.theme}');
    </script>
</body>
</html>`;
}

// ===========================
// ENHANCEMENT FUNCTIONS
// ===========================

async function aiEnhance() {
  const name = document.getElementById('name').value.trim();
  const title = document.getElementById('title').value.trim();
  const about = document.getElementById('about').value.trim();
  const skills = document.getElementById('skills').value.trim();

  if (!name || !title) {
    showStatus('Please fill in Name and Title for enhancement', 'error');
    return;
  }

  showStatus('✨ Enhancing your content...', 'loading');
  
  // Simulate processing
  setTimeout(() => {
    const skillList = skills.split(',').map(s => s.trim()).filter(s => s);
    const enhancements = generateOfflineEnhancements(name, title, about, skillList);
    
    // Update form with enhancements
    if (enhancements.enhancedAbout) {
      document.getElementById('about').value = enhancements.enhancedAbout;
    }
    
    if (enhancements.skillSuggestions && Array.isArray(enhancements.skillSuggestions)) {
      const currentSkills = skillList;
      const allSkills = [...new Set([...currentSkills, ...enhancements.skillSuggestions])];
      document.getElementById('skills').value = allSkills.join(', ');
      updateSkillTags(allSkills);
    }
    
    if (enhancements.titleSuggestions && enhancements.titleSuggestions.length > 0) {
      showTitleSuggestions(enhancements.titleSuggestions);
    }
    
    if (enhancements.projectIdeas && enhancements.projectIdeas.length > 0) {
      addProjectIdeas(enhancements.projectIdeas);
    }
    
    // Store for portfolio generation
    aiSuggestions = enhancements;
    
    showStatus('✨ Enhancement complete! Check the suggestions.', 'success');
    
    // Show improvement tips
    if (enhancements.improvementTips && enhancements.improvementTips.length > 0) {
      setTimeout(() => {
        showStatus(`💡 ${enhancements.improvementTips[0]}`, 'info');
      }, 1000);
    }
  }, 1500);
}

function generateOfflineEnhancements(name, title, about, skills) {
  // Categorize skills
  const technicalKeywords = ['js', 'javascript', 'python', 'java', 'react', 'node', 'vue', 'angular', 'sql', 'aws', 'docker', 'git', 'html', 'css'];
  const hasTechSkills = skills.some(skill => 
    technicalKeywords.some(keyword => skill.toLowerCase().includes(keyword))
  );
  
  // Generate enhanced about section
  let enhancedAbout = about;
  if (!about || about.length < 50) {
    enhancedAbout = `${name} is a ${title} with expertise in ${skills.slice(0, 5).join(', ')}. Passionate about creating efficient solutions and delivering high-quality work. Strong advocate for best practices in software development and continuous learning. Committed to collaboration and innovation in every project.`;
  }
  
  // Generate suggestions based on title
  let skillSuggestions = [];
  if (title.toLowerCase().includes('frontend')) {
    skillSuggestions = ['TypeScript', 'React Hooks', 'CSS Grid', 'Webpack', 'Jest'];
  } else if (title.toLowerCase().includes('backend')) {
    skillSuggestions = ['Node.js', 'Express', 'MongoDB', 'Redis', 'Docker'];
  } else if (title.toLowerCase().includes('full')) {
    skillSuggestions = ['TypeScript', 'GraphQL', 'Docker', 'AWS', 'CI/CD'];
  } else {
    skillSuggestions = ['Git', 'Agile/Scrum', 'Problem Solving', 'Communication', 'Teamwork'];
  }
  
  // Add missing essential skills
  const essentialSkills = ['Git', 'Problem Solving', 'Communication'];
  essentialSkills.forEach(skill => {
    if (!skills.some(s => s.toLowerCase().includes(skill.toLowerCase()))) {
      skillSuggestions.push(skill);
    }
  });
  
  return {
    titleSuggestions: [
      title,
      `Senior ${title}`,
      `Lead ${title}`,
      `${title} Specialist`,
      `Technical ${title}`
    ],
    enhancedAbout: enhancedAbout,
    skillSuggestions: [...new Set(skillSuggestions)].slice(0, 7),
    projectIdeas: [
      `Build a ${title.toLowerCase()} portfolio project`,
      'Create a technical blog or documentation site',
      'Develop an open-source tool'
    ],
    professionalSummary: `${title} with expertise in ${skills.slice(0, 3).join(', ')}.`,
    improvementTips: [
      'Add specific achievements with metrics',
      'Include links to live projects or demos',
      'Showcase your problem-solving process',
      'Add testimonials or references'
    ]
  };
}

function showTitleSuggestions(suggestions) {
  const suggestionsHTML = suggestions.map((suggestion, index) => `
    <div class="title-suggestion" onclick="selectTitleSuggestion('${suggestion}')">
      <span class="suggestion-number">${index + 1}</span>
      <span class="suggestion-text">${suggestion}</span>
      <i class="fas fa-check"></i>
    </div>
  `).join('');
  
  const modalHTML = `
    <div class="enhancement-modal" id="title-suggestions-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3><i class="fas fa-lightbulb"></i> Title Suggestions</h3>
          <button class="modal-close" onclick="closeTitleSuggestions()">&times;</button>
        </div>
        <div class="modal-body">
          <p>Choose a professional title suggestion:</p>
          <div class="title-suggestions-list">
            ${suggestionsHTML}
          </div>
        </div>
      </div>
    </div>
  `;
  
  const existingModal = document.getElementById('title-suggestions-modal');
  if (existingModal) existingModal.remove();
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  setTimeout(() => {
    document.getElementById('title-suggestions-modal').classList.add('show');
  }, 100);
}

function selectTitleSuggestion(title) {
  document.getElementById('title').value = title;
  closeTitleSuggestions();
  showStatus(`Title updated to: ${title}`, 'success');
}

function closeTitleSuggestions() {
  const modal = document.getElementById('title-suggestions-modal');
  if (modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.remove(), 300);
  }
}

function addProjectIdeas(projectIdeas) {
  projectIdeas.forEach((idea, index) => {
    addProject();
    const projects = document.querySelectorAll('.project-item');
    const lastProject = projects[projects.length - 1];
    
    lastProject.querySelector('.project-name').value = `Suggested Project ${index + 1}`;
    lastProject.querySelector('.project-desc').value = idea;
  });
  
  showStatus(`${projectIdeas.length} project ideas added`, 'success');
}

function updateFormWithSuggestions(suggestions) {
  if (!suggestions) return;
  
  if (suggestions.titleSuggestions && suggestions.titleSuggestions.length > 0) {
    const currentTitle = document.getElementById('title').value;
    if (!currentTitle || currentTitle.length < 5) {
      document.getElementById('title').value = suggestions.titleSuggestions[0];
    }
  }
  
  if (suggestions.skillSuggestions && suggestions.skillSuggestions.length > 0) {
    const currentSkills = document.getElementById('skills').value;
    const currentSkillList = currentSkills.split(',').map(s => s.trim()).filter(s => s);
    const newSkills = [...new Set([...currentSkillList, ...suggestions.skillSuggestions])];
    document.getElementById('skills').value = newSkills.join(', ');
    updateSkillTags(newSkills);
  }
  
  if (suggestions.improvementTips && suggestions.improvementTips.length > 0) {
    setTimeout(() => {
      showStatus(`💡 Suggestion: ${suggestions.improvementTips[0]}`, 'info');
    }, 2000);
  }
}

// ===========================
// FORM MANAGEMENT FUNCTIONS
// ===========================

function initUploadAreas() {
  const photoUploadArea = document.getElementById('photo-upload-area');
  const photoInput = document.getElementById('profile-photo');
  const resumeUploadArea = document.getElementById('resume-upload-area');
  const resumeInput = document.getElementById('resume');

  if (photoUploadArea && photoInput) {
    photoUploadArea.addEventListener('click', () => photoInput.click());
    photoInput.addEventListener('change', handlePhotoUpload);
  }

  if (resumeUploadArea && resumeInput) {
    resumeUploadArea.addEventListener('click', () => resumeInput.click());
    resumeInput.addEventListener('change', handleResumeUpload);
  }
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!file.type.startsWith('image/')) {
    showStatus('Please upload an image file (JPG, PNG, GIF)', 'error');
    return;
  }

  if (file.size > 2 * 1024 * 1024) {
    showStatus('Image size should be less than 2MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    profilePhoto = e.target.result;
    const preview = document.getElementById('photo-preview');
    preview.innerHTML = `
      <div class="photo-preview-content">
        <img src="${profilePhoto}" alt="Profile Preview">
        <button class="remove-btn" onclick="removePhoto()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    showStatus('Profile photo uploaded successfully!', 'success');
  };
  reader.readAsDataURL(file);
}

function handleResumeUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
  const fileExtension = file.name.split('.').pop().toLowerCase();
  
  if (!allowedTypes.includes('.' + fileExtension)) {
    showStatus('Please upload a PDF, DOC, DOCX, or TXT file', 'error');
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    showStatus('File size should be less than 5MB', 'error');
    return;
  }

  const reader = new FileReader();
  reader.onload = function(e) {
    resumeData = {
      name: file.name,
      content: e.target.result,
      type: file.type,
      size: file.size
    };
    
    const resumeInfo = document.getElementById('resume-info');
    resumeInfo.innerHTML = `
      <div class="file-info">
        <i class="fas fa-file-alt"></i>
        <div>
          <strong>${file.name}</strong>
          <span>${(file.size / 1024).toFixed(1)} KB</span>
        </div>
        <button class="remove-btn" onclick="removeResume()">
          <i class="fas fa-times"></i>
        </button>
      </div>
    `;
    showStatus('Resume uploaded successfully!', 'success');
  };
  reader.readAsText(file);
}

function initSkillTags() {
  const skillsInput = document.getElementById('skills');
  if (!skillsInput) return;
  
  skillsInput.addEventListener('input', function() {
    const skills = this.value.split(',').map(s => s.trim()).filter(s => s);
    updateSkillTags(skills);
  });
}

function updateSkillTags(skills) {
  const skillsTags = document.getElementById('skill-tags');
  if (!skillsTags) return;
  
  skillsTags.innerHTML = skills.map(skill => `
    <span class="skill-tag">
      ${escapeHTML(skill)}
      <button type="button" class="remove-tag" onclick="removeSkill('${escapeHTML(skill)}')">&times;</button>
    </span>
  `).join('');
}

function removeSkill(skillToRemove) {
  const skillsInput = document.getElementById('skills');
  const skills = skillsInput.value.split(',').map(s => s.trim()).filter(s => s && s !== skillToRemove);
  skillsInput.value = skills.join(', ');
  updateSkillTags(skills);
}

function addProject() {
  const container = document.getElementById('projects-container');
  if (!container) return;
  
  const projectCount = container.children.length + 1;
  
  const projectDiv = document.createElement('div');
  projectDiv.className = 'project-item';
  projectDiv.innerHTML = `
    <div class="form-group">
      <label>Project ${projectCount} Name</label>
      <input type="text" class="project-name" placeholder="Project ${projectCount}">
    </div>
    <div class="form-group">
      <label>Project Description</label>
      <textarea class="project-desc" rows="3" placeholder="Describe your project..."></textarea>
    </div>
    <button type="button" class="btn-remove" onclick="removeProject(this)">
      <i class="fas fa-trash"></i> Remove
    </button>
  `;
  
  container.appendChild(projectDiv);
}

function removeProject(button) {
  const container = document.getElementById('projects-container');
  if (!container) return;
  
  if (container.children.length > 1) {
    button.closest('.project-item').remove();
    const projects = container.querySelectorAll('.project-item');
    projects.forEach((project, index) => {
      const label = project.querySelector('label');
      if (label) {
        label.textContent = `Project ${index + 1} Name`;
      }
    });
  }
}

async function fetchGitHubProjects() {
  const username = document.getElementById('github-username').value.trim();
  if (!username) {
    showStatus('Please enter a GitHub username', 'error');
    return;
  }

  showStatus('Fetching GitHub projects...', 'loading');
  
  try {
    const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=6`);
    
    if (!response.ok) {
      throw new Error('GitHub user not found or rate limit exceeded');
    }
    
    const repos = await response.json();
    githubProjects = repos;
    
    const projectsContainer = document.getElementById('github-projects');
    if (projectsContainer) {
      projectsContainer.innerHTML = `
        <h4>GitHub Projects (${repos.length})</h4>
        <div class="github-projects-list">
          ${repos.map(repo => `
            <div class="github-project">
              <div class="project-header">
                <i class="fab fa-github"></i>
                <strong>${escapeHTML(repo.name)}</strong>
                <span class="project-stars">
                  <i class="fas fa-star"></i> ${repo.stargazers_count}
                </span>
              </div>
              <p>${escapeHTML(repo.description || 'No description')}</p>
              <div class="project-footer">
                <span class="project-language">${repo.language || 'N/A'}</span>
                <button class="btn-add" onclick="addGitHubProject('${escapeHTML(repo.name)}', '${escapeHTML(repo.description || '')}')">
                  <i class="fas fa-plus"></i> Add
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }
    
    showStatus(`Found ${repos.length} GitHub repositories`, 'success');
  } catch (error) {
    showStatus('Error fetching GitHub projects: ' + error.message, 'error');
  }
}

function addGitHubProject(name, description) {
  addProject();
  
  const projects = document.querySelectorAll('.project-item');
  const lastProject = projects[projects.length - 1];
  
  lastProject.querySelector('.project-name').value = name;
  lastProject.querySelector('.project-desc').value = description || '';
  
  showStatus('Project added from GitHub', 'success');
}

// ===========================
// EXPORT & DOWNLOAD FUNCTIONS
// ===========================

function exportPortfolio() {
  if (!currentPortfolioHTML) {
    showStatus('Please generate a portfolio first', 'error');
    return;
  }

  const name = document.getElementById('name').value.trim() || 'portfolio';
  downloadFile(currentPortfolioHTML, `${name.replace(/\s+/g, '_')}_portfolio.html`, 'text/html');
  showStatus('✨ Portfolio exported successfully!', 'success');
}

function downloadPortfolio() {
  exportPortfolio();
}

async function copyHTML() {
  if (!currentPortfolioHTML) {
    showStatus('Please generate a portfolio first', 'error');
    return;
  }

  const name = document.getElementById('name').value.trim() || 'portfolio';
  try {
    await navigator.clipboard.writeText(currentPortfolioHTML);
    showStatus('✨ Portfolio HTML copied to clipboard!', 'success');
  } catch (err) {
    console.error('Copy failed:', err);
    showStatus('Failed to copy to clipboard. Please try again.', 'error');
  }
}

function deployToGitHub() {
  if (!currentPortfolioHTML) {
    showStatus('Please generate a portfolio first', 'error');
    return;
  }

  showStatus('🚀 Preparing portfolio for deployment...', 'loading');
  
  setTimeout(() => {
    showStatus('✨ Portfolio ready for GitHub Pages deployment!', 'success');
  }, 2000);
}

// ===========================
// CLEAR & RESET FUNCTIONS
// ===========================

function clearForm() {
  document.getElementById('portfolio-form').reset();
  document.getElementById('photo-preview').innerHTML = '';
  document.getElementById('resume-info').innerHTML = '';
  document.getElementById('skill-tags').innerHTML = '';
  document.getElementById('github-projects').innerHTML = '';
  
  // Clear projects except first one
  const projectsContainer = document.getElementById('projects-container');
  if (projectsContainer) {
    const firstProject = projectsContainer.querySelector('.project-item');
    projectsContainer.innerHTML = '';
    if (firstProject) {
      projectsContainer.appendChild(firstProject);
      firstProject.querySelector('.project-name').value = '';
      firstProject.querySelector('.project-desc').value = '';
    }
  }
  
  // Reset global variables
  profilePhoto = null;
  resumeData = null;
  githubProjects = [];
  currentPortfolioHTML = '';
  currentPortfolioData = null;
  aiSuggestions = null;
  
  // Clear preview
  document.getElementById('portfolio-preview').innerHTML = `
    <div class="preview-placeholder">
      <i class="fas fa-palette"></i>
      <h3>Portfolio Preview</h3>
      <p>Fill the form and click "Generate Portfolio" to see your professional portfolio</p>
      <p class="template-info">Current Template: ${TEMPLATES[selectedTemplate].name} • Theme: ${selectedTheme}</p>
    </div>
  `;
  
  showStatus('Form cleared! Ready for new portfolio.', 'success');
}

function removePhoto() {
  profilePhoto = null;
  document.getElementById('photo-preview').innerHTML = '';
  document.getElementById('profile-photo').value = '';
  showStatus('Profile photo removed', 'info');
}

function removeResume() {
  resumeData = null;
  document.getElementById('resume-info').innerHTML = '';
  document.getElementById('resume').value = '';
  showStatus('Resume removed', 'info');
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function escapeHTML(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ===========================
// UI & AUTH FUNCTIONS
// ===========================

function updateUserUI() {
  const authBtn = document.getElementById('auth-btn');
  const userInfo = document.getElementById('user-info');

  if (currentUser) {
    authBtn.innerHTML = `<i class="fas fa-sign-out-alt"></i> Sign Out`;
    authBtn.onclick = signOut;
    
    if (userInfo) {
      userInfo.style.display = 'flex';
      document.getElementById('user-avatar').src = currentUser.photoURL || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(currentUser.displayName || currentUser.email);
      document.getElementById('user-name').textContent = currentUser.displayName || currentUser.email;
    }
  } else {
    authBtn.innerHTML = `<i class="fas fa-user"></i> Sign In`;
    authBtn.onclick = toggleAuthModal;
    
    if (userInfo) userInfo.style.display = 'none';
  }
}

function toggleAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.toggle('show');
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.remove('show');
  }
}

function signOut() {
  auth.signOut()
    .then(() => {
      currentUser = null;
      updateUserUI();
      showStatus('Successfully signed out', 'success');
    })
    .catch(error => {
      showStatus('Sign out failed: ' + error.message, 'error');
    });
}

function signInWithGitHub() {
  const provider = new firebase.auth.GithubAuthProvider();
  provider.addScope('repo');
  
  auth.signInWithPopup(provider)
    .then((result) => {
      currentUser = result.user;
      updateUserUI();
      closeAuthModal();
      showStatus('Successfully signed in with GitHub!', 'success');
    })
    .catch((error) => {
      showStatus('GitHub sign in failed: ' + error.message, 'error');
    });
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status-message');
  if (!statusDiv) {
    console.log('Status:', message);
    return;
  }
  
  statusDiv.className = `status-message ${type} show`;
  
  const iconClass = {
    'success': 'check-circle',
    'error': 'exclamation-circle',
    'loading': 'spinner fa-spin',
    'info': 'info-circle',
    'warning': 'exclamation-triangle'
  }[type] || 'info-circle';
  
  statusDiv.innerHTML = `
    <i class="fas fa-${iconClass}"></i>
    <span>${message}</span>
  `;
  
  if (type !== 'loading') {
    setTimeout(() => {
      statusDiv.className = 'status-message';
    }, 5000);
  }
}

// ===========================
// EXAMPLE DATA
// ===========================

function loadExampleData() {
  document.getElementById('name').value = 'Alex Johnson';
  document.getElementById('email').value = 'alex.johnson@example.com';
  document.getElementById('title').value = 'Senior Full Stack Developer';
  document.getElementById('about').value = 'Passionate developer with 8+ years of experience building scalable web applications. Specialized in React, Node.js, and cloud technologies. Strong advocate for clean code and best practices.';
  document.getElementById('skills').value = 'JavaScript, React, Node.js, Python, AWS, Docker, MongoDB, PostgreSQL, TypeScript, GraphQL';
  document.getElementById('github-username').value = 'alexjohnson';
  
  // Update skill tags
  updateSkillTags(['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker', 'MongoDB', 'PostgreSQL', 'TypeScript', 'GraphQL']);
  
  // Clear existing projects and add example ones
  const projectsContainer = document.getElementById('projects-container');
  if (projectsContainer) {
    projectsContainer.innerHTML = '';
    
    const exampleProjects = [
      {
        name: 'E-commerce Platform',
        description: 'Built a full-stack e-commerce platform with React frontend, Node.js backend, and MongoDB database.'
      },
      {
        name: 'Task Management App',
        description: 'Developed a collaborative task management application with real-time updates using Socket.io.'
      }
    ];
    
    exampleProjects.forEach((project, index) => {
      const projectDiv = document.createElement('div');
      projectDiv.className = 'project-item';
      projectDiv.innerHTML = `
        <div class="form-group">
          <label>Project ${index + 1} Name</label>
          <input type="text" class="project-name" value="${escapeHTML(project.name)}">
        </div>
        <div class="form-group">
          <label>Project Description</label>
          <textarea class="project-desc" rows="3">${escapeHTML(project.description)}</textarea>
        </div>
        ${index > 0 ? `<button type="button" class="btn-remove" onclick="removeProject(this)">
          <i class="fas fa-trash"></i> Remove
        </button>` : ''}
      `;
      projectsContainer.appendChild(projectDiv);
    });
  }
  
  showStatus('Example data loaded! Ready for portfolio generation! ✨', 'success');
}

// ===========================
// STYLES FOR GENERATOR UI
// ===========================

// Add these styles to your main stylesheet
const generatorStyles = `
:root {
  --primary-color: #6366f1;
  --secondary-color: #8b5cf6;
  --accent-color: #10b981;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --border-color: #e2e8f0;
  --shadow-color: rgba(0, 0, 0, 0.1);
}

[data-theme="dark"] {
  --bg-primary: #0f172a;
  --bg-secondary: #1e293b;
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --border-color: #334155;
  --shadow-color: rgba(0, 0, 0, 0.3);
}

/* Theme Toggle */
.theme-toggle-btn {
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.theme-toggle-btn:hover {
  transform: rotate(15deg);
  border-color: var(--primary-color);
}

/* Template Selector */
.template-selector {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  margin: 1rem 0;
}

.template-card {
  flex: 1;
  min-width: 200px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-2px);
  border-color: var(--primary-color);
  box-shadow: 0 10px 25px var(--shadow-color);
}

.template-card.active {
  border-color: var(--primary-color);
  background: linear-gradient(135deg, rgba(var(--primary-color-rgb), 0.1), transparent);
}

.template-colors {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border-color);
}

/* Form Elements */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-primary);
  font-weight: 500;
}

.form-control {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  color: var(--text-primary);
  transition: all 0.3s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(var(--primary-color-rgb), 0.1);
}

/* Skill Tags */
.skill-tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.skill-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.remove-tag {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  font-size: 1.2rem;
}

.remove-tag:hover {
  color: #ef4444;
}

/* File Upload */
.upload-area {
  border: 2px dashed var(--border-color);
  border-radius: 12px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.upload-area:hover {
  border-color: var(--primary-color);
  background: var(--bg-secondary);
}

.file-preview {
  margin-top: 1rem;
}

.preview-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.remove-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
}

.remove-btn:hover {
  color: #ef4444;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(var(--primary-color-rgb), 0.2);
}

.btn-remove {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-remove:hover {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

/* Status Messages */
.status-message {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  box-shadow: 0 10px 25px var(--shadow-color);
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
  z-index: 1000;
}

.status-message.show {
  opacity: 1;
  transform: translateY(0);
}

.status-message.success {
  border-left: 4px solid #10b981;
}

.status-message.error {
  border-left: 4px solid #ef4444;
}

.status-message.loading {
  border-left: 4px solid #f59e0b;
}

.status-message.info {
  border-left: 4px solid #3b82f6;
}

/* Preview Container */
.preview-container {
  background: var(--bg-primary);
  border-radius: 16px;
  border: 1px solid var(--border-color);
  overflow: hidden;
  box-shadow: 0 20px 40px var(--shadow-color);
}

.preview-placeholder {
  padding: 4rem 2rem;
  text-align: center;
  color: var(--text-secondary);
}

.preview-placeholder i {
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: var(--primary-color);
}

.preview-placeholder h3 {
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.template-info {
  margin-top: 1rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 0.9rem;
}

/* Responsive */
@media (max-width: 768px) {
  .template-card {
    min-width: 100%;
  }
  
  .nav-links {
    flex-wrap: wrap;
    gap: 1rem;
  }
}
`;

// Add styles to document
const styleElement = document.createElement('style');
styleElement.textContent = generatorStyles;
document.head.appendChild(styleElement);