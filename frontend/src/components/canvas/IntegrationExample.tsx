// Example of how to integrate the enhanced canvas controls
// Replace in your main layout/page component

import React from 'react';
import { EnhancedBlockPalette } from '../components/panels/EnhancedBlockPalette';
import { EnhancedAnvayaCanvas } from '../components/canvas/EnhancedAnvayaCanvas';

export function CanvasPage() {
  return (
    <div className="h-screen flex bg-[#0f1218] overflow-hidden">
      {/* Enhanced Block Palette */}
      <EnhancedBlockPalette />
      
      {/* Enhanced Canvas with Custom Controls */}
      <div className="flex-1 relative">
        <EnhancedAnvayaCanvas />
      </div>
      
      {/* Configuration Panel (existing) */}
      <div className="w-80 bg-[#10131a] border-l border-[#1c2028]">
        {/* Your existing ConfigPanel component */}
      </div>
    </div>
  );
}

// What's new:
// 1. CustomCanvasControls with proper dark theme colors
// 2. CustomMiniMap with themed styling  
// 3. Enhanced block palette with search and categories
// 4. Comprehensive CSS overrides for ReactFlow components
// 5. Improved visual feedback and interactions