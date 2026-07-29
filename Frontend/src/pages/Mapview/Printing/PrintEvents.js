export const PRINT_EVENTS = Object.freeze({
  PRINT_CURRENT_MAP: "ruda:print-current-map",
  PRINT_IMPORTED_KMZ: "ruda:print-imported-kmz",
  PRINT_STATE: "ruda:print-state",
  REQUEST_PRINT_STATE: "ruda:request-print-state",
  IMPORT_STATE: "ruda:import-print-state",
  REQUEST_IMPORT_STATE: "ruda:request-import-print-state",
});

export const dispatchPrintEvent = (eventName, detail = undefined) => {
  window.dispatchEvent(
    detail === undefined
      ? new Event(eventName)
      : new CustomEvent(eventName, { detail }),
  );
};
