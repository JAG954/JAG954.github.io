import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './App.css'
import './styles/optimizationWorkbench.css'
import './styles/modelProblems.css'
import ModelProblemSection from './components/ModelProblemSection.jsx'
import OptimizationWorkbench from './components/OptimizationWorkbench.jsx'
import ArchitectureSection from './components/ArchitectureSection.jsx'
import LimitationsSection from './components/LimitationsSection.jsx'

function SiteHeader() {
  return (
    <>
      <a className="visually-hidden-focusable skip-link" href="#optimization-main">
        Skip to main content
      </a>

      <header className="site-header sticky-top">
        <nav className="navbar navbar-expand-lg bg-white border-bottom" aria-label="Primary navigation">
          <div className="container">
            <a className="navbar-brand fw-semibold" href="/">
              Jishnu Ghosh
            </a>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#siteNavigation"
              aria-controls="siteNavigation"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon"></span>
            </button>

            <div className="collapse navbar-collapse" id="siteNavigation">
              <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                <li className="nav-item"><a className="nav-link" href="/#about">About</a></li>
                <li className="nav-item"><a className="nav-link" href="/#projects">Projects</a></li>
                <li className="nav-item"><a className="nav-link active" href="/optimization/">LP Workbench</a></li>
                <li className="nav-item"><a className="nav-link" href="/#skills">Skills</a></li>
                <li className="nav-item"><a className="nav-link" href="/#experience">Experience</a></li>
                <li className="nav-item"><a className="nav-link" href="/#resume">Resume</a></li>
                <li className="nav-item"><a className="nav-link" href="/#contact">Contact</a></li>
              </ul>
            </div>
          </div>
        </nav>
      </header>
    </>
  )
}

function SiteFooter() {
  return (
    <footer className="py-4 border-top">
      <div className="container">
        <div className="d-flex flex-column flex-md-row justify-content-between gap-2">
          <p className="mb-0">&copy; 2026 Jishnu Auro Ghosh.</p>
          <p className="mb-0">Industrial Engineering &middot; Operations Research &middot; Production Systems</p>
        </div>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <SiteHeader />

      <main id="optimization-main">
        <OptimizationWorkbench />
        <ModelProblemSection />
        <ArchitectureSection />
        <LimitationsSection />
      </main>

      <SiteFooter />
    </>
  )
}
