import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { LanguageSwitcher } from '../app/components/LanguageSwitcher'
import { useLanguage } from '../app/contexts/LanguageContext'

// Mock the context
vi.mock('../app/contexts/LanguageContext', () => ({
    useLanguage: vi.fn(),
}))

describe('LanguageSwitcher', () => {
    it('renders correctly and switches language', () => {
        const setLanguage = vi.fn()
        vi.mocked(useLanguage).mockReturnValue({
            language: 'en',
            setLanguage,
            t: (key: string) => key,
        } as any)

        render(<LanguageSwitcher />)

        const enButton = screen.getByText('EN')
        const esButton = screen.getByText('ES')

        expect(enButton).toBeInTheDocument()
        expect(esButton).toBeInTheDocument()

        // Test switching
        fireEvent.click(esButton)
        expect(setLanguage).toHaveBeenCalledWith('es')
    })
})
