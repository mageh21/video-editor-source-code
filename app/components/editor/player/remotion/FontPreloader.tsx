import { useEffect } from 'react';
import { continueRender, delayRender } from 'remotion';
import { useAppSelector } from '@/app/store';
import { loadRemotionFonts, extractFontsFromTextElements } from '@/app/utils/remotion-font-loader';

export const FontPreloader: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const textElements = useAppSelector(state => state.projectState.textElements);
  
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handle = delayRender();
    
    // Extract unique fonts from text elements
    const fonts = extractFontsFromTextElements(textElements);
    
    // Load all fonts
    const fontConfigs = fonts.map(family => ({ family }));
    
    loadRemotionFonts(fontConfigs)
      .then(() => {
        console.log('All fonts loaded successfully');
        continueRender(handle);
      })
      .catch((error) => {
        console.error('Error loading fonts:', error);
        continueRender(handle); // Continue even if fonts fail
      });
  }, [textElements]);
  
  return <>{children}</>;
};