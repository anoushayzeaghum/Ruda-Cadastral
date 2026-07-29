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

const hasOwnKeys = (value) =>
  value && typeof value === "object" && Object.keys(value).length > 0;

const getNameList = (items = [], fallback = "") => {
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const names = list
    .map((item) =>
      typeof item === "object"
        ? item?.name ||
          item?.district ||
          item?.tehsil ||
          item?.mauza ||
          item?.label
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

  // This fallback prevents a missing/incorrect mode prop from making the
  // Cadastral page print as "GIS Metaverse". Cadastral MapPage passes a
  // populated `layers` object, while GIS Metaverse uses layerVisibility.
  const isCadastralMode = mode === "cadastral";

  const publishState = useCallback(() => {
    dispatchPrintEvent(PRINT_EVENTS.PRINT_STATE, {
      mapReady: Boolean(map && isMapReady),
      printLoading,
      mode: isCadastralMode ? "cadastral" : "metaverse",
    });
  }, [map, isMapReady, printLoading, isCadastralMode]);

  useEffect(() => {
    publishState();
    window.addEventListener(PRINT_EVENTS.REQUEST_PRINT_STATE, publishState);

    return () => {
      window.removeEventListener(
        PRINT_EVENTS.REQUEST_PRINT_STATE,
        publishState,
      );
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

      const legendRows = isCadastralMode
        ? buildCadastralLegendRows({
            layers,
            boundaryStatus,
          })
        : buildVisibleLegendRows({
            map,
            layerVisibility,
            adminBoundaryVisibility,
            includeImportedLayer: true,
          });

      const metadata = {
        ...getMapMetadata(map),
        basemap,
        boundaryStatus: isCadastralMode
          ? boundaryStatus
          : "Operational map",
        visibleLayerCount: legendRows.length,
      };

      const title = isCadastralMode
        ? getCadastralTitle(filters)
        : getSelectedProjectTitle(filters);

      console.debug("[MapPrinter] resolved print context", {
        requestedMode: mode,
        isCadastralMode,
        title,
        legendRows,
        layers,
        layerVisibility,
        adminBoundaryVisibility,
        visibleMapLayers: map
          ?.getStyle?.()
          ?.layers?.filter(
            (layer) =>
              map.getLayoutProperty(layer.id, "visibility") !== "none",
          )
          ?.map((layer) => layer.id),
      });

      printWindow.document.open();
      printWindow.document.write(
        makePrintableHtml({
          title,
          subtitle: isCadastralMode
            ? "Cadastral Map — Current Visible Layers"
            : "GIS Metaverse • Current Visible Layers",
          mapImage,
          insetImage: mapImage,
          legendRows,
          logoUrl: RudaLogo,
          metadata,
          insetTitle: isCadastralMode
            ? "Current Cadastral Extent"
            : "RUDA / LP Principle Boundary Overview",
        }),
      );
      printWindow.document.close();
    } catch (error) {
      console.error("[MapPrinter] Current map print failed", error);
      printWindow.close();

      window.alert(
        error?.message ||
          "The map could not be prepared for printing.",
      );
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
    isCadastralMode,
  ]);

  useEffect(() => {
    window.addEventListener(
      PRINT_EVENTS.PRINT_CURRENT_MAP,
      printCurrentMap,
    );

    return () => {
      window.removeEventListener(
        PRINT_EVENTS.PRINT_CURRENT_MAP,
        printCurrentMap,
      );
    };
  }, [printCurrentMap]);

  return null;
}
