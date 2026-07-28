import { useCallback, useEffect, useState } from "react";
import RudaLogo from "../../../assets/Ruda.png";
import { buildVisibleLegendRows } from "./LegendGenerator";
import { PRINT_EVENTS, dispatchPrintEvent } from "./PrintEvents";
import { makePrintableHtml } from "./PrintTemplate";
import {
  captureMapCanvas,
  getMapMetadata,
  getSelectedProjectTitle,
  openPreparingPrintWindow,
} from "./PrintUtils";

export default function MapPrinter({
  map,
  isMapReady,
  filters,
  layerVisibility,
  adminBoundaryVisibility,
}) {
  const [printLoading, setPrintLoading] = useState(false);

  const publishState = useCallback(() => {
    dispatchPrintEvent(PRINT_EVENTS.PRINT_STATE, {
      mapReady: Boolean(map && isMapReady),
      printLoading,
    });
  }, [map, isMapReady, printLoading]);

  useEffect(() => {
    publishState();
    window.addEventListener(PRINT_EVENTS.REQUEST_PRINT_STATE, publishState);
    return () => {
      window.removeEventListener(PRINT_EVENTS.REQUEST_PRINT_STATE, publishState);
    };
  }, [publishState]);

  const printCurrentMap = useCallback(async () => {
    if (!map || !isMapReady || printLoading) return;

    const printWindow = openPreparingPrintWindow();
    if (!printWindow) {
      window.alert(
        "The browser blocked the print window. Allow pop-ups for this site and try again.",
      );
      return;
    }

    setPrintLoading(true);

    try {
      const mapImage = await captureMapCanvas(map);
      const legendRows = buildVisibleLegendRows({
        map,
        layerVisibility,
        adminBoundaryVisibility,
        includeImportedLayer: true,
      });
      const metadata = getMapMetadata(map);
      const title = getSelectedProjectTitle(filters);

      printWindow.document.open();
      printWindow.document.write(
        makePrintableHtml({
          title,
          subtitle: "Current Visible Layers",
          mapImage,
          insetImage: mapImage,
          legendRows,
          logoUrl: RudaLogo,
          metadata,
        }),
      );
      printWindow.document.close();
    } catch (error) {
      console.error("[MapPrinter] Current map print failed", error);
      printWindow.close();
      window.alert(error?.message || "The map could not be prepared for printing.");
    } finally {
      setPrintLoading(false);
    }
  }, [
    map,
    isMapReady,
    printLoading,
    filters,
    layerVisibility,
    adminBoundaryVisibility,
  ]);

  useEffect(() => {
    window.addEventListener(PRINT_EVENTS.PRINT_CURRENT_MAP, printCurrentMap);
    return () => {
      window.removeEventListener(
        PRINT_EVENTS.PRINT_CURRENT_MAP,
        printCurrentMap,
      );
    };
  }, [printCurrentMap]);

  return null;
}
