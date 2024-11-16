import Location from "./Location";
import SightLayout from "./layouts/SightLayout";
import DoorLockManagementContainer from "./features/manage/DoorLockManagementContainer";

import "./App.css";

function App() {
  return (
    <SightLayout>
      <Location label="infraBlue" />
      <main className="content">
        <DoorLockManagementContainer />
      </main>
    </SightLayout>
  );
}

export default App;
