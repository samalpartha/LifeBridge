import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next/Router or other globals if needed
vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
    }),
    useSearchParams: () => new URLSearchParams(),
    usePathname: () => '',
}))
