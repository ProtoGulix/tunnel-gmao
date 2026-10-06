import { Component } from 'react'

/**
 * ErrorBoundary — capture les erreurs de rendu React enfants.
 * Wrapper les routes principales pour éviter un écran blanc total.
 *
 * Usage :
 *   <ErrorBoundary>
 *     <MonComposant />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full px-6 text-center bg-[#F4F6F8]">
          <div className="w-12 h-12 rounded-full bg-[#C62828]/10 flex items-center justify-center mb-4">
            <span className="text-[#C62828] text-xl font-bold">!</span>
          </div>
          <p className="text-sm font-semibold text-[#2E2E2E] mb-1">Une erreur est survenue</p>
          <p className="text-xs text-[#616161] mb-6">
            {this.state.error?.message ?? 'Erreur inattendue'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 rounded border border-[#1F3A5F]/30 text-xs font-medium text-[#1F3A5F] active:bg-[#1F3A5F]/10"
          >
            Réessayer
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
