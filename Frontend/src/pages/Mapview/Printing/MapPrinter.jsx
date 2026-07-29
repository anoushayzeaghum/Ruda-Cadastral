import { useCallback, useEffect, useState } from "react";
import RudaLogo from "../../../assets/Ruda.png";
import {
  buildCadastralLegendRows,
  buildVisibleLegendRows,
} from "./LegendGenerator";
import { PRINT_EVENTS, dispatchPrintEvent } from "./PrintEvents";
import { makePrintableHtml } from "./PrintTemplate";
import {
  captureMapCanvas,
  getMapMetadata,
  getSelectedProjectTitle,
  openPreparingPrintWindow,
} from "./PrintUtils";

const getNameList = (items = [], fallback = "") => {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const names = list
    .map((item) =>
      typeof item === "object"
        ? item?.name || item?.district || item?.tehsil || item?.mauza || item?.label
        : item,
    )
    .filter(Boolean);
  return names.join(", ") || fallback;
};

const getCadastralTitle = (filters = {}) => {
  const mauza =
    filters?.selectedMauzaDetails?.mauza ||
    filters?.selectedMauzaDetails?.name;
  if (mauza) return `${mauza} Cadastral Map`;

  const tehsil = getNameList(filters?.selectedTehsilOptions);
  if (tehsil) return `${tehsil} Tehsil Cadastral Map`;

  const district = getNameList(filters?.selectedDistrictOptions);
  if (district) return `${district} District Cadastral Map`;

  return "RUDA Cadastral Management Map";
};

export default function MapPrinter({
  map,
  isMapReady = Boolean(map),
  filters = {},
  layerVisibility = {},
  adminBoundaryVisibility = {},
  mode = "metaverse",
  layers = {},
  basemap = "Streets",
  boundaryStatus = "verified",
}) {
  const [printLoading, setPrintLoading] = useState(false);

  const publishState = useCallback(() => {
    dispatchPrintEvent(PRINT_EVENTS.PRINT_STATE, {
      mapReady: Boolean(map && isMapReady),
      printLoading,
      mode,
    });
  }, [map, isMapReady, printLoading, mode]);

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
      const isCadastral = mode === "cadastral";
      const legendRows = isCadastral
        ? buildCadastralLegendRows({ layers, boundaryStatus })
        : buildVisibleLegendRows({
            map,
            layerVisibility,
            adminBoundaryVisibility,
            includeImportedLayer: true,
          });

      const metadata = {
        ...getMapMetadata(map),
        basemap,
        boundaryStatus,
      };

      const title = isCadastral
        ? getCadastralTitle(filters)
        : getSelectedProjectTitle(filters);

      printWindow.document.open();
      printWindow.document.write(
        makePrintableHtml({
          title,
          subtitle: isCadastral
            ? "Current Visible Cadastral Layers"
            : "Current Visible Layers",
          mapImage,
          insetImage: mapImage,
          legendRows,
          logoUrl: RudaLogo,
          metadata,
          insetTitle: isCadastral
            ? "Current Cadastral Map Overview"
            : "RUDA / LP Principle Boundary Overview",
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
    mode,
    layers,
    basemap,
    boundaryStatus,
  ]);

  useEffect(() => {
    window.addEventListener(PRINT_EVENTS.PRINT_CURRENT_MAP, printCurrentMap);
    return () => {
      window.removeEventListener(PRINT_EVENTS.PRINT_CURRENT_MAP, printCurrentMap);
    };
  }, [printCurrentMap]);

  return null;
}
