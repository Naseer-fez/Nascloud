import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Cloud, 
  Download, 
  Shield, 
  HardDrive, 
  Share2, 
  Trash2, 
  ArrowRight, 
  Server, 
  Laptop, 
  CheckCircle,
  FileText,
  Lock,
  Layers,
  Database
} from 'lucide-react';
import { DOWNLOAD_ZIP_URL, GITHUB_URL } from '../../config';
import styles from './Home.module.css';

// Mockup image imports
import fileBrowserPreview from '../../assets/file_browser_preview.png';
import setupWizardPreview from '../../assets/setup_wizard_preview.png';

export default function Home() {
  const handleScroll = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDownloadAll = (e) => {
    e.preventDefault();
    
    // Download Setup & Server ZIP archive
    const zipLink = document.createElement('a');
    zipLink.href = DOWNLOAD_ZIP_URL;
    zipLink.download = 'NasCloud.zip';
    document.body.appendChild(zipLink);
    zipLink.click();
    document.body.removeChild(zipLink);
  };

  return (
    <div className={styles.homeContainer}>
      {/* Navbar */}
      <nav className={styles.navbar}>
        <div className={styles.navBrand}>
          <Cloud className={styles.brandIcon} size={28} />
          <span className={styles.brandName}>NasCloud</span>
        </div>
        <div className={styles.navLinks}>
          <button onClick={() => handleScroll('features')} className={styles.navLinkBtn}>
            Features
          </button>
          <button onClick={() => handleScroll('how-it-works')} className={styles.navLinkBtn}>
            How It Works
          </button>
          <button onClick={() => handleScroll('preview')} className={styles.navLinkBtn}>
            Preview
          </button>
        </div>
        <div className={styles.navActions}>
          <Link to="/login" className={styles.loginBtn}>
            Sign In
          </Link>
          <button 
            onClick={handleDownloadAll}
            className={styles.downloadNavBtn}
          >
            <Download size={16} />
            <span>Download</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <header className={styles.heroSection}>
        <div className={styles.heroGlow1}></div>
        <div className={styles.heroGlow2}></div>
        
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <span className={styles.badgeText}>✨ Standalone Self-Hosted Solution</span>
          </div>
          <h1 className={styles.heroTitle}>
            <span className={styles.gradientText}>NasCloud</span>
          </h1>
          <p className={styles.heroTagline}>
            Your personal cloud. No third parties. No limits.
          </p>
          <p className={styles.heroDesc}>
            Take absolute control of your data. Host your own high-performance cloud storage server on Windows in minutes. Sync files, share access, and manage everything with zero external dependencies.
          </p>
          
          <div className={styles.heroActions}>
            <button 
              onClick={handleDownloadAll}
              className={styles.primaryDownloadBtn}
            >
              <Download size={20} />
              <span>Download NasCloud</span>
            </button>
            <a 
              href={GITHUB_URL} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.secondaryGithubBtn}
            >
              <span>View Source on GitHub</span>
              <ArrowRight size={16} />
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built for Complete Data Autonomy</h2>
          <p className={styles.sectionSub}>Why run your personal storage backend with NasCloud?</p>
        </div>

        <div className={styles.featuresGrid}>
          {/* Card 1: Easy Setup */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Server className={styles.featureIcon} size={24} />
            </div>
            <h3>One-Click Wizard Setup</h3>
            <p>
              Forget complex command-line scripts or environments. Our dedicated Setup Wizard configures your directories, automatically manages Python dependencies, sets up Ngrok tunnels, and links your local workspaces in just 3 clicks.
            </p>
          </div>

          {/* Card 2: Self-Hosting */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Shield className={styles.featureIcon} size={24} />
            </div>
            <h3>True Self-Hosting Privacy</h3>
            <p>
              Your data never leaves your hardware. We do not store, access, or proxy your files through our servers. Everything is stored directly in your designated folders, with JWT access authentication guarding your private API.
            </p>
          </div>

          {/* Card 3: Chunked Transfers */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Layers className={styles.featureIcon} size={24} />
            </div>
            <h3>Smart Chunked File Transfers</h3>
            <p>
              Upload and download large media assets smoothly. NasCloud segments files into streams of chunks, preventing backend memory spikes and assuring reliable, interrupted resume-capable transfers for files of any size.
            </p>
          </div>

          {/* Card 4: Directory Management */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <HardDrive className={styles.featureIcon} size={24} />
            </div>
            <h3>Nested Directory Serialization</h3>
            <p>
              Instantly view your file system structure. We build and cache optimized JSON representations of nested subdirectories, allowing you to search, drag-and-drop, rename, and organize assets with near-zero latency.
            </p>
          </div>

          {/* Card 5: Secure Sharing */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Share2 className={styles.featureIcon} size={24} />
            </div>
            <h3>Secure Public Sharing</h3>
            <p>
              Generate instant temporary shareable URLs for files and folders. Customize duration, control public download availability, and allow external users to retrieve items directly without needing account authentication.
            </p>
          </div>

          {/* Card 6: Trash System */}
          <div className={styles.featureCard}>
            <div className={styles.featureIconWrapper}>
              <Trash2 className={styles.featureIcon} size={24} />
            </div>
            <h3>Soft-Delete Trash Bin</h3>
            <p>
              Protect against accidents. Deleted assets are safely relocated to a system-wide trash bin with easy restore capabilities before they are permanently purged from your local hard disk space.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className={`${styles.sectionContainer} ${styles.altBg}`}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Get Started In 3 Easy Steps</h2>
          <p className={styles.sectionSub}>Hosting your own personal drive service is simpler than you think</p>
        </div>

        <div className={styles.stepsFlow}>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>1</div>
            <h3>Download Installer</h3>
            <p>Grab the executable installer bundle from our GitHub repository releases.</p>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>2</div>
            <h3>Run Wizard Setup</h3>
            <p>Run the setup wizard to pick your drive path, configure security keys, and auto-initialize the database.</p>
          </div>
          <div className={styles.stepConnector}></div>
          <div className={styles.stepItem}>
            <div className={styles.stepNumber}>3</div>
            <h3>Access Web Drive</h3>
            <p>Start the server manager, open your local URL, log in with your admin account, and start uploading files!</p>
          </div>
        </div>
      </section>

      {/* Preview Section */}
      <section id="preview" className={styles.sectionContainer}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Experience The Interface</h2>
          <p className={styles.sectionSub}>A preview of our lightweight setup utility and high-fidelity file browser</p>
        </div>

        <div className={styles.previewsContainer}>
          <div className={styles.previewItem}>
            <div className={styles.previewImageWrapper}>
              <img 
                src={setupWizardPreview} 
                alt="NasCloud Setup Wizard Interface" 
                className={styles.previewImage}
              />
            </div>
            <div className={styles.previewMeta}>
              <Laptop size={18} className={styles.previewIcon} />
              <h4>Step-by-Step Desktop Installer</h4>
            </div>
            <p>The GUI Setup Wizard configures Ngrok, validates dependencies, and initializes the configuration without manual file editing.</p>
          </div>

          <div className={styles.previewItem}>
            <div className={styles.previewImageWrapper}>
              <img 
                src={fileBrowserPreview} 
                alt="NasCloud File Browser Interface" 
                className={styles.previewImage}
              />
            </div>
            <div className={styles.previewMeta}>
              <Cloud size={18} className={styles.previewIcon} />
              <h4>Fluid File Storage Web UI</h4>
            </div>
            <p>The sleek, glassmorphic client interface features instant search, visual folder structures, drag uploads, and detailed storage breakdown.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerTop}>
          <div className={styles.footerBrand}>
            <Cloud className={styles.brandIcon} size={24} />
            <span className={styles.brandName}>NasCloud</span>
          </div>
          <div className={styles.footerLinks}>
            <button onClick={() => handleScroll('features')} className={styles.footerLink}>Features</button>
            <button onClick={() => handleScroll('how-it-works')} className={styles.footerLink}>How It Works</button>
            <button onClick={() => handleScroll('preview')} className={styles.footerLink}>Preview</button>
            <button onClick={handleDownloadAll} className={styles.footerLink}>Download</button>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className={styles.footerLink}>GitHub</a>
            <Link to="/login" className={styles.footerLink}>Sign In</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <p>© 2026 Shaik Naseer John Ahmed. Released under the MIT License.</p>
          <p className={styles.footerCredit}>Made with ♥ for absolute privacy and file control.</p>
        </div>
      </footer>
    </div>
  );
}
