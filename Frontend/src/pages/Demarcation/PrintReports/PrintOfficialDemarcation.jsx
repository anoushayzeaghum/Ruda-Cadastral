import commercialPlot12Pdf from "../../../assets/Commercial Plot-12.pdf";
import commercialPlot13Pdf from "../../../assets/Commercial Plot-13.pdf";
import commercialPlot14Pdf from "../../../assets/Commercial Plot-14.pdf";
import { getPlotPdfKey } from "./printUtils";

const officialDemarcationPdfs = {
  12: commercialPlot12Pdf,
  13: commercialPlot13Pdf,
  14: commercialPlot14Pdf,
};

export const printOfficialDemarcation = ({ details }) => {
  const plotKey = getPlotPdfKey(details?.plotNo);
  const pdfUrl = officialDemarcationPdfs[plotKey];

  if (!pdfUrl) {
    alert(`Official demarcation is not available for Plot ${plotKey || details?.plotNo || ""}.`);
    return;
  }

  const preview = window.open(pdfUrl, "_blank");
  if (!preview) {
    alert("Please allow popups to preview the official demarcation PDF.");
    return;
  }
  preview.opener = null;
};

export default printOfficialDemarcation;
