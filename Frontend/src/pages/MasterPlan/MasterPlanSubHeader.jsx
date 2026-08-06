/**
 * MasterPlanSubHeader
 *
 * Thin wrapper around MetaverseSubHeader so the Master Plan page gets the
 * identical project-selection flow (Phase → Project Type → Project) without
 * duplicating any code and without touching MetaverseSubHeader.jsx.
 *
 * All props are forwarded directly.  Any Master Plan-specific filter UI that
 * is needed in the future can be added here without affecting /gis-metaverse.
 */
import MetaverseSubHeader from "../GISMetaverse/MetaverseSubHeader";

export default function MasterPlanSubHeader(props) {
  return <MetaverseSubHeader {...props} />;
}
