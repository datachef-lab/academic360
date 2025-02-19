import { useParams } from "react-router-dom";
import ManageMarksheetWrapper from "./ManageMarksheetWrapper";

export default function FrameworkActivitiesTab() {
  const { framework } = useParams();

  return <ManageMarksheetWrapper>FrameworkActivitiesTab - {framework}</ManageMarksheetWrapper>;
}
