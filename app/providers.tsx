'use client';

import { Provider } from 'react-redux';
import { store } from './store';
import { ThemeProvider } from "next-themes"
import { ExportProvider } from './contexts/ExportContext';
import { FontPreloader } from './components/FontPreloader';
import { FontPreviewPreloader } from './components/editor/PropertiesSection/FontPreviewCanvas';

export function Providers({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
        >
            <ExportProvider>
                <FontPreloader />
                <FontPreviewPreloader />
                {children}
            </ExportProvider>
        </ThemeProvider>
    </Provider>;
} 