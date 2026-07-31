import CadastralAttributeTable from "../CadastralAttributeTable";

export default function GeodeticNetworkAttribute(props) {
  return (
    <CadastralAttributeTable
      {...props}
      title="Geodetic Network"
      placeholder="Search geodetic network..."
      fields={[
        { key: 'name', label: 'Name', sources: ["name"] },
        { key: 'code', label: 'Code', sources: ["code"] },
        { key: 'easting', label: 'Easting (m)', sources: ["easting_m", "easting"] },
        { key: 'northing', label: 'Northing (m)', sources: ["northing_m", "northing"] },
        { key: 'elevation', label: 'Elevation', sources: ["elevation"] }
      ]}
    />
  );
}
