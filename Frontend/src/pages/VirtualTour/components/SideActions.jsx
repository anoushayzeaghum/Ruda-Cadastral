/**
 * SideActions — DEPRECATED / empty pass-through.
 *
 * Gallery, Gyro, and Info are now rendered inside ViewerControls.jsx
 * as part of the unified .vt-toolbar pill.
 *
 * This file is kept so existing imports in VirtualTourViewer.jsx don't break.
 * VirtualTourViewer has been updated to pass these props directly to ViewerControls.
 */
export default function SideActions() {
  return null;
}
