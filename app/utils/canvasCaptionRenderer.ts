import { Caption, CaptionStyle, WordToken, WordEffect } from '../types';
import { HIGHLIGHT_STYLES } from '@/config/themes';

// Generate word tokens with estimated timing if not provided
export function generateWordTokens(caption: Caption): WordToken[] {
    const words = caption.text.split(' ');
    const startTime = (caption as any).start ?? caption.startMs / 1000;
    const endTime = (caption as any).end ?? caption.endMs / 1000;
    const captionDuration = endTime - startTime;
    const wordsPerSecond = 2.5; // Configurable speaking rate
    const wordDuration = Math.min(captionDuration / words.length, 1 / wordsPerSecond);

    return words.map((word, index) => ({
        text: word,
        start: startTime + (index * wordDuration),
        end: startTime + ((index + 1) * wordDuration)
    }));
}

// Wrap text for canvas with word-aware breaking
export function wrapTextForCanvas(
    ctx: CanvasRenderingContext2D, 
    words: string[], 
    maxWidth: number
): { lines: string[][], lineIndices: number[][] } {
    const lines: string[][] = [];
    const lineIndices: number[][] = [];
    let currentLine: string[] = [];
    let currentIndices: number[] = [];
    let currentLineText = '';

    words.forEach((word, index) => {
        const testLine = currentLineText ? `${currentLineText} ${word}` : word;
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            lineIndices.push(currentIndices);
            currentLine = [word];
            currentIndices = [index];
            currentLineText = word;
        } else {
            currentLine.push(word);
            currentIndices.push(index);
            currentLineText = testLine;
        }
    });
    
    if (currentLine.length > 0) {
        lines.push(currentLine);
        lineIndices.push(currentIndices);
    }
    
    return { lines, lineIndices };
}

// Calculate animation progress with easing
export function calculateAnimationProgress(
    currentTime: number,
    startTime: number,
    duration: number
): number {
    const progress = Math.max(0, Math.min(1, (currentTime - startTime) / duration));
    // Ease-out cubic
    return 1 - Math.pow(1 - progress, 3);
}

// Apply word effects to canvas context
export function applyWordEffect(
    ctx: CanvasRenderingContext2D,
    effect: WordEffect,
    currentTime: number,
    isActive: boolean
) {
    ctx.save();
    
    switch (effect.type) {
        case 'color':
            if (effect.config.color) {
                ctx.fillStyle = effect.config.color;
            }
            break;
            
        case 'shake':
            const intensity = (effect.config.intensity || 50) / 100;
            const shakeAmount = intensity * 2;
            const shakeX = (Math.random() - 0.5) * shakeAmount * 2;
            const shakeY = (Math.random() - 0.5) * shakeAmount * 2;
            ctx.translate(shakeX, shakeY);
            break;
            
        case 'glow':
            const glowIntensity = (effect.config.intensity || 50) / 100;
            const glowColor = effect.config.color || '#FFD700';
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 10 * glowIntensity;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            break;
            
        case 'shadow':
            ctx.shadowColor = effect.config.shadowColor || '#000000';
            ctx.shadowBlur = effect.config.shadowBlur || 5;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            break;
            
        case 'gradient':
            // This will be handled differently when rendering the actual text
            break;
    }
}

// Create gradient for word
export function createWordGradient(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    effect: WordEffect
): CanvasGradient | string {
    if (effect.type !== 'gradient' || !effect.config.color || !effect.config.secondaryColor) {
        return effect.config.color || '#000000';
    }
    
    let gradient: CanvasGradient;
    
    switch (effect.config.direction) {
        case 'vertical':
            gradient = ctx.createLinearGradient(x, y - height/2, x, y + height/2);
            break;
        case 'radial':
            gradient = ctx.createRadialGradient(x, y, 0, x, y, width/2);
            break;
        default: // horizontal
            gradient = ctx.createLinearGradient(x - width/2, y, x + width/2, y);
    }
    
    gradient.addColorStop(0, effect.config.color);
    gradient.addColorStop(1, effect.config.secondaryColor);
    
    return gradient;
}

// Render emoji with proper sizing and positioning
export function renderEmoji(
    ctx: CanvasRenderingContext2D,
    emoji: string,
    x: number,
    y: number,
    fontSize: number
) {
    ctx.save();
    // Emojis render better with certain fonts
    ctx.font = `${fontSize}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y);
    ctx.restore();
}

// Check if a string contains emoji
export function containsEmoji(text: string): boolean {
    const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
    return emojiRegex.test(text);
}

// Render TikTok style captions
export function renderTikTokCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    const startTime = (caption as any).start ?? caption.startMs / 1000;

    // Calculate entrance animation (first 0.3 seconds)
    const enterProgress = calculateAnimationProgress(currentTime, startTime, 0.3);
    const scale = 0.8 + (0.2 * enterProgress);
    const translateY = 50 * (1 - enterProgress);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY + translateY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2 + translateY;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY - translateY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Apply scale transformation
    ctx.translate(xPosition, yPosition);
    ctx.scale(scale, scale);
    ctx.translate(-xPosition, -yPosition);
    
    // Set base text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left'; // We'll calculate positioning manually
    ctx.textBaseline = 'top'; // Consistent baseline for all positions
    
    // Text styling for TikTok
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.2;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Build the full line text with proper spacing
        const fullLineText = lineWords.join(' ');
        
        // Calculate total line width for centering
        ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
        const lineWidth = ctx.measureText(fullLineText.toUpperCase()).width;
        
        // Start position for line (centered)
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word in the line
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const isActive = currentTime >= token.start && currentTime <= token.end;
            const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === globalWordIndex);
            
            // Save current state
            ctx.save();
            
            // Apply word effects if any
            const wordEffect = caption.wordEffects?.find(e => e.wordIndex === globalWordIndex);
            if (wordEffect) {
                applyWordEffect(ctx, wordEffect, currentTime, isActive);
            }
            
            // Apply word-specific styling
            if (isActive) {
                // Active word - TikTok green
                ctx.fillStyle = '#39E508';
                ctx.font = `bold ${fontSize}px ${fontFamily}`;
                
                // Calculate the exact word metrics for background
                const wordMetrics = ctx.measureText(word.toUpperCase());
                
                // Draw highlight background only behind the word
                const padding = 2;
                ctx.save();
                ctx.fillStyle = 'rgba(57, 229, 8, 0.3)';
                
                // Create rounded rectangle for word highlight
                const bgX = currentX - padding;
                const bgY = lineY - padding;
                const bgWidth = wordMetrics.width + (padding * 2);
                const bgHeight = fontSize + (padding * 2);
                const radius = 4;
                
                // Draw rounded rectangle
                ctx.beginPath();
                ctx.moveTo(bgX + radius, bgY);
                ctx.lineTo(bgX + bgWidth - radius, bgY);
                ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
                ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
                ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
                ctx.lineTo(bgX + radius, bgY + bgHeight);
                ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
                ctx.lineTo(bgX, bgY + radius);
                ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
                ctx.fillStyle = '#39E508';
            } else if (wordEffect && wordEffect.type === 'gradient') {
                // Apply gradient fill
                const wordMetrics = ctx.measureText(word.toUpperCase());
                const gradient = createWordGradient(
                    ctx, 
                    currentX + wordMetrics.width / 2, 
                    lineY + fontSize / 2, 
                    wordMetrics.width, 
                    fontSize, 
                    wordEffect
                );
                ctx.fillStyle = gradient;
            } else if (wordHighlight) {
                // Apply highlight style
                const highlightStyle = HIGHLIGHT_STYLES[wordHighlight.style];
                ctx.fillStyle = highlightStyle.color;
                if (highlightStyle.fontWeight === 'bold') {
                    ctx.font = `bold ${fontSize}px ${fontFamily}`;
                }
            } else {
                // Default color
                ctx.fillStyle = style.color;
                ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
            }
            
            // Apply text outline/stroke
            if (style.outlineWidth > 0) {
                ctx.strokeStyle = style.outlineColor;
                ctx.lineWidth = style.outlineWidth * 2;
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeText(word.toUpperCase(), currentX, lineY);
            }
            
            // Draw the word
            const wordToRender = word.toUpperCase();
            
            // Check if the word contains emoji and emoji rendering is enabled
            if (caption.enableEmojis !== false && containsEmoji(wordToRender)) {
                // Split word into emoji and non-emoji parts
                const emojiRegex = /([\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/gu;
                const parts = wordToRender.split(emojiRegex);
                let partX = currentX;
                
                parts.forEach(part => {
                    if (part && containsEmoji(part)) {
                        // Render emoji with special handling
                        renderEmoji(ctx, part, partX + fontSize/2, lineY + fontSize/2, fontSize);
                        partX += fontSize; // Emojis take roughly fontSize width
                    } else if (part) {
                        // Render regular text
                        ctx.fillText(part, partX, lineY);
                        partX += ctx.measureText(part).width;
                    }
                });
            } else {
                // Regular text rendering
                ctx.fillText(wordToRender, currentX, lineY);
            }
            
            // Restore state
            ctx.restore();
            
            // Move to next word position - always use base font size for spacing
            ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
            const wordWidth = ctx.measureText(wordToRender).width;
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordWidth + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render YouTube style captions
export function renderYouTubeCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left'; // We'll calculate positioning manually
    ctx.textBaseline = 'top'; // Consistent baseline
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render background if specified
    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
        const padding = 16;
        const lineHeight = fontSize * 1.4;
        const totalHeight = lines.length * lineHeight + padding * 2;
        const totalWidth = Math.min(maxWidth + padding * 2, canvasWidth * 0.9);
        
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(
            xPosition - totalWidth / 2,
            style.position === 'bottom' ? yPosition - totalHeight : yPosition,
            totalWidth,
            totalHeight
        );
    }
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Build the full line text
        const fullLineText = lineWords.join(' ');
        
        // Calculate total line width
        ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
        const lineWidth = ctx.measureText(fullLineText).width;
        
        // Start position for line
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const isActive = currentTime >= token.start && currentTime <= token.end;
            const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === globalWordIndex);
            
            ctx.save();
            
            // Apply word styling
            if (isActive) {
                // Active word - YouTube golden
                ctx.fillStyle = '#FFD700';
                ctx.font = `bold ${fontSize}px ${fontFamily}`;
                
                // Subtle background highlight - only behind the word
                const wordMetrics = ctx.measureText(word);
                const padding = 1;
                ctx.save();
                ctx.fillStyle = 'rgba(255, 215, 0, 0.25)';
                
                // Simple rounded rectangle for YouTube style
                const bgX = currentX - padding;
                const bgY = lineY - padding;
                const bgWidth = wordMetrics.width + (padding * 2);
                const bgHeight = fontSize + (padding * 2);
                const radius = 2;
                
                ctx.beginPath();
                ctx.moveTo(bgX + radius, bgY);
                ctx.lineTo(bgX + bgWidth - radius, bgY);
                ctx.quadraticCurveTo(bgX + bgWidth, bgY, bgX + bgWidth, bgY + radius);
                ctx.lineTo(bgX + bgWidth, bgY + bgHeight - radius);
                ctx.quadraticCurveTo(bgX + bgWidth, bgY + bgHeight, bgX + bgWidth - radius, bgY + bgHeight);
                ctx.lineTo(bgX + radius, bgY + bgHeight);
                ctx.quadraticCurveTo(bgX, bgY + bgHeight, bgX, bgY + bgHeight - radius);
                ctx.lineTo(bgX, bgY + radius);
                ctx.quadraticCurveTo(bgX, bgY, bgX + radius, bgY);
                ctx.closePath();
                ctx.fill();
                
                ctx.restore();
                ctx.fillStyle = '#FFD700';
            } else if (wordHighlight) {
                const highlightStyle = HIGHLIGHT_STYLES[wordHighlight.style];
                ctx.fillStyle = highlightStyle.color;
                if (highlightStyle.fontWeight === 'bold') {
                    ctx.font = `bold ${fontSize}px ${fontFamily}`;
                }
            } else {
                ctx.fillStyle = style.color;
                ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
            }
            
            // Apply outline
            if (style.outlineWidth > 0) {
                ctx.strokeStyle = style.outlineColor;
                ctx.lineWidth = style.outlineWidth * 2;
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;
                ctx.strokeText(word, currentX, lineY);
            }
            
            // Draw word
            ctx.fillText(word, currentX, lineY);
            
            ctx.restore();
            
            // Move to next position - always use base font for consistent spacing
            ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
            const wordWidth = ctx.measureText(word).width;
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordWidth + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render Typewriter style captions
export function renderTypewriterCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    // Build visible words array
    const visibleWords: string[] = [];
    const visibleIndices: number[] = [];
    let activeWordIndex = -1;
    
    wordTokens.forEach((token, index) => {
        if (currentTime >= token.start) {
            visibleWords.push(token.text);
            visibleIndices.push(index);
            if (currentTime >= token.start && currentTime <= token.end) {
                activeWordIndex = visibleIndices.length - 1;
            }
        }
    });
    
    if (visibleWords.length === 0) return; // Don't render if no text is visible yet
    
    ctx.save();
    
    // Set monospace font
    const fontSize = style.fontSize;
    ctx.font = `${style.fontWeight} ${fontSize}px Consolas, Monaco, "Courier New", monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Get wrapped lines for visible words
    const { lines, lineIndices } = wrapTextForCanvas(ctx, visibleWords, maxWidth);
    
    // Calculate dimensions
    const padding = 20;
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight + padding * 2;
    
    // Calculate max line width for background
    let maxLineWidth = 0;
    lines.forEach(line => {
        const lineText = line.join(' ');
        const lineWidth = ctx.measureText(lineText).width;
        maxLineWidth = Math.max(maxLineWidth, lineWidth);
    });
    const bgWidth = Math.min(maxLineWidth + padding * 2, maxWidth + padding * 2);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2 - totalHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY - totalHeight;
    }
    
    const xPosition = canvasWidth / 2;
    
    // Terminal-style background (only if not transparent)
    if (!caption.typewriterTransparent) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(
            xPosition - bgWidth / 2,
            yPosition,
            bgWidth,
            totalHeight
        );
        
        // Terminal border
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            xPosition - bgWidth / 2,
            yPosition,
            bgWidth,
            totalHeight
        );
    }
    
    // Render each line
    let cursorDrawn = false;
    lines.forEach((lineWords, lineIndex) => {
        const lineY = yPosition + padding + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Build the full line text
        const fullLineText = lineWords.join(' ');
        
        // Calculate line width for centering
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word in the line
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const isActive = globalWordIndex === activeWordIndex;
            
            ctx.fillStyle = isActive ? '#FFFF00' : '#00FF00';
            ctx.fillText(word, currentX, lineY);
            
            const wordWidth = ctx.measureText(word).width;
            const spaceWidth = ctx.measureText(' ').width;
            
            // Draw cursor after active word
            if (isActive && !cursorDrawn) {
                ctx.fillStyle = '#FFFF00';
                // Blinking cursor effect based on time
                if (Math.floor(currentTime * 2) % 2 === 0) {
                    ctx.fillText('|', currentX + wordWidth + 2, lineY);
                }
                cursorDrawn = true;
            }
            
            currentX += wordWidth + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render default style captions (with basic fade animation)
export function renderDefaultCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    // Calculate fade in/out
    const fadeInDuration = 0.2;
    const fadeOutDuration = 0.3;
    const startTime = (caption as any).start ?? caption.startMs / 1000;
    const endTime = (caption as any).end ?? caption.endMs / 1000;
    const fadeInProgress = calculateAnimationProgress(currentTime, startTime, fadeInDuration);
    const fadeOutProgress = 1 - calculateAnimationProgress(currentTime, endTime - fadeOutDuration, fadeOutDuration);
    const opacity = Math.min(fadeInProgress, fadeOutProgress) * style.opacity;
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    ctx.globalAlpha = opacity;
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle'; // Use middle for default style
    
    // Apply background if specified
    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
        const metrics = ctx.measureText(caption.text);
        const padding = 16;
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(
            xPosition - metrics.width / 2 - padding,
            yPosition - fontSize / 2 - padding,
            metrics.width + padding * 2,
            fontSize + padding * 2
        );
    }
    
    // Apply outline/stroke
    if (style.outlineWidth > 0) {
        ctx.strokeStyle = style.outlineColor;
        ctx.lineWidth = style.outlineWidth * 2;
        ctx.strokeText(caption.text, xPosition, yPosition);
    }
    
    // Draw text with highlighted words support
    if (caption.highlightedWords && caption.highlightedWords.length > 0) {
        const words = caption.text.split(' ');
        const wordMetrics: TextMetrics[] = words.map(w => ctx.measureText(w));
        const spaceWidth = ctx.measureText(' ').width;
        
        // Calculate total width
        let totalWidth = 0;
        wordMetrics.forEach((m, i) => {
            totalWidth += m.width;
            if (i < wordMetrics.length - 1) totalWidth += spaceWidth;
        });
        
        // Render each word
        let currentX = xPosition - totalWidth / 2;
        words.forEach((word, index) => {
            const highlight = caption.highlightedWords?.find(hw => hw.wordIndex === index);
            
            if (highlight) {
                const highlightStyle = HIGHLIGHT_STYLES[highlight.style];
                ctx.fillStyle = highlightStyle.color;
                if (highlightStyle.fontWeight === 'bold') {
                    ctx.font = `bold ${fontSize}px ${fontFamily}`;
                }
            } else {
                ctx.fillStyle = style.color;
                ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
            }
            
            ctx.fillText(word, currentX + wordMetrics[index].width / 2, yPosition);
            currentX += wordMetrics[index].width + spaceWidth;
        });
    } else {
        // Simple text rendering
        ctx.fillStyle = style.color;
        ctx.fillText(caption.text, xPosition, yPosition);
    }
    
    ctx.restore();
}

// Render Karaoke style captions (words fill with color progressively)
export function renderKaraokeCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Background if specified
    if (style.backgroundColor && style.backgroundColor !== 'transparent') {
        const padding = 20;
        const lineHeight = fontSize * 1.4;
        const bgWidth = maxWidth + padding * 2;
        const bgHeight = lineHeight + padding * 2;
        
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(
            xPosition - bgWidth / 2,
            style.position === 'bottom' ? yPosition - bgHeight : yPosition,
            bgWidth,
            bgHeight
        );
    }
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Calculate line width for centering
        const fullLineText = lineWords.join(' ');
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            
            // Calculate fill progress for this word
            let fillProgress = 0;
            if (currentTime >= token.start && currentTime <= token.end) {
                // Word is currently being spoken - calculate fill progress
                fillProgress = (currentTime - token.start) / (token.end - token.start);
            } else if (currentTime > token.end) {
                // Word has been fully spoken
                fillProgress = 1;
            }
            
            const wordMetrics = ctx.measureText(word);
            
            // Save state for clipping
            ctx.save();
            
            // Draw the unfilled (outline) version first
            if (style.outlineWidth > 0) {
                ctx.strokeStyle = style.outlineColor || '#000000';
                ctx.lineWidth = style.outlineWidth * 2;
                ctx.lineJoin = 'round';
                ctx.strokeText(word, currentX, lineY);
            }
            
            // Draw empty text (base color)
            ctx.fillStyle = style.color;
            ctx.globalAlpha = 0.3; // Dimmed for unfilled portion
            ctx.fillText(word, currentX, lineY);
            
            // Create clipping region for filled portion
            if (fillProgress > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.rect(
                    currentX,
                    lineY - fontSize * 0.2,
                    wordMetrics.width * fillProgress,
                    fontSize * 1.4
                );
                ctx.clip();
                
                // Draw filled portion with highlight color
                ctx.fillStyle = '#FFD700'; // Golden color for karaoke
                ctx.globalAlpha = 1;
                ctx.fillText(word, currentX, lineY);
                
                // Add glow effect for active word
                if (fillProgress > 0 && fillProgress < 1) {
                    ctx.shadowColor = '#FFD700';
                    ctx.shadowBlur = 10;
                    ctx.fillText(word, currentX, lineY);
                }
                
                ctx.restore();
            }
            
            ctx.restore();
            
            // Move to next word position
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordMetrics.width + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render Bounce style captions (words bounce in)
export function renderBounceCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Calculate line width for centering
        const fullLineText = lineWords.join(' ');
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === globalWordIndex);
            
            // Calculate bounce animation for each word
            const wordAge = currentTime - token.start;
            const bounceDuration = 0.5; // Duration of bounce animation
            let bounceOffset = 0;
            let scale = 1;
            let opacity = 1;
            
            if (wordAge < 0) {
                // Word hasn't appeared yet
                opacity = 0;
            } else if (wordAge < bounceDuration) {
                // Word is bouncing in
                const progress = wordAge / bounceDuration;
                
                // Easing function for bounce effect
                const easeOutBounce = (t: number): number => {
                    if (t < 1 / 2.75) {
                        return 7.5625 * t * t;
                    } else if (t < 2 / 2.75) {
                        t -= 1.5 / 2.75;
                        return 7.5625 * t * t + 0.75;
                    } else if (t < 2.5 / 2.75) {
                        t -= 2.25 / 2.75;
                        return 7.5625 * t * t + 0.9375;
                    } else {
                        t -= 2.625 / 2.75;
                        return 7.5625 * t * t + 0.984375;
                    }
                };
                
                const bounceProgress = easeOutBounce(progress);
                bounceOffset = (1 - bounceProgress) * 50; // Start 50px above
                scale = 0.5 + bounceProgress * 0.5; // Scale from 0.5 to 1
                opacity = progress; // Fade in
            }
            
            const isActive = currentTime >= token.start && currentTime <= token.end;
            
            ctx.save();
            
            // Apply transformations
            ctx.globalAlpha = opacity * style.opacity;
            ctx.translate(currentX + (ctx.measureText(word).width / 2), lineY + (fontSize / 2));
            ctx.scale(scale, scale);
            ctx.translate(-(currentX + (ctx.measureText(word).width / 2)), -(lineY + (fontSize / 2)) - bounceOffset);
            
            // Apply word styling
            if (isActive) {
                // Active word gets special treatment
                ctx.fillStyle = '#FF6B6B'; // Coral color for active word
                ctx.font = `bold ${fontSize}px ${fontFamily}`;
                
                // Add shadow for depth
                ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                ctx.shadowBlur = 5;
                ctx.shadowOffsetY = 3;
            } else if (wordHighlight) {
                const highlightStyle = HIGHLIGHT_STYLES[wordHighlight.style];
                ctx.fillStyle = highlightStyle.color;
                if (highlightStyle.fontWeight === 'bold') {
                    ctx.font = `bold ${fontSize}px ${fontFamily}`;
                }
            } else {
                ctx.fillStyle = style.color;
            }
            
            // Apply outline
            if (style.outlineWidth > 0) {
                ctx.strokeStyle = style.outlineColor || '#000000';
                ctx.lineWidth = style.outlineWidth * 2;
                ctx.lineJoin = 'round';
                ctx.strokeText(word, currentX, lineY - bounceOffset);
            }
            
            // Draw word
            ctx.fillText(word, currentX, lineY - bounceOffset);
            
            ctx.restore();
            
            // Move to next word position
            const wordMetrics = ctx.measureText(word);
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordMetrics.width + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render Wave style captions (words appear in a wave pattern)
export function renderWaveCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Shadow for wave effect
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Calculate line width for centering
        const fullLineText = lineWords.join(' ');
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const wordHighlight = caption.highlightedWords?.find(hw => hw.wordIndex === globalWordIndex);
            
            // Calculate wave animation
            const wordAge = currentTime - token.start;
            const waveDuration = 0.8; // Duration of wave animation
            const waveDelay = globalWordIndex * 0.1; // Stagger effect
            const adjustedAge = wordAge - waveDelay;
            
            let waveOffset = 0;
            let opacity = 1;
            let scale = 1;
            
            if (adjustedAge < 0) {
                // Word hasn't started animating yet
                opacity = 0;
                waveOffset = 30;
            } else if (adjustedAge < waveDuration) {
                // Word is in wave animation
                const progress = adjustedAge / waveDuration;
                
                // Sine wave for smooth motion
                const easeInOutSine = (t: number): number => {
                    return -(Math.cos(Math.PI * t) - 1) / 2;
                };
                
                const waveProgress = easeInOutSine(progress);
                
                // Create wave motion
                waveOffset = (1 - waveProgress) * 30 * Math.sin(progress * Math.PI * 2);
                opacity = progress;
                scale = 0.8 + waveProgress * 0.2;
                
                // Add continuous subtle wave for active words
                if (currentTime >= token.start && currentTime <= token.end) {
                    const timeSinceStart = currentTime - token.start;
                    waveOffset += Math.sin(timeSinceStart * 5) * 3; // Subtle continuous wave
                }
            } else {
                // After wave animation, add subtle floating effect
                const timeSinceStart = adjustedAge - waveDuration;
                waveOffset = Math.sin(timeSinceStart * 2) * 2; // Gentle floating
            }
            
            const isActive = currentTime >= token.start && currentTime <= token.end;
            
            ctx.save();
            
            // Apply transformations
            ctx.globalAlpha = opacity * style.opacity;
            
            // Apply word styling
            if (isActive) {
                // Active word - ocean blue color
                ctx.fillStyle = '#00B4D8';
                ctx.font = `bold ${fontSize * scale}px ${fontFamily}`;
                
                // Enhanced glow for active word
                ctx.shadowColor = '#00B4D8';
                ctx.shadowBlur = 15;
            } else if (wordHighlight) {
                const highlightStyle = HIGHLIGHT_STYLES[wordHighlight.style];
                ctx.fillStyle = highlightStyle.color;
                if (highlightStyle.fontWeight === 'bold') {
                    ctx.font = `bold ${fontSize * scale}px ${fontFamily}`;
                } else {
                    ctx.font = `${style.fontWeight} ${fontSize * scale}px ${fontFamily}`;
                }
            } else {
                ctx.fillStyle = style.color;
                ctx.font = `${style.fontWeight} ${fontSize * scale}px ${fontFamily}`;
            }
            
            // Apply outline
            if (style.outlineWidth > 0) {
                ctx.strokeStyle = style.outlineColor || '#000000';
                ctx.lineWidth = style.outlineWidth * 2;
                ctx.lineJoin = 'round';
                ctx.strokeText(word, currentX, lineY + waveOffset);
            }
            
            // Draw word with wave offset
            ctx.fillText(word, currentX, lineY + waveOffset);
            
            // Add water ripple effect for active words
            if (isActive && opacity > 0.5) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = '#00B4D8';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(
                    currentX + ctx.measureText(word).width / 2, 
                    lineY + waveOffset + fontSize / 2,
                    fontSize * 0.8 * (1 + Math.sin(currentTime * 5) * 0.1),
                    0,
                    Math.PI * 2
                );
                ctx.stroke();
                ctx.restore();
            }
            
            ctx.restore();
            
            // Move to next word position
            const wordMetrics = ctx.measureText(word);
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordMetrics.width + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render Liquid Ripple effect
export function renderLiquidCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Calculate line width for centering
        const fullLineText = lineWords.join(' ');
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word with liquid effect
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const isActive = currentTime >= token.start && currentTime <= token.end;
            const wordWidth = ctx.measureText(word).width;
            
            ctx.save();
            
            // Calculate ripple effect
            const rippleTime = currentTime * 3;
            const ripplePhase = globalWordIndex * 0.5;
            
            // Multiple wave layers for liquid effect
            const wave1 = Math.sin(rippleTime + ripplePhase) * 5;
            const wave2 = Math.sin(rippleTime * 1.5 + ripplePhase + Math.PI/3) * 3;
            const wave3 = Math.sin(rippleTime * 2 + ripplePhase + Math.PI/6) * 2;
            const totalWave = wave1 + wave2 + wave3;
            
            // Distortion effect
            const distortionX = Math.cos(rippleTime + ripplePhase) * (isActive ? 3 : 1);
            const distortionY = totalWave;
            
            // Transform for liquid motion
            ctx.translate(currentX + distortionX, lineY + distortionY);
            
            // Create liquid gradient
            const gradient = ctx.createLinearGradient(
                0, -fontSize/2,
                0, fontSize/2
            );
            
            if (isActive) {
                // Active word - vibrant liquid colors
                const hue1 = (180 + Math.sin(rippleTime) * 30) % 360;
                const hue2 = (220 + Math.sin(rippleTime + Math.PI) * 30) % 360;
                
                gradient.addColorStop(0, `hsla(${hue1}, 100%, 50%, 0.9)`);
                gradient.addColorStop(0.5, `hsla(${hue2}, 100%, 60%, 1)`);
                gradient.addColorStop(1, `hsla(${hue1}, 100%, 40%, 0.9)`);
                
                // Add ripple rings
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.strokeStyle = `hsl(${hue1}, 100%, 70%)`;
                ctx.lineWidth = 2;
                
                // Draw expanding ripples
                for (let i = 0; i < 3; i++) {
                    const rippleRadius = (currentTime * 30 + i * 20) % 60;
                    const rippleAlpha = Math.max(0, 1 - rippleRadius / 60);
                    ctx.globalAlpha = rippleAlpha * 0.3;
                    
                    ctx.beginPath();
                    ctx.ellipse(
                        wordWidth / 2, 
                        fontSize / 2,
                        rippleRadius, 
                        rippleRadius * 0.6,
                        Math.sin(rippleTime) * 0.2,
                        0,
                        Math.PI * 2
                    );
                    ctx.stroke();
                }
                ctx.restore();
                
                // Water drop effect
                ctx.shadowColor = `hsl(${hue1}, 100%, 50%)`;
                ctx.shadowBlur = 20;
                ctx.shadowOffsetY = 3;
                
            } else {
                // Inactive word - calm water
                gradient.addColorStop(0, 'rgba(100, 150, 255, 0.8)');
                gradient.addColorStop(0.5, 'rgba(50, 100, 200, 0.9)');
                gradient.addColorStop(1, 'rgba(30, 70, 150, 0.8)');
                
                ctx.shadowColor = 'rgba(50, 100, 200, 0.5)';
                ctx.shadowBlur = 10;
            }
            
            ctx.fillStyle = gradient;
            
            // Apply slight rotation for fluid motion
            const rotation = Math.sin(rippleTime + ripplePhase) * 0.05;
            ctx.rotate(rotation);
            
            // Scale effect for active words
            if (isActive) {
                const scale = 1 + Math.sin(rippleTime * 2) * 0.1;
                ctx.scale(scale, scale);
            }
            
            // Draw word with liquid distortion
            // Create a subtle path distortion
            if (isActive) {
                // Measure each character for path distortion
                const chars = word.split('');
                let charX = 0;
                
                chars.forEach((char, charIndex) => {
                    const charWave = Math.sin(rippleTime + charIndex * 0.5) * 2;
                    ctx.save();
                    ctx.translate(0, charWave);
                    ctx.fillText(char, charX, 0);
                    charX += ctx.measureText(char).width;
                    ctx.restore();
                });
            } else {
                // Normal rendering for inactive words
                ctx.fillText(word, 0, 0);
            }
            
            // Add water surface reflection effect
            if (isActive) {
                ctx.save();
                ctx.globalAlpha = 0.3;
                ctx.scale(1, -0.5);
                ctx.translate(0, -fontSize * 2);
                
                const reflectionGradient = ctx.createLinearGradient(
                    0, 0,
                    0, fontSize
                );
                reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
                reflectionGradient.addColorStop(1, 'transparent');
                ctx.fillStyle = reflectionGradient;
                ctx.fillText(word, 0, 0);
                ctx.restore();
            }
            
            ctx.restore();
            
            // Move to next word position
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordWidth + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render Fire Text effect
export function renderFireCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `900 ${fontSize}px ${fontFamily}`; // Extra bold for fire effect
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Calculate line width for centering
        const fullLineText = lineWords.join(' ');
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word with fire effect
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const isActive = currentTime >= token.start && currentTime <= token.end;
            const wordWidth = ctx.measureText(word).width;
            
            ctx.save();
            
            // Multiple layers for depth
            const layers = isActive ? 5 : 3;
            
            for (let layer = 0; layer < layers; layer++) {
                ctx.save();
                
                const layerOffset = layer * 2;
                const time = currentTime * 15 + layer * 0.5;
                
                // Create dynamic gradient for each layer
                const gradient = ctx.createLinearGradient(
                    currentX + wordWidth/2, 
                    lineY + fontSize + layerOffset,
                    currentX + wordWidth/2, 
                    lineY - fontSize * (isActive ? 0.8 : 0.3)
                );
                
                if (isActive) {
                    // Active word - intense multi-layered fire
                    const flickerIntensity = Math.sin(time) * 0.1 + 0.9;
                    
                    if (layer === 0) {
                        // Core layer - white hot
                        gradient.addColorStop(0, '#FFFFFF');
                        gradient.addColorStop(0.2, '#FFFFCC');
                        gradient.addColorStop(0.4, '#FFFF99');
                        gradient.addColorStop(0.7, '#FFCC00');
                        gradient.addColorStop(1, 'transparent');
                        ctx.globalAlpha = 0.9 * flickerIntensity;
                    } else if (layer === 1) {
                        // Middle layer - yellow/orange
                        gradient.addColorStop(0, '#FFCC00');
                        gradient.addColorStop(0.3, '#FF9900');
                        gradient.addColorStop(0.6, '#FF6600');
                        gradient.addColorStop(1, 'transparent');
                        ctx.globalAlpha = 0.7 * flickerIntensity;
                    } else if (layer === 2) {
                        // Outer layer - orange/red
                        gradient.addColorStop(0, '#FF6600');
                        gradient.addColorStop(0.4, '#FF3300');
                        gradient.addColorStop(0.7, '#CC0000');
                        gradient.addColorStop(1, 'transparent');
                        ctx.globalAlpha = 0.5 * flickerIntensity;
                    } else {
                        // Glow layers
                        gradient.addColorStop(0, 'rgba(255, 100, 0, 0.3)');
                        gradient.addColorStop(0.5, 'rgba(255, 50, 0, 0.2)');
                        gradient.addColorStop(1, 'transparent');
                        ctx.globalAlpha = 0.3 * flickerIntensity;
                    }
                    
                    // Add dynamic blur for outer layers
                    if (layer > 2) {
                        ctx.filter = `blur(${layer}px)`;
                    }
                    
                    // Glow effect
                    ctx.shadowColor = layer === 0 ? '#FFFF00' : '#FF6600';
                    ctx.shadowBlur = 20 + layer * 5;
                    ctx.shadowOffsetY = -5;
                    
                } else {
                    // Inactive word - ember effect
                    gradient.addColorStop(0, '#330000');
                    gradient.addColorStop(0.3, '#660000');
                    gradient.addColorStop(0.6, '#990000');
                    gradient.addColorStop(0.8, '#CC3300');
                    gradient.addColorStop(1, 'rgba(255, 100, 0, 0.3)');
                    
                    ctx.globalAlpha = 0.8 - layer * 0.2;
                    ctx.shadowColor = '#CC0000';
                    ctx.shadowBlur = 10 + layer * 2;
                }
                
                ctx.fillStyle = gradient;
                
                // Add slight offset for flame movement
                const offsetY = isActive ? Math.sin(time + layer) * 2 : 0;
                ctx.fillText(word, currentX, lineY + offsetY);
                
                ctx.restore();
            }
            
            // Add dynamic flame particles for active words
            if (isActive) {
                const particleCount = 15;
                const time = currentTime * 10;
                
                for (let i = 0; i < particleCount; i++) {
                    ctx.save();
                    
                    const particleX = currentX + (i / particleCount) * wordWidth;
                    const particleTime = time + i * 0.5;
                    const particleY = lineY - Math.abs(Math.sin(particleTime)) * 30;
                    const particleSize = Math.random() * 3 + 1;
                    const particleLife = (Math.sin(particleTime) + 1) / 2;
                    
                    ctx.globalAlpha = particleLife * 0.6;
                    
                    // Particle glow
                    const particleGradient = ctx.createRadialGradient(
                        particleX, particleY, 0,
                        particleX, particleY, particleSize * 3
                    );
                    particleGradient.addColorStop(0, '#FFFFFF');
                    particleGradient.addColorStop(0.3, '#FFFF00');
                    particleGradient.addColorStop(0.6, '#FF6600');
                    particleGradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = particleGradient;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
                
                // Add heat distortion effect above text
                ctx.save();
                ctx.globalAlpha = 0.1;
                ctx.filter = 'blur(3px)';
                
                for (let wave = 0; wave < 3; wave++) {
                    const waveOffset = Math.sin(time * 2 + wave) * 5;
                    const waveGradient = ctx.createLinearGradient(
                        currentX + waveOffset, lineY - 10,
                        currentX + waveOffset, lineY - 40
                    );
                    waveGradient.addColorStop(0, 'transparent');
                    waveGradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.3)');
                    waveGradient.addColorStop(1, 'transparent');
                    
                    ctx.fillStyle = waveGradient;
                    ctx.fillRect(currentX + waveOffset - 10, lineY - 40, wordWidth + 20, 40);
                }
                ctx.restore();
            }
            
            ctx.restore();
            
            // Move to next word position
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordWidth + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Render Glitch effect
export function renderGlitchCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    // Glitch parameters
    const glitchIntensity = Math.sin(currentTime * 20) > 0.8 ? 1 : 0; // Random glitch moments
    const rgbOffset = glitchIntensity * 5;
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Calculate line width for centering
        const fullLineText = lineWords.join(' ');
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word with RGB split effect
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const isActive = currentTime >= token.start && currentTime <= token.end;
            
            // Random glitch for active words
            const wordGlitch = isActive && Math.random() > 0.9;
            const offset = wordGlitch ? (Math.random() - 0.5) * 10 : 0;
            
            // Draw RGB split effect
            if (wordGlitch || glitchIntensity > 0) {
                // Red channel
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = 'rgb(255, 0, 0)';
                ctx.fillText(word, currentX - rgbOffset + offset, lineY);
                
                // Green channel
                ctx.fillStyle = 'rgb(0, 255, 0)';
                ctx.fillText(word, currentX, lineY + (wordGlitch ? 2 : 0));
                
                // Blue channel
                ctx.fillStyle = 'rgb(0, 0, 255)';
                ctx.fillText(word, currentX + rgbOffset - offset, lineY);
                
                ctx.globalCompositeOperation = 'source-over';
            } else {
                // Normal rendering
                ctx.fillStyle = isActive ? '#00FF00' : style.color;
                ctx.fillText(word, currentX, lineY);
            }
            
            // Random digital artifacts
            if (wordGlitch) {
                ctx.fillStyle = '#00FF00';
                ctx.globalAlpha = 0.5;
                // Draw random blocks
                for (let i = 0; i < 3; i++) {
                    const blockX = currentX + Math.random() * ctx.measureText(word).width;
                    const blockY = lineY + Math.random() * fontSize;
                    ctx.fillRect(blockX, blockY, Math.random() * 20, 2);
                }
                ctx.globalAlpha = 1;
            }
            
            // Move to next word position
            const wordWidth = ctx.measureText(word).width;
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordWidth + spaceWidth;
        });
    });
    
    // Add scan lines effect
    if (glitchIntensity > 0) {
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#00FF00';
        for (let y = 0; y < canvasHeight; y += 2) {
            ctx.fillRect(0, y, canvasWidth, 1);
        }
        ctx.globalAlpha = 1;
    }
    
    ctx.restore();
}

// Render Rainbow Wave effect
export function renderRainbowCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    const wordTokens = caption.wordTokens || generateWordTokens(caption);
    
    // Calculate position
    let yPosition = 0;
    if (style.position === 'top') {
        yPosition = style.offsetY;
    } else if (style.position === 'center') {
        yPosition = canvasHeight / 2;
    } else { // bottom
        yPosition = canvasHeight - style.offsetY;
    }
    
    const xPosition = canvasWidth / 2;
    const maxWidth = (canvasWidth * style.maxWidth) / 100;
    
    ctx.save();
    
    // Set text properties
    const fontSize = style.fontSize;
    const fontFamily = style.fontFamily || 'Arial';
    ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    // Get wrapped lines
    const words = wordTokens.map(t => t.text);
    const { lines, lineIndices } = wrapTextForCanvas(ctx, words, maxWidth);
    
    // Render each line
    const lineHeight = fontSize * 1.4;
    const totalHeight = lines.length * lineHeight;
    let startY = yPosition;
    
    if (style.position === 'center') {
        startY = yPosition - totalHeight / 2;
    } else if (style.position === 'bottom') {
        startY = yPosition - totalHeight;
    }
    
    lines.forEach((lineWords, lineIndex) => {
        const lineY = startY + (lineIndex * lineHeight);
        const wordIndices = lineIndices[lineIndex];
        
        // Calculate line width for centering
        const fullLineText = lineWords.join(' ');
        const lineWidth = ctx.measureText(fullLineText).width;
        let currentX = xPosition - lineWidth / 2;
        
        // Render each word
        lineWords.forEach((word, wordIndexInLine) => {
            const globalWordIndex = wordIndices[wordIndexInLine];
            const token = wordTokens[globalWordIndex];
            const isActive = currentTime >= token.start && currentTime <= token.end;
            
            ctx.save();
            
            // Calculate rainbow color based on time and position
            const hueBase = (currentTime * 60) % 360; // Base hue rotates over time
            const hueOffset = (globalWordIndex * 30) % 360; // Offset for each word
            const hue = (hueBase + hueOffset) % 360;
            
            // Wave effect for vertical position
            const waveAmplitude = isActive ? 15 : 8;
            const waveSpeed = isActive ? 4 : 2;
            const waveOffset = Math.sin((currentTime * waveSpeed) + (globalWordIndex * 0.5)) * waveAmplitude;
            
            // Apply wave transform
            ctx.translate(0, waveOffset);
            
            // Set rainbow color
            const saturation = isActive ? 100 : 80;
            const lightness = isActive ? 50 : 60;
            ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
            
            // Add glow effect
            if (isActive) {
                ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                ctx.shadowBlur = 15;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            }
            
            // Apply text outline
            if (style.outlineWidth > 0) {
                ctx.strokeStyle = style.outlineColor;
                ctx.lineWidth = style.outlineWidth * 2;
                ctx.strokeText(word, currentX, lineY);
            }
            
            // Draw the word
            ctx.fillText(word, currentX, lineY);
            
            ctx.restore();
            
            // Move to next word position
            const wordWidth = ctx.measureText(word).width;
            const spaceWidth = ctx.measureText(' ').width;
            currentX += wordWidth + spaceWidth;
        });
    });
    
    ctx.restore();
}

// Main caption rendering function
export function renderCaption(
    ctx: CanvasRenderingContext2D,
    caption: Caption,
    style: CaptionStyle,
    currentTime: number,
    canvasWidth: number,
    canvasHeight: number
) {
    // Choose renderer based on animation style
    switch (caption.animationStyle) {
        case 'tiktok':
            renderTikTokCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'youtube':
            renderYouTubeCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'typewriter':
            renderTypewriterCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'karaoke':
            renderKaraokeCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'bounce':
            renderBounceCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'wave':
            renderWaveCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'rainbow':
            renderRainbowCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'glitch':
            renderGlitchCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'fire':
            renderFireCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        case 'liquid':
            renderLiquidCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
        default:
            renderDefaultCaption(ctx, caption, style, currentTime, canvasWidth, canvasHeight);
            break;
    }
}