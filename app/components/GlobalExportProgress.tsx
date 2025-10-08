"use client"

import ExportProgressOverlay from './editor/ExportProgressOverlay';
import { useExportContext } from '../contexts/ExportContext';

export default function GlobalExportProgress() {
  const { showProgress, hideProgress } = useExportContext();

  return (
    <ExportProgressOverlay 
      isVisible={showProgress} 
      onClose={hideProgress} 
    />
  );
}