import { describe, it, expect } from 'vitest';

import { HomePage } from './HomePage';

import { render, screen } from '@/shared/test/utils';

describe('HomePage', () => {
    it('renders heading', () => {
        render(<HomePage />);
        expect(screen.getByRole('heading', { name: /csr boilerplate/i })).toBeInTheDocument();
    });
});
