// Google Fonts download URLs for popular fonts
// These are direct TTF download links that work without API key

export const GOOGLE_FONTS_TTF_URLS: Record<string, string> = {
    // Sans-serif fonts
    'Roboto': 'https://github.com/google/fonts/raw/main/apache/roboto/static/Roboto-Regular.ttf',
    'Open Sans': 'https://github.com/google/fonts/raw/main/ofl/opensans/static/OpenSans-Regular.ttf',
    'Lato': 'https://github.com/google/fonts/raw/main/ofl/lato/Lato-Regular.ttf',
    'Montserrat': 'https://github.com/google/fonts/raw/main/ofl/montserrat/static/Montserrat-Regular.ttf',
    'Poppins': 'https://github.com/google/fonts/raw/main/ofl/poppins/Poppins-Regular.ttf',
    'Raleway': 'https://github.com/google/fonts/raw/main/ofl/raleway/static/Raleway-Regular.ttf',
    'Nunito': 'https://github.com/google/fonts/raw/main/ofl/nunito/static/Nunito-Regular.ttf',
    'Ubuntu': 'https://github.com/google/fonts/raw/main/ufl/ubuntu/Ubuntu-Regular.ttf',
    'Oswald': 'https://github.com/google/fonts/raw/main/ofl/oswald/static/Oswald-Regular.ttf',
    'Quicksand': 'https://github.com/google/fonts/raw/main/ofl/quicksand/static/Quicksand-Regular.ttf',
    'Comfortaa': 'https://github.com/google/fonts/raw/main/ofl/comfortaa/static/Comfortaa-Regular.ttf',
    
    // Serif fonts
    'Playfair Display': 'https://github.com/google/fonts/raw/main/ofl/playfairdisplay/static/PlayfairDisplay-Regular.ttf',
    'Merriweather': 'https://github.com/google/fonts/raw/main/ofl/merriweather/Merriweather-Regular.ttf',
    'Lora': 'https://github.com/google/fonts/raw/main/ofl/lora/static/Lora-Regular.ttf',
    
    // Display fonts
    'Bebas Neue': 'https://github.com/google/fonts/raw/main/ofl/bebasneue/BebasNeue-Regular.ttf',
    'Abril Fatface': 'https://github.com/google/fonts/raw/main/ofl/abrilfatface/AbrilFatface-Regular.ttf',
    
    // Script fonts
    'Dancing Script': 'https://github.com/google/fonts/raw/main/ofl/dancingscript/static/DancingScript-Regular.ttf',
    'Pacifico': 'https://github.com/google/fonts/raw/main/ofl/pacifico/Pacifico-Regular.ttf',
    'Satisfy': 'https://github.com/google/fonts/raw/main/ofl/satisfy/Satisfy-Regular.ttf',
    
    // Handwriting fonts
    'Indie Flower': 'https://github.com/google/fonts/raw/main/ofl/indieflower/IndieFlower-Regular.ttf',
    'Amatic SC': 'https://github.com/google/fonts/raw/main/ofl/amaticsc/AmaticSC-Regular.ttf',
    'Permanent Marker': 'https://github.com/google/fonts/raw/main/apache/permanentmarker/PermanentMarker-Regular.ttf',
    'Shadows Into Light': 'https://github.com/google/fonts/raw/main/ofl/shadowsintolight/ShadowsIntoLight-Regular.ttf',
    
    // Monospace fonts
    'Roboto Mono': 'https://github.com/google/fonts/raw/main/apache/robotomono/static/RobotoMono-Regular.ttf',
    'Source Code Pro': 'https://github.com/adobe-fonts/source-code-pro/raw/release/TTF/SourceCodePro-Regular.ttf',
    'Fira Code': 'https://github.com/tonsky/FiraCode/raw/master/distr/ttf/FiraCode-Regular.ttf'
};

/**
 * Get TTF URL for a Google Font
 */
export function getGoogleFontTTFUrl(fontName: string): string | null {
    return GOOGLE_FONTS_TTF_URLS[fontName] || null;
}