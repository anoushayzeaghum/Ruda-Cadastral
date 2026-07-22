import { jsPDF } from "jspdf";
import {
  addImageContained,
  buildPlotDetails,
  canvasAsPng,
  createPlanCanvas,
  createPdfPreviewWindow,
  drawNorthArrowPdf,
  openPdfPreview,
  valueOrDash,
} from "./printUtils";

export const printPartPlan = async ({
  parcel,
  filters = {},
  contextGeojson,
}) => {
  if (!parcel) {
    alert("Please select a plot first.");
    return;
  }

  const previewWindow = createPdfPreviewWindow("Part Plan");
  if (!previewWindow) return;

  try {
    const details = buildPlotDetails(parcel, filters);
    const [locationCanvas, dimensionCanvas] = await Promise.all([
      createPlanCanvas({
        selectedFeature: parcel,
        contextGeojson,
        details,
        mode: "partOverview",
        width: 3200,
        height: 1350,
        selectedFill: "#9ed8f1",
        selectedStroke: "#0037ff",
        watermark: false,
        showDimensions: false,
        showVertexLabels: false,
        showContextLabels: true,
        northArrow: true,
      }),
      createPlanCanvas({
        selectedFeature: parcel,
        contextGeojson,
        details,
        mode: "part",
        width: 3000,
        height: 1900,
        selectedFill: "#a9daf2",
        selectedStroke: "#0637ff",
        watermark: false,
        showDimensions: true,
        showVertexLabels: false,
        showContextLabels: true,
        northArrow: false,
      }),
    ]);

    const locationImage = canvasAsPng(locationCanvas);
    const dimensionImage = canvasAsPng(dimensionCanvas);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a3",
      compress: true,
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 8;
    const contentWidth = pageWidth - margin * 2;
    const titleHeight = 19;
    const subtitleHeight = 11;
    const mapHeight = 132;
    const dimensionTop = margin + titleHeight + subtitleHeight + mapHeight;
    const dimensionHeight = pageHeight - dimensionTop - margin;

    doc.setDrawColor(130, 130, 130);
    doc.setLineWidth(0.25);
    doc.rect(margin, margin, contentWidth, pageHeight - margin * 2);

    const schemeName = valueOrDash(details.project, "CHAHARBAGH HOUSING SCHEME").toUpperCase();
    const title = `SCHEME PART PLAN OF PLOT NO ${valueOrDash(details.plotNo)}, BLOCK ${valueOrDash(
      details.block,
    )}, ${schemeName}`;

    doc.rect(margin, margin, contentWidth, titleHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(18.5);
    doc.text(title, margin + 5, margin + 12.5);

    const subtitleTop = margin + titleHeight;
    doc.rect(margin, subtitleTop, contentWidth, subtitleHeight);
    doc.setFontSize(11.5);
    doc.text("LOCATION PLAN AS PER APPROVED MASTER PLAN", margin + 5, subtitleTop + 7.5);

    const mapTop = subtitleTop + subtitleHeight;
    doc.rect(margin, mapTop, contentWidth, mapHeight);

    if (locationImage) {
      addImageContained(
        doc,
        locationImage.dataUrl,
        locationImage.width,
        locationImage.height,
        margin + 0.5,
        mapTop + 0.5,
        contentWidth - 1,
        mapHeight - 1,
      );
    }


    doc.rect(margin, dimensionTop, contentWidth, dimensionHeight);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11.2);
    doc.text("PLOT DIMENSIONS", margin + 7, dimensionTop + 7);
    doc.setFontSize(6.7);
    doc.text("As per approved Scheme Plan", margin + 7, dimensionTop + 11.5);

    if (dimensionImage) {
      addImageContained(
        doc,
        dimensionImage.dataUrl,
        dimensionImage.width,
        dimensionImage.height,
        margin + 4,
        dimensionTop + 1,
        contentWidth - 8,
        dimensionHeight - 3,
      );
    }

    drawNorthArrowPdf(doc, pageWidth - margin - 23, dimensionTop + 25, 11);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text("NOTE: ALL DIMENSIONS ARE IN FEET AND INCHES.", margin + 7, pageHeight - margin - 6);

    openPdfPreview(doc, `Part Plan - Plot ${details.plotNo || ""}`, previewWindow);
  } catch (error) {
    previewWindow.close();
    console.error("Part plan generation failed", error);
    alert("Failed to generate the part plan. Please check the selected plot data and try again.");
  }
};

export default printPartPlan;
