import PlotDetails from "./PlotDetails";

// The Plot Management landing page uses the same search/details screen so the
// admin can immediately find and inspect a plot. No existing backend behavior
// is replaced here; this is the new UI shell for the plot workflow.
export default function PlotManagement() {
  return <PlotDetails />;
}
